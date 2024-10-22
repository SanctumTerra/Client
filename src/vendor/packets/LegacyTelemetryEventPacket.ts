import { BinaryStream, VarInt, VarLong } from "@serenityjs/binarystream";
import { DataPacket } from "@serenityjs/protocol";
import { Proto, Serialize } from "@serenityjs/raknet";

enum TelemetryEventType { 
    AchievementAwarded = 0,
    EntityInteract = 1,
    PortalBuilt = 2,
    PortalUsed = 3,
    MobKilled = 4,
    CauldronUsed = 5,
    PlayerDeath = 6,
    BossKilled = 7,
    AgentCommand = 8,
    AgentCreated = 9,
    BannerPatternRemoved = 10,
    CommandExecuted = 11,
    FishBucketed = 12,
    MobBorn = 13,
    PetDied = 14,
    CauldronBlockUsed = 15,
    ComposterBlockUsed = 16,
    BellBlockUsed = 17,
    ActorDefinition = 18,
    RaidUpdate = 19,
    PlayerMovementAnomaly = 20,
    PlayerMovementCorrected = 21,
    HoneyHarvested = 22,
    TargetBlockHit = 23,
    PiglinBarter = 24,
    WaxedOrUnwaxedCopper = 25,
    CodeBuilderRuntimeAction = 26,
    CodeBuilderScoreboard = 27,
    StriderRiddenInLavaInOverworld = 28,
    SneakCloseToSculkSensor = 29,
    CarefulRestoration = 30,
    ItemUsed = 31
}

type EventData = {
    AchievementAwarded: { achievementId: number };
    EntityInteract: {
        interactedEntityId: bigint;
        interactionType: number;
        interactionActorType: number;
        interactionActorVariant: number;
        interactionActorColor: number;
    };
    PortalBuilt: { dimensionId: number };
    PortalUsed: { fromDimensionId: number; toDimensionId: number };
    MobKilled: {
        instigatorActorId: bigint;
        targetActorId: bigint;
        instigatorChildActorType: number;
        damageSource: number;
        tradeTier: number;
        traderName: string;
    };
    CauldronUsed: { contentsColor: number; contentsType: number; fillLevel: number };
    PlayerDeath: {
        instigatorActorId: bigint;
        instigatorMobVariant: number;
        damageSource: number;
        diedInRaid: boolean;
    };
    BossKilled: { bossActorId: bigint; partySize: number; bossType: number };
    AgentCommand: { result: number; resultNumber: number; commandName: string; resultKey: string; resultString: string };
    AgentCreated: Record<string, never>;
    BannerPatternRemoved: Record<string, never>;
    CommandExecuted: { successCount: number; errorCount: number; commandName: string; errorList: string };
    FishBucketed: Record<string, never>;
    MobBorn: { entityType: number; entityVariant: number; color: number };
    PetDied: {
        killedPetEntityType: number;
        killedPetVariant: number;
        killerEntityType: number;
        killerVariant: number;
        damageSource: number;
    };
    CauldronBlockUsed: { blockInteractionType: number; itemId: number };
    ComposterBlockUsed: { blockInteractionType: number; itemId: number };
    BellBlockUsed: { itemId: number };
    ActorDefinition: { eventName: string };
    RaidUpdate: { currentRaidWave: number; totalRaidWaves: number; wonRaid: boolean };
    PlayerMovementA: Record<string, never>;
    PlayerMovementCorrected: Record<string, never>;
    HoneyHarvested: Record<string, never>;
    TargetBlockHit: { redstoneLevel: number };
    PiglinBarter: { itemId: number; wasTargetingBarteringPlayer: boolean };
    WaxedOrUnwaxedCopper: { playerWaxedOrUnwaxedCopperBlockId: number };
    CodeBuilderRuntimeAction: { codeBuilderRuntimeAction: string };
    CodeBuilderScoreboard: { objectiveName: string; codeBuilderScoreboardScore: number };
    StriderRiddenInLavaInOverworld: Record<string, never>;
    SneakCloseToSculkSensor: Record<string, never>;
    CarefulRestoration: Record<string, never>;
    ItemUsed: { itemId: number; itemAux: number; useMethod: number; useCount: number };
};

@Proto(65)
class LegacyTelemetryEventPacket extends DataPacket { 
    public unique_id!: bigint;
    public type!: TelemetryEventType;
    public use_player_id!: number;
    public event_data!: EventData[keyof EventData] | undefined;

    public override serialize(): Buffer { 
        this.writeVarInt(65);
        this.writeVarLong(this.unique_id);
        this.writeVarInt(this.type);
        this.writeByte(this.use_player_id);

        switch(this.type) { 
            case TelemetryEventType.AchievementAwarded: {
                this.writeVarInt((this.event_data as EventData['AchievementAwarded']).achievementId);
                break;
            }
            case TelemetryEventType.EntityInteract: {
                const ei = this.event_data as EventData['EntityInteract'];
                this.writeVarLong(ei.interactedEntityId);
                this.writeVarInt(ei.interactionType);
                this.writeVarInt(ei.interactionActorType);
                this.writeVarInt(ei.interactionActorVariant);
                this.writeUint8(ei.interactionActorColor);
                break;
            }
            case TelemetryEventType.PortalBuilt: {
                this.writeVarInt((this.event_data as EventData['PortalBuilt']).dimensionId);
                break;
            }
            case TelemetryEventType.PortalUsed: {
                const pu = this.event_data as EventData['PortalUsed'];
                this.writeVarInt(pu.fromDimensionId);
                this.writeVarInt(pu.toDimensionId);
                break;
            }
            case TelemetryEventType.MobKilled: {
                const mk = this.event_data as EventData['MobKilled'];
                this.writeVarLong(mk.instigatorActorId);
                this.writeVarLong(mk.targetActorId);
                this.writeVarInt(mk.instigatorChildActorType);
                this.writeVarInt(mk.damageSource);
                this.writeVarInt(mk.tradeTier);
                this.writeVarString(mk.traderName);
                break;
            }
            case TelemetryEventType.CauldronUsed: {
                const cu = this.event_data as EventData['CauldronUsed'];
                this.writeVarInt(cu.contentsColor);
                this.writeVarInt(cu.contentsType);
                this.writeVarInt(cu.fillLevel);
                break;
            }
            case TelemetryEventType.PlayerDeath: {
                const pd = this.event_data as EventData['PlayerDeath'];
                this.writeVarLong(pd.instigatorActorId);
                this.writeVarInt(pd.instigatorMobVariant);
                this.writeVarInt(pd.damageSource);
                this.writeBool(pd.diedInRaid);
                break;
            }
            case TelemetryEventType.BossKilled: {
                const bk = this.event_data as EventData['BossKilled'];
                this.writeVarLong(bk.bossActorId);
                this.writeVarInt(bk.partySize);
                this.writeVarInt(bk.bossType);
                break;
            }
            case TelemetryEventType.AgentCommand: {
                const ac = this.event_data as EventData['AgentCommand'];
                this.writeVarInt(ac.result);
                this.writeVarInt(ac.resultNumber);
                this.writeVarString(ac.commandName);
                this.writeVarString(ac.resultKey);
                this.writeVarString(ac.resultString);
                break;
            }
            case TelemetryEventType.CommandExecuted: {
                const ce = this.event_data as EventData['CommandExecuted'];
                this.writeVarInt(ce.successCount);
                this.writeVarInt(ce.errorCount);
                this.writeVarString(ce.commandName);
                this.writeVarString(ce.errorList);
                break;
            }
            case TelemetryEventType.MobBorn: {
                const mb = this.event_data as EventData['MobBorn'];
                this.writeVarInt(mb.entityType);
                this.writeVarInt(mb.entityVariant);
                this.writeUint8(mb.color);
                break;
            }
            case TelemetryEventType.PetDied: {
                const petd = this.event_data as EventData['PetDied'];
                this.writeVarInt(petd.killedPetEntityType);
                this.writeVarInt(petd.killedPetVariant);
                this.writeVarInt(petd.killerEntityType);
                this.writeVarInt(petd.killerVariant);
                this.writeVarInt(petd.damageSource);
                break;
            }
            case TelemetryEventType.CauldronBlockUsed:
            case TelemetryEventType.ComposterBlockUsed: {
                const cbu = this.event_data as EventData['CauldronBlockUsed'];
                this.writeVarInt(cbu.blockInteractionType);
                this.writeVarInt(cbu.itemId);
                break;
            }
            case TelemetryEventType.BellBlockUsed: {
                this.writeVarInt((this.event_data as EventData['BellBlockUsed']).itemId);
                break;
            }
            case TelemetryEventType.ActorDefinition: {
                this.writeVarString((this.event_data as EventData['ActorDefinition']).eventName);
                break;
            }
            case TelemetryEventType.RaidUpdate: {
                const ru = this.event_data as EventData['RaidUpdate'];
                this.writeVarInt(ru.currentRaidWave);
                this.writeVarInt(ru.totalRaidWaves);
                this.writeBool(ru.wonRaid);
                break;
            }
            case TelemetryEventType.TargetBlockHit: {
                this.writeVarInt((this.event_data as EventData['TargetBlockHit']).redstoneLevel);
                break;
            }
            case TelemetryEventType.PiglinBarter: {
                const pb = this.event_data as EventData['PiglinBarter'];
                this.writeVarInt(pb.itemId);
                this.writeBool(pb.wasTargetingBarteringPlayer);
                break;
            }
            case TelemetryEventType.WaxedOrUnwaxedCopper: {
                this.writeVarInt((this.event_data as EventData['WaxedOrUnwaxedCopper']).playerWaxedOrUnwaxedCopperBlockId);
                break;
            }
            case TelemetryEventType.CodeBuilderRuntimeAction: {
                this.writeVarString((this.event_data as EventData['CodeBuilderRuntimeAction']).codeBuilderRuntimeAction);
                break;
            }
            case TelemetryEventType.CodeBuilderScoreboard: {
                const cbs = this.event_data as EventData['CodeBuilderScoreboard'];
                this.writeVarString(cbs.objectiveName);
                this.writeVarInt(cbs.codeBuilderScoreboardScore);
                break;
            }
            case TelemetryEventType.ItemUsed: {
                const iu = this.event_data as EventData['ItemUsed'];
                this.writeShort(iu.itemId);
                this.writeVarInt(iu.itemAux);
                this.writeVarInt(iu.useMethod);
                this.writeVarInt(iu.useCount);
                break;
            }
            case TelemetryEventType.AgentCreated:
            case TelemetryEventType.BannerPatternRemoved:
            case TelemetryEventType.FishBucketed:
            case TelemetryEventType.PlayerMovementAnomaly:
            case TelemetryEventType.PlayerMovementCorrected:
            case TelemetryEventType.HoneyHarvested:
            case TelemetryEventType.StriderRiddenInLavaInOverworld:
            case TelemetryEventType.SneakCloseToSculkSensor:
            case TelemetryEventType.CarefulRestoration: {
                break;
            }
            default: {
                break;
            }
        }

        return this.getBuffer();
    }
	public override deserialize(): this { 
        this.readVarInt();
        this.unique_id = this.readVarLong();
        this.type = this.readVarInt() as TelemetryEventType;
        this.use_player_id = this.readByte();
        console.log(this.getBuffer());
        switch(this.type) { 
            case TelemetryEventType.AchievementAwarded:
                this.event_data = { achievementId: this.readVarInt() };
                break;
            case TelemetryEventType.EntityInteract:
                this.event_data = {
                    interactedEntityId: this.readVarLong(),
                    interactionType: this.readVarInt(),
                    interactionActorType: this.readVarInt(),
                    interactionActorVariant: this.readVarInt(),
                    interactionActorColor: this.readUint8()
                };
                break;
            case TelemetryEventType.PortalBuilt:
                this.event_data = { dimensionId: this.readVarInt() };
                break;
            case TelemetryEventType.PortalUsed:
                this.event_data = {
                    fromDimensionId: this.readVarInt(),
                    toDimensionId: this.readVarInt()
                };
                break;
            case TelemetryEventType.MobKilled:
                this.event_data = {
                    instigatorActorId: this.readVarLong(),
                    targetActorId: this.readVarLong(),
                    instigatorChildActorType: this.readVarInt(),
                    damageSource: this.readVarInt(),
                    tradeTier: this.readVarInt(),
                    traderName: this.readVarString()
                };
                break;
            case TelemetryEventType.CauldronUsed:
                this.event_data = {
                    contentsColor: this.readVarInt(),
                    contentsType: this.readVarInt(),
                    fillLevel: this.readVarInt()
                };
                break;
            case TelemetryEventType.PlayerDeath:
                this.event_data = {
                    instigatorActorId: this.readVarLong(),
                    instigatorMobVariant: this.readVarInt(),
                    damageSource: this.readVarInt(),
                    diedInRaid: this.readBool()
                };
                break;
            case TelemetryEventType.BossKilled:
                this.event_data = {
                    bossActorId: this.readVarLong(),
                    partySize: this.readVarInt(),
                    bossType: this.readVarInt()
                };
                break;
            case TelemetryEventType.AgentCommand:
                this.event_data = {
                    result: this.readVarInt(),
                    resultNumber: this.readVarInt(),
                    commandName: this.readVarString(),
                    resultKey: this.readVarString(),
                    resultString: this.readVarString()
                };
                break;
            case TelemetryEventType.AgentCreated:
                this.event_data = {};
                break;
            case TelemetryEventType.BannerPatternRemoved:
                this.event_data = {};
                break;
            case TelemetryEventType.CommandExecuted:
                this.event_data = {
                    successCount: this.readVarInt(),
                    errorCount: this.readVarInt(),
                    commandName: this.readVarString(),
                    errorList: this.readVarString()
                };
                break;
            case TelemetryEventType.FishBucketed:
                this.event_data = {};
                break;
            case TelemetryEventType.MobBorn:
                this.event_data = {
                    entityType: this.readVarInt(),
                    entityVariant: this.readVarInt(),
                    color: this.readUint8()
                };
                break;
            case TelemetryEventType.PetDied:
                this.event_data = {
                    killedPetEntityType: this.readVarInt(),
                    killedPetVariant: this.readVarInt(),
                    killerEntityType: this.readVarInt(),
                    killerVariant: this.readVarInt(),
                    damageSource: this.readVarInt()
                };
                break;
            case TelemetryEventType.CauldronBlockUsed:
                this.event_data = {
                    blockInteractionType: this.readVarInt(),
                    itemId: this.readVarInt()
                };
                break;
            case TelemetryEventType.ComposterBlockUsed:
                this.event_data = {
                    blockInteractionType: this.readVarInt(),
                    itemId: this.readVarInt()
                };
                break;
            case TelemetryEventType.BellBlockUsed:
                this.event_data = { itemId: this.readVarInt() };
                break;
            case TelemetryEventType.ActorDefinition:
                this.event_data = { eventName: this.readVarString() };
                break;
            case TelemetryEventType.RaidUpdate:
                this.event_data = {
                    currentRaidWave: this.readVarInt(),
                    totalRaidWaves: this.readVarInt(),
                    wonRaid: this.readBool()
                };
                break;
            case TelemetryEventType.PlayerMovementAnomaly:
                this.event_data = {};
                break;
            case TelemetryEventType.PlayerMovementCorrected:
                this.event_data = {};
                break;
            case TelemetryEventType.HoneyHarvested:
                this.event_data = {};
                break;
            case TelemetryEventType.TargetBlockHit:
                this.event_data = { redstoneLevel: this.readVarInt() };
                break;
            case TelemetryEventType.PiglinBarter:
                this.event_data = {
                    itemId: this.readVarInt(),
                    wasTargetingBarteringPlayer: this.readBool()
                };
                break;
            case TelemetryEventType.WaxedOrUnwaxedCopper:
                this.event_data = { playerWaxedOrUnwaxedCopperBlockId: this.readVarInt() };
                break;
            case TelemetryEventType.CodeBuilderRuntimeAction:
                this.event_data = { codeBuilderRuntimeAction: this.readVarString() };
                break;
            case TelemetryEventType.CodeBuilderScoreboard:
                this.event_data = {
                    objectiveName: this.readVarString(),
                    codeBuilderScoreboardScore: this.readVarInt()
                };
                break;
            case TelemetryEventType.StriderRiddenInLavaInOverworld:
                this.event_data = {};
                break;
            case TelemetryEventType.SneakCloseToSculkSensor:
                this.event_data = {};
                break;
            case TelemetryEventType.CarefulRestoration:
                this.event_data = {};
                break;
            case TelemetryEventType.ItemUsed:
                this.event_data = {
                    itemId: this.readShort(),
                    itemAux: this.readVarInt(),
                    useMethod: this.readVarInt(),
                    useCount: this.readVarInt()
                };
                break;
            default:
                this.event_data = undefined;
        }
        return this;
    }
}

export { LegacyTelemetryEventPacket, TelemetryEventType, type EventData };
