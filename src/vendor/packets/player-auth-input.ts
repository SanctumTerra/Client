import { Serialize } from "@sanctumterra/raknet";
import {
	type BinaryStream,
	Endianness,
	Float32,
	VarInt,
} from "@serenityjs/binarystream";
import {
	ClientPredictedVehicle,
	DataPacket,
	InputData,
	type InputMode,
	type InteractionMode,
	InventoryAction,
	type ItemStackRequest,
	ItemStackRequestAction,
	ItemUseInventoryTransaction,
	LegacyTransaction,
	Packet,
	PlayerAuthInputData,
	PlayerBlockActions,
	PlayerInputTick,
	type PlayMode,
	Vector2f,
	Vector3f,
} from "@serenityjs/protocol";
import { DataType, Proto } from "@serenityjs/raknet";

export class InputTransaction extends DataType {
	public legacyTransaction!: LegacyTransaction;
	public actions!: Array<InventoryAction>;
	public trasactionUseItem!: ItemUseInventoryTransaction;

	public constructor(
		legacyTransactionn: LegacyTransaction,
		actions: Array<InventoryAction>,
		transactionUseItem: ItemUseInventoryTransaction,
	) {
		super();
		this.legacyTransaction = legacyTransactionn;
		this.actions = actions;
		this.trasactionUseItem = transactionUseItem;
	}
	public static write(
		stream: BinaryStream,
		value: InputTransaction,
		_: unknown,
		data: PlayerAuthInputData,
	) {
		if (!data.hasFlag(InputData.PerformItemInteraction)) return;

		LegacyTransaction.write(stream, value.legacyTransaction);

		stream.writeVarInt(value.actions.length);

		for (const action of value.actions) {
			InventoryAction.write(stream, action);
		}

		ItemUseInventoryTransaction.write(stream, value.trasactionUseItem);
	}

	public static read(
		stream: BinaryStream,
		_: unknown,
		data: PlayerAuthInputData,
	): InputTransaction | null {
		if (!data.hasFlag(InputData.PerformItemInteraction)) return null;
		const legacyTransaction = LegacyTransaction.read(stream);
		const amount = stream.readVarInt();
		const actions: Array<InventoryAction> = [];

		for (let index = 0; index < amount; index++) {
			const action = InventoryAction.read(stream);
			actions.push(action);
		}

		const transactionUseItem = ItemUseInventoryTransaction.read(stream);
		return new InputTransaction(legacyTransaction, actions, transactionUseItem);
	}
}

class PlayerAuthItemStackRequest extends DataType {
	/**
	 * The item stack request id.
	 */
	public readonly clientRequestId: number;

	/**
	 * The item stack request actions.
	 */
	public readonly actions: Array<ItemStackRequestAction>;

	/**
	 * The filter strings of the item stack request.
	 */
	public readonly filterStrings: Array<string>;

	/**
	 * The origin of the strings filter.
	 */
	public readonly stringsFilterOrigin: number;

	/**
	 * Creates a new instance of ItemStackRequest.
	 * @param clientRequestId - The item stack request id.
	 * @param actions - The item stack request actions.
	 * @param filterStrings - The filter strings of the item stack request.
	 * @param stringsFilterOrigin - The origin of the strings filter.
	 */
	public constructor(
		clientRequestId: number,
		actions: Array<ItemStackRequestAction>,
		filterStrings: Array<string>,
		stringsFilterOrigin: number,
	) {
		super();
		this.clientRequestId = clientRequestId;
		this.actions = actions;
		this.filterStrings = filterStrings;
		this.stringsFilterOrigin = stringsFilterOrigin;
	}

	public static read(
		stream: BinaryStream,
		_: unknown,
		data: PlayerAuthInputData,
	): PlayerAuthItemStackRequest | null {
		// Check if the input data has the block actions flag
		if (!data.hasFlag(InputData.PerformItemStackRequest)) return null;

		// Read the client request id.
		const clientRequestId = stream.readZigZag();

		// Read the actions.
		const actions = new Array<ItemStackRequestAction>();
		const actionsCount = stream.readVarInt();
		for (let index = 0; index < actionsCount; index++) {
			actions.push(ItemStackRequestAction.read(stream));
		}

		// Read the filter strings.
		const filterStrings = new Array<string>();
		const filterStringsCount = stream.readVarInt();
		for (let index = 0; index < filterStringsCount; index++) {
			filterStrings.push(stream.readVarString());
		}

		// Read the strings filter origin.
		const stringsFilterOrigin = stream.readInt32(Endianness.Little);

		return new PlayerAuthItemStackRequest(
			clientRequestId,
			actions,
			filterStrings,
			stringsFilterOrigin,
		);
	}

	public static write(
		stream: BinaryStream,
		value: ItemStackRequest,
		_: unknown,
		data: PlayerAuthInputData,
	): void {
		// Check if the input data has the block actions flag
		if (!data.hasFlag(InputData.PerformItemStackRequest)) return;

		// Write the client request id.
		stream.writeZigZag(value.clientRequestId);

		// Write the amount of actions.
		stream.writeVarInt(value.actions.length);

		// Iterate through the actions.
		for (const action of value.actions) {
			// Write the action.
			ItemStackRequestAction.write(stream, action);
		}

		// Write the amount of filter strings.
		stream.writeVarInt(value.filterStrings.length);
	}
}

// @ts-ignore
@Proto(Packet.PlayerAuthInput)
export class PlayerAuthInputPacket extends DataPacket {
	@Serialize(Vector2f) public rotation!: Vector2f;
	@Serialize(Vector3f) public position!: Vector3f;
	@Serialize(Vector2f) public motion!: Vector2f;
	@Serialize(Float32, Endianness.Little) public headYaw!: number;
	@Serialize(PlayerAuthInputData) public inputData!: PlayerAuthInputData;
	@Serialize(VarInt) public inputMode!: InputMode;
	@Serialize(VarInt) public playMode!: PlayMode;
	@Serialize(VarInt) public interactionMode!: InteractionMode;
	@Serialize(Vector2f) public interactRotation!: Vector2f;
	@Serialize(PlayerInputTick) public inputTick!: bigint;
	@Serialize(Vector3f) public positionDelta!: Vector3f;

	@Serialize(InputTransaction, 0, "inputData")
	public inputTransaction!: InputTransaction | null;

	@Serialize(PlayerAuthItemStackRequest, 0, "inputData")
	public itemStackRequest!: PlayerAuthItemStackRequest | null;

	@Serialize(PlayerBlockActions, 0, "inputData")
	public blockActions!: PlayerBlockActions | null;

	@Serialize(ClientPredictedVehicle, 0, "inputData")
	public predictedVehicle!: ClientPredictedVehicle | null;

	@Serialize(Vector2f) public analogueMotion!: Vector2f;
	@Serialize(Vector3f) public cameraOrientation!: Vector3f;
	@Serialize(Vector2f) public rawMoveVector!: Vector2f;
}

export { PlayerAuthInputData };
