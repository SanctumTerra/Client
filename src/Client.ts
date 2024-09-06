import { RakNetClient, Advertisement } from "@sanctumterra/raknet";
import { authenticate, createOfflineSession } from "./client/Auth";
import { ClientData } from "./client/ClientData";
import { ProtocolList, defaultOptions, ClientOptions } from "./client/ClientOptions";
import { Listener, ListenerEvents } from "./client/Listener";
import { ProtocolValidator } from "./vendor/ProtocolValidator";
import { PacketSorter } from "./vendor/PacketSorter";
import { PacketEncryptor } from "./vendor/PacketEncryptor";
import { ActionIds, BlockAction, DataPacket, InputDataFlags, InputMode, InputTransaction, InteractionMode, ItemUseInventoryTransaction, ItemUseInventoryTransactionType, LegacyTransaction, NetworkItemStackDescriptor, Packets, PlayerAuthInputData, PlayerAuthInputPacket, PlayMode, RequestNetworkSettingsPacket, TextPacket, TextPacketType, TriggerType, Vector2f, Vector3f } from "@serenityjs/protocol";
import { Priority } from "@serenityjs/raknet";
import { PluginLoader } from "./vendor/PluginLoader";
import { Inventory } from "./client/inventory/Inventory";
import { Logger } from "./vendor/Logger";
import { Queue } from "./vendor/Queue";

class Client extends Listener {
    public readonly raknet: RakNetClient;
    public readonly options: ClientOptions;
    public readonly protocol: ProtocolList;
    public readonly data: ClientData;
    public readonly packetSorter: PacketSorter;
    public pluginLoader: PluginLoader;
    private ticker!: NodeJS.Timeout;
    public runtimeEntityId!: bigint;
    public username!: string;
    public position!: Vector3f;
    public tick: number = 0;

    public playStatus!: number;
    public _encryption: boolean = false;
    public _encryptor!: PacketEncryptor;

    private sneaking: boolean = false;
    private firstSneak: boolean = false;

    private headYaw: number = 0;
    private pitch: number = 0;
    private yaw: number = 0;
    private velocity: Vector3f = new Vector3f(0, 0, 0);

    public inventory: Inventory;
    
    private breakQueue: Queue<Vector3f> = new Queue();
    private isBreaking: boolean = false;
    
    constructor(options: Partial<ClientOptions> = {}) {
        super();
        this.options = { ...defaultOptions, ...options };
        this.protocol = ProtocolList[this.options.version];
        this.raknet = new RakNetClient();
        this.data = new ClientData(this);
        this.packetSorter = new PacketSorter(this);
        this.pluginLoader = new PluginLoader(this);
        this.prepare();
        this.inventory = new Inventory(this);
        this.ticker = setInterval(() => { this.emit("tick", this.tick++) }, 50)
        this.once("spawn", this.handleAuthInput.bind(this))
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
    public disconnect() { 
        Logger.info("Disconnecting...");
        this.raknet.close();
        clearInterval(this.ticker);
        setTimeout(() => {
            process.exit(0);
        }, 1000)
    }

    public async sneak() { 
        this.firstSneak = true;
        this.sneaking = true;
    } 

    private initializeSession(): void {
        this.on("session", this.handleSessionStart.bind(this));
        this.options.offline ? createOfflineSession(this) : authenticate(this);
    }

    private handleSessionStart(): void {
        this.raknet.connect(this.options.host, this.options.port);
    }

    private handleServerAdvertisement(ping: Advertisement): void {
        this.data.serverAdvertisement = ping;
    }

    private prepare(): void {
        this.raknet.once("connect", this.handleConnect.bind(this));
    }

    private handleConnect(): void {
        const networkSettingsPacket = new RequestNetworkSettingsPacket();
        networkSettingsPacket.protocol = this.protocol;
        this.sendPacket(networkSettingsPacket);
    }

    public sendPacket(packet: DataPacket, priority: Priority = Priority.Normal): void {
        const packetId = packet.getId();
        const hexId = packetId.toString(16).padStart(2, '0');
        if(this.options.debug) Logger.debug(`Sending Game PACKET --> ${packetId} | 0x${hexId} ${new Date().toISOString()}`);

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
            if(this.sneaking) {
                if(this.firstSneak) {
                    this.firstSneak = false;
                    inputData.setFlag(InputDataFlags.StartSneaking, true);
                    inputData.setFlag(InputDataFlags.SneakDown, true);
                }
                inputData.setFlag(InputDataFlags.Sneaking, true);
            }

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
                0,0,0
            );
            packet.tick = BigInt(this.tick);
            packet.transaction = undefined;
            packet.yaw = this.yaw;

            let cancel = false;
            this.emit("PrePlayerAuthInputPacket", packet, cancel);
            if(!cancel) {
                this.sendPacket(packet, Priority.Immediate);
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
     * Look at a specific position in the world
     * @param x The x coordinate of the target position
     * @param y The y coordinate of the target position
     * @param z The z coordinate of the target position
     * @param aimWithHead Whether to adjust the pitch (true) or only yaw (false)
     */
    public lookAt(x: number, y: number, z: number, aimWithHead: boolean = true): void {
        const view = {
            x: x - this.position.x,
            y: y - this.position.y,
            z: z - this.position.z
        };

        const dz = view.z;
        const dx = view.x;

        const tanOutput = 90 - (Math.atan(dx / dz) * (180 / Math.PI));
        let thetaOffset = 270;

        if (dz < 0) {
            thetaOffset = 90;
        }

        const yaw = thetaOffset + tanOutput;

        if (aimWithHead) {
            const bDiff = Math.sqrt(dx * dx + dz * dz);
            const dy = (this.position.y) - y; 
            this.pitch = Math.atan(dy / bDiff) * (180 / Math.PI);
        }

        this.yaw = yaw;
        this.headYaw = yaw;
    }

    /**
     * @deprecated
     */
    public async waitForEvent<K extends keyof ListenerEvents>(eventName: K, modifier?: (data: DataPacket) => void): Promise<Parameters<ListenerEvents[K]>[0]> {
        return new Promise((resolve) => {
            const listener: ListenerEvents[K] = ((...args: Parameters<ListenerEvents[K]>) => {
                let data = args[0];
                if (modifier && data instanceof DataPacket) {
                    modifier(data);
                }
                this.removeListener(eventName, listener);
                resolve(data);
            }) as ListenerEvents[K];

            this.once(eventName, listener);
        });
    }

    /**
     * Calculate the face of a block
     * @param blockPosition The position of the block
     * @returns The face of the block
     */
    private calculateFace(blockPosition: Vector3f): number {
        const dx = blockPosition.x - this.position.x;
        const dy = blockPosition.y - this.position.y;
        const dz = blockPosition.z - this.position.z;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const absDz = Math.abs(dz);

        if (absDx > absDy && absDx > absDz) {
            return dx > 0 ? 5 : 4; // EAST : WEST
        } else if (absDy > absDx && absDy > absDz) {
            return dy > 0 ? 1 : 0; // UP : DOWN
        } else {
            return dz > 0 ? 3 : 2; // SOUTH : North
        }
    }

    /**
     * Queue a block to be broken
     * @param position The position of the block
     */
    public queueBreak(position: Vector3f): void {
        this.breakQueue.enqueue(position);
        this.processBreakQueue();
    }

    /**
     * Process the break queue
     */
    private async processBreakQueue(): Promise<void> {
        if (this.isBreaking || this.breakQueue.isEmpty()) {
            return;
        }

        this.isBreaking = true;

        while (!this.breakQueue.isEmpty()) {
            const position = this.breakQueue.dequeue();
            if (position) {
                await this.breakBlock(position);
            }
        }

        this.isBreaking = false;
    }

    /**
     * Break a block
     * @param position The position of the block
     * @param ticks The number of ticks to break the block
     */
    private async breakBlock(position: Vector3f, ticks: number = 5): Promise<void> {
        const MAX_DISTANCE = 5;
        const TICK_INTERVAL = 100;

        const isBlockTooFar = (playerPosition: Vector3f, blockPosition: Vector3f): boolean => {
            return Math.abs(blockPosition.x - playerPosition.x) > MAX_DISTANCE ||
                   Math.abs(blockPosition.z - playerPosition.z) > MAX_DISTANCE;
        };

        const modifyNextPacket = (modifier: (packet: PlayerAuthInputPacket) => void): Promise<void> => {
            return new Promise((resolve) => {
                this.once('PrePlayerAuthInputPacket', (packet: PlayerAuthInputPacket) => {
                    modifier(packet);
                    resolve();
                });
            });
        };

        const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

        if (isBlockTooFar(this.position, position)) {
            Logger.warn(`The block is too far from the player. Max distance is ${MAX_DISTANCE} blocks.`);
            return;
        }

        const startTick = Number(this.tick);
        const endTick = startTick + ticks;

        this.lookAt(position.x, position.y, position.z);

        const face = this.calculateFace(position);
        // Start Break
        await modifyNextPacket((packet: PlayerAuthInputPacket) => {
            this.lookAt(position.x, position.y, position.z);
            packet.blockActions.push(
                new BlockAction(ActionIds.StartBreak, position, face),
                new BlockAction(ActionIds.CrackBreak, position, face)
            );
            packet.inputData.setFlag(InputDataFlags.BlockAction, true);
        });

        // Crack Break
        for (let tick = startTick + 1; tick < endTick; tick++) {
            await modifyNextPacket((packet: PlayerAuthInputPacket) => {
                this.lookAt(position.x, position.y, position.z);
                packet.blockActions.push(new BlockAction(ActionIds.CrackBreak, position, face));
                packet.inputData.setFlag(InputDataFlags.BlockAction, true);
            });
            await sleep(TICK_INTERVAL);
        }

        // Stop Break
        await modifyNextPacket((packet: PlayerAuthInputPacket) => {
            packet.inputData.setFlag(InputDataFlags.BlockAction, true);
            packet.inputData.setFlag(InputDataFlags.ItemInteract, true);
            this.lookAt(position.x, position.y, position.z);

            packet.blockActions.push(
                new BlockAction(ActionIds.StopBreak),
                new BlockAction(ActionIds.CrackBreak, position, face)
            );

            packet.transaction = new InputTransaction(
                new LegacyTransaction(0, []),
                [],
                new ItemUseInventoryTransaction(
                    ItemUseInventoryTransactionType.Destroy,
                    TriggerType.Unknown,
                    position, 1, 0,
                    new NetworkItemStackDescriptor(0),
                    this.position,
                    new Vector3f(0, 0, 0), 0,
                    false
                )
            );
        });

        await sleep(TICK_INTERVAL);
    }

    /**
     * Break a block
     * @param {Vector3f} position The position of the block
     */
    public break(position: Vector3f): void {
        this.queueBreak(position);
    }
}

export { Client };