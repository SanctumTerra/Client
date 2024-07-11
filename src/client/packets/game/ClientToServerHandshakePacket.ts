import { DataPacket } from "@serenityjs/protocol";
import { Proto } from "../proto";

@Proto(0x04)
class ClientToServerHandshakePacket extends DataPacket {}

export { ClientToServerHandshakePacket }