import "reflect-metadata";
import {
	PlayerAuthInputData,
	PlayerAuthInputPacket,
	Vector3f,
	type TextPacket,
} from "@serenityjs/protocol";
import { Client } from "../Client";
import { Logger } from "../vendor/Logger";

const client = new Client({
	host: "127.0.0.1",
	offline: true,
	username: "SanctumTerra",
	version: "1.21.50",
	port: 19132,
	viewDistance: 11,
});

console.time("Connection");
client.connect();
client.on("spawn", ([ad, packet]) => {
	console.timeEnd("Connection");
	client.sendMessage("Hello");
});

client.on("DisconnectPacket", (packet) => {
	Logger.chat(packet.message.message);
});

// client.on("containerOpen", (container) => {
// 	console.log("Opened a chest")
// 	const messages: string[] = [];
// 	for(const item of container.items) {
// 		// messages.push(`${item.network}`)
// 		const slot = container.items.indexOf(item);
// 		container.take(slot, 9, 0);
// 	}
// 	// client.sendMessage(`Container ${container.id} opened that has ${container.slots} slots`);
// 	// sendMessages(messages);
// })

function sendMessages(messages: string[]) {
	const perMessage = 30;
	let current = 0;
	for (let i = 0; i < messages.length / 10; i++) {
		let string = "Found: ";
		for (let j = 0; j < perMessage; j++) {
			string += `${messages[current + j]}, `;
		}
		client.sendMessage(string);
		current += perMessage;
	}
}

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
	console.log("TextHandler", packet.parameters);
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
	} else if (packet.parameters?.includes("use")) {
		client.inventory.useItem("right");
	} else if (packet.parameters?.includes("useleft")) {
		client.inventory.useItem("left");
	}
	if (packet.parameters === null) return;
	if (packet.parameters.length < 2) return;

	// TextHandler [ 'AnyBananaGAME', 'slot 1' ]
	const param = packet.parameters[1].split(" ");

	for (let i = 0; i < param.length; i++) {
		// avoiding loops
		if (packet.parameters[0] === "SanctumTerra") return;
		if (param[i] === "slot") {
			const slot = Number(param[i + 1]);
			client.sendMessage(`Switching to slot ${slot}`);
			client.inventory.switchSlot(slot);
		}
	}
	for (let i = 0; i < param.length; i++) {
		// avoiding loops
		if (packet.parameters[0] === "SanctumTerra") return;
		if (param[i] === "mine") {
			const x = Number(param[i + 1]);
			const y = Number(param[i + 2]);
			const z = Number(param[i + 3]);
			client.sendMessage(`Mining block at ${x}, ${y}, ${z}`);
			client.breakBlock(new Vector3f(x, y, z), 5);
		}
	}
};
