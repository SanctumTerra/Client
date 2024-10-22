import { type BinaryStream, Endianness } from "@serenityjs/binarystream";
import { DataType } from "@serenityjs/raknet";

export enum MoveActorDeltaFlags {
	FLAG_HAS_X = 0x01,
	FLAG_HAS_Y = 0x02,
	FLAG_HAS_Z = 0x04,
	FLAG_HAS_PITCH = 0x08,
	FLAG_HAS_YAW = 0x10,
	FLAG_HAS_HEAD_YAW = 0x20,
	FLAG_GROUND = 0x40,
	FLAG_TELEPORT = 0x80,
	FLAG_FORCE_MOVE_LOCAL_ENTITY = 0x100,
}

class MoveActorDeltaData extends DataType {
	public runtimeEntityId: bigint;
	public flags: number;
	public xPos: number;
	public yPos: number;
	public zPos: number;
	public pitch: number;
	public yaw: number;
	public headYaw: number;

	constructor(
		runtimeEntityId: bigint,
		flags: number,
		xPos: number,
		yPos: number,
		zPos: number,
		pitch: number,
		yaw: number,
		headYaw: number,
	) {
		super();
		this.runtimeEntityId = runtimeEntityId;
		this.flags = flags;
		this.xPos = xPos;
		this.yPos = yPos;
		this.zPos = zPos;
		this.pitch = pitch;
		this.yaw = yaw;
		this.headYaw = headYaw;
	}

	static readPossibleCoordinate(
		stream: BinaryStream,
		flags: number,
		flag: number,
	): number {
		if ((flags & flag) !== 0) {
			return stream.readFloat32(Endianness.Little);
		}
		return 0.0;
	}
	static readPossibleRotation(
		stream: BinaryStream,
		flags: number,
		flag: number,
	): number {
		if ((flags & flag) !== 0) {
			return stream.readByte() * (360 / 256);
		}
		return 0.0;
	}

	static writePossibleCoordinate(
		stream: BinaryStream,
		value: number,
		flags: number,
		flag: number,
	): void {
		if ((flags & flag) !== 0) {
			stream.writeFloat32(value, Endianness.Little);
		}
	}
	static writePossibleRotation(
		stream: BinaryStream,
		value: number,
		flags: number,
		flag: number,
	): void {
		if ((flags & flag) !== 0) {
			stream.writeByte(value / (360 / 256));
		}
	}

	static override read(stream: BinaryStream): MoveActorDeltaData {
		const runtimeEntityId = stream.readVarLong();
		const flags = stream.readShort(Endianness.Little);
		const xPos = MoveActorDeltaData.readPossibleCoordinate(
			stream,
			flags,
			MoveActorDeltaFlags.FLAG_HAS_X,
		);
		const yPos = MoveActorDeltaData.readPossibleCoordinate(
			stream,
			flags,
			MoveActorDeltaFlags.FLAG_HAS_Y,
		);
		const zPos = MoveActorDeltaData.readPossibleCoordinate(
			stream,
			flags,
			MoveActorDeltaFlags.FLAG_HAS_Z,
		);
		const pitch = MoveActorDeltaData.readPossibleRotation(
			stream,
			flags,
			MoveActorDeltaFlags.FLAG_HAS_PITCH,
		);
		const yaw = MoveActorDeltaData.readPossibleRotation(
			stream,
			flags,
			MoveActorDeltaFlags.FLAG_HAS_YAW,
		);
		const headYaw = MoveActorDeltaData.readPossibleRotation(
			stream,
			flags,
			MoveActorDeltaFlags.FLAG_HAS_HEAD_YAW,
		);
		return new MoveActorDeltaData(
			runtimeEntityId,
			flags,
			xPos,
			yPos,
			zPos,
			pitch,
			yaw,
			headYaw,
		);
	}

	static override write(stream: BinaryStream, value: MoveActorDeltaData): void {
		stream.writeShort(value.flags, Endianness.Little);
		MoveActorDeltaData.writePossibleCoordinate(
			stream,
			value.xPos,
			value.flags,
			MoveActorDeltaFlags.FLAG_HAS_X,
		);
		MoveActorDeltaData.writePossibleCoordinate(
			stream,
			value.yPos,
			value.flags,
			MoveActorDeltaFlags.FLAG_HAS_Y,
		);
		MoveActorDeltaData.writePossibleCoordinate(
			stream,
			value.zPos,
			value.flags,
			MoveActorDeltaFlags.FLAG_HAS_Z,
		);
		MoveActorDeltaData.writePossibleRotation(
			stream,
			value.pitch,
			value.flags,
			MoveActorDeltaFlags.FLAG_HAS_PITCH,
		);
		MoveActorDeltaData.writePossibleRotation(
			stream,
			value.yaw,
			value.flags,
			MoveActorDeltaFlags.FLAG_HAS_YAW,
		);
		MoveActorDeltaData.writePossibleRotation(
			stream,
			value.headYaw,
			value.flags,
			MoveActorDeltaFlags.FLAG_HAS_HEAD_YAW,
		);
	}
}

export { MoveActorDeltaData };
