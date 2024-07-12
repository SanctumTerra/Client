import { DataPacket } from "@serenityjs/protocol";
import { Bool } from "@serenityjs/binarystream";
import { Proto } from "../proto";
import { Serialize } from "../serialize";

@Proto(129)
class CacheStatusPacket extends DataPacket {
	@Serialize(Bool) public enabled!: boolean;
}

export { CacheStatusPacket };