import { DataPacket } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";
import { CompoundTag } from "@serenityjs/nbt";
import { CacheableNbt } from "./types/CacheableNbt";
import { VarInt } from "@serenityjs/binarystream";

@Proto(165)
class SyncActorPropertyPacket extends DataPacket {
	@Serialize(CompoundTag, true) public properties!: CompoundTag;
}

export { SyncActorPropertyPacket };
