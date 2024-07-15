import { RequestChunkRadiusPacket, RespawnPacket, RespawnState, StartGamePacket, Vector3f } from "@serenityjs/protocol";
import { BaseHandler } from "../BaseHandler";
import { Priority } from "@serenityjs/raknet";

class StartGameHandler extends BaseHandler {
    public name: string = StartGamePacket.name;

    public handle(packet: StartGamePacket){
        const radius = new RequestChunkRadiusPacket();
        radius.radius = 10;
        radius.maxRadius = 10;
        _client.runtimeEntityId = packet.runtimeEntityId;
        _client.sendPacket(radius, Priority.Immediate);
    }
}

export default StartGameHandler;