import type { Priority } from "@serenityjs/raknet";
import { Logger } from "../vendor/Logger";
import {
	CompressionMethod,
	type DataPacket,
	Framer,
	getPacketId,
	Packets,
	SetScorePacket,
} from "@serenityjs/protocol";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { Connection } from "../Connection";
import { Frame } from "@sanctumterra/raknet";

export class PacketSorter {
	constructor(private readonly connection: Connection) {
		this.initializeListeners();
	}

	public sendPacket(packet: DataPacket, priority: Priority): void {
		try {
			const serialized = packet.serialize();
			const framed = Framer.frame(serialized);
			const payload = this.preparePayload(framed);

			const frame = new Frame();
			frame.orderChannel = 0;
			frame.payload = payload;
			this.connection.raknet.sendFrame(frame, priority);
		} catch (error) {
			Logger.error(
				`Error sending packet:  ${(error as Error).message}`,
				error as Error,
			);
		}
	}

	public handleDisconnect(payload: Buffer): void {
		this.connection.emit("close");
	}

	private initializeListeners(): void {
		this.connection.raknet.on(
			"encapsulated",
			this.handleEncapsulatedPacket.bind(this),
		);
	}

	private handleEncapsulatedPacket(payload: Buffer): void {
		// if (
		// payload.length === this.lastPacket.length &&
		// payload.equals(this.lastPacket)
		// ) {
		// Logger.debug("Duplicate packet detected, skipping");
		// return;
		// }
		// this.lastPacket = payload;
		const header = payload[0] as number;
		try {
			if (header === 254) {
				this.handleGamePacket(payload);
			} else if (header === 21) {
				this.handleDisconnect(payload);
			} else {
				if (globalThis.__DEBUG) Logger.debug(`Unknown header ${header}`);
			}
		} catch (error) {
			Logger.warn(
				`Error processing encapsulated packet: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	private preparePayload(framed: Buffer): Buffer {
		if (this.connection._encryption) {
			return this.connection._encryptor.encryptPacket(framed).payload;
		}

		const shouldCompress =
			framed.byteLength > this.connection.data.compressionThreshold &&
			this.connection.compression;
		const deflated = shouldCompress
			? Buffer.concat([
					Buffer.from([this.connection.data.compressionMethod]),
					deflateRawSync(framed),
				])
			: this.connection.compression
				? Buffer.concat([Buffer.from([CompressionMethod.None]), framed])
				: framed;

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
		if (!this.connection._encryption) return payload;

		try {
			return this.connection._encryptor.decryptPacket(payload);
		} catch (error) {
			Logger.error(
				`Decryption error: ${error instanceof Error ? error.message : String(error)}`,
			);
			return null;
		}
	}

	private getCompressionAlgorithm(buffer: Buffer): CompressionMethod {
		return buffer[0] in CompressionMethod
			? (buffer.readUint8() as CompressionMethod)
			: CompressionMethod.NotPresent;
	}

	private inflatePacket(
		buffer: Buffer,
		algorithm: CompressionMethod,
	): Buffer | null {
		switch (algorithm) {
			case CompressionMethod.Zlib:
				return inflateRawSync(buffer);
			case CompressionMethod.None:
			case CompressionMethod.NotPresent:
				return buffer;
			default:
				Logger.error(
					`Invalid compression algorithm: ${CompressionMethod[algorithm]}`,
				);
				return null;
		}
	}

	private processInflatedPacket(inflated: Buffer): void {
		try {
			const frames = Framer.unframe(inflated);
			this.processFrames(frames);
		} catch (error) {
			Logger.warn(
				`Could not unframe packet: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	private processFrames(frames: Buffer[]): void {
		for (const frame of frames) {
			const id = getPacketId(frame);
			if (id === SetScorePacket.id) continue;

			const PacketClass = Packets[id];

			if (!PacketClass) {
				if (this.connection.options.logPacketErrors) {
					Logger.warn(`Packet with ID ${id} not found`);
				}
				continue;
			}
			if (this.connection.options.debug) {
				Logger.debug(`Received packet ${PacketClass.name}`);
			}
			try {
				const instance = new PacketClass(frame).deserialize();
				//  @ts-ignore
				this.connection.emit(PacketClass.name, instance);
			} catch (error) {
				if (this.connection.options.logPacketErrors) {
					Logger.warn(
						`Error processing packet ${id}: ${error instanceof Error ? error.message : String(error)}\n`,
						(error as Error).stack,
					);
				}
			}
		}
	}
}
