import { ResourcePackClientResponsePacket, ResourcePackResponse, ResourcePacksInfoPacket, TextPacket, TextPacketType } from "@serenityjs/protocol";
import { BaseHandler } from "../BaseHandler";
import { Priority } from "@serenityjs/raknet";
import { Logger } from "../../../utils/Logger"

class ResourcePacksInfoHandler extends BaseHandler {
    public name: string = ResourcePacksInfoPacket.name;

    public handle(packet: ResourcePacksInfoPacket) {
        if(packet.texturePacks.length !== 0){
            Logger.debug("Texture Pack Length is not 0!")
        };
        
        const response = new ResourcePackClientResponsePacket();
        response.response = ResourcePackResponse.Completed;
        response.packs = [];
        _client.sendPacket(response, Priority.Immediate);
    }
}

export { ResourcePacksInfoHandler }