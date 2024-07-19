import { VarInt } from "@serenityjs/binarystream";
import { BasePacket, Packet } from "@serenityjs/raknet";

class DataPacket extends BasePacket {
    static readonly id: Packet;
    static readonly id_type: typeof VarInt;

    public serialize(): Buffer{
        throw new Error("DataPacket.serialize() is not implemented");
    }
    public deserialize(): this {
        throw new Error("DataPacket.deserialize() is not implemented");
    }
};

export { DataPacket }