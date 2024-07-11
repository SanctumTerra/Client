import { NetworkSettingsPacket } from "@serenityjs/protocol";
import { BaseHandler } from "../BaseHandler";
import { Priority } from "@serenityjs/raknet";
import { LoginPacket, LoginTokens } from "../../packets/game/LoginPacket";
import { Logger } from "../../../utils/Logger";


class NetworkSettingsHandler extends BaseHandler {
    public name: string = NetworkSettingsPacket.name;

    handle(packet: NetworkSettingsPacket): void {
        if(_client.options.debug) Logger.debug("S -> C NetworkSettingsPacket");
        _client.data.sendDeflated = true;
        _client.data.compressionThreshold = packet.compressionThreshold;
        const chain = [_client.data.loginData.clientIdentityChain, ..._client.data.accessToken];
        const userChain = _client.data.loginData.clientUserChain;
        const encodedChain = JSON.stringify({ chain });

        const login = new LoginPacket();
        login.protocol = _client.protocol;
        login.tokens = new LoginTokens(userChain, encodedChain);

        _client.sendPacket(login, Priority.Immediate);
    }

}

export { NetworkSettingsHandler };