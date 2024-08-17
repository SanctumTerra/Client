import { Frame, Priority, Reliability } from "@serenityjs/raknet";
import { Client } from "../Client";
import { Logger } from "@sanctumterra/raknet";
import {
    CompressionMethod,
    DataPacket,
    Framer,
    NetworkSettingsPacket,
    Packets,
    PlayStatusPacket,
    ResourcePacksInfoPacket,
    ServerToClientHandshakePacket,
    StartGamePacket,
    getPacketId
} from "@serenityjs/protocol";
import { deflateRawSync, inflateRawSync } from "zlib";
import { PacketHandler } from "./PacketHandler";

export class PacketSorter {
    private readonly packetHandler: PacketHandler;

    constructor(private readonly client: Client) {
        this.packetHandler = new PacketHandler(this.client);
        this.initializeListeners();
    }

    private initializeListeners(): void {
        this.client.raknet.on("encapsulated", this.handleEncapsulatedPacket.bind(this));
        this.setupDefaultHandlers();
    }

    private handleEncapsulatedPacket(frame: Frame): void {
        const header = frame.payload[0] as number;
        if (header === 254) {
            this.handleGamePacket(frame.payload);
        } else {
            Logger.debug(`Unknown header ${header}`);
        }
    }

    public sendPacket(packet: DataPacket, priority: Priority): void {
        const serialized = packet.serialize();
        const framed = Framer.frame(serialized);
        const payload = this.preparePayload(framed);

        const frame = new Frame();
        frame.reliability = Reliability.ReliableOrdered;
        frame.orderChannel = 0;
        frame.payload = payload;
        this.client.raknet.queue.sendFrame(frame, priority);
    }

    private preparePayload(framed: Buffer): Buffer {
        if (this.client._encryption) {
            return this.client._encryptor.encryptPacket(framed).payload;
        }

        if (!this.client.data.sendDeflated) {
            return Buffer.concat([Buffer.from([254]), framed]);
        }

        const deflated = framed.byteLength > 256
            ? Buffer.from([CompressionMethod.Zlib, ...deflateRawSync(framed)])
            : Buffer.from([CompressionMethod.None, ...framed]);
        return Buffer.concat([Buffer.from([254]), deflated]);
    }

    private handleGamePacket(payload: Buffer): void {
        let decrypted = this.decryptPayload(payload.subarray(1));
        if (!decrypted) return;

        const algorithm = this.getCompressionAlgorithm(decrypted);
        if (algorithm !== CompressionMethod.NotPresent) {
            decrypted = decrypted.subarray(1);
        }

        const inflated = this.inflatePacket(decrypted, algorithm);
        if (!inflated) return;

        this.processInflatedPacket(inflated);
    }

    private decryptPayload(payload: Buffer): Buffer | null {
        if (!this.client._encryption) return payload;

        try {
            return this.client._encryptor.decryptPacket(payload);
        } catch (error) {
            Logger.error(`Decryption error: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    private getCompressionAlgorithm(buffer: Buffer): CompressionMethod {
        return buffer[0] in CompressionMethod ? buffer.readUint8() as CompressionMethod : CompressionMethod.NotPresent;
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

    private processInflatedPacket(inflated: Buffer): void {
        try {
            const frames = Framer.unframe(inflated);
            this.processFrames(frames);
        } catch (error) {
            Logger.warn(`Could not unframe packet: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private processFrames(frames: Buffer[]): void {
        for (const frame of frames) {
            const id = getPacketId(frame);
            const PacketClass = Packets[id];
            if (!PacketClass) {
                Logger.warn(`Packet with ID ${id} not found`);
                continue;
            }

            try {
                const instance = new PacketClass(frame).deserialize();
                this.client.emit(PacketClass.name, instance);
            } catch (error) {
                Logger.warn(`Error processing packet ${id}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    private setupDefaultHandlers(): void {
        this.client.on(NetworkSettingsPacket.name, this.packetHandler.onNetworkSettings.bind(this.packetHandler));
        this.client.on(ServerToClientHandshakePacket.name, this.packetHandler.onServerToClientHandshake.bind(this.packetHandler));
        this.client.on(PlayStatusPacket.name, this.packetHandler.onPlayStatus.bind(this.packetHandler));
        this.client.on(ResourcePacksInfoPacket.name, this.packetHandler.onResourcePack.bind(this.packetHandler));
        this.client.on(StartGamePacket.name, this.packetHandler.onStartGame.bind(this.packetHandler))
    }
}