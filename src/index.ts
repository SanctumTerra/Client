import { Client } from "./Client";
import { Logger } from "./vendor/Logger";
import { Connection } from "./Connection";
import { DeviceOS } from "./client/ClientOptions";

declare global {
	var shieldID: number;
}

export * from "./vendor/debug-tools";
export { Client, Logger, Connection, DeviceOS };
