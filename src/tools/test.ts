import { SetTimePacket } from "@serenityjs/protocol";
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

Logger.info("§l§bINFO?§6!");
Logger.error("§l§cERROR§6!")