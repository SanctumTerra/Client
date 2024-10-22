import {
	Disconnect,
	Frame,
	type Priority,
	Reliability,
} from "@serenityjs/raknet";
import { Logger } from "../vendor/Logger";
import {
	CompressionMethod,
	type DataPacket,
	DisconnectPacket,
	Framer,
	getPacketId,
	Packet,
	Packets,
	SetScorePacket
} from "@serenityjs/protocol";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { CraftingDataPacket } from "./packets/CraftingDataPacket";
import type { Connection } from "../Connection";
import { LevelEventGenericPacket } from "./packets/LevelEventGenericPacket";
import { identity } from "lodash";
import { CurrectStructureFeaturePacket } from "./packets/current-structure-feature-packet";
import { TrimDataPacket } from "./packets/trim-data-packet";
import { PlayerFogPacket } from "./packets/player-fog-packet";
import { GameRulesChangedPacket } from "./packets/game-rules-changed";
import { SetDifficultyPacket } from "./packets/set-difficulty-packet";
import { SetSpawnPositionPacket } from "./packets/set-spawn-position-packet";
import { SetHealthPacket } from "./packets/set-health";
import { UnlockedRecipesPacket } from "./packets/unlocked-recipes";
import { SyncActorPropertyPacket } from "./packets/SyncActorPropertyPacket";
import { MoveActorDeltaPacket } from "./packets/MoveActorDeltaPacket";
import { ItemComponentPacket } from "./packets/ItemComponentPacket";
import { SetActorDataPacket } from "./packets/SetActorDataPacket";
import { AddEntityPacket } from "./packets/AddActorPacket";
import { AddItemActorPacket } from "./packets/add-item-actor";
import { LegacyTelemetryEventPacket } from "./packets/LegacyTelemetryEventPacket";
import { UpdateSubChunkBlocksPacket } from "./packets/UpdateSubChunkBlocksPacket";

export class PacketSorter {
	constructor(private readonly connection: Connection) {
		this.initializeListeners();
	}

	public sendPacket(packet: DataPacket, priority: Priority): void {
		const serialized = packet.serialize();
		const framed = Framer.frame(serialized);
		const payload = this.preparePayload(framed);

		const frame = new Frame();
		frame.reliability = Reliability.ReliableOrdered;
		frame.orderChannel = 0;
		frame.payload = payload;
		this.connection.raknet.sender.sendFrame(frame, priority);
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

	private handleEncapsulatedPacket(frame: Frame): void {
		const header = frame.payload[0] as number;
		try {
			if (header === 254) {
				this.handleGamePacket(frame.payload);
			} else if (header === 21) {
				this.handleDisconnect(frame.payload);
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

		if (!this.connection.data.sendDeflated) {
			return Buffer.concat([Buffer.from([254]), framed]);
		}

		const deflated =
			framed.byteLength > 256
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

			let PacketClass = Packets[id];
			if (id === 52) {
				PacketClass = CraftingDataPacket;
			}

			if ((id as number) === 124) {
				PacketClass = LevelEventGenericPacket;
			}

			if ((id as number) === 314) {
				PacketClass = CurrectStructureFeaturePacket;
			}

			if ((id as number) === 302) {
				PacketClass = TrimDataPacket;
			}

			if ((id as number) === 160) {
				PacketClass = PlayerFogPacket;
			}

			if ((id as number) === 72) {
				PacketClass = GameRulesChangedPacket;
			}

			if ((id as number) === 60) {
				PacketClass = SetDifficultyPacket;
			}

			if ((id as number) === 43) {
				PacketClass = SetSpawnPositionPacket;
			}

			if ((id as number) === 42) {
				PacketClass = SetHealthPacket;
			}

			if ((id as number) === 199) {
				PacketClass = UnlockedRecipesPacket;
			}

			if ((id as number) === 165) {
				PacketClass = SyncActorPropertyPacket;
			}

			if ((id as number) === 111) {
				PacketClass = MoveActorDeltaPacket;
			}

			if((id as number) === 162) {
				PacketClass = ItemComponentPacket;
			}

			if((id as number) === 39) {
				PacketClass = SetActorDataPacket;
			}

			if((id as number) === 13) {
				PacketClass = AddEntityPacket;
			}

			if((id as number) === 15) {
				PacketClass = AddItemActorPacket;
			}

			if((id as number) === 65) {
				PacketClass = LegacyTelemetryEventPacket;
			}

			if((id as number) === 172) {
				PacketClass = UpdateSubChunkBlocksPacket;
			}

			if (!PacketClass) {
				Logger.warn(`Packet with ID ${id} not found`);
				continue;
			}

			try {
				const instance = new PacketClass(frame).deserialize();
				this.connection.emit(PacketClass.name, instance);
			} catch (error) {
				Logger.warn(
					`Error processing packet ${id}: ${error instanceof Error ? error.message : String(error)}\n`,
					(error as Error).stack,
				);
			}
		}
	}
}
