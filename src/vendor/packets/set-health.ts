import { Long, VarLong, ZigZag } from "@serenityjs/binarystream";
import { DataPacket } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";

@Proto(42)
class SetHealthPacket extends DataPacket {
    @Serialize(ZigZag) public health!: number;
}

export { SetHealthPacket };
