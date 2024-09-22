import { DataType } from "@serenityjs/raknet";

import {
	NetworkItemInstanceDescriptor,
	RecipeIngredient,
} from "@serenityjs/protocol";

import type { BinaryStream } from "@serenityjs/binarystream";

class SmithingTransformRecipe extends DataType {
	/**
	 * The identifier of the recipe
	 */
	public readonly identifier: string;

	/**
	 * The template ingredient
	 */
	public readonly templateIngredient: RecipeIngredient;

	/**
	 * The base ingredient
	 */
	public readonly baseIngredient: RecipeIngredient;

	/**
	 * The additional ingredient
	 */
	public readonly additionalIngredient: RecipeIngredient;

	/**
	 * The resultant of the recipe
	 */
	public readonly resultant: NetworkItemInstanceDescriptor;

	/**
	 * The tag of the recipe
	 */
	public readonly tag: string;

	/**
	 * The network ID of the recipe
	 */
	public readonly recipeNetworkId: number;

	/**
	 * @param identifier The identifier of the recipe
	 * @param templateIngredient The template ingredient
	 * @param baseIngredient The base ingredient
	 * @param additionalIngredient The additional ingredient
	 * @param resultant The resultant of the recipe
	 * @param tag The tag of the recipe
	 * @param recipeNetworkId The network ID of the recipe
	 */
	public constructor(
		identifier: string,
		templateIngredient: RecipeIngredient,
		baseIngredient: RecipeIngredient,
		additionalIngredient: RecipeIngredient,
		resultant: NetworkItemInstanceDescriptor,
		tag: string,
		recipeNetworkId: number,
	) {
		super();
		this.identifier = identifier;
		this.templateIngredient = templateIngredient;
		this.baseIngredient = baseIngredient;
		this.additionalIngredient = additionalIngredient;
		this.resultant = resultant;
		this.tag = tag;
		this.recipeNetworkId = recipeNetworkId;
	}

	public static read(stream: BinaryStream): SmithingTransformRecipe {
		// Read the identifier of the recipe
		const identifier = stream.readVarString();

		// Read the template ingredient
		const templateIngredient = RecipeIngredient.read(stream);

		// Read the base ingredient
		const baseIngredient = RecipeIngredient.read(stream);

		// Read the additional ingredient
		const additionalIngredient = RecipeIngredient.read(stream);

		// Read the resultant of the recipe
		const resultant = NetworkItemInstanceDescriptor.read(stream);

		// Read the tag of the recipe
		const tag = stream.readVarString();

		// Read the network ID of the recipe
		const recipeNetworkId = stream.readVarInt();

		return new SmithingTransformRecipe(
			identifier,
			templateIngredient,
			baseIngredient,
			additionalIngredient,
			resultant,
			tag,
			recipeNetworkId,
		);
	}

	public static write(
		stream: BinaryStream,
		value: SmithingTransformRecipe,
	): void {
		// Write the identifier of the recipe
		stream.writeVarString(value.identifier);

		// Write the template ingredient
		RecipeIngredient.write(stream, value.templateIngredient);

		// Write the base ingredient
		RecipeIngredient.write(stream, value.baseIngredient);

		// Write the additional ingredient
		RecipeIngredient.write(stream, value.additionalIngredient);

		// Write the resultant of the recipe
		NetworkItemInstanceDescriptor.write(stream, value.resultant);

		// Write the tag of the recipe
		stream.writeVarString(value.tag);

		// Write the network ID of the recipe
		stream.writeVarInt(value.recipeNetworkId);
	}
}

class MultiRecipe extends DataType {
	/**
	 * The uuid of the recipe.
	 */
	public readonly uuid: string;

	/**
	 * The network id of the recipe.
	 */
	public readonly networkId: number;

	/**
	 * Creates an instance of MultiRecipe.
	 * @param uuid The uuid of the recipe.
	 * @param networkId The network id of the recipe.
	 */
	public constructor(uuid: string, networkId: number) {
		super();
		this.uuid = uuid;
		this.networkId = networkId;
	}

	public static read(stream: BinaryStream): MultiRecipe {
		// Read the uuid of the recipe.
		const uuid = stream.readUuid();

		// Read the network id of the recipe.
		const networkId = stream.readVarInt();

		// Return the multi recipe.
		return new MultiRecipe(uuid, networkId);
	}

	public static write(stream: BinaryStream, value: MultiRecipe): void {
		// Write the uuid of the recipe.
		stream.writeUuid(value.uuid);

		// Write the network id of the recipe.
		stream.writeVarInt(value.networkId);
	}
}

class FurnanceAuxRecipe extends DataType {
	/**
	 * The input of the recipe.
	 */
	public readonly data: number;

	/**
	 * The metadata of the recipe input.
	 */
	public readonly metadata: number;

	/**
	 * The result of the recipe.
	 */
	public readonly resultant: NetworkItemInstanceDescriptor;

	/**
	 * The tag of the recipe.
	 */
	public readonly tag: string;

	/**
	 * Creates an instance of FurnanceAuxRecipe.
	 * @param data The input of the recipe.
	 * @param metadata The metadata of the recipe input.
	 * @param resultant The result of the recipe.
	 * @param tag The tag of the recipe.
	 */
	public constructor(
		data: number,
		metadata: number,
		resultant: NetworkItemInstanceDescriptor,
		tag: string,
	) {
		super();
		this.data = data;
		this.metadata = metadata;
		this.resultant = resultant;
		this.tag = tag;
	}

	public static read(stream: BinaryStream): FurnanceAuxRecipe {
		// Read the input of the recipe.
		const data = stream.readZigZag();

		// Read the metadata of the recipe input.
		const metadata = stream.readZigZag();

		// Read the result of the recipe.
		const resultant = NetworkItemInstanceDescriptor.read(stream);

		// Read the tag of the recipe.
		const tag = stream.readVarString();

		// Return the furnace recipe.
		return new FurnanceAuxRecipe(data, metadata, resultant, tag);
	}

	public static write(stream: BinaryStream, value: FurnanceAuxRecipe): void {
		// Write the input of the recipe.
		stream.writeZigZag(value.data);

		// Write the metadata of the recipe input.
		stream.writeZigZag(value.metadata);

		// Write the result of the recipe.
		NetworkItemInstanceDescriptor.write(stream, value.resultant);

		// Write the tag of the recipe.
		stream.writeVarString(value.tag);
	}
}
class FurnanceRecipe extends DataType {
	/**
	 * The input of the recipe.
	 */
	public readonly data: number;

	/**
	 * The result of the recipe.
	 */
	public readonly resultant: NetworkItemInstanceDescriptor;

	/**
	 * The tag of the recipe.
	 */
	public readonly tag: string;

	/**
	 * Creates an instance of FurnanceRecipe.
	 * @param data The input of the recipe.
	 * @param resultant The result of the recipe.
	 * @param tag The tag of the recipe.
	 */
	public constructor(
		data: number,
		resultant: NetworkItemInstanceDescriptor,
		tag: string,
	) {
		super();
		this.data = data;
		this.resultant = resultant;
		this.tag = tag;
	}

	public static read(stream: BinaryStream): FurnanceRecipe {
		// Read the input of the recipe.
		const data = stream.readZigZag();

		// Read the result of the recipe.
		const resultant = NetworkItemInstanceDescriptor.read(stream);

		// Read the tag of the recipe.
		const tag = stream.readVarString();

		// Return the furnace recipe.
		return new FurnanceRecipe(data, resultant, tag);
	}

	public static write(stream: BinaryStream, value: FurnanceRecipe): void {
		// Write the input of the recipe.
		stream.writeZigZag(value.data);

		// Write the result of the recipe.
		NetworkItemInstanceDescriptor.write(stream, value.resultant);

		// Write the tag of the recipe.
		stream.writeVarString(value.tag);
	}
}
class SmithingTrimRecipe extends DataType {
	/**
	 * The identifier of the recipe
	 */
	public readonly identifier: string;

	/**
	 * The template ingredient
	 */
	public readonly templateIngredient: RecipeIngredient;

	/**
	 * The base ingredient
	 */
	public readonly baseIngredient: RecipeIngredient;

	/**
	 * The additional ingredient
	 */
	public readonly additionalIngredient: RecipeIngredient;

	/**
	 * The tag of the recipe
	 */
	public readonly tag: string;

	/**
	 * The network ID of the recipe
	 */
	public readonly recipeNetworkId: number;

	/**
	 * @param identifier The identifier of the recipe
	 * @param templateIngredient The template ingredient
	 * @param baseIngredient The base ingredient
	 * @param additionalIngredient The additional ingredient
	 * @param tag The tag of the recipe
	 * @param recipeNetworkId The network ID of the recipe
	 */
	public constructor(
		identifier: string,
		templateIngredient: RecipeIngredient,
		baseIngredient: RecipeIngredient,
		additionalIngredient: RecipeIngredient,
		tag: string,
		recipeNetworkId: number,
	) {
		super();
		this.identifier = identifier;
		this.templateIngredient = templateIngredient;
		this.baseIngredient = baseIngredient;
		this.additionalIngredient = additionalIngredient;
		this.tag = tag;
		this.recipeNetworkId = recipeNetworkId;
	}

	public static read(stream: BinaryStream): SmithingTrimRecipe {
		// Read the identifier of the recipe
		const identifier = stream.readVarString();

		// Read the template ingredient
		const templateIngredient = RecipeIngredient.read(stream);

		// Read the base ingredient
		const baseIngredient = RecipeIngredient.read(stream);

		// Read the additional ingredient
		const additionalIngredient = RecipeIngredient.read(stream);

		// Read the tag of the recipe
		const tag = stream.readVarString();

		// Read the network ID of the recipe
		const recipeNetworkId = stream.readVarInt();

		// Return the recipe
		return new SmithingTrimRecipe(
			identifier,
			templateIngredient,
			baseIngredient,
			additionalIngredient,
			tag,
			recipeNetworkId,
		);
	}

	public static write(stream: BinaryStream, value: SmithingTrimRecipe): void {
		// Write the identifier of the recipe
		stream.writeVarString(value.identifier);

		// Write the template ingredient
		RecipeIngredient.write(stream, value.templateIngredient);

		// Write the base ingredient
		RecipeIngredient.write(stream, value.baseIngredient);

		// Write the additional ingredient
		RecipeIngredient.write(stream, value.additionalIngredient);

		// Write the tag of the recipe
		stream.writeVarString(value.tag);

		// Write the network ID of the recipe
		stream.writeVarInt(value.recipeNetworkId);
	}
}

class ShulkerBoxRecipe extends DataType {
	/**
	 * The identifier of the recipe.
	 */
	public readonly identifier: string;

	/**
	 * The ingredients required to craft the recipe.
	 */
	public readonly ingredients: Array<RecipeIngredient>;

	/**
	 * The resultants of the recipe.
	 */
	public readonly resultants: Array<NetworkItemInstanceDescriptor>;

	/**
	 * The UUID of the recipe.
	 * why Mojank why...
	 */
	public readonly uuid: string;

	/**
	 * The tag of the recipe.
	 */
	public readonly tag: string;

	/**
	 * The priority of the recipe.
	 */
	public readonly priority: number;

	/**
	 * @param identifier The identifier of the recipe.
	 * @param ingredients The ingredients required to craft the recipe.
	 * @param resultants The resultants of the recipe.
	 * @param uuid The UUID of the recipe.
	 * @param tag The tag of the recipe.
	 * @param priority The priority of the recipe.
	 */
	public constructor(
		identifier: string,
		ingredients: Array<RecipeIngredient>,
		resultants: Array<NetworkItemInstanceDescriptor>,
		uuid: string,
		tag: string,
		priority: number,
	) {
		super();
		this.identifier = identifier;
		this.ingredients = ingredients;
		this.resultants = resultants;
		this.uuid = uuid;
		this.tag = tag;
		this.priority = priority;
	}

	public static read(stream: BinaryStream): ShulkerBoxRecipe {
		// Read the identifier
		const identifier = stream.readVarString();

		// Read the number of ingredients
		const ingredientsCount = stream.readVarInt();
		const ingredients: Array<RecipeIngredient> = [];

		// Loop through the ingredients
		for (let index = 0; index < ingredientsCount; index++) {
			// Read the ingredient
			const ingredient = RecipeIngredient.read(stream);

			// Add the ingredient to the array
			ingredients.push(ingredient);
		}

		// Read the number of resultants
		const resultantsCount = stream.readVarInt();
		const resultants: Array<NetworkItemInstanceDescriptor> = [];

		// Loop through the resultants
		for (let index = 0; index < resultantsCount; index++) {
			// Read the resultant
			const resultant = NetworkItemInstanceDescriptor.read(stream);

			// Add the resultant to the array
			resultants.push(resultant);
		}

		// Read the UUID
		const uuid = stream.readUuid();

		// Read the tag
		const tag = stream.readVarString();

		// Read the priority
		const priority = stream.readZigZag();

		// Return a new instance with the identifier, ingredients, resultants, UUID, tag, priority, and requirement
		return new ShulkerBoxRecipe(
			identifier,
			ingredients,
			resultants,
			uuid,
			tag,
			priority,
		);
	}

	public static write(stream: BinaryStream, value: ShulkerBoxRecipe): void {
		// Write the identifier
		stream.writeVarString(value.identifier);

		// Get the ingredients
		const ingredients = value.ingredients as Array<RecipeIngredient>;

		// Write the number of ingredients
		stream.writeVarInt(ingredients.length);

		// Loop through the ingredients
		for (const ingredient of ingredients) {
			// Write the ingredient
			RecipeIngredient.write(stream, ingredient);
		}

		// Get the resultants
		const resultants = value.resultants as Array<NetworkItemInstanceDescriptor>;

		// Write the number of resultants
		stream.writeVarInt(resultants.length);

		// Loop through the resultants
		for (const resultant of resultants) {
			// Write the resultant
			NetworkItemInstanceDescriptor.write(stream, resultant);
		}

		// Write the UUID
		stream.writeUuid(value.uuid);

		// Write the tag
		stream.writeVarString(value.tag);

		// Write the priority
		stream.writeZigZag(value.priority);
	}
}

export { ShulkerBoxRecipe };
export { SmithingTrimRecipe };
export { FurnanceRecipe };
export { FurnanceAuxRecipe };
export { MultiRecipe };
export { SmithingTransformRecipe };
