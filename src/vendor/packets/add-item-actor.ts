import { Bool, VarLong, ZigZong } from "@serenityjs/binarystream";
import { DataPacket, NetworkItemStackDescriptor, Packet, Vector3f } from "@serenityjs/protocol";
import { Serialize, Proto } from "@serenityjs/raknet";
import { DataItem } from "./types/data-item";



@Proto(Packet.AddItemActor)
class AddItemActorPacket extends DataPacket {
	@Serialize(ZigZong) public uniqueId!: bigint;
	@Serialize(VarLong) public runtimeId!: bigint;
	@Serialize(NetworkItemStackDescriptor)
	public item!: NetworkItemStackDescriptor;

	@Serialize(Vector3f) public position!: Vector3f;
	@Serialize(Vector3f) public velocity!: Vector3f;
	@Serialize(DataItem) public data!: Array<DataItem>;
	@Serialize(Bool) public fromFishing!: boolean;
}

export { AddItemActorPacket };