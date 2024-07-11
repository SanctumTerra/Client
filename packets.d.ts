
import { 
    LoginPacket,
    PlayStatusPacket,
    ServerToClientHandshakePacket,
    DisconnectPacket,
    ResourcePacksInfoPacket,
    ResourcePackStackPacket,
    ResourcePackClientResponsePacket,
    TextPacket,
    SetTimePacket,
    StartGamePacket,
    AddPlayerPacket,
    AddEntityPacket,
    RemoveEntityPacket,
    AddItemActorPacket,
    TakeItemActorPacket,
    MoveActorAbsolutePacket,
    MovePlayerPacket,
    UpdateBlockPacket,
    LevelEventPacket,
    ActorEventPacket,
    UpdateAttributesPacket,
    InventoryTransactionPacket,
    MobEquipmentPacket,
    InteractPacket,
    BlockPickRequestPacket,
    PlayerActionPacket,
    SetEntityDataPacket,
    SetActorMotionPacket,
    AnimatePacket,
    RespawnPacket,
    ContainerOpenPacket,
    ContainerClosePacket,
    PlayerHotbarPacket,
    InventoryContentPacket,
    InventorySlotPacket,
    BlockActorDataPacket,
    LevelChunkPacket,
    SetCommandsEnabledPacket,
    ChangeDimensionPacket,
    SetPlayerGameTypePacket,
    PlayerListPacket,
    RequestChunkRadiusPacket,
    ChunkRadiusUpdatePacket,
    BossEventPacket,
    AvailableCommandsPacket,
    CommandRequestPacket,
    CommandOutputPacket,
    ResourcePackDataInfoPacket,
    ResourcePackChunkDataPacket,
    ResourcePackChunkRequestPacket,
    TransferPacket,
    SetTitlePacket,
    PlayerSkinPacket,
    ModalFormRequestPacket,
    ModalFormResponsePacket,
    RemoveObjectivePacket,
    SetDisplayObjectivePacket,
    SetScorePacket,
    SetScoreboardIdentityPacket,
    SetLocalPlayerAsInitializedPacket,
    NetworkStackLatencyPacket,
    NetworkChunkPublisherUpdatePacket,
    BiomeDefinitionListPacket,
    LevelSoundEventPacket,
    EmotePacket,
    NetworkSettingsPacket,
    PlayerAuthInputPacket,
    CreativeContentPacket,
    ItemStackRequestPacket,
    ItemStackResponsePacket,
    EmoteListPacket,
    PacketViolationWarningPacket,
    AnimateEntityPacket,
    ItemComponentPacket,
    NpcDialoguePacket,
    ScriptMessagePacket,
    ToastRequestPacket,
    UpdateAbilitiesPacket,
    UpdateAdventureSettingsPacket,
    DeathInfoPacket,
    RequestNetworkSettingsPacket,
    SetHudPacket,
    AwardAchievementPacket,
 } from "@serenityjs/protocol"

export type EventTypes = {
    LoginPacket: [packet: LoginPacket];
    PlayStatusPacket: [packet: PlayStatusPacket];
    ServerToClientHandshakePacket: [packet: ServerToClientHandshakePacket];
    DisconnectPacket: [packet: DisconnectPacket];
    ResourcePacksInfoPacket: [packet: ResourcePacksInfoPacket];
    ResourcePackStackPacket: [packet: ResourcePackStackPacket];
    ResourcePackClientResponsePacket: [packet: ResourcePackClientResponsePacket];
    TextPacket: [packet: TextPacket];
    SetTimePacket: [packet: SetTimePacket];
    StartGamePacket: [packet: StartGamePacket];
    AddPlayerPacket: [packet: AddPlayerPacket];
    AddEntityPacket: [packet: AddEntityPacket];
    RemoveEntityPacket: [packet: RemoveEntityPacket];
    AddItemActorPacket: [packet: AddItemActorPacket];
    TakeItemActorPacket: [packet: TakeItemActorPacket];
    MoveActorAbsolutePacket: [packet: MoveActorAbsolutePacket];
    MovePlayerPacket: [packet: MovePlayerPacket];
    UpdateBlockPacket: [packet: UpdateBlockPacket];
    LevelEventPacket: [packet: LevelEventPacket];
    ActorEventPacket: [packet: ActorEventPacket];
    UpdateAttributesPacket: [packet: UpdateAttributesPacket];
    InventoryTransactionPacket: [packet: InventoryTransactionPacket];
    MobEquipmentPacket: [packet: MobEquipmentPacket];
    InteractPacket: [packet: InteractPacket];
    BlockPickRequestPacket: [packet: BlockPickRequestPacket];
    PlayerActionPacket: [packet: PlayerActionPacket];
    SetEntityDataPacket: [packet: SetEntityDataPacket];
    SetActorMotionPacket: [packet: SetActorMotionPacket];
    AnimatePacket: [packet: AnimatePacket];
    RespawnPacket: [packet: RespawnPacket];
    ContainerOpenPacket: [packet: ContainerOpenPacket];
    ContainerClosePacket: [packet: ContainerClosePacket];
    PlayerHotbarPacket: [packet: PlayerHotbarPacket];
    InventoryContentPacket: [packet: InventoryContentPacket];
    InventorySlotPacket: [packet: InventorySlotPacket];
    BlockActorDataPacket: [packet: BlockActorDataPacket];
    LevelChunkPacket: [packet: LevelChunkPacket];
    SetCommandsEnabledPacket: [packet: SetCommandsEnabledPacket];
    ChangeDimensionPacket: [packet: ChangeDimensionPacket];
    SetPlayerGameTypePacket: [packet: SetPlayerGameTypePacket];
    PlayerListPacket: [packet: PlayerListPacket];
    RequestChunkRadiusPacket: [packet: RequestChunkRadiusPacket];
    ChunkRadiusUpdatePacket: [packet: ChunkRadiusUpdatePacket];
    BossEventPacket: [packet: BossEventPacket];
    AvailableCommandsPacket: [packet: AvailableCommandsPacket];
    CommandRequestPacket: [packet: CommandRequestPacket];
    CommandOutputPacket: [packet: CommandOutputPacket];
    ResourcePackDataInfoPacket: [packet: ResourcePackDataInfoPacket];
    ResourcePackChunkDataPacket: [packet: ResourcePackChunkDataPacket];
    ResourcePackChunkRequestPacket: [packet: ResourcePackChunkRequestPacket];
    TransferPacket: [packet: TransferPacket];
    SetTitlePacket: [packet: SetTitlePacket];
    PlayerSkinPacket: [packet: PlayerSkinPacket];
    ModalFormRequestPacket: [packet: ModalFormRequestPacket];
    ModalFormResponsePacket: [packet: ModalFormResponsePacket];
    RemoveObjectivePacket: [packet: RemoveObjectivePacket];
    SetDisplayObjectivePacket: [packet: SetDisplayObjectivePacket];
    SetScorePacket: [packet: SetScorePacket];
    SetScoreboardIdentityPacket: [packet: SetScoreboardIdentityPacket];
    SetLocalPlayerAsInitializedPacket: [packet: SetLocalPlayerAsInitializedPacket];
    NetworkStackLatencyPacket: [packet: NetworkStackLatencyPacket];
    NetworkChunkPublisherUpdatePacket: [packet: NetworkChunkPublisherUpdatePacket];
    BiomeDefinitionListPacket: [packet: BiomeDefinitionListPacket];
    LevelSoundEventPacket: [packet: LevelSoundEventPacket];
    EmotePacket: [packet: EmotePacket];
    NetworkSettingsPacket: [packet: NetworkSettingsPacket];
    PlayerAuthInputPacket: [packet: PlayerAuthInputPacket];
    CreativeContentPacket: [packet: CreativeContentPacket];
    ItemStackRequestPacket: [packet: ItemStackRequestPacket];
    ItemStackResponsePacket: [packet: ItemStackResponsePacket];
    EmoteListPacket: [packet: EmoteListPacket];
    PacketViolationWarningPacket: [packet: PacketViolationWarningPacket];
    AnimateEntityPacket: [packet: AnimateEntityPacket];
    ItemComponentPacket: [packet: ItemComponentPacket];
    NpcDialoguePacket: [packet: NpcDialoguePacket];
    ScriptMessagePacket: [packet: ScriptMessagePacket];
    ToastRequestPacket: [packet: ToastRequestPacket];
    UpdateAbilitiesPacket: [packet: UpdateAbilitiesPacket];
    UpdateAdventureSettingsPacket: [packet: UpdateAdventureSettingsPacket];
    DeathInfoPacket: [packet: DeathInfoPacket];
    RequestNetworkSettingsPacket: [packet: RequestNetworkSettingsPacket];
    SetHudPacket: [packet: SetHudPacket];
    AwardAchievementPacket: [packet: AwardAchievementPacket];
    
}
