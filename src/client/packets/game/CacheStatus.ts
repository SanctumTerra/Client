import { DataPacket } from "../DataPacket";
import { Bool } from "@serenityjs/binarystream";
import { Proto, Serialize } from "@serenityjs/raknet";
import 'reflect-metadata';

@Proto(129)
class CacheStatusPacket extends DataPacket {
  @Serialize(Bool) public enabled!: boolean;
}

export { CacheStatusPacket };
