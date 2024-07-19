import { TextPacket, TextPacketType } from "@serenityjs/protocol";
import { BaseHandler } from "../BaseHandler";
import { Logger } from "../../../utils/Logger";

class StartGameHandler extends BaseHandler {
    public name: string = TextPacket.name;

    public handle(packet: TextPacket){

        if(packet.message.includes("%chat.type.announcement")) {
            const o = packet;
            o.message = "%chat.type.announcement";
            this.handleTranslationChat(o);
            return;
        }

        switch (packet.type) {
            case TextPacketType.Translation:
                    this.handleTranslationChat(packet);
                break;
            case TextPacketType.Raw:
                    Logger.chat(packet.message)
                break;
            default:
                Logger.warn("Unhandeled packet type!" + packet.type)
                break;
        }
    }


    handleTranslationChat(packet: TextPacket){
        switch(packet.message){
            case "%chat.type.announcement":
            case "chat.type.text": {
                if(packet.parameters && packet.parameters.length > 0)
                Logger.chat(`[${packet?.parameters[0]}] ${packet?.parameters[1]}`)
                break;
            }
            case "commands.help.header": 
                if(!packet.parameters || packet.parameters.length < 1) return;
                Logger.chat(`§l§7Viewing page ${packet.parameters[0]} out of ${packet.parameters[1]}.`)
                break;;
            case "commands.players.list": 
                if(!packet.parameters || packet.parameters.length < 1) return;
                Logger.chat(`§l§7There are ${packet.parameters[0]} out of ${packet.parameters[1]} players online.`)
                break;
            default:
                Logger.chat(packet.message)
                Logger.warn("Unhandeled packet message! ")
                break;
        }
    }
}

export default StartGameHandler;