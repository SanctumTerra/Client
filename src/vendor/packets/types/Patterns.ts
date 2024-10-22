import type { BinaryStream } from "@serenityjs/binarystream";
import { DataType } from "@serenityjs/raknet";

export type TrimDataPattern = {
    item_name: string;
    pattern: string;
}

class Patterns extends DataType {
    public patterns: TrimDataPattern[];
 

    constructor(patterns: TrimDataPattern[] = []) {
        super();
        this.patterns = patterns;
    }

    public static read(stream: BinaryStream): Patterns {
        const patterns = new Patterns();
        const length = stream.readVarInt();
        for (let i = 0; i < length; i++) {
            const item_name = stream.readVarString();
            const pattern = stream.readVarString();
            patterns.patterns.push({ item_name, pattern });
        }
        return patterns;
    }
    public static write(stream: BinaryStream, value: Patterns): void {
        stream.writeVarInt(value.patterns.length);
        for (const pattern of value.patterns) {
            stream.writeVarString(pattern.item_name);
            stream.writeVarString(pattern.pattern);
        }
    }
}

export { Patterns };
