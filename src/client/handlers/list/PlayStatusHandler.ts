import { PlayStatus, PlayStatusPacket, SetLocalPlayerAsInitializedPacket } from "@serenityjs/protocol";
import { BaseHandler } from "../BaseHandler";

class PlayerStatusHandler extends BaseHandler {
    public name: string = PlayStatusPacket.name;

    public handle(packet: PlayStatusPacket) {
        switch (packet.status) {
            case PlayStatus.PlayerSpawn:
                this.playerSpawn();
                break;
        
            default:
                break;
        }
      
        
    }

    public playerSpawn(): void {
        const init = new SetLocalPlayerAsInitializedPacket()
        init.runtimeEntityId = _client.runtimeEntityId;
        _client.sendPacket(init);
    }
}

export default PlayerStatusHandler;