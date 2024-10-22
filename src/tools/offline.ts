import {
	Vector3f,
	type TextPacket,
	type UpdateBlockPacket,
} from "@serenityjs/protocol";
import { Client, DeviceOS, Logger } from "../index";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const client = new Client({
	host: "127.0.0.1",
	port: 19132,
	username: "SanctumTerra",
	version: "1.21.30",
	offline: true,
	loadPlugins: false,
	debug: false,
	deviceOS: DeviceOS.Win10,
});

client.raknet.socket.on("error", (error) => Logger.error(error));

Logger.info("Connecting to server...");
try {
	client.connect();
	console.time("SpawnTime");
} catch (error) {
	Logger.error(error as Error);
}
/*
setTimeout(() => {
	Logger.info("Disconnecting from server");
	client.disconnect();
}, 5000)
*/

client.on("TextPacket", handleTextPacket);
client.on("spawn", handleSpawn);
client.on("UpdateBlockPacket", handleUpdateBlockPacket);
client.on("StartGamePacket", (packet) => { console.log(`Logged in with UniqueID ${packet.entityId} and runtimeID ${packet.runtimeEntityId}`)});
async function handleTextPacket(packet: TextPacket): Promise<void> {
	if (!packet.parameters) return Logger.chat(packet.message);

	const [param1, param2] = packet.parameters;
	const messageTypes = {
		"chat.type.text": () => Logger.chat(`§f<${param1}> ${param2}§r`),
		"multiplayer.player.joined": () =>
			Logger.chat(`§e${param1} §ejoined the game§r`),
		"multiplayer.player.left": () =>
			Logger.chat(`§f${param1} §7left the game§r`),
		"chat.type.announcement": () => Logger.chat(`§d[${param1}] ${param2}§r`),
	};

	const handler = Object.entries(messageTypes).find(([key]) =>
		packet.message.includes(key),
	);
	handler ? handler[1]() : console.log(packet.message);
}

async function handleSpawn(): Promise<void> {
	console.timeEnd("SpawnTime");
	await sleep(1000);
	client.sendMessage("§aHello, world!");
	client.place(new Vector3f(323, 143, 294));
}

function handleUpdateBlockPacket(packet: UpdateBlockPacket): void {
	if (packet.networkBlockId === 11844 || packet.networkBlockId === 6118) return;

	const distance =
		Math.abs(packet.position.x - client.position.x) +
		Math.abs(packet.position.y - client.position.y) +
		Math.abs(packet.position.z - client.position.z);

	if (distance <= 5) {
		client.break(
			new Vector3f(packet.position.x, packet.position.y, packet.position.z),
		);
	}
}
