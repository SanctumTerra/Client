import type { TextPacket } from "@serenityjs/protocol";
import { Client } from "../Client";
// import fs from "fs";
// import path from "path";
import { Logger } from "src/vendor/Logger";
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
	version: "1.21.40",
	port: 19132,
	viewDistance: 1,
	// debug: true
});

console.time("Connection");
// writeToLog("Starting connection...");

client.connect().then(([ad, packet]) => {
	console.timeEnd("Connection");
    console.log(ad)
	// writeToLog(`Connected successfully: ${JSON.stringify(ad)}`);
});

client.on("DisconnectPacket", (packet) => {
	console.log(packet);
	// writeToLog(`Disconnected: ${JSON.stringify(packet)}`);
});

// process.on("uncaughtException", (error) => {
// writeToLog(
// `[UNCAUGHT EXCEPTION] ${sanitizeToLatin(error.message)}\n${sanitizeToLatin(error.stack || "")}`,
// );
// });

// process.on("unhandledRejection", (reason, promise) => {
// writeToLog(
// 	`[UNHANDLED REJECTION] at: ${sanitizeToLatin(String(promise))}\nReason: ${sanitizeToLatin(String(reason))}`,
// );
// });

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
}
