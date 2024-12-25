import {
	type ClientOptions,
	defaultOptions,
	ProtocolList,
} from "./client/ClientOptions";
import { Listener } from "./client/Listener";
import { ClientData } from "./client/ClientData";
import {
	ClientToServerHandshakePacket,
	type DataPacket,
	DisconnectMessage,
	DisconnectPacket,
	DisconnectReason,
	LoginPacket,
	LoginTokens,
	type NetworkSettingsPacket,
	PlayStatus,
	type PlayStatusPacket,
	RequestChunkRadiusPacket,
	RequestNetworkSettingsPacket,
	ResourcePackClientResponsePacket,
	ResourcePackResponse,
	type ResourcePacksInfoPacket,
	ResourcePackStackPacket,
	ServerboundLoadingScreenPacketPacket,
	ServerboundLoadingScreenType,
	type ServerToClientHandshakePacket,
	SetLocalPlayerAsInitializedPacket,
	type StartGamePacket,
	type Vector3f,
} from "@serenityjs/protocol";
import { Logger } from "./vendor/Logger";
import { Priority } from "@serenityjs/raknet";
import { PacketSorter } from "./vendor/PacketSorter";
import { PacketEncryptor } from "./vendor/PacketEncryptor";
import { authenticate, createOfflineSession } from "./client/Auth";
import {
	createECDH,
	createHash,
	createPublicKey,
	KeyObject,
} from "node:crypto";
import * as crypto from "node:crypto";
import { measureExecutionTime } from "./vendor/debug-tools";

import {
	Client as RakNetClient,
	type Advertisement,
} from "@sanctumterra/raknet";

declare global {
	var __DEBUG: boolean;
}

class Connection extends Listener {
	private ticker!: NodeJS.Timeout;
	private packetSorter: PacketSorter;

	public protocol: number;
	public playStatus!: number;
	public _encryptor!: PacketEncryptor;
	public username!: string;
	public runtimeEntityId!: bigint;
	public position!: Vector3f;
	public tick = 0;
	public _encryption = false;
	public compression = false;
	public options: ClientOptions;
	public data: ClientData;

	public readonly raknet: RakNetClient;

	constructor(options: Partial<ClientOptions> = {}) {
		super();
		this.options = { ...defaultOptions, ...options };
		globalThis.__DEBUG = options.debug ?? false;
		this.protocol = ProtocolList[this.options.version];
		this.raknet = new RakNetClient({
			address: this.options.host,
			port: this.options.port,
			debug: this.options.debug,
			mtuSize: 1492,
		});
		this.data = new ClientData(this);
		this.packetSorter = new PacketSorter(this);
		this.prepare();
	}

	@measureExecutionTime
	public async connect(): Promise<[Advertisement, StartGamePacket]> {
		try {
			return await this.initializeSession();
		} catch (error) {
			Logger.error("Connection failed:", error as Error);
			throw error;
		}
	}

	public disconnect(clientSide = true, packet: DisconnectPacket | null = null) {
		const reason = packet?.message?.message ?? "Raknet Closed.";

		Logger.info(`Disconnecting: ${reason}`);
		if (clientSide) {
			const disconnectPacket = new DisconnectPacket();
			disconnectPacket.reason = DisconnectReason.Disconnected;
			disconnectPacket.message = new DisconnectMessage();
			disconnectPacket.hideDisconnectScreen = true;
			this.sendPacket(disconnectPacket, Priority.Immediate);
		}
		clearInterval(this.ticker);
		this.removeAll();
		// this.raknet.close();
	}

	@measureExecutionTime
	public sendPacket(
		packet: DataPacket,
		priority: Priority = Priority.Normal,
	): void {
		const packetId = packet.getId();
		const hexId = packetId.toString(16).padStart(2, "0");
		if (this.options.debug) {
			Logger.debug(
				`Sending Game PACKET --> ${packetId} | 0x${hexId} ${new Date().toISOString()}`,
			);
		}
		try {
			this.packetSorter.sendPacket(packet, priority);
		} catch (error) {
			Logger.error("Error sending packet:", error as Error);
			throw error;
		}
	}

	private prepare(): void {
		this.raknet.once("connect", this.handleConnect.bind(this));
		this.ticker = setInterval(() => {
			this.emit("tick", this.tick++);
		}, this.options.tickRate);
		this.once("close", () => {
			this.disconnect(false);
		});
		this.once("DisconnectPacket", this.disconnect.bind(this, false));
		this.once("NetworkSettingsPacket", this.onNetworkSettings.bind(this));
		this.on("PlayStatusPacket", this.onPlayStatus.bind(this));
		this.once("StartGamePacket", this.onStartGame.bind(this));
		this.once("ResourcePacksInfoPacket", this.onResourcePack.bind(this));
		this.once("ResourcePackStackPacket", this.onResourcePack.bind(this));
		this.once(
			"ServerToClientHandshakePacket",
			this.onServerToClientHandshake.bind(this),
		);
	}

	private handleConnect(): void {
		const networkSettingsPacket = new RequestNetworkSettingsPacket();
		networkSettingsPacket.protocol = this.protocol;
		this.sendPacket(networkSettingsPacket);
		this.compression = true;
	}

	@measureExecutionTime
	private async initializeSession(): Promise<[Advertisement, StartGamePacket]> {
		return new Promise((resolve, reject) => {
			let Advertisement_: Advertisement;
			this.onceAfter("StartGamePacket", (packet: StartGamePacket) => {
				startGamePacket = packet;
			});

			this.once("session", async () => {
				Advertisement_ = await this.handleSessionStart();
				console.timeEnd("RakConnect");
			});
			let startGamePacket: StartGamePacket;

			this.once("spawn", () => {
				try {
					if (startGamePacket) {
						resolve([Advertisement_, startGamePacket]);
					} else {
						this.once("StartGamePacket", (packet: StartGamePacket) => {
							startGamePacket = packet;
							resolve([Advertisement_, startGamePacket]);
						});
					}
				} catch (e) {
					console.log(e);
				}
			});
			this.options.offline ? createOfflineSession(this) : authenticate(this);
		});
	}

	@measureExecutionTime
	private async handleSessionStart(): Promise<Advertisement> {
		try {
			return await this.raknet.connect();
		} catch (error) {
			Logger.error("RakNet connection error:", error as Error);
			throw error;
		}
	}

	@measureExecutionTime
	private onNetworkSettings(instance: NetworkSettingsPacket): void {
		if (this.options.debug) Logger.debug("S -> C NetworkSettingsPacket");
		this.data.sendDeflated = true;
		this.data.compressionThreshold = instance.compressionThreshold;
		this.data.compressionMethod = instance.compressionMethod;
		this.sendLoginPacket();
	}

	@measureExecutionTime
	private onStartGame(instance: StartGamePacket): void {
		this.position = instance.playerPosition;
		this.runtimeEntityId = instance.runtimeEntityId;
		globalThis.shieldID =
			instance.items.find((item) => item.name === "minecraft:shield")
				?.networkId ?? 0;
		const radius = new RequestChunkRadiusPacket();
		radius.radius = this.options.viewDistance;
		radius.maxRadius = this.options.viewDistance;
		this.sendPacket(radius, Priority.Immediate);
	}

	@measureExecutionTime
	onServerToClientHandshake(instance: ServerToClientHandshakePacket): void {
		const [header, payload] = instance.token
			.split(".")
			.map((k) => Buffer.from(k, "base64"));
		const { x5u } = JSON.parse(header.toString());
		const { salt } = JSON.parse(payload.toString());

		const pubKeyDer = createPublicKey({
			key: Buffer.from(x5u, "base64"),
			type: "spki",
			format: "der",
		});
		this.data.sharedSecret = this.createSharedSecret(
			this.data.loginData.ecdhKeyPair.privateKey,
			pubKeyDer,
		);

		// this.data.sharedSecret = diffieHellman({ privateKey: this.data.loginData.ecdhKeyPair.privateKey, publicKey: pubKeyDer })

		this.setupEncryption(salt);
		this.sendClientToServerHandshake();
	}

	@measureExecutionTime
	private onPlayStatus(instance: PlayStatusPacket): void {
		this.playStatus = instance.status;
		if (instance.status === PlayStatus.PlayerSpawn) {
			const init = new SetLocalPlayerAsInitializedPacket();
			init.runtimeEntityId = this.runtimeEntityId;
			const ServerBoundLoadingScreen =
				new ServerboundLoadingScreenPacketPacket();
			ServerBoundLoadingScreen.type =
				ServerboundLoadingScreenType.EndLoadingScreen;
			ServerBoundLoadingScreen.hasScreenId = false;
			// this.sendPacket(ServerBoundLoadingScreen, Priority.Immediate);
			this.sendPacket(init, Priority.Immediate);
			this.emit("spawn");
		}
	}

	@measureExecutionTime
	private onResourcePack(
		instance: ResourcePacksInfoPacket | ResourcePackStackPacket,
	): void {
		if (instance instanceof ResourcePackStackPacket) {
			if (instance.texturePacks.length !== 0) {
				Logger.debug("Texture Pack Length is not 0!");
			}
		} else {
			if (instance.packs.length !== 0) {
				Logger.debug("Texture Pack Length is not 0!");
			}
		}
		const response = new ResourcePackClientResponsePacket();
		response.response = ResourcePackResponse.Completed;
		response.packs = [];
		this.sendPacket(response, Priority.Immediate);
	}
	@measureExecutionTime
	private sendLoginPacket(): void {
		const chain = [
			this.data.loginData.clientIdentityChain,
			...this.data.accessToken,
		];
		const userChain = this.data.loginData.clientUserChain;
		const encodedChain = JSON.stringify({ chain });

		const login = new LoginPacket();
		login.protocol = this.protocol;
		login.tokens = new LoginTokens(userChain, encodedChain);
		this.sendPacket(login, Priority.Immediate);
	}

	@measureExecutionTime
	private createSharedSecret(
		privateKey: KeyObject,
		publicKey: KeyObject,
	): Buffer {
		this.validateKeys(privateKey, publicKey);

		const curve = privateKey.asymmetricKeyDetails?.namedCurve;
		if (!curve) {
			throw new Error("Invalid private key format. Named curve is missing.");
		}

		try {
			const ecdh = createECDH(curve);
			const privateKeyJwk = privateKey.export({ format: "jwk" }) as {
				d?: string;
			};
			const publicKeyJwk = publicKey.export({ format: "jwk" }) as {
				x?: string;
				y?: string;
			};

			if (!privateKeyJwk.d || !publicKeyJwk.x || !publicKeyJwk.y) {
				throw new Error(
					"Invalid key format. Missing 'd', 'x', or 'y' parameters.",
				);
			}

			ecdh.setPrivateKey(Buffer.from(privateKeyJwk.d, "base64"));
			const publicKeyBuffer = Buffer.concat([
				Buffer.from([0x04]),
				Buffer.from(publicKeyJwk.x, "base64"),
				Buffer.from(publicKeyJwk.y, "base64"),
			]);

			return ecdh.computeSecret(publicKeyBuffer);
		} catch (error) {
			Logger.error("Error computing shared secret:", error as Error);
			throw new Error("Failed to create shared secret.");
		}
	}

	@measureExecutionTime
	private setupEncryption(salt: string): void {
		const secretHash = createHash("sha256")
			.update(Buffer.from(salt, "base64"))
			.update(this.data.sharedSecret)
			.digest();

		this.data.secretKeyBytes = secretHash;
		this.data.iv = secretHash.slice(0, 16);

		if (!this._encryptor) {
			this._encryptor = new PacketEncryptor(this, this.data.secretKeyBytes);
		}
		this._encryption = true;
	}

	@measureExecutionTime
	private sendClientToServerHandshake(): void {
		const handshake = new ClientToServerHandshakePacket();
		this.sendPacket(handshake, Priority.Immediate);
	}

	@measureExecutionTime
	private validateKeys(privateKey: KeyObject, publicKey: KeyObject): void {
		if (
			!(privateKey instanceof KeyObject) ||
			!(publicKey instanceof KeyObject)
		) {
			throw new Error(
				"Both privateKey and publicKey must be crypto.KeyObject instances",
			);
		}

		if (privateKey.type !== "private" || publicKey.type !== "public") {
			throw new Error("Invalid key types. Expected private and public keys.");
		}
	}
}

export { Connection };
