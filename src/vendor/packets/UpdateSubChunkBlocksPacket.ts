import type { BinaryStream } from "@serenityjs/binarystream";
import { BlockPosition, DataPacket } from "@serenityjs/protocol";
import { DataType, Proto, Serialize } from "@serenityjs/raknet";


type Block = {
    position: BlockPosition;
    runtimeId: number;
    updateFlags: number;
    entityUniqueId: bigint;
    message: number;
}

class BlocksChangedStandard extends DataType {
    public blocks: Block[];

    constructor(blocks: Block[]) {
        super();
        this.blocks = blocks;
    }

    static override read(stream: BinaryStream): BlocksChangedStandard {
        const count = stream.readVarInt();
        const blocks = [];
        for(let i = 0; i < count; i++) {
            const block: Block = {
                position: BlockPosition.read(stream),
                runtimeId: stream.readVarInt(),
                updateFlags: stream.readVarInt(),
                entityUniqueId: stream.readVarLong(),
                message: stream.readVarInt(),
            }
            blocks.push(block);
        }
        return new BlocksChangedStandard(blocks);
    }
}

class BlocksChangedExtra extends DataType {
    public blocks: Block[];

    constructor(blocks: Block[]) {
        super();
        this.blocks = blocks;
    }

    static override read(stream: BinaryStream): BlocksChangedStandard {
        const count = stream.readVarInt();
        const blocks = [];
        for(let i = 0; i < count; i++) {
            const block: Block = {
                position: BlockPosition.read(stream),
                runtimeId: stream.readVarInt(),
                updateFlags: stream.readVarInt(),
                entityUniqueId: stream.readVarLong(),
                message: stream.readVarInt(),
            }
            blocks.push(block);
        }
        return new BlocksChangedStandard(blocks);
    }
}


@Proto(172)
class UpdateSubChunkBlocksPacket extends DataPacket { 
    @Serialize(BlockPosition) public position!: BlockPosition;
    @Serialize(BlocksChangedStandard) public blocks!: BlocksChangedStandard;
    @Serialize(BlocksChangedExtra) public extraBlocks!: BlocksChangedExtra;
}

export { UpdateSubChunkBlocksPacket };
