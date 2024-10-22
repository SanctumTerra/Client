import { VarString } from "@serenityjs/binarystream";
import { DataPacket } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";
import { Fogs } from "./types/Fogs";

@Proto(160)
class PlayerFogPacket extends DataPacket {
	@Serialize(Fogs) public stack!: Fogs;
}

export { PlayerFogPacket };
