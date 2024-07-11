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
        
            default:
                Logger.debug("Unhandeled packet type!" + packet.type)
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
            default:
                Logger.debug("Unhandeled packet message! " + packet.message)
                break;
        }
    }
}

export default StartGameHandler;