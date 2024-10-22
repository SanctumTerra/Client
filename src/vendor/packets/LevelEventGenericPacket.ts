import { VarInt } from "@serenityjs/binarystream";
import { DataPacket } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";
import { NbtLoop } from "./types/NbtLoop";
import { CompoundTag } from "@serenityjs/nbt";

@Proto(124)
class LevelEventGenericPacket extends DataPacket {
    @Serialize(VarInt) public eventId!: number;
    @Serialize(NbtLoop) public nbtData!: NbtLoop;
}

export { LevelEventGenericPacket };
