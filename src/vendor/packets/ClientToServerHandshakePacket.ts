import { DataPacket } from "@serenityjs/protocol"
import { Proto } from "@serenityjs/raknet";



@Proto(Number(0x04))
export class ClientToServerHandshakePacket extends DataPacket {}