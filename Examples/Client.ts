import { DisconnectPacket, TextPacket, TextPacketType } from "@serenityjs/protocol";
import { Priority } from "@serenityjs/raknet";
import Client from "../src/Client";
import { Advertisement } from "@sanctumterra/raknet";
import * as readline from 'readline';
import { Logger } from "../src/utils/Logger";
import { BaseHandler } from "@sanctumterra/client";

const HOST = process.argv[2] ?? "127.0.0.1";
const PORT = parseInt(process.argv[3]) ?? 19132;
console.log(PORT);
let time = Date.now()

const client = new Client({
    host: HOST,
    port: PORT,
    version: "1.21.2"
}); 

client.connect();
// client.raknet.ping().then((ad: Advertisement) => console.log(ad));

client.on("spawn", () => {
    Logger.info(`\n   | ${client.username} has spawned in!\n   | Time taken: ${Date.now()-time}ms`)
});

const completer = (line: string) => {
    const suggestions = getCommandSuggestions(line);
    const hits = suggestions.length ? suggestions : [line];  
    return [hits, line];
};



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: completer
});

function getCommandSuggestions(input: string): string[] {
    const inputLower = input.toLowerCase();
    const commands = client.data.commands;
    return commands
        .filter(cmd => 
            ('/' + cmd.name.toLowerCase()).startsWith(inputLower) || 
            cmd.description.toLowerCase().includes(inputLower)
        )
        .map(cmd => '/' + cmd.name);
}


function sendTextPacket(input: string) {
    const Text = new TextPacket();
    Text.filtered = "";
    Text.message = input.replace(/^\s+/, '');
    Text.needsTranslation = false;
    Text.parameters = [];
    Text.platformChatId = "";
    Text.source = client.data.profile.name;
    Text.type = TextPacketType.Chat;
    Text.xuid = "";
    client.sendPacket(Text, Priority.Immediate);
}


class DisconnectHandler extends BaseHandler {
    public name: string = DisconnectPacket.name;

    public handle(packet: DisconnectPacket): void {
        Logger.info("Disconnected : "+packet.message ?? "");
        rl.emit("close");
    }
}

client.packetHandler.registerHandler(
    new DisconnectHandler()
)


rl.on('line', (input: string) => {
    if (input.trim() !== "") {
        sendTextPacket(input);
    }
});

rl.on('close', () => {
    console.log('Readline closed');
    process.exit(0);
});

process.on('SIGINT', () => {
    rl.close();
    process.exit();
});