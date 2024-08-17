import { RakNetClient, Advertisement, Logger } from "@sanctumterra/raknet";
import { authenticate, createOfflineSession } from "./client/Auth";
import { ClientData } from "./client/ClientData";
import { ProtocolList, defaultOptions, ClientOptions } from "./client/ClientOptions";
import { Listener } from "./client/Listener";
import { ProtocolValidator } from "./vendor/ProtocolValidator";
import { PacketSorter } from "./vendor/PacketSorter";
import { PacketEncryptor } from "./vendor/PacketEncryptor";
import { DataPacket, RequestNetworkSettingsPacket, TextPacket, TextPacketType } from "@serenityjs/protocol";
import { Priority } from "@serenityjs/raknet";

class Client extends Listener {
    public readonly raknet: RakNetClient;
    public readonly options: ClientOptions;
    public readonly protocol: ProtocolList;
    public readonly data: ClientData;
    public readonly packetSorter: PacketSorter;

    public runtimeEntityId!: bigint;
    public username!: string;
    public playStatus!: number;
    public _encryption: boolean = false;
    public _encryptor!: PacketEncryptor;

    constructor(options: Partial<ClientOptions> = {}) {
        super();
        this.options = { ...defaultOptions, ...options };
        this.protocol = ProtocolList[this.options.version];
        this.raknet = new RakNetClient(this.options.host, this.options.port);
        this.data = new ClientData(this);
        this.packetSorter = new PacketSorter(this);
        this.prepare();
    }

    public async connect(): Promise<void> {
        const protocolValidator = new ProtocolValidator(this);
        console.time('Protocol Validation');
        await protocolValidator.validateAndInstall();
        console.timeEnd('Protocol Validation');

        this.initializeSession();
    }

    private initializeSession(): void {
        this.options.offline ? createOfflineSession(this) : authenticate(this);
        this.on("session", this.handleSessionStart.bind(this));
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

    sendMessage(text: string): void {
        console.log("SendMessage ", text)
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
}

export { Client };