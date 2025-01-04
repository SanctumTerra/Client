import { ItemNametagComponent, ItemStack } from "@serenityjs/world";
import type { Client } from "../../Client";
import {
	AnimateId,
	AnimatePacket,
	BlockPosition,
	ComplexInventoryTransaction,
	ContainerId,
	InventoryAction,
	type InventoryContentPacket,
	type InventorySlotPacket,
	InventorySource,
	InventorySourceType,
	InventoryTransaction,
	InventoryTransactionPacket,
	ItemUseInventoryTransaction,
	ItemUseInventoryTransactionType,
	LegacyTransaction,
	MobEquipmentPacket,
	NetworkItemStackDescriptor,
	PredictedResult,
	TriggerType,
	Vector3f,
} from "@serenityjs/protocol";

class Inventory {
	private readonly client: Client;
	private readonly MAX_ITEMS = 36;
	private slot = 0;

	public items: NetworkItemStackDescriptor[] = new Array(this.MAX_ITEMS).fill(
		new NetworkItemStackDescriptor(0),
	);

	constructor(client: Client) {
		this.client = client;
		this.client.on(
			"InventoryContentPacket",
			(packet: InventoryContentPacket) => {
				if (packet.containerId === ContainerId.Inventory) {
					packet.items.forEach((item, slot) => {
						this.items[slot] = item;
					});
				}
			},
		);
		this.client.on("InventorySlotPacket", (packet: InventorySlotPacket) => {
			if (packet.containerId === ContainerId.Inventory) {
				this.items[packet.slot] = packet.item;
			}
		});

		this.client.on("MobEquipmentPacket", (packet) => {
			if (packet.runtimeEntityId === this.client.runtimeEntityId) {
				this.slot = packet.selectedSlot;
			}
		});
	}

	public switchSlot(slot: number) {
		this.slot = slot;
		const packet = new MobEquipmentPacket();
		packet.containerId = ContainerId.Inventory;
		packet.item = this.items[slot];
		packet.runtimeEntityId = this.client.runtimeEntityId;
		packet.selectedSlot = slot;
		packet.slot = slot;
		this.client.sendPacket(packet);
	}

	/**
	 * useItem
	 */
	public useItem(type: "left" | "right" = "right") {
		if (type === "right") {
			const transaction = new InventoryTransactionPacket();
			transaction.legacy = new LegacyTransaction(-this.client.tick, [
				{ containerId: ContainerId.Inventory, changedSlots: [] },
			]);
			transaction.transaction = new InventoryTransaction(
				ComplexInventoryTransaction.ItemUseTransaction,
				[],
				new ItemUseInventoryTransaction(
					ItemUseInventoryTransactionType.Use,
					TriggerType.PlayerInput,
					new BlockPosition(0, 0, 0),
					this.client.calculateFace(new Vector3f(0, 0, 0)),
					0,
					new NetworkItemStackDescriptor(0),
					this.client.position,
					new Vector3f(0, 0, 0),
					0,
					PredictedResult.Success,
				),
			);
			this.client.sendPacket(transaction);
			return;
		}
		const animate = new AnimatePacket();
		animate.boatRowingTime = null;
		animate.id = AnimateId.SwingArm;
		animate.runtimeEntityId = this.client.runtimeEntityId;
		this.client.sendPacket(animate);
	}

	getItem(slot: number): NetworkItemStackDescriptor {
		return this.items[slot] as NetworkItemStackDescriptor;
	}

	dropItem(slot: number, count = 1) {
		console.log("Dropping Item");
		const packet = new InventoryTransactionPacket();
		packet.legacy = new LegacyTransaction(-this.client.tick, [
			{ containerId: ContainerId.Inventory, changedSlots: [slot] },
		]);

		const newItem = new NetworkItemStackDescriptor(
			this.items[slot].network,
			(this.items[slot].stackSize ?? 1) - count,
			this.items[slot].metadata,
			this.items[slot].stackNetId,
			this.items[slot].networkBlockId,
			this.items[slot].extras,
		);
		const newItem2 = new NetworkItemStackDescriptor(
			this.items[slot].network,
			count,
			this.items[slot].metadata,
			this.items[slot].stackNetId,
			this.items[slot].networkBlockId,
			this.items[slot].extras,
		);

		packet.transaction = new InventoryTransaction(
			ComplexInventoryTransaction.NormalTransaction,
			[
				new InventoryAction(
					new InventorySource(InventorySourceType.WorldInteraction, null, 0),
					0,
					new NetworkItemStackDescriptor(0),
					newItem2,
				),
				new InventoryAction(
					new InventorySource(
						InventorySourceType.ContainerInventory,
						ContainerId.Inventory,
					),
					slot,
					this.items[slot],
					newItem,
				),
			],
		);
		this.client.sendPacket(packet);
	}

	public getSlot(): number {
		return this.slot;
	}
}

export { Inventory };
