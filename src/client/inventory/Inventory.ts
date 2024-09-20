import { ItemNametagComponent, ItemStack } from "@serenityjs/world";
import type { Client } from "../../Client";
import {
	ComplexInventoryTransaction,
	ContainerId,
	InventoryAction,
	type InventoryContentPacket,
	type InventorySlotPacket,
	InventorySource,
	InventorySourceType,
	InventoryTransaction,
	InventoryTransactionPacket,
	LegacyTransaction,
	NetworkItemStackDescriptor,
} from "@serenityjs/protocol";

class Inventory {
	private readonly client: Client;
	private readonly MAX_ITEMS = 36;
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
	}

	getItem(slot: number): NetworkItemStackDescriptor {
		return this.items[slot] as NetworkItemStackDescriptor;
	}

	dropItem(slot: number, count = 1) {
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
}

export { Inventory };
