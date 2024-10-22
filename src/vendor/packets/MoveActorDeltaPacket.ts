import { DataPacket } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";
import { VarInt } from "@serenityjs/binarystream";
import { MoveActorDeltaData } from "./types/MoveActorDeltaData";

@Proto(111)
class MoveActorDeltaPacket extends DataPacket {
	@Serialize(MoveActorDeltaData) public actorData!: MoveActorDeltaData;
}

export { MoveActorDeltaPacket };
