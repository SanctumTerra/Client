import { MoveActorAbsolutePacket, MovePlayerPacket, RespawnPacket, RespawnState, TextPacket, UpdateBlockPacket, Vector3f } from "@serenityjs/protocol";
import { Client } from "../Client";
import { Logger } from "../vendor/Logger";
import { Priority } from "@serenityjs/raknet";
import { BlockIdentifier, BlockPermutation } from "@serenityjs/block";
import { inspect } from "util";
import { Block, Dimension } from "@serenityjs/world";

const client = new Client({
    host: "127.0.0.1",
    offline: false,
    username: "SanctumTerra",
    version: "1.21.20",
    port: 19133,
    loadPlugins: false,
    validateProtocol: false
});

try {
    client.connect();
    console.time("SpawnTime");
} catch (error) {
    console.error(error);
}

client.on("spawn", () => {
    console.timeEnd("SpawnTime");
    client.sneak();
    setInterval(() => {
        const [x, y, z] = Math.random() < 0.5 ? [258, 74, 257] : [251, 72, 257];
       // client.lookAt(x, y, z);
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

client.on("TextPacket", async (packet: TextPacket): Promise<void> => {
    if (!packet.parameters) return Logger.chat(packet.message);

    const [param1, param2] = packet.parameters;
    if (packet.message.includes("chat.type.text")) Logger.chat(`§f<${param1}> ${param2}`);
    else if (packet.message.includes("multiplayer.player.joined")) Logger.chat(`§e${param1} §ejoined the game`);
    else if (packet.message.includes("multiplayer.player.left")) Logger.chat(`§f${param1} §7left the game`);
    else console.log(packet.message);

    if (packet.message.includes("chat.type.text") && param2.includes("rat")) {
        const breakBlock = async (x: number, y: number, z: number) => {
            console.log(`Breaking block at ${x}, ${y}, ${z}`);
            await client.break(new Vector3f(x, y, z));
            console.log(`Finished breaking block at ${x}, ${y}, ${z}`);
            // Add a small delay between breaking blocks
            await new Promise(resolve => setTimeout(resolve, 200));
        };

        for (let i = 0; i < 3; i++) {
            for (let ix = 0; ix < 3; ix++) {
                for (let iz = 0; iz < 3; iz++) {
                    const x = Math.floor(client.position.x) + ix;
                    const y = Math.floor(client.position.y-1.62) - i;
                    const z = Math.floor(client.position.z) + iz;
                    await breakBlock(x, y, z);
                }
            }
        }

        console.log("All blocks broken sequentially");
    }
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


client.on("MoveActorAbsolutePacket", (packet: MoveActorAbsolutePacket) => {
    if(packet.runtimeId == client.runtimeEntityId) return;
    // client.lookAt(packet.position.x, packet.position.y, packet.position.z);
});

client.on("UpdateBlockPacket", (packet: UpdateBlockPacket) => {
    // const block = BlockPermutation.resolve(BlockIdentifier.Air);
    //console.log(inspect(block, true, 999, true))
    if(packet.networkBlockId == 11844) return;
    console.log(packet.networkBlockId);
    client.break(new Vector3f(packet.position.x, packet.position.y, packet.position.z));
});