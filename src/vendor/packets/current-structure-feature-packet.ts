import { VarString } from "@serenityjs/binarystream";
import { DataPacket } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";

@Proto(314)
class CurrectStructureFeaturePacket extends DataPacket {
    @Serialize(VarString) public featureId!: string;
}

export { CurrectStructureFeaturePacket };
