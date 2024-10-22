import { DataPacket } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";
import { Patterns } from "./types/Patterns";
import { Materials } from "./types/Materials";

@Proto(302)
class TrimDataPacket extends DataPacket {
	@Serialize(Patterns) public patterns!: Patterns;
	@Serialize(Materials) public materials!: Materials;
}

export { TrimDataPacket };
