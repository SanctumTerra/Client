import {
	ContainerClosePacket,
	type ContainerId,
	ContainerName,
	ContainerType,
	FullContainerName,
	type InventoryContentPacket,
	type InventorySlotPacket,
	ItemStackActionTakePlace,
	ItemStackRequest,
	ItemStackRequestAction,
	ItemStackRequestActionType,
	ItemStackRequestPacket,
	ItemStackRequestSlotInfo,
	type NetworkItemStackDescriptor,
} from "@serenityjs/protocol";
import type { Client } from "../../../Client";

class Container {
	private client: Client;
	public slots = 0;
	public isOpen = true;
	public items: NetworkItemStackDescriptor[] = [];
	public type: ContainerType;
	public uniqueId: bigint;
	public id: ContainerId;

	private _emitted = false;
	private _contentReceived = false;
	private _wtf = 0;

	private listener: (packet: InventoryContentPacket) => void;
	private slotListener: (packet: InventorySlotPacket) => void;
	private closeListener: (packet: ContainerClosePacket) => void;

	constructor(
		client: Client,
		type: ContainerType,
		uniqueId: bigint,
		id: ContainerId,
	) {
		this.client = client;
		this.type = type;
		this.uniqueId = uniqueId;
		this.id = id;

		this.listener = (packet: InventoryContentPacket) => {
			if (packet.containerId === this.id) {
				this.slots = packet.items.length;
				this.items = packet.items;
				this._contentReceived = true;
				this._wtf++;
			}
		};
		this.client.on("InventoryContentPacket", this.listener);
		this.slotListener = (packet: InventorySlotPacket) => {
			if (packet.containerId === this.id) {
				this.items[packet.slot] = packet.item;
			}
		};
		this.client.on("InventorySlotPacket", this.slotListener);

		this.closeListener = (packet: ContainerClosePacket) => {
			if (this.isOpen && this.id === packet.identifier) {
				console.log(packet);
				this.close(true);
			}
		};
		this.client.on("ContainerClosePacket", this.closeListener);

		const interval = setInterval(() => {
			console.log(this._wtf);
			if (this._contentReceived) {
				if (this._wtf < 2) {
					setTimeout(() => {
						if (!this._emitted) {
							this._emitted = true;
							this.client.emit("containerOpen", this);
						}
						clearInterval(interval);
					}, 300);
				} else {
					if (!this._emitted) {
						this._emitted = true;
						this.client.emit("containerOpen", this);
					}
					clearInterval(interval);
				}
			}
		}, 100);
	}

	private take(slot: number, to: number | null, _count = 0) {
		if (slot > this.slots) return;
		const item = this.items[slot];
		if (!item) return;

		if (to === null) {
			const emptySlot = this.client.inventory.items.findIndex(
				(item) => item.networkBlockId === 0,
			);
			// biome-ignore lint/style/noParameterAssign: <explanation>
			to = emptySlot;
		}

		const packet = new ItemStackRequestPacket();
		let count = _count;
		if (count === 0) count = item.stackSize ?? 0;
		if (count < 1) return;

		packet.requests = [
			new ItemStackRequest(
				-this.client.tick,
				[
					new ItemStackRequestAction(
						ItemStackRequestActionType.Place,
						new ItemStackActionTakePlace(
							count,
							new ItemStackRequestSlotInfo(
								new FullContainerName(ContainerName.Inventory),
								slot,
								item.stackNetId ?? 0,
							),
							new ItemStackRequestSlotInfo(
								new FullContainerName(ContainerName.HotbarAndInventory),
								to,
								0,
							),
						),
					),
				],
				[],
				-1,
			),
		];
		this.client.sendPacket(packet);
		// this.items[slot] = null;
	}

	public close(serverInitiated = false) {
		if (!this.isOpen) return;
		this.isOpen = false;
		this.client.remove("InventoryContentPacket", this.listener);
		this.client.remove("InventorySlotPacket", this.slotListener);
		this.client.remove("ContainerClosePacket", this.closeListener);

		console.log("Closing container");
		this.client.emit("containerClose", this.id);
		if (!serverInitiated) {
			const closePacket = new ContainerClosePacket();
			closePacket.identifier = this.id;
			closePacket.type = ContainerType.None;
			closePacket.serverInitiated = false;
			this.client.sendPacket(closePacket);
		}
	}
}

export { Container };
