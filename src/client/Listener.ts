import type * as Protocol from "@serenityjs/protocol";
import Emitter from "@serenityjs/emitter";

type PacketNames = {
	[K in keyof typeof Protocol]: K extends `${string}Packet` ? K : never;
}[keyof typeof Protocol];

type ListenerEvents = {
	// @ts-expect-error does not matter
	[K in PacketNames]: [InstanceType<(typeof Protocol)[K]>];
} & {
	session: [];
	spawn: [];
	tick: [number];
	PrePlayerAuthInputPacket: [Protocol.PlayerAuthInputPacket];
	close: [];
};

class Listener extends Emitter<ListenerEvents> {}

export { Listener, type ListenerEvents };
