import { RespawnPacket, RespawnState, TextPacket, Vector3f } from "@serenityjs/protocol";
import { Client } from "../Client";
import { Logger } from "../vendor/Logger";
import { Priority } from "@serenityjs/raknet";

const client = new Client({
    host: "127.0.0.1",
    offline: false,
    username: "SanctumTerra",
    version: "1.21.20",
    port: 19133,
});

try {
    client.connect();
    console.time("SpawnTime");
} catch (error) {
    console.error(error);
}

client.on("spawn", () => {
    console.timeEnd("SpawnTime");
   
    setInterval(() => {
        const [x, y, z] = Math.random() < 0.5 ? [258, 74, 257] : [251, 72, 257];
        client.lookAt(x, y, z);
    }, 1000);

    setInterval(async () => {
        const item = client.inventory.items.find(item => item.network > 0);
        if (item) {
            client.inventory.dropItem(client.inventory.items.indexOf(item), 1);
            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }, 250);
});

client.on("SetTimePacket", () => {
    const { x, y, z } = client.position;
    client.sendMessage(`Hello! My position is ${Math.floor(x)} ${Math.floor(y - 1.62)} ${Math.floor(z)}`);
});

client.on("TextPacket", (packet: TextPacket): void => {
    if (!packet.parameters) return Logger.chat(packet.message);

    const [param1, param2] = packet.parameters;
    if (packet.message.includes("chat.type.text")) Logger.chat(`§f<${param1}> ${param2}`);
    else if (packet.message.includes("multiplayer.player.joined")) Logger.chat(`§e${param1} §ejoined the game`);
    else if (packet.message.includes("multiplayer.player.left")) Logger.chat(`§f${param1} §7left the game`);
    else console.log(packet.message);
});

client.on("RespawnPacket", (packet: RespawnPacket) => {
    const response = new RespawnPacket();
    response.runtimeEntityId = client.runtimeEntityId;

    if (packet.state === RespawnState.ServerSearchingForSpawn) {
        response.position = packet.position;
        response.state = RespawnState.ClientReadyToSpawn;
    } else if (packet.state === RespawnState.ServerReadyToSpawn) {
        response.position = new Vector3f(0, 0, 0);
        // @ts-expect-error So far this does not work NOTE!: prob missing a state?
        response.state = 3;
    }

    client.position = packet.position;
    client.sendPacket(response, Priority.Immediate);
});