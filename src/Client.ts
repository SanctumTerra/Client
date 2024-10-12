import {
	ActionIds,
	BlockAction,
	BlockFace,
	BlockPosition,
	ComplexInventoryTransaction,
	InputDataFlags,
	InputMode,
	InputTransaction,
	InteractionMode,
	InventoryTransaction,
	InventoryTransactionPacket,
	ItemUseInventoryTransaction,
	ItemUseInventoryTransactionType,
	LegacyTransaction,
	type MovePlayerPacket,
	NetworkItemStackDescriptor,
	PlayerActionPacket,
	PlayerAuthInputData,
	PlayerAuthInputPacket,
	PlayMode,
	TextPacket,
	TextPacketType,
	TriggerType,
	Vector2f,
	Vector3f,
} from "@serenityjs/protocol";
import { Priority } from "@serenityjs/raknet";
import type { ClientOptions } from "./client/ClientOptions";
import { Inventory } from "./client/inventory/Inventory";
import { Connection } from "./Connection";
import { Logger } from "./vendor/Logger";
import { Queue } from "./vendor/Queue";

class Client extends Connection {
	private sneaking = false;
	private firstSneak = false;

	private headYaw = 0;
	private pitch = 0;
	private yaw = 0;
	private velocity: Vector3f = new Vector3f(0, 0, 0);

	public inventory: Inventory;

	private breakQueue: Queue<Vector3f> = new Queue();
	private isBreaking = false;

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
		this.position = instance.position;
	}

	private handleAuthInput(): void {
		setInterval(() => {
			const inputData = new PlayerAuthInputData();
			inputData.setFlag(InputDataFlags.BlockBreakingDelayEnabled, true);
			if (this.sneaking) {
				if (this.firstSneak) {
					this.firstSneak = false;
					inputData.setFlag(InputDataFlags.StartSneaking, true);
					inputData.setFlag(InputDataFlags.SneakDown, true);
				}
				inputData.setFlag(InputDataFlags.Sneaking, true);
			}

			const packet = new PlayerAuthInputPacket();
			packet.analogueMoveVector = new Vector2f(
				this.velocity.x,
				this.velocity.z,
			);
			packet.blockActions = [];
			packet.gazeDirection = undefined;
			packet.headYaw = this.headYaw;
			packet.inputData = inputData;
			packet.inputMode = InputMode.Mouse;
			packet.itemStackRequest = undefined;
			packet.motion = new Vector2f(this.velocity.x, this.velocity.z);
			packet.pitch = this.pitch;
			packet.playMode = PlayMode.Screen;
			packet.interactionMode = InteractionMode.Touch;
			packet.position = this.position;
			packet.positionDelta = new Vector3f(0, 0, 0);
			packet.tick = BigInt(this.tick);
			packet.transaction = undefined;
			packet.yaw = this.yaw;

			const cancel = false;
			this.emit("PrePlayerAuthInputPacket", packet, cancel);
			if (!cancel) {
				this.sendPacket(packet, Priority.Immediate);
			}
		}, 100);
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
	private async breakBlock(position: Vector3f, ticks = 5): Promise<void> {
		const MAX_DISTANCE = 5;
		const TICK_INTERVAL = 100;

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
			modifier: (packet: PlayerAuthInputPacket) => void,
		): Promise<void> => {
			return new Promise((resolve) => {
				this.once(
					"PrePlayerAuthInputPacket",
					(packet: PlayerAuthInputPacket) => {
						modifier(packet);
						resolve();
					},
				);
			});
		};

		const sleep = (ms: number): Promise<void> =>
			new Promise((resolve) => setTimeout(resolve, ms));

		if (isBlockTooFar(this.position, position)) {
			Logger.warn(
				`The block is too far from the player. Max distance is ${MAX_DISTANCE} blocks.`,
			);
			return;
		}

		const startTick = Number(this.tick);
		const endTick = startTick + ticks;

		this.lookAt(position.x, position.y, position.z);

		const face = this.calculateFace(position);
		// Start Break
		await modifyNextPacket((packet: PlayerAuthInputPacket) => {
			this.lookAt(position.x, position.y, position.z);
			packet.blockActions.push(
				new BlockAction(ActionIds.StartBreak, position, face),
				new BlockAction(ActionIds.CrackBreak, position, face),
			);
			packet.inputData.setFlag(InputDataFlags.BlockAction, true);
		});

		// Crack Break
		for (let tick = startTick + 1; tick < endTick; tick++) {
			await modifyNextPacket((packet: PlayerAuthInputPacket) => {
				this.lookAt(position.x, position.y, position.z);
				packet.blockActions.push(
					new BlockAction(ActionIds.CrackBreak, position, face),
				);
				packet.inputData.setFlag(InputDataFlags.BlockAction, true);
			});
			await sleep(TICK_INTERVAL);
		}

		// Stop Break
		await modifyNextPacket((packet: PlayerAuthInputPacket) => {
			packet.inputData.setFlag(InputDataFlags.BlockAction, true);
			packet.inputData.setFlag(InputDataFlags.ItemInteract, true);
			this.lookAt(position.x, position.y, position.z);

			packet.blockActions.push(
				new BlockAction(ActionIds.StopBreak),
				new BlockAction(ActionIds.CrackBreak, position, face),
			);

			packet.transaction = new InputTransaction(
				new LegacyTransaction(0, []),
				[],
				new ItemUseInventoryTransaction(
					ItemUseInventoryTransactionType.Destroy,
					TriggerType.Unknown,
					position,
					this.calculateFace(position),
					0,
					new NetworkItemStackDescriptor(0),
					this.position,
					new Vector3f(0, 0, 0),
					0,
					false,
				),
			);
		});
		await sleep(TICK_INTERVAL);
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
		this.lookAt(position.x, position.y, position.z);

		const action1 = new PlayerActionPacket();
		action1.entityRuntimeId = this.runtimeEntityId;
		action1.action = ActionIds.StartItemUseOn;
		action1.blockPosition = position.subtract(new Vector3f(0, 1, 0));
		action1.face = this.calculateFace(position);
		action1.resultPosition = position;

		this.sendPacket(action1, Priority.Normal);

		const transaction1 = new InventoryTransactionPacket();
		transaction1.legacy = new LegacyTransaction(0);
		transaction1.transaction = new InventoryTransaction(
			ComplexInventoryTransaction.ItemUseTransaction,
			[],
			new ItemUseInventoryTransaction(
				ItemUseInventoryTransactionType.Place,
				TriggerType.PlayerInput,
				new BlockPosition(position.x, position.y - 1, position.z),
				this.calculateFace(position),
				0,
				this.inventory.getItem(0),
				this.position,
				new Vector3f(0, 0, 0),
				this.inventory.getItem(0).networkBlockId ?? 0,
				true,
			),
		);

		this.sendPacket(transaction1);

		const transaction2 = new InventoryTransactionPacket();

		transaction2.legacy = new LegacyTransaction(0);
		transaction2.transaction = new InventoryTransaction(
			ComplexInventoryTransaction.ItemUseTransaction,
			[],
			new ItemUseInventoryTransaction(
				ItemUseInventoryTransactionType.Use,
				TriggerType.Unknown,
				new BlockPosition(position.x, position.y - 1, position.z),
				this.calculateFace(position),
				0,
				this.inventory.getItem(0),
				this.position,
				new Vector3f(0, 0, 0),
				this.inventory.getItem(0).networkBlockId ?? 0,
				false,
			),
		);
		this.sendPacket(transaction2);

		const action2 = new PlayerActionPacket();
		action2.entityRuntimeId = this.runtimeEntityId;
		action2.action = ActionIds.StopItemUseOn;
		action2.blockPosition = position;
		action2.face = this.calculateFace(position);
		action2.resultPosition = new Vector3f(0, 0, 0);

		this.sendPacket(action2);
	}
}

export { Client };
