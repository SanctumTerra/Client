import { Endianness, type BinaryStream } from "@serenityjs/binarystream";
import { DataType, Serialize } from "@serenityjs/raknet";

enum UnlockedRecipesType {
	EMPTY = 0,
	INITIALLY_UNLOCKED = 1,
	NEWLY_UNLOCKED = 2,
	REMOVED = 3,
	REMOVED_ALL = 4,
}

class UnlockedRecipesEntry extends DataType {
	public type: UnlockedRecipesType;
	public recipes: string[] = [];

	public constructor(type: UnlockedRecipesType, recipes: string[]) {
		super();
		this.type = type;
		this.recipes = recipes;
	}

	public static write(stream: BinaryStream, value: UnlockedRecipesEntry): void {
		stream.writeInt32(value.type, Endianness.Little);
		stream.writeVarInt(value.recipes.length);
		for (const recipe of value.recipes) {
			stream.writeVarString(recipe);
		}
	}

	public static read(stream: BinaryStream): UnlockedRecipesEntry {
		const recipes = [];
		const type = stream.readInt32(Endianness.Little);
		const recipeCount = stream.readVarInt();

		for (let i = 0; i < recipeCount; i++) {
			recipes.push(stream.readVarString());
		}

		console.log(stream.readRemainingBuffer());
		return new UnlockedRecipesEntry(type, recipes);
	}
}

export { UnlockedRecipesEntry };
