import { DataPacket, Packet } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";
import { ComponentItem } from "./types/ComponentItem";

@Proto(Packet.ItemComponent)
class ItemComponentPacket extends DataPacket {
	@Serialize(ComponentItem) public items!: Array<ComponentItem>;
}

export { ItemComponentPacket };
