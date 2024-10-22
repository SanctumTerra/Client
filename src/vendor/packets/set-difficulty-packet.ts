import { DataPacket, type Difficulty } from "@serenityjs/protocol";

import { VarInt } from "@serenityjs/binarystream";
import { Proto, Serialize } from "@serenityjs/raknet";

@Proto(60)
class SetDifficultyPacket extends DataPacket {
    @Serialize(VarInt) public difficulty!: Difficulty;
}

export { SetDifficultyPacket };
