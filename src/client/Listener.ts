import { EventEmitter } from "node:events";
import type * as Protocol from "@serenityjs/protocol";
import type { NetworkEvents } from "@serenityjs/network";

class Listener extends EventEmitter {
	emit<K extends keyof ListenerEvents>(
		eventName: K,
		...args: Parameters<ListenerEvents[K]>
	): boolean;
	emit(eventName: string, ...args: unknown[]): boolean;
	emit(eventName: string, ...args: unknown[]): boolean {
		return super.emit(eventName, ...args);
	}

	on<K extends keyof ListenerEvents>(
		eventName: K,
		listener: ListenerEvents[K],
	): this;
	on(eventName: string, listener: (...args: unknown[]) => void): this;
	on(eventName: string, listener: (...args: unknown[]) => void): this {
		return super.on(eventName, listener);
	}

	once<K extends keyof ListenerEvents>(
		eventName: K,
		listener: ListenerEvents[K],
	): this;
	once(eventName: string, listener: (...args: unknown[]) => void): this;
	once(eventName: string, listener: (...args: unknown[]) => void): this {
		return super.once(eventName, listener);
	}
}

type PacketNames = {
	[K in keyof typeof Protocol]: K extends `${string}Packet` ? K : never;
}[keyof typeof Protocol];

type ListenerEvents = {
	// @ts-expect-error does not matter
	[K in PacketNames]: (packet: InstanceType<(typeof Protocol)[K]>) => void;
} & {
	session: () => void;
	spawn: () => void;
	tick: (tick: number) => void;
	PrePlayerAuthInputPacket: (
		packet: Protocol.PlayerAuthInputPacket,
		cancel: boolean,
	) => void;
};

export { Listener, type ListenerEvents };
