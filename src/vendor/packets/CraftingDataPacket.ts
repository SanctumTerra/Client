import { Proto, Serialize } from "@serenityjs/raknet";
import { Bool } from "@serenityjs/binarystream";
import {
	ContainerMixDataEntry,
	DataPacket,
	MaterialReducerDataEntry,
	Packet,
	PotionMixDataEntry,
} from "@serenityjs/protocol";
import { CraftingDataEntry } from "./types/CraftingDataEntry";

@Proto(Packet.CraftingData)
class CraftingDataPacket extends DataPacket {
	@Serialize(CraftingDataEntry) public crafting!: Array<CraftingDataEntry>;
	@Serialize(PotionMixDataEntry) public potions!: Array<PotionMixDataEntry>;
	@Serialize(ContainerMixDataEntry)
	public containers!: Array<ContainerMixDataEntry>;

	@Serialize(MaterialReducerDataEntry)
	public materitalReducers!: Array<MaterialReducerDataEntry>;

	@Serialize(Bool) public clearRecipes!: boolean;
}

export { CraftingDataPacket };
