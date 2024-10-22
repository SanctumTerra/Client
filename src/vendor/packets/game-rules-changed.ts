import { DataPacket, GameRules } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";

@Proto(72)
class GameRulesChangedPacket extends DataPacket {
    @Serialize(GameRules) public rules!: GameRules;
}

export { GameRulesChangedPacket };
