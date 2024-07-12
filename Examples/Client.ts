import { TextPacket, TextPacketType } from "@serenityjs/protocol";
import { Priority } from "@serenityjs/raknet";
import { Client } from "../index";

const client = new Client({
    host: "127.0.0.1",
    port: 19132
});

client.connect();

client.on("spawn", () => {
    setInterval(() => {
        const Text = new TextPacket()
        Text.filtered = "";
        Text.message = ` ${new Date().toLocaleDateString() } `
        Text.needsTranslation = false;
        Text.parameters = [];
        Text.platformChatId = "";
        Text.source = _client.data.profile.name;
        Text.type = TextPacketType.Chat;
        Text.xuid = "";
        _client.sendPacket(Text, Priority.Immediate);
        
    }, 10000);
})

