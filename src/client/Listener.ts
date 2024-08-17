import {
    ActorEventPacket, AddEntityPacket, AddItemActorPacket,
    AddPlayerPacket, AnimateEntityPacket, AnimatePacket,
    AvailableActorIdentifiersPacket, AvailableCommandsPacket, AwardAchievementPacket,
    BiomeDefinitionListPacket, BlockActorDataPacket, BlockPickRequestPacket,
    BookEditPacket, BossEventPacket, CameraInstructionsPacket,
    CameraPresetsPacket, CameraShakePacket, ChangeDimensionPacket,
    ChunkRadiusUpdatePacket, ClientboundCloseFormPacket, CommandOutputPacket,
    CommandRequestPacket, CompletedUsingItemPacket, ContainerClosePacket,
    ContainerOpenPacket, ContainerSetDataPacket, CraftingDataPacket,
    CreativeContentPacket, DeathInfoPacket, DimensionDataPacket,
    DisconnectPacket, EmoteListPacket, EmotePacket,
    InteractPacket, InventoryContentPacket, InventorySlotPacket,
    InventoryTransactionPacket, ItemComponentPacket, ItemStackRequestPacket,
    ItemStackResponsePacket, LevelChunkPacket, LevelEventPacket,
    LevelSoundEventPacket, LoginPacket, MobEffectPacket,
    MobEquipmentPacket, ModalFormRequestPacket, ModalFormResponsePacket,
    MoveActorAbsolutePacket, MovePlayerPacket, NetworkChunkPublisherUpdatePacket,
    NetworkSettingsPacket, NetworkStackLatencyPacket, NpcDialoguePacket,
    NpcRequestPacket, OpenSignPacket, PlayStatusPacket,
    PlayerActionPacket, PlayerAuthInputPacket, PlayerHotbarPacket,
    PlayerListPacket, PlayerSkinPacket, PlayerStartItemCooldownPacket,
    RemoveEntityPacket, RemoveObjectivePacket, RequestChunkRadiusPacket,
    RequestNetworkSettingsPacket, ResourcePackChunkDataPacket, ResourcePackChunkRequestPacket,
    ResourcePackClientResponsePacket, ResourcePackDataInfoPacket, ResourcePackStackPacket,
    ResourcePacksInfoPacket, RespawnPacket, ScriptMessagePacket,
    ServerToClientHandshakePacket, ServerboundLoadingScreenPacketPacket, SetActorDataPacket,
    SetActorMotionPacket, SetCommandsEnabledPacket, SetDisplayObjectivePacket,
    SetHudPacket, SetLocalPlayerAsInitializedPacket, SetPlayerGameTypePacket,
    SetPlayerInventoryOptionsPacket, SetScorePacket, SetScoreboardIdentityPacket,
    SetTimePacket, SetTitlePacket, SpawnParticleEffectPacket,
    StartGamePacket, StructureBlockUpdatePacket, TakeItemActorPacket,
    TextPacket, ToastRequestPacket, TransferPacket,
    UpdateAbilitiesPacket, UpdateAdventureSettingsPacket, UpdateAttributesPacket,
    UpdateBlockPacket
} from "@serenityjs/protocol";
import { EventEmitter } from "events";

class Listener extends EventEmitter {
    emit<K extends keyof ListenerEvents>(eventName: K, ...args: Parameters<ListenerEvents[K]>): boolean {
        return super.emit(eventName, ...args);
    }
  
    on(eventName: string | symbol, listener: (...args: any[]) => void): this;
    on<K extends keyof ListenerEvents>(eventName: K, listener: ListenerEvents[K]): this;
    on(eventName: string | symbol, listener: (...args: any[]) => void): this {
      return super.on(eventName, listener);
    }
}

interface ListenerEvents {
    'session': () => void;
    'TextPacket': (packet: TextPacket) => void;
    "DisconnectPacket": (packet: DisconnectPacket) => void;
    'SetTimePacket': (packet: SetTimePacket) => void;
    'RespawnPacket': (packet: RespawnPacket) => void;
    'SetLocalPlayerAsInitializedPacket': (packet: SetLocalPlayerAsInitializedPacket) => void;
    'NetworkChunkPublisherUpdatePacket': (packet: NetworkChunkPublisherUpdatePacket) => void;
    'ResourcePackClientResponsePacket': (packet: ResourcePackClientResponsePacket) => void;
    'SetPlayerInventoryOptionsPacket': (packet: SetPlayerInventoryOptionsPacket) => void;
    'AvailableActorIdentifiersPacket': (packet: AvailableActorIdentifiersPacket) => void;
    'ServerboundLoadingScreenPacketPacket': (packet: ServerboundLoadingScreenPacketPacket) => void;
    'ResourcePackChunkRequestPacket': (packet: ResourcePackChunkRequestPacket) => void;
    'UpdateAdventureSettingsPacket': (packet: UpdateAdventureSettingsPacket) => void;
    'ServerToClientHandshakePacket': (packet: ServerToClientHandshakePacket) => void;
    'PlayerStartItemCooldownPacket': (packet: PlayerStartItemCooldownPacket) => void;
    'RequestNetworkSettingsPacket': (packet: RequestNetworkSettingsPacket) => void;
    'SetScoreboardIdentityPacket': (packet: SetScoreboardIdentityPacket) => void;
    'ResourcePackChunkDataPacket': (packet: ResourcePackChunkDataPacket) => void;
    'StructureBlockUpdatePacket': (packet: StructureBlockUpdatePacket) => void;
    'InventoryTransactionPacket': (packet: InventoryTransactionPacket) => void;
    'ClientboundCloseFormPacket': (packet: ClientboundCloseFormPacket) => void;
    'ResourcePackDataInfoPacket': (packet: ResourcePackDataInfoPacket) => void;
    'SetDisplayObjectivePacket': (packet: SetDisplayObjectivePacket) => void;
    'NetworkStackLatencyPacket': (packet: NetworkStackLatencyPacket) => void;
    'BiomeDefinitionListPacket': (packet: BiomeDefinitionListPacket) => void;
    'SpawnParticleEffectPacket': (packet: SpawnParticleEffectPacket) => void;
    'SetCommandsEnabledPacket': (packet: SetCommandsEnabledPacket) => void;
    'RequestChunkRadiusPacket': (packet: RequestChunkRadiusPacket) => void;
    'CompletedUsingItemPacket': (packet: CompletedUsingItemPacket) => void;
    'CameraInstructionsPacket': (packet: CameraInstructionsPacket) => void;
    'SetPlayerGameTypePacket': (packet: SetPlayerGameTypePacket) => void;
    'MoveActorAbsolutePacket': (packet: MoveActorAbsolutePacket) => void;
    'ModalFormResponsePacket': (packet: ModalFormResponsePacket) => void;
    'ItemStackResponsePacket': (packet: ItemStackResponsePacket) => void;
    'ChunkRadiusUpdatePacket': (packet: ChunkRadiusUpdatePacket) => void;
    'AvailableCommandsPacket': (packet: AvailableCommandsPacket) => void;
    'ResourcePacksInfoPacket': (packet: ResourcePacksInfoPacket) => void;
    'ResourcePackStackPacket': (packet: ResourcePackStackPacket) => void;
    'UpdateAttributesPacket': (packet: UpdateAttributesPacket) => void;
    'ModalFormRequestPacket': (packet: ModalFormRequestPacket) => void;
    'ItemStackRequestPacket': (packet: ItemStackRequestPacket) => void;
    'InventoryContentPacket': (packet: InventoryContentPacket) => void;
    'ContainerSetDataPacket': (packet: ContainerSetDataPacket) => void;
    'BlockPickRequestPacket': (packet: BlockPickRequestPacket) => void;
    'AwardAchievementPacket': (packet: AwardAchievementPacket) => void;
    'UpdateAbilitiesPacket': (packet: UpdateAbilitiesPacket) => void;
    'RemoveObjectivePacket': (packet: RemoveObjectivePacket) => void;
    'PlayerAuthInputPacket': (packet: PlayerAuthInputPacket) => void;
    'NetworkSettingsPacket': (packet: NetworkSettingsPacket) => void;
    'LevelSoundEventPacket': (packet: LevelSoundEventPacket) => void;
    'CreativeContentPacket': (packet: CreativeContentPacket) => void;
    'ChangeDimensionPacket': (packet: ChangeDimensionPacket) => void;
    'SetActorMotionPacket': (packet: SetActorMotionPacket) => void;
    'ContainerClosePacket': (packet: ContainerClosePacket) => void;
    'CommandRequestPacket': (packet: CommandRequestPacket) => void;
    'BlockActorDataPacket': (packet: BlockActorDataPacket) => void;
    'TakeItemActorPacket': (packet: TakeItemActorPacket) => void;
    'ScriptMessagePacket': (packet: ScriptMessagePacket) => void;
    'ItemComponentPacket': (packet: ItemComponentPacket) => void;
    'InventorySlotPacket': (packet: InventorySlotPacket) => void;
    'DimensionDataPacket': (packet: DimensionDataPacket) => void;
    'ContainerOpenPacket': (packet: ContainerOpenPacket) => void;
    'CommandOutputPacket': (packet: CommandOutputPacket) => void;
    'CameraPresetsPacket': (packet: CameraPresetsPacket) => void;
    'AnimateEntityPacket': (packet: AnimateEntityPacket) => void;
    'ToastRequestPacket': (packet: ToastRequestPacket) => void;
    'SetActorDataPacket': (packet: SetActorDataPacket) => void;
    'RemoveEntityPacket': (packet: RemoveEntityPacket) => void;
    'PlayerHotbarPacket': (packet: PlayerHotbarPacket) => void;
    'PlayerActionPacket': (packet: PlayerActionPacket) => void;
    'MobEquipmentPacket': (packet: MobEquipmentPacket) => void;
    'CraftingDataPacket': (packet: CraftingDataPacket) => void;
    'AddItemActorPacket': (packet: AddItemActorPacket) => void;
    'UpdateBlockPacket': (packet: UpdateBlockPacket) => void;
    'NpcDialoguePacket': (packet: NpcDialoguePacket) => void;
    'CameraShakePacket': (packet: CameraShakePacket) => void;
    'PlayerSkinPacket': (packet: PlayerSkinPacket) => void;
    'PlayerListPacket': (packet: PlayerListPacket) => void;
    'PlayStatusPacket': (packet: PlayStatusPacket) => void;
    'NpcRequestPacket': (packet: NpcRequestPacket) => void;
    'LevelEventPacket': (packet: LevelEventPacket) => void;
    'LevelChunkPacket': (packet: LevelChunkPacket) => void;
    'MovePlayerPacket': (packet: MovePlayerPacket) => void;
    'ActorEventPacket': (packet: ActorEventPacket) => void;
    'StartGamePacket': (packet: StartGamePacket) => void;
    'MobEffectPacket': (packet: MobEffectPacket) => void;
    'EmoteListPacket': (packet: EmoteListPacket) => void;
    'DeathInfoPacket': (packet: DeathInfoPacket) => void;
    'BossEventPacket': (packet: BossEventPacket) => void;
    'AddPlayerPacket': (packet: AddPlayerPacket) => void;
    'AddEntityPacket': (packet: AddEntityPacket) => void;
    'TransferPacket': (packet: TransferPacket) => void;
    'SetScorePacket': (packet: SetScorePacket) => void;
    'SetTitlePacket': (packet: SetTitlePacket) => void;
    'OpenSignPacket': (packet: OpenSignPacket) => void;
    'InteractPacket': (packet: InteractPacket) => void;
    'BookEditPacket': (packet: BookEditPacket) => void;
    'AnimatePacket': (packet: AnimatePacket) => void;
    'SetHudPacket': (packet: SetHudPacket) => void;
    'LoginPacket': (packet: LoginPacket) => void;
    'EmotePacket': (packet: EmotePacket) => void;
}



export {
    Listener
};
