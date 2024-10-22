import { DataPacket } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";
import { UnlockedRecipesEntry } from "./types/UnlockedRecipesEntry";

@Proto(199)
class UnlockedRecipesPacket extends DataPacket {
	@Serialize(UnlockedRecipesEntry) public recipes!: UnlockedRecipesEntry;
}

export { UnlockedRecipesPacket };
