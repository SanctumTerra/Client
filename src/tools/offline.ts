import { TextPacket } from "@serenityjs/protocol";
import { Client } from "src/Client";
import { Logger } from "src/vendor/Logger";

const client = new Client({
    host: "127.0.0.1",
    offline: true,
    username: "SanctumTerra",
    version: "1.21.20",
    port: 19133,
    loadPlugins: false,
    validateProtocol: false
});
Logger.info("Connecting to server...");
try {
    client.connect();
    console.time("SpawnTime");
} catch (error) {
    Logger.error(error);
}


client.on("TextPacket", async (packet: TextPacket): Promise<void> => {
    if (!packet.parameters) return Logger.chat(packet.message);

    const [param1, param2] = packet.parameters;
    if (packet.message.includes("chat.type.text")) Logger.chat(`§f<${param1}> ${param2}`);
    else if (packet.message.includes("multiplayer.player.joined")) Logger.chat(`§e${param1} §ejoined the game`);
    else if (packet.message.includes("multiplayer.player.left")) Logger.chat(`§f${param1} §7left the game`);
    else console.log(packet.message);

    client.disconnect()
});

client.on("spawn", () => {
    console.timeEnd("SpawnTime");
});