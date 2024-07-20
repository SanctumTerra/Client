import { EventEmitter } from "events";
import { RakNetClient, Advertisement } from "@sanctumterra/raknet";
import { Socket } from "dgram";
import { Frame, Priority, Reliability } from "@serenityjs/raknet";
import { GAME_BYTE } from "@serenityjs/network";
import { 
    CompressionMethod,
    DataPacket, 
    Framer, 
    getPacketId, 
    Packets, 
    RequestNetworkSettingsPacket,
    SetScorePacket
} from "@serenityjs/protocol";
import * as DATAPACKET from "./client/packets/DataPacket";

import { deflateRawSync, inflateRawSync } from "zlib";
import { Logger } from "./utils/Logger";
import { PacketEncryptor } from "./client/packets/PacketEncryptor";
import { ClientData } from "./client/ClientData";
import { authenticate, createOfflineSession } from "./client/auth/Auth";
import { defaultOptions, Options, PROTOCOL } from "./client/ClientOptions";
import { PacketHandler } from "./client/handlers";
import { Listener } from "./client/Listener";

class Client extends Listener {
    public raknet: RakNetClient;
    public socket?: Socket;
    private _encryption: boolean = false;
    public readonly protocol: number;
    public options: Options;
    public data: ClientData;
    public packetHandler: PacketHandler;
    
    public runtimeEntityId!: bigint;
    public username?: string;

    public constructor(options: Partial<Options> = {}) {
        super();
        globalThis._client = this;
        this.options = { ...defaultOptions, ...options };
        this.protocol = PROTOCOL[this.options.version];
        this.raknet = this.createClient();

        this.data = new ClientData(this);
        this.packetHandler = new PacketHandler(this);

        this.raknet.on("encapsulated", this.handlePacket.bind(this));
    }

    private createClient(): RakNetClient {
        return this.options.raknetClass 
            ? new this.options.raknetClass(this.options.host, this.options.port)
            : new RakNetClient(this.options.host, this.options.port);
    }

    public connect(): void {
        this.raknet.on("connect", this.onConnect.bind(this));

        const authPromise = this.options.offline
            ? createOfflineSession(this)
            : authenticate(this);

        authPromise.then(this.handleAuthResult.bind(this));

        this.on("session", this.onSession.bind(this));
    }

    private onConnect(): void {
        const networksettings = new RequestNetworkSettingsPacket();
        networksettings.protocol = this.protocol;
        this.sendPacket(networksettings, Priority.Immediate);
    }

    private handleAuthResult(result: { profile: any, chains: any }): void {
        this.data.profile = result.profile;
        this.data.accessToken = result.chains;
        this.username = result.profile.name;

        if (!this.options.offline) {
            this.data.loginData.clientIdentityChain = this.data.createClientChain(null, false);
            this.data.loginData.clientUserChain = this.data.createClientUserChain(this.data.loginData.ecdhKeyPair.privateKey);
        }

        this.emit("session");
    }

    private onSession(): void {
        this.raknet.connect((ping: Advertisement) => {
            this.data.serverAdvertisement = ping;
        });
    }

    public sendPacket(packet: DataPacket | DATAPACKET.DataPacket, priority: Priority = Priority.Normal): void {
        const id = packet.getId().toString(16).padStart(2, '0');
        const date = new Date();
        Logger.warn(`Sending a Game PACKET  --> ${packet.getId()}  |  0x${id} ${date.toTimeString().split(' ')[0]}.${date.getMilliseconds().toString().padStart(3, '0')}`);

        let serialized: Buffer;
        try {
            serialized = packet.serialize();
        } catch(error: any) {
            Logger.error(error);
            return;
        }

        const framed = Framer.frame(serialized);
        const payload = this.preparePayload(framed);
        
        const frame = new Frame();
        frame.reliability = Reliability.ReliableOrdered;
        frame.orderChannel = 0;
        frame.payload = payload;

        this.raknet.queue.sendFrame(frame, priority);
    }

    private preparePayload(framed: Buffer): Buffer {
        if (this._encryption) {
            return _encryptor.encryptPacket(framed).payload;
        }

        if (!this.data.sendDeflated) {
            return Buffer.concat([Buffer.from([GAME_BYTE]), framed]);
        }

        const deflated = framed.byteLength > 256
            ? Buffer.from([CompressionMethod.Zlib, ...deflateRawSync(framed)])
            : Buffer.from([CompressionMethod.None, ...framed]);

        return Buffer.concat([Buffer.from([GAME_BYTE]), deflated]);
    }

    private handlePacket(frame: Frame): void {
        const header = frame.payload[0] as number;
        if (header === GAME_BYTE) {
            this.handleGamePacket(frame.payload);
        } else {
            Logger.debug("Unknown header " + header);
        }
    }

    private async handleGamePacket(buffer: Buffer): Promise<void> {
        let decrypted = buffer.subarray(1);

        if (this._encryption) {
            try {
                decrypted = _encryptor.decryptPacket(decrypted);
            } catch(error: any) {
                Logger.error(error?.message ?? error);
                return;
            }
        }
        
        const algorithm = this.getCompressionAlgorithm(decrypted);
        if (algorithm !== CompressionMethod.NotPresent) {
            decrypted = decrypted.subarray(1);
        }

        const inflated = this.inflatePacket(decrypted, algorithm);
        if (!inflated) return;

        let frames;
        try {
            frames = Framer.unframe(inflated);
        } catch (error) {
            Logger.warn("Could not unframe packet");
            return;
        }

        this.processFrames(frames);
    }

    private getCompressionAlgorithm(buffer: Buffer): CompressionMethod {
        return CompressionMethod[buffer[0] as number] 
            ? buffer.readUint8() as CompressionMethod
            : CompressionMethod.NotPresent;
    }

    private inflatePacket(buffer: Buffer, algorithm: CompressionMethod): Buffer | null {
        switch (algorithm) {
            case CompressionMethod.Zlib:
                return inflateRawSync(buffer);
            case CompressionMethod.None:
            case CompressionMethod.NotPresent:
                return buffer;
            default:
                Logger.error(`Invalid compression algorithm: ${CompressionMethod[algorithm]}`);
                return null;
        }
    }

    private processFrames(frames: Buffer[]): void {
        for (const frame of frames) {
            const id = getPacketId(frame);
            if (id === SetScorePacket.id) continue;

            const PacketClass = Packets[id];
            if (!PacketClass) {
                Logger.warn(`Packet with ID ${id} not found`);
                continue;
            }

            try {
                const instance = new PacketClass(frame).deserialize();
                this.emit(PacketClass.name, instance);
            } catch (error) {
                Logger.warn(`Error processing packet ${id}: ${error}`);
            }
        }
    }
}

export default Client;