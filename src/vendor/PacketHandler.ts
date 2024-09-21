import {
	LoginPacket,
	LoginTokens,
	type MovePlayerPacket,
	type NetworkSettingsPacket,
	PlayStatus,
	type PlayStatusPacket,
	RequestChunkRadiusPacket,
	ResourcePackClientResponsePacket,
	ResourcePackResponse,
	ResourcePackStackPacket,
	type ResourcePacksInfoPacket,
	type ServerToClientHandshakePacket,
	SetLocalPlayerAsInitializedPacket,
	type StartGamePacket,
	ClientToServerHandshakePacket,
} from "@serenityjs/protocol";
import type { Client } from "../Client";
import { Priority } from "@serenityjs/raknet";
import {
	createECDH,
	createHash,
	createPublicKey,
	KeyObject,
} from "node:crypto";
import { PacketEncryptor } from "./PacketEncryptor";
import { Logger } from "./Logger";

export class PacketHandler {
	constructor(private readonly client: Client) {}

	onNetworkSettings(instance: NetworkSettingsPacket): void {
		if (this.client.options.debug) Logger.debug("S -> C NetworkSettingsPacket");
		this.client.data.sendDeflated = true;
		this.client.data.compressionThreshold = instance.compressionThreshold;
		this.sendLoginPacket();
	}

	private sendLoginPacket(): void {
		const chain = [
			this.client.data.loginData.clientIdentityChain,
			...this.client.data.accessToken,
		];
		const userChain = this.client.data.loginData.clientUserChain;
		const encodedChain = JSON.stringify({ chain });

		const login = new LoginPacket();
		login.protocol = this.client.protocol;
		login.tokens = new LoginTokens(userChain, encodedChain);
		this.client.sendPacket(login, Priority.Immediate);
	}

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
		this.client.data.sharedSecret = this.createSharedSecret(
			this.client.data.loginData.ecdhKeyPair.privateKey,
			pubKeyDer,
		);

		this.setupEncryption(salt);
		this.sendClientToServerHandshake();
	}

	private setupEncryption(salt: string): void {
		const secretHash = createHash("sha256")
			.update(Buffer.from(salt, "base64"))
			.update(this.client.data.sharedSecret)
			.digest();

		this.client.data.secretKeyBytes = secretHash;
		this.client.data.iv = secretHash.slice(0, 16);

		if (!this.client._encryptor) {
			this.client._encryptor = new PacketEncryptor(
				this.client,
				this.client.data.secretKeyBytes,
			);
		}
		this.client._encryption = true;
	}

	private sendClientToServerHandshake(): void {
		const handshake = new ClientToServerHandshakePacket();
		this.client.sendPacket(handshake, Priority.Immediate);
	}

	onPlayStatus(instance: PlayStatusPacket): void {
		this.client.playStatus = instance.status;
		if (instance.status === PlayStatus.PlayerSpawn) {
			this.handlePlayerSpawn();
		}
	}

	private handlePlayerSpawn(): void {
		const init = new SetLocalPlayerAsInitializedPacket();
		init.runtimeEntityId = this.client.runtimeEntityId;
		this.client.sendPacket(init, Priority.Immediate);
		this.client.emit("spawn");
	}

	public onStartGame(instance: StartGamePacket): void {
		this.client.position = instance.playerPosition;
		this.client.runtimeEntityId = instance.runtimeEntityId;

		const radius = new RequestChunkRadiusPacket();
		radius.radius = this.client.options.viewDistance;
		radius.maxRadius = this.client.options.viewDistance;
		this.client.sendPacket(radius, Priority.Immediate);
	}

	public onMovePlayer(instance: MovePlayerPacket): void {
		this.client.position = instance.position;
	}

	onResourcePack(
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
		this.sendResourcePackResponse();
	}

	private sendResourcePackResponse(): void {
		const response = new ResourcePackClientResponsePacket();
		response.response = ResourcePackResponse.Completed;
		response.packs = [];
		this.client.sendPacket(response, Priority.Immediate);
	}

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
