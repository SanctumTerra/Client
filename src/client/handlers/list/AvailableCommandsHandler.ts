import { AvailableCommandsPacket } from "@serenityjs/protocol";
import { BaseHandler } from "../BaseHandler";

export class AvailableCommandsHandler extends BaseHandler {
    public name: string = AvailableCommandsPacket.name;

    
    public handle(packet: AvailableCommandsPacket) : void {
        _client.data.commands = packet.commands;
    }

}