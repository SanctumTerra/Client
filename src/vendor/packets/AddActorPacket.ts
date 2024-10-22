import {
	Endianness,
	Float32,
	VarLong,
	VarString,
	ZigZong,
} from "@serenityjs/binarystream";
import {
	DataPacket,
	EntityAttributes,
	Links,
	Packet,
	PropertySyncData,
	Vector3f,
} from "@serenityjs/protocol";
import { Serialize, Proto } from "@serenityjs/raknet";
import { DataItem } from "./types/data-item";

@Proto(Packet.AddEntity)
class AddEntityPacket extends DataPacket {
	@Serialize(ZigZong) public uniqueEntityId!: bigint;
	@Serialize(VarLong) public runtimeId!: bigint;
	@Serialize(VarString) public identifier!: string;
	@Serialize(Vector3f) public position!: Vector3f;
	@Serialize(Vector3f) public velocity!: Vector3f;
	@Serialize(Float32, Endianness.Little) public pitch!: number;
	@Serialize(Float32, Endianness.Little) public yaw!: number;
	@Serialize(Float32, Endianness.Little) public headYaw!: number;
	@Serialize(Float32, Endianness.Little) public bodyYaw!: number;
	@Serialize(EntityAttributes) public attributes!: Array<EntityAttributes>;
	@Serialize(DataItem) public data!: Array<DataItem>;
	@Serialize(PropertySyncData) public properties!: PropertySyncData;
	@Serialize(Links) public links!: Array<Links>;
}

export { AddEntityPacket };
