import {
	PlayerBlockActions,
	BlockFace,
	InputMode,
	InteractionMode,
	ItemUseInventoryTransaction,
	ItemUseInventoryTransactionType,
	LegacyTransaction,
	type MovePlayerPacket,
	NetworkItemStackDescriptor,
	PlayerActionPacket,
	PlayMode,
	TextPacket,
	TextPacketType,
	TriggerType,
	Vector2f,
	Vector3f,
	PlayerActionType,
	PlayerBlockActionData,
	InputData,
	type PlayerAuthInputPacket as ProtocolPlayerAuthInputPacket,
	InventoryTransactionPacket,
	InventoryTransaction,
	AnimatePacket,
	AnimateId,
	ComplexInventoryTransaction,
	BlockPosition,
	ItemStackRequestPacket,
	ItemStackRequestActionType,
	ItemStackRequest,
	ItemStackRequestAction,
	ItemStackActionTakePlace,
} from "@serenityjs/protocol";
import { Priority } from "@serenityjs/raknet";
import type { ClientOptions } from "./client/ClientOptions";
import { Inventory } from "./client/inventory/Inventory";
import { Connection } from "./Connection";
import { Logger } from "./vendor/Logger";
import { Queue } from "./vendor/Queue";
import {
	InputTransaction,
	PlayerAuthInputData,
	PlayerAuthInputPacket as CustomPlayerAuthInputPacket,
} from "./vendor/packets/player-auth-input";

class Client extends Connection {
	private sneaking = false;
	private firstSneak = false;

	public headYaw = 0;
	public pitch = 0;
	public yaw = 0;
	public velocity: Vector3f = new Vector3f(0, 0, 0);

	public inventory: Inventory;

	private breakQueue: Queue<Vector3f> = new Queue();
	private isBreaking = false;
	private requestId = -2;

	constructor(options: Partial<ClientOptions> = {}) {
		super(options);
		this.inventory = new Inventory(this);
		this.on("spawn", this.handleAuthInput.bind(this));
		this.on("MovePlayerPacket", this.onMovePlayer.bind(this));
	}

	public async sneak() {
		this.firstSneak = true;
		this.sneaking = true;
	}

	private onMovePlayer(instance: MovePlayerPacket): void {
		if (instance.runtimeId === this.runtimeEntityId) {
			this.position = instance.position;
			this.pitch = instance.pitch;
			this.yaw = instance.yaw;
			this.headYaw = instance.headYaw;
		}
	}

	private handleAuthInput(): void {
		setInterval(() => {
			const inputData = new PlayerAuthInputData(0n);
			inputData.setFlag(InputData.BlockBreakingDelayEnabled, true);
			if (this.sneaking) {
				if (this.firstSneak) {
					this.firstSneak = false;
					inputData.setFlag(InputData.StartSneaking, true);
					inputData.setFlag(InputData.SneakDown, true);
				}
				inputData.setFlag(InputData.Sneaking, true);
			}

			const packet = new CustomPlayerAuthInputPacket();
			packet.rotation = new Vector2f(this.pitch, this.yaw);
			packet.position = this.position;
			packet.motion = new Vector2f(this.velocity.x, this.velocity.z);
			packet.headYaw = this.headYaw;
			packet.inputData = inputData;
			packet.inputMode = InputMode.Mouse;
			packet.playMode = PlayMode.Screen;
			packet.interactionMode = InteractionMode.Touch;
			packet.interactRotation = new Vector2f(0, 0);
			packet.inputTick = BigInt(this.tick);
			packet.positionDelta = new Vector3f(0, 0, 0);
			packet.itemStackRequest = null;
			packet.blockActions = null;
			packet.predictedVehicle = null;
			packet.analogueMotion = new Vector2f(0, 0);
			packet.cameraOrientation = new Vector3f(0, 0, 0);
			packet.rawMoveVector = new Vector2f(0, 0);
			const cancel = false;
			this.emit("PrePlayerAuthInputPacket", packet, cancel);
			if (!cancel) {
				this.sendPacket(packet, Priority.Immediate);
			}
		}, 50);
	}

	public sendMessage(text: string): void {
		const textPacket = new TextPacket();
		textPacket.filtered = "";
		textPacket.message = text.replace(/^\s+/, "");
		textPacket.needsTranslation = false;
		textPacket.parameters = [];
		textPacket.platformChatId = "";
		textPacket.source = this.data.profile.name;
		textPacket.type = TextPacketType.Chat;
		textPacket.xuid = "";
		this.sendPacket(textPacket, Priority.Normal);
	}

	/**
	 * Look at a specific position in the world
	 * @param x The x coordinate of the target position
	 * @param y The y coordinate of the target position
	 * @param z The z coordinate of the target position
	 * @param aimWithHead Whether to adjust the pitch (true) or only yaw (false)
	 */
	public lookAt(x: number, y: number, z: number, aimWithHead = true): void {
		const view = {
			x: x - this.position.x,
			y: y - this.position.y,
			z: z - this.position.z,
		};

		const dz = view.z;
		const dx = view.x;

		const tanOutput = 90 - Math.atan(dx / dz) * (180 / Math.PI);
		let thetaOffset = 270;

		if (dz < 0) {
			thetaOffset = 90;
		}

		const yaw = thetaOffset + tanOutput;

		if (aimWithHead) {
			const bDiff = Math.sqrt(dx * dx + dz * dz);
			const dy = this.position.y - y;
			this.pitch = Math.atan(dy / bDiff) * (180 / Math.PI);
		}

		this.yaw = yaw;
		this.headYaw = yaw;
	}

	/**
	 * Calculate the face of a block
	 * @param blockPosition The position of the block
	 * @returns The face of the block
	 */
	private calculateFace(blockPosition: Vector3f): number {
		const dx = blockPosition.x - this.position.x;
		const dy = blockPosition.y - this.position.y;
		const dz = blockPosition.z - this.position.z;

		const absDx = Math.abs(dx);
		const absDy = Math.abs(dy);
		const absDz = Math.abs(dz);

		if (absDx > absDy && absDx > absDz) {
			return dx > 0 ? BlockFace.East : BlockFace.West;
		}
		if (absDy > absDx && absDy > absDz) {
			return dy > 0 ? BlockFace.Top : BlockFace.Bottom;
		}
		return dz > 0 ? BlockFace.South : BlockFace.North;
	}

	/**
	 * Queue a block to be broken
	 * @param position The position of the block
	 */
	public queueBreak(position: Vector3f): void {
		this.breakQueue.enqueue(position);
		this.processBreakQueue();
	}

	/**
	 * Process the break queue
	 */
	private async processBreakQueue(): Promise<void> {
		if (this.isBreaking || this.breakQueue.isEmpty()) {
			return;
		}

		this.isBreaking = true;

		while (!this.breakQueue.isEmpty()) {
			const position = this.breakQueue.dequeue();
			if (position) {
				await this.breakBlock(position);
			}
		}

		this.isBreaking = false;
	}

	/**
	 * Break a block
	 * @param position The position of the block
	 * @param ticks The number of ticks to break the block
	 */
	public async breakBlock(position: Vector3f, ticks = 5): Promise<void> {
		const MAX_DISTANCE = 5;
		const TICK_INTERVAL = 50;

		const isBlockTooFar = (
			playerPosition: Vector3f,
			blockPosition: Vector3f,
		): boolean => {
			return (
				Math.abs(blockPosition.x - playerPosition.x) > MAX_DISTANCE ||
				Math.abs(blockPosition.y - playerPosition.y) > MAX_DISTANCE ||
				Math.abs(blockPosition.z - playerPosition.z) > MAX_DISTANCE
			);
		};

		const modifyNextPacket = (
			modifier: (packet: CustomPlayerAuthInputPacket) => void,
		): Promise<void> => {
			return new Promise((resolve) => {
				const handler = (
					packet: ProtocolPlayerAuthInputPacket,
					cancel: boolean,
				) => {
					modifier(packet as unknown as CustomPlayerAuthInputPacket);
					this.removeListener("PrePlayerAuthInputPacket", handler);
					resolve();
				};
				this.on("PrePlayerAuthInputPacket", handler);
			});
		};

		if (isBlockTooFar(this.position, position)) {
			Logger.warn(
				`The block is too far from the player. Max distance is ${MAX_DISTANCE} blocks.`,
			);
			return;
		}

		this.lookAt(position.x, position.y, position.z);
		const face = this.calculateFace(position);

		// Start Break
		await modifyNextPacket((packet: CustomPlayerAuthInputPacket) => {
			packet.blockActions = new PlayerBlockActions([
				new PlayerBlockActionData(
					PlayerActionType.StartDestroyBlock,
					position,
					face,
				),
				new PlayerBlockActionData(PlayerActionType.CrackBlock, position, face),
			]);
			packet.inputData.setFlag(InputData.PerformBlockActions, true);
		});

		// Crack Break
		for (let i = 0; i < ticks; i++) {
			await modifyNextPacket((packet: CustomPlayerAuthInputPacket) => {
				this.lookAt(position.x, position.y, position.z);
				packet.blockActions = new PlayerBlockActions([
					new PlayerBlockActionData(
						PlayerActionType.CrackBlock,
						position,
						face,
					),
				]);
				packet.inputData.setFlag(InputData.PerformBlockActions, true);
			});
			await new Promise((resolve) => setTimeout(resolve, TICK_INTERVAL));
		}

		// Stop Break
		await modifyNextPacket((packet: CustomPlayerAuthInputPacket) => {
			this.lookAt(position.x, position.y, position.z);
			packet.inputData.setFlag(InputData.PerformBlockActions, true);
			packet.inputData.setFlag(InputData.StartUsingItem, true);
			packet.inputData.setFlag(InputData.PerformItemInteraction, true);
			packet.blockActions = new PlayerBlockActions([
				new PlayerBlockActionData(
					PlayerActionType.StopDestroyBlock,
					position,
					face,
				),
			]);
			packet.inputTransaction = new InputTransaction(
				new LegacyTransaction(0, []),
				[],
				new ItemUseInventoryTransaction(
					ItemUseInventoryTransactionType.Destroy,
					TriggerType.Unknown,
					position,
					face,
					0,
					new NetworkItemStackDescriptor(0),
					this.position,
					new Vector3f(0, 0, 0),
					0,
					false,
				),
			);
		});
	}

	/**
	 * Break a block
	 * @param {Vector3f} position The position of the block
	 */
	public break(position: Vector3f): void {
		this.queueBreak(position);
	}

	/**
	 * DO NOT USE AS THIS IS NOT FINISHED!
	 * @todo Finish this
	 */
	public place(position: Vector3f): void {
		// this.lookAt(position.x, position.y, position.z);
		// const action1 = new PlayerActionPacket();
		// action1.entityRuntimeId = this.runtimeEntityId;
		// action1.action = ActionIds.StartItemUseOn;
		// action1.blockPosition = position.subtract(new Vector3f(0, 1, 0));
		// action1.face = this.calculateFace(position);
		// action1.resultPosition = position;
		// this.sendPacket(action1, Priority.Normal);
		// const transaction1 = new InventoryTransactionPacket();
		// transaction1.legacy = new LegacyTransaction(0);
		// transaction1.transaction = new InventoryTransaction(
		// 	ComplexInventoryTransaction.ItemUseTransaction,
		// 	[],
		// 	new ItemUseInventoryTransaction(
		// 		ItemUseInventoryTransactionType.Place,
		// 		TriggerType.PlayerInput,
		// 		new BlockPosition(position.x, position.y - 1, position.z),
		// 		this.calculateFace(position),
		// 		0,
		// 		this.inventory.getItem(0),
		// 		this.position,
		// 		new Vector3f(0, 0, 0),
		// 		this.inventory.getItem(0).networkBlockId ?? 0,
		// 		true,
		// 	),
		// );
		// this.sendPacket(transaction1);
		// const transaction2 = new InventoryTransactionPacket();
		// transaction2.legacy = new LegacyTransaction(0);
		// transaction2.transaction = new InventoryTransaction(
		// 	ComplexInventoryTransaction.ItemUseTransaction,
		// 	[],
		// 	new ItemUseInventoryTransaction(
		// 		ItemUseInventoryTransactionType.Use,
		// 		TriggerType.Unknown,
		// 		new BlockPosition(position.x, position.y - 1, position.z),
		// 		this.calculateFace(position),
		// 		0,
		// 		this.inventory.getItem(0),
		// 		this.position,
		// 		new Vector3f(0, 0, 0),
		// 		this.inventory.getItem(0).networkBlockId ?? 0,
		// 		false,
		// 	),
		// );
		// this.sendPacket(transaction2);
		// const action2 = new PlayerActionPacket();
		// action2.entityRuntimeId = this.runtimeEntityId;
		// action2.action = ActionIds.StopItemUseOn;
		// action2.blockPosition = position;
		// action2.face = this.calculateFace(position);
		// action2.resultPosition = new Vector3f(0, 0, 0);
		// this.sendPacket(action2);
	}

	public openChest(position: Vector3f): void {
		this.lookAt(position.x, position.y, position.z);
		const action = new PlayerActionPacket();
		action.entityRuntimeId = this.runtimeEntityId;
		action.action = PlayerActionType.StartItemUseOn;
		action.blockPosition = position;
		action.face = this.calculateFace(position);
		action.resultPosition = position;
		this.sendPacket(action, Priority.Normal);

		const animate = new AnimatePacket();
		animate.id = AnimateId.SwingArm;
		animate.runtimeEntityId = this.runtimeEntityId;
		animate.boatRowingTime = 0;
		this.sendPacket(animate, Priority.Normal);

		const transaction = new InventoryTransactionPacket();
		transaction.legacy = new LegacyTransaction(0);
		transaction.transaction = new InventoryTransaction(
			ComplexInventoryTransaction.ItemUseTransaction,
			[],
			new ItemUseInventoryTransaction(
				ItemUseInventoryTransactionType.Use,
				TriggerType.PlayerInput,
				new BlockPosition(position.x, position.y, position.z),
				this.calculateFace(position),
				0,
				new NetworkItemStackDescriptor(0),
				this.position,
				new Vector3f(0, 0, 0),
				0,
				true,
			),
		);
		this.sendPacket(transaction, Priority.Normal);

		const action2 = new PlayerActionPacket();
		action2.entityRuntimeId = this.runtimeEntityId;
		action2.action = PlayerActionType.StopItemUseOn;
		action2.blockPosition = position;
		action2.face = this.calculateFace(position);
		action2.resultPosition = new Vector3f(0, 0, 0);
		this.sendPacket(action2, Priority.Normal);

		// const itemStackRequest = new ItemStackRequestPacket();
		// const requests: ItemStackRequest[] = [];
		// const itemStackRequestAction = new ItemStackRequestAction(
		// 	ItemStackRequestActionType.Place,
		// 	new ItemStackActionTakePlace(

		// 	)

		// );

		// requests.push(
		// 	new ItemStackRequest(
		// 		this.requestId,
		// 		[itemStackRequestAction],
		// 		[],
		// 		0
		// 	),
		// );
		// this.sendPacket(itemStackRequest, Priority.Normal);
	}
}

export { Client };
