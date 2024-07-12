import { ResourcePackClientResponsePacket, ResourcePackResponse, ResourcePackStackPacket } from "@serenityjs/protocol";
import { BaseHandler } from "../BaseHandler";
import { Priority } from "@serenityjs/raknet";
import { Logger } from "@sanctumterra/raknet";

class ResourcePackStackHandler extends BaseHandler {
    public name: string = ResourcePackStackPacket.name;

    public handle(packet: ResourcePackStackPacket): void {
        if(packet.texturePacks.length !== 0){
            Logger.debug("Texture Pack Length is not 0!")
        };
        
        const response = new ResourcePackClientResponsePacket();
        response.response = ResourcePackResponse.Completed;
        response.packs = [];
        _client.sendPacket(response, Priority.Immediate);
    }
}

export { ResourcePackStackHandler }