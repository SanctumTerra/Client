import { DataPacket } from "@serenityjs/protocol";

abstract class BaseHandler{
    abstract name: string;

    abstract handle(packet: DataPacket): void;
}
export { BaseHandler }