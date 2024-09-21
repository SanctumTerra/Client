import {
	type TextPacket,
	type UpdateBlockPacket,
	Vector3f,
} from "@serenityjs/protocol";
import { Client, Logger } from "../index";

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const client = new Client({
	host: "127.0.0.1",
	offline: true,
	username: "SanctumTerra",
	version: "1.21.30",
	port: 19132,
	loadPlugins: false,
	validateProtocol: false,
	tokensFolder: "./tokens",
});

client.raknet.socket.on("error", (error) => {
	Logger.error(error);
});

Logger.info("Connecting to server...");

try {
	client.connect();
	console.time("SpawnTime");
} catch (error) {
	Logger.error(error as Error);
}

client.on("TextPacket", async (packet: TextPacket): Promise<void> => {
	if (!packet.parameters) return Logger.chat(packet.message);

	const [param1, param2] = packet.parameters;
	if (packet.message.includes("chat.type.text"))
		Logger.chat(`§f<${param1}> ${param2}`);
	else if (packet.message.includes("multiplayer.player.joined"))
		Logger.chat(`§e${param1} §ejoined the game`);
	else if (packet.message.includes("multiplayer.player.left"))
		Logger.chat(`§f${param1} §7left the game`);
	else console.log(packet.message);
});

client.on("spawn", async () => {
	console.timeEnd("SpawnTime");
	await sleep(1000);
	client.sendMessage("§aHello, world!");
	client.place(new Vector3f(323, 143, 294));
});

client.on("UpdateBlockPacket", (packet: UpdateBlockPacket) => {
	// const block = BlockPermutation.resolve(BlockIdentifier.Air);
	//console.log(inspect(block, true, 999, true))
	if (packet.networkBlockId === 11844 || packet.networkBlockId === 6118) return;
	client.break(
		new Vector3f(packet.position.x, packet.position.y, packet.position.z),
	);
});
