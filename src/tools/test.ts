import { SetTimePacket, TextPacket } from "@serenityjs/protocol";
import { Client } from "../Client";
import { Logger } from "../vendor/Logger";

const client = new Client({
    host: "127.0.0.1",
    offline: false,
    username: "ImoHigh",
    version: "1.21.20"
})   
client.connect();

client.on(SetTimePacket.name, () => {
    client.sendMessage("hey")
})

client.on(TextPacket.name, (packet: TextPacket): void => {
    if(packet.parameters){
        if(packet.message.includes("chat.type.text")) return Logger.chat(`§f<${packet.parameters[0]}> ${packet.parameters[1]}`)
        if(packet.message.includes("multiplayer.player.joined")) return Logger.chat(`§e${packet.parameters[0]} §ejoined the game`)
        if(packet.message.includes("multiplayer.player.left")) return Logger.chat(`§f${packet.parameters[0]} §7left the game`)
        console.log(packet.message);
    }
    Logger.chat(packet.message);
})

Logger.info("§l§bINFO?§6!");
Logger.error("§l§cERROR§6!")