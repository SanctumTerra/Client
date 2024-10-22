import { DataType } from "@serenityjs/raknet";
import { BinaryStream } from "@serenityjs/binarystream";
import { CompoundTag, type Tag } from "@serenityjs/nbt";

class CacheableNbt extends DataType {
  private properties: CompoundTag;

  constructor(properties: CompoundTag) {
    super();
    this.properties = properties;
  }

  static override read(stream: BinaryStream): CacheableNbt {
    const tempStream = new BinaryStream(stream.readRemainingBuffer());
    const tag = CompoundTag.read(tempStream, true);
    return new CacheableNbt(tag);
  }

  static override write(stream: BinaryStream, value: CacheableNbt): void {
    CompoundTag.write(stream, value.properties, true);
  }
}

export { CacheableNbt };
