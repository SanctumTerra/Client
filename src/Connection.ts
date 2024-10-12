import { Client as RakNetClient } from "@sanctumterra/raknet";
import { type ClientOptions, defaultOptions, ProtocolList } from "./client/ClientOptions";
import { Listener } from "./client/Listener";
import { ClientData } from "./client/ClientData";
import { ClientToServerHandshakePacket, type DataPacket, DisconnectMessage, DisconnectPacket, DisconnectReason, LoginPacket, LoginTokens, type NetworkSettingsPacket, PlayStatus, type PlayStatusPacket, RequestChunkRadiusPacket, RequestNetworkSettingsPacket, ResourcePackClientResponsePacket, ResourcePackResponse, type ResourcePacksInfoPacket, ResourcePackStackPacket, type ServerToClientHandshakePacket, SetLocalPlayerAsInitializedPacket, type StartGamePacket, type Vector3f } from "@serenityjs/protocol";
import { Logger } from "./vendor/Logger";
import { Priority } from "@serenityjs/raknet";
import { PacketSorter } from "./vendor/PacketSorter";
import { PacketEncryptor } from "./vendor/PacketEncryptor";
import { authenticate, createOfflineSession } from "./client/Auth";
import { createECDH, createHash, createPublicKey, KeyObject } from "node:crypto";
import { performance } from 'node:perf_hooks';

export function measureExecutionTime(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
        const start = performance.now();
        const result = originalMethod.apply(this, args);
        const end = performance.now();
        const duration = end - start;
        if (globalThis.__DEBUG) Logger.debug(`${propertyKey} execution time: ${duration.toFixed(2)}ms`);
        return result;
    };
    return descriptor;
}

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
    public options: ClientOptions;
    public data: ClientData;

    public readonly raknet: RakNetClient;

	constructor(options: Partial<ClientOptions> = {}) {
        super();
        this.options = { ...defaultOptions, ...options };
		globalThis.__DEBUG = options.debug ?? false;
        this.protocol = ProtocolList[this.options.version];
		this.raknet = new RakNetClient({ host: this.options.host, port: this.options.port, debug: this.options.debug });
        this.data = new ClientData(this);
		this.packetSorter = new PacketSorter(this);
        this.prepare();
    }

    public async connect(): Promise<void> {
		this.initializeSession();
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
			this.raknet.disconnect();
		} else {
			this.raknet.close();
		}
		clearInterval(this.ticker);
		this.removeAllListeners();
	}


    public sendPacket(
        packet: DataPacket,
        priority: Priority = Priority.Normal
    ): void {
        const packetId = packet.getId();
        const hexId = packetId.toString(16).padStart(2, "0");
        if (this.options.debug)
			Logger.debug(
				`Sending Game PACKET --> ${packetId} | 0x${hexId} ${new Date().toISOString()}`,
			);
		try {
			this.packetSorter.sendPacket(packet, priority);
		} catch (error) {
			Logger.error(
				`Error sending packet: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
    }

    private prepare(): void {
        this.raknet.once("connect", this.handleConnect.bind(this));
        this.ticker = setInterval(() => { this.emit("tick", this.tick++) }, 50);
        this.once("close", () => { this.disconnect(false); });
        this.once("DisconnectPacket", this.disconnect.bind(this, false));
        this.once("NetworkSettingsPacket", this.onNetworkSettings.bind(this));
        this.on("PlayStatusPacket", this.onPlayStatus.bind(this));
        this.once("StartGamePacket", this.onStartGame.bind(this));
        this.once("ResourcePacksInfoPacket", this.onResourcePack.bind(this));
        this.once("ResourcePackStackPacket", this.onResourcePack.bind(this));
        this.once("ServerToClientHandshakePacket", this.onServerToClientHandshake.bind(this));
    }
	
    private handleConnect(): void {
        const networkSettingsPacket = new RequestNetworkSettingsPacket();
        networkSettingsPacket.protocol = this.protocol;
        this.sendPacket(networkSettingsPacket);
    }

	@measureExecutionTime
    private initializeSession(): void {
		this.on("session", this.handleSessionStart.bind(this));
		this.options.offline ? createOfflineSession(this) : authenticate(this);
	}
    
    private async handleSessionStart(): Promise<void> {
		await this.raknet.connect();
	}

    @measureExecutionTime
    private onNetworkSettings(instance: NetworkSettingsPacket): void {
        if (this.options.debug) Logger.debug("S -> C NetworkSettingsPacket");
		this.data.sendDeflated = true;
		this.data.compressionThreshold = instance.compressionThreshold;
		this.sendLoginPacket();
    }

    @measureExecutionTime
    private onStartGame(instance: StartGamePacket): void {
		this.position = instance.playerPosition;
		this.runtimeEntityId = instance.runtimeEntityId;
        globalThis.shieldID = instance.items.find((item) => item.name === "minecraft:shield")?.networkId ?? 0;
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

		this.setupEncryption(salt);
		this.sendClientToServerHandshake();
	}

    @measureExecutionTime
    private onPlayStatus(instance: PlayStatusPacket): void {
		this.playStatus = instance.status;
		if (instance.status === PlayStatus.PlayerSpawn) {
            const init = new SetLocalPlayerAsInitializedPacket();
            init.runtimeEntityId = this.runtimeEntityId;
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
			throw new Error(
				"Invalid private key format. Expected JWK with named curve.",
			);
		}
		const ecdh = createECDH(curve);
		const privateKeyJwk = privateKey.export({ format: "jwk" }) as {
			d?: string;
		};
		const publicKeyJwk = publicKey.export({ format: "jwk" }) as {
			x?: string;
			y?: string;
		};
		if (!privateKeyJwk.d || !publicKeyJwk.x || !publicKeyJwk.y) {
			throw new Error("Invalid key format");
		}
		const privateKeyHex = Buffer.from(privateKeyJwk.d, "base64").toString(
			"hex",
		);
		ecdh.setPrivateKey(privateKeyHex, "hex");
		const publicKeyX = Buffer.from(publicKeyJwk.x, "base64").toString("hex");
		const publicKeyY = Buffer.from(publicKeyJwk.y, "base64").toString("hex");
		const publicKeyHex = `04${publicKeyX}${publicKeyY}`;
		return ecdh.computeSecret(publicKeyHex, "hex");
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
			this._encryptor = new PacketEncryptor(
				this,
				this.data.secretKeyBytes,
			);
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