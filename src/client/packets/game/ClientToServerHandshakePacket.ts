import { BasePacket, Proto } from "@serenityjs/raknet";
import { DataPacket } from "../DataPacket";

const ClientToServerHandshakePacketID = Number(0x04);

@Proto(ClientToServerHandshakePacketID)
class ClientToServerHandshakePacket extends DataPacket {
    
};

export { ClientToServerHandshakePacket };