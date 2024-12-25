import "reflect-metadata";
import { Vector3f, type TextPacket } from "@serenityjs/protocol";
import { Client } from "../Client";
// import fs from "fs";
// import path from "path";
import { Logger } from "../vendor/Logger";
// import util from "util";

// const logsDir = path.join(process.cwd(), "logs");
// if (!fs.existsSync(logsDir)) {
// 	fs.mkdirSync(logsDir);
// }

// const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
// const logFile = path.join(logsDir, `connection-${timestamp}.log`);

// const sanitizeToLatin = (str: string): string => {
// 	return str
// 		.replace(/\u001b\[\d{1,2}m/g, "")
// 		.replace(/\u001b\[0m/g, "")
// 		.replace(/[^\x20-\x7E\n]/g, "")
// 		.replace(/[\x00-\x1F\x7F]/g, "");
// };

// const writeToLog = (message: string) => {
// 	const sanitizedMessage = sanitizeToLatin(message);
// 	fs.appendFileSync(
// 		logFile,
// 		`${new Date().toISOString()} - ${sanitizedMessage}\n`,
// 	);
// };

// const originalConsoleLog = console.log;
// const originalConsoleError = console.error;
// const originalConsoleWarn = console.warn;
// const originalConsoleInfo = console.info;

// console.log = (...args) => {
// 	const message = args
// 		.map((arg) =>
// 			typeof arg === "object"
// 				? util.inspect(arg, { colors: false })
// 				: String(arg),
// 		)
// 		.join(" ");
// 	writeToLog(`[LOG] ${message}`);
// 	originalConsoleLog.apply(console, args);
// };

// console.error = (...args) => {
// 	const message = args
// 		.map((arg) =>
// 			typeof arg === "object"
// 				? util.inspect(arg, { colors: false })
// 				: String(arg),
// 		)
// 		.join(" ");
// 	writeToLog(`[ERROR] ${message}`);
// 	originalConsoleError.apply(console, args);
// };

// console.warn = (...args) => {
// 	const message = args
// 		.map((arg) =>
// 			typeof arg === "object"
// 				? util.inspect(arg, { colors: false })
// 				: String(arg),
// 		)
// 		.join(" ");
// 	writeToLog(`[WARN] ${message}`);
// 	originalConsoleWarn.apply(console, args);
// };

// console.info = (...args) => {
// 	const message = args
// 		.map((arg) =>
// 			typeof arg === "object"
// 				? util.inspect(arg, { colors: false })
// 				: String(arg),
// 		)
// 		.join(" ");
// 	writeToLog(`[INFO] ${message}`);
// 	originalConsoleInfo.apply(console, args);
// };

// const timers: { [key: string]: number } = {};
// const originalConsoleTime = console.time;
// const originalConsoleTimeEnd = console.timeEnd;

// console.time = (label: string) => {
// 	timers[label] = Date.now();
// 	writeToLog(`[TIME START] ${sanitizeToLatin(label)}`);
// 	originalConsoleTime.call(console, label);
// };

// console.timeEnd = (label: string) => {
// 	const duration = Date.now() - (timers[label] || 0);
// 	writeToLog(`[TIME END] ${sanitizeToLatin(label)}: ${duration}ms`);
// 	originalConsoleTimeEnd.call(console, label);
// };

const client = new Client({
	host: "127.0.0.1",
	offline: true,
	username: "SanctumTerra",
	version: "1.21.50",
	port: 19132,
	viewDistance: 4,
	// debug: true
});

console.time("Connection");
console.time("RakConnect");
// writeToLog("Starting connection...");

client.connect().then(([ad, packet]) => {
	console.timeEnd("Connection");
	client.sendMessage("Hello");

	setTimeout(() => {
		const vec = new Vector3f(264, 66, 242);
		// console.log("Vec: ", vec);
		// client.breakBlock(vec);
	}, 5000);
});

client.on("DisconnectPacket", (packet) => {
	Logger.chat(packet.message.message);
	// console.log(packet);
	// writeToLog(`Disconnected: ${JSON.stringify(packet)}`);
});

let last = Date.now();
client.on("UpdateBlockPacket", (packet) => {
	if (packet.networkBlockId === 6870) {
		if (Date.now() - last > 50) {
			client.breakBlock(
				new Vector3f(packet.position.x, packet.position.y, packet.position.z),
				3,
			);
			last = Date.now();
		}
	}
});

client.on("TextPacket", handleTextPacket);

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
	textHandler(packet);
}

const textHandler = (packet: TextPacket) => {
	// console.log("TextHandler", packet.parameters);
	if (packet.parameters?.includes("drop")) {
		client.inventory.dropItem(0, 1);
	} else if (packet.parameters?.includes("hi")) {
		client.sendMessage("Hello");
	} else if (packet.parameters?.includes("spin")) {
		client.yaw = 1;
		const interval = setInterval(() => {
			client.yaw += 3;
			if (client.yaw > 356) {
				clearInterval(interval);
			}
		}, 30);
	} else if (packet.parameters?.includes("chest")) {
		client.openChest(new Vector3f(287, 176, 145));
	}
};
