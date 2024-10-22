import { Proto, Serialize } from "@serenityjs/raknet";

import { BlockPosition, DataPacket } from "@serenityjs/protocol";
import { ZigZag } from "@serenityjs/binarystream";

enum SpawnType {
	Player = 0,
	World = 1,
}

@Proto(43)
class SetSpawnPositionPacket extends DataPacket {
	@Serialize(ZigZag) public spawnType!: SpawnType;
	@Serialize(BlockPosition) public playerPosition!: BlockPosition;
	@Serialize(ZigZag) public dimension!: number;
	@Serialize(BlockPosition) public worldPosition!: BlockPosition;
}

export { SetSpawnPositionPacket };
