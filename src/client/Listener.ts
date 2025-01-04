import type * as Protocol from "@serenityjs/protocol";
import Emitter from "@serenityjs/emitter";
import type { Advertisement } from "@sanctumterra/raknet";
import type { Container } from "./inventory/container/container";

type PacketNames = {
	[K in keyof typeof Protocol]: K extends `${string}Packet` ? K : never;
}[keyof typeof Protocol];

type ListenerEvents = {
	// @ts-expect-error does not matter
	[K in PacketNames]: [InstanceType<(typeof Protocol)[K]>];
} & {
	session: [];
	spawn: [[Advertisement, Protocol.StartGamePacket]];
	tick: [number];
	PrePlayerAuthInputPacket: [Protocol.PlayerAuthInputPacket];
	close: [];
	ready: [];
	containerOpen: [Container];
	/**
	 * @param id - The id of the container that was closed
	 */
	containerClose: [Protocol.ContainerId];
};

class Listener extends Emitter<ListenerEvents> {}

export { Listener, type ListenerEvents };
