import { RakNetClient, Advertisement, Logger } from "@sanctumterra/raknet";
import { authenticate, createOfflineSession } from "./client/Auth";
import { ClientData } from "./client/ClientData";
import { ProtocolList, defaultOptions, ClientOptions } from "./client/ClientOptions";
import { Listener } from "./client/Listener";
import { ProtocolValidator } from "./vendor/ProtocolValidator";
import { PacketSorter } from "./vendor/PacketSorter";
import { PacketEncryptor } from "./vendor/PacketEncryptor";
import { DataPacket, InputDataFlags, InputMode, InteractionMode, PlayerAuthInputData, PlayerAuthInputPacket, PlayMode, RequestNetworkSettingsPacket, TextPacket, TextPacketType, Vector2f, Vector3f } from "@serenityjs/protocol";
import { Priority } from "@serenityjs/raknet";
import { PluginLoader } from "./vendor/PluginLoader";
import { Inventory } from "./client/inventory/Inventory";

class Client extends Listener {
    public readonly raknet: RakNetClient;
    public readonly options: ClientOptions;
    public readonly protocol: ProtocolList;
    public readonly data: ClientData;
    public readonly packetSorter: PacketSorter;
    public pluginLoader: PluginLoader;

    public runtimeEntityId!: bigint;
    public username!: string;
    public position!: Vector3f;
    public tick: number = 0;

    public playStatus!: number;
    public _encryption: boolean = false;
    public _encryptor!: PacketEncryptor;

    private headYaw: number = 0;
    private pitch: number = 0;
    private yaw: number = 0;
    private velocity: Vector3f = new Vector3f(0, 0, 0);

    public inventory: Inventory;
    
    constructor(options: Partial<ClientOptions> = {}) {
        super();
        this.options = { ...defaultOptions, ...options };
        this.protocol = ProtocolList[this.options.version];
        this.raknet = new RakNetClient(this.options.host, this.options.port);
        this.data = new ClientData(this);
        this.packetSorter = new PacketSorter(this);
        this.pluginLoader = new PluginLoader(this);
        this.prepare();
        this.inventory = new Inventory(this);

        setInterval(() => { this.emit("tick", this.tick++) }, 50)
        this.on("spawn", this.handleAuthInput.bind(this))
    }

    public async connect(): Promise<void> {
        const protocolValidator = new ProtocolValidator(this);
        if(this.options.validateProtocol) {
            await protocolValidator.validateAndCheck();
        }
        if(this.options.loadPlugins) {
            await this.pluginLoader.init();
        }
        this.initializeSession();
    }

    private initializeSession(): void {
        this.on("session", this.handleSessionStart.bind(this));
        this.options.offline ? createOfflineSession(this) : authenticate(this);
    }

    private handleSessionStart(): void {
        this.raknet.connect(this.handleServerAdvertisement.bind(this));
    }

    private handleServerAdvertisement(ping: Advertisement): void {
        this.data.serverAdvertisement = ping;
    }

    private prepare(): void {
        this.raknet.on("connect", this.handleConnect.bind(this));
    }

    private handleConnect(): void {
        const networkSettingsPacket = new RequestNetworkSettingsPacket();
        networkSettingsPacket.protocol = this.protocol;
        this.sendPacket(networkSettingsPacket);
    }

    public sendPacket(packet: DataPacket, priority: Priority = Priority.Normal): void {
        const packetId = packet.getId();
        const hexId = packetId.toString(16).padStart(2, '0');
        Logger.debug(`Sending Game PACKET --> ${packetId} | 0x${hexId} ${new Date().toISOString()}`);

        try {
            this.packetSorter.sendPacket(packet, priority);
        } catch (error) {
            Logger.error(`Error sending packet: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private handleAuthInput(): void {
        setInterval(() => {
            const inputData = new PlayerAuthInputData();
            inputData.setFlag(InputDataFlags.BlockBreakingDelayEnabled, true);

            let packet = new PlayerAuthInputPacket();
            packet.analogueMoveVector = new Vector2f(this.velocity.x, this.velocity.z);
            packet.blockActions = [];
            packet.gazeDirection = undefined;
            packet.headYaw = this.headYaw;
            packet.inputData = inputData;
            packet.inputMode = InputMode.Mouse;
            packet.itemStackRequest = undefined;
            packet.motion = new Vector2f(this.velocity.x, this.velocity.z);
            packet.pitch = this.pitch;
            packet.playMode = PlayMode.Screen;
            packet.interactionMode = InteractionMode.Touch;;
            packet.position = this.position;
            packet.positionDelta = new Vector3f( 
                this.velocity.x,
                this.velocity.y,
                this.velocity.z
            );
            packet.tick = BigInt(this.tick);
            packet.transaction = undefined;
            packet.yaw = this.yaw;

            let cancel = false;
            this.emit("PrePlayerAuthInputPacket", packet, cancel);
            if(!cancel) {
                this.sendPacket(packet);
            }
        }, 100)
    }

    public sendMessage(text: string): void {
        const textPacket = new TextPacket();
        textPacket.filtered = '';
        textPacket.message = text.replace(/^\s+/, '');
        textPacket.needsTranslation = false;
        textPacket.parameters = [];
        textPacket.platformChatId = "";
        textPacket.source = this.data.profile.name;
        textPacket.type = TextPacketType.Chat;
        textPacket.xuid = "";
        this.sendPacket(textPacket, Priority.Normal);
    }

    /**
     * This ownt look at the block but a direction atleast (something i needed for now)
     */
    public lookAt(x: number, y: number, z: number): void { 
        const deltaX = x - this.position.x;
        const deltaY = y - this.position.y;
        const deltaZ = z - this.position.z;

        const groundDistance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
        const pitch = Math.atan2(deltaY, groundDistance) * (180 / Math.PI);
        const yaw = Math.atan2(-deltaX, -deltaZ) * (180 / Math.PI);
        const headYaw = yaw;

        this.pitch = pitch;
        this.yaw = yaw;
        this.headYaw = headYaw;
    }

}

export { Client };