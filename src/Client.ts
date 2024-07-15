import { EventEmitter } from "events";
import { RakNetClient, Advertisement } from "@sanctumterra/raknet";
import { createSocket, Socket } from "dgram";
import { Frame, Priority, Reliability } from "@serenityjs/raknet";
import { GAME_BYTE } from "@serenityjs/network";
import { 
    CompressionMethod,
    DataPacket, 
    Framer, 
    getPacketId, 
    Packets, 
    RequestNetworkSettingsPacket, 
    SetEntityDataPacket, 

} from "@serenityjs/protocol";
import { deflateRawSync, inflateRawSync } from "zlib";
import { Logger } from "./utils/Logger";
import { PacketEncryptor } from "./client/packets/PacketEncryptor";
import { ClientData } from "./client/ClientData";
import { authenticate, createOfflineSession } from "./client/auth/Auth";
import { defaultOptions, Options } from "./client/ClientOptions";
import { PacketHandler } from "./client/handlers";
import { Listener } from "./client/Listener";

declare global {
    var _client: Client; // eslint-disable-line
    var _encryptor: PacketEncryptor; // eslint-disable-line
}

  
class Client extends Listener {
    public raknet: RakNetClient;
    public socket: Socket;
    public _encryption: boolean = false;
    public readonly protocol: number = 685;
    public options: Options;
    public data: ClientData;
    public packetHandler: PacketHandler;
    
    public runtimeEntityId!: bigint;

    public constructor(options: Partial<Options> = {}) {
        super();
        this.options = { ...defaultOptions, ...options };
        if (!this.options.host) throw new Error("Host cannot be undefined");
        if (!this.options.port) throw new Error("Port cannot be undefined");
        globalThis._client = this;
        this.socket = createSocket("udp4");

        this.data = new ClientData(this);
        this.packetHandler= new PacketHandler(this);
        if(this.options.raknetClass){
            this.raknet = new this.options.raknetClass(this.options.host, this.options.port)
        } else {
            this.raknet = new RakNetClient(this.options.host, this.options.port);
        }

        this.raknet.on("encapsulated", (frame) => {
            this.handlePacket(frame);
        })

        setInterval(() => {}, 50);
        
    }



    connect() {
        this.raknet.on("connect", () => {
            const networksettings = new RequestNetworkSettingsPacket();
            networksettings.protocol = this.protocol;
            this.sendPacket(networksettings, Priority.Immediate);
        });

        if (this.options.offline) {
          createOfflineSession(this).then(i => {
            this.data.profile = i.profile;
            this.data.accessToken = i.chains;
          })
        } else {
            authenticate(this).then(i => {
                this.data.profile = i.profile;
                this.data.accessToken = i.chains;
                this.data.loginData.clientIdentityChain = this.data.createClientChain(null, this.options.offline ?? false)
                this.data.loginData.clientUserChain = this.data.createClientUserChain(this.data.loginData.ecdhKeyPair.privateKey);
                this.emit("session")
            })
        }
        this.on("session", async () => {
            this.raknet.connect((ping: Advertisement) => {
                this.data.serverAdvertisement = ping;
                //console.log(this.data.serverAdvertisement)
            });
        })
    }

    sendPacket(packet: DataPacket, priority: Priority = Priority.Normal) {
        const id = packet.getId().toString(16).padStart(2, '0');
        const date = new Date();
        Logger.debug(`Sending a Game PACKET  --> ${packet.getId()}  |  0x${id} ${date.toTimeString().split(' ')[0]}.${date.getMilliseconds().toString().padStart(3, '0')}`);
        const serialized = packet.serialize();

        let framed = Buffer.alloc(0)
        framed = Framer.frame(serialized);

        if(this._encryption){        
            const encryptedFrame = _encryptor.encryptPacket(framed) as Frame;
            // @ts-ignore idk why
            this.raknet.queue.sendFrame(encryptedFrame, priority); 
        } else {
            let payload;
            if (!this.data.sendDeflated) {
                payload = Buffer.concat([Buffer.from([GAME_BYTE]), framed]);
            } else {
                let deflated; 
                if (framed.byteLength > 256) {
                    deflated = Buffer.from([CompressionMethod.Zlib, ...deflateRawSync(framed)]);
                } else {
                    deflated = Buffer.from([CompressionMethod.None, ...framed]);
                }
                payload = Buffer.concat([Buffer.from([GAME_BYTE]), deflated]);
            }
            
            const frame = new Frame();
            frame.reliability = Reliability.ReliableOrdered;
            frame.orderChannel = 0;
            frame.payload = payload;
            // @ts-ignore idk why
            this.raknet.queue.sendFrame(frame, priority);
        }   
    }

    handlePacket(frame: Frame){
        const header = (frame.payload[0] as number);
        switch (header) {
            case GAME_BYTE:
                this.handleGamePacket(frame.payload);
                break;
            default: 
                Logger.debug("Unknown header " + header)
        }
    }

    private async handleGamePacket(buffer: Buffer): Promise<void> {
        let decrypted = buffer.subarray(1);

        if(this._encryption){
            try {decrypted = _encryptor.decryptPacket(decrypted)} catch(error: any) {
                Logger.error(error?.message ?? error)
                return;
            }
        }
        
        const algorithm: CompressionMethod = CompressionMethod[
                decrypted[0] as number
            ] ? decrypted.readUint8()
            : CompressionMethod.NotPresent;

        if (algorithm !== CompressionMethod.NotPresent)
            decrypted = decrypted.subarray(1);
        let inflated: Buffer;

        switch (algorithm) {
            case CompressionMethod.Zlib: {
                inflated = inflateRawSync(decrypted);
                break;
            }
            case CompressionMethod.None:
            case CompressionMethod.NotPresent: {
                inflated = decrypted;
                break;
            }
            default: {
                return console.error(
                    `Received invalid compression algorithm !`,
                    CompressionMethod[algorithm]
                );
            }
        }

        let frames;
        try { frames = Framer.unframe(inflated) }  catch (error) {
            console.log("\n\n\nCAN NOT UNFRAME\n\n\n")
        }       
        if(!frames) {
            Logger.warn("Did not unframe correctly!");
            return;    
        }
        
        for (const frame of frames) {
            const id = getPacketId(frame);
            const packet = Packets[id];
            if(!packet){
                Logger.warn("Packet with ID " + id + " not found");
                continue;
            }
            let instance;
            try {
                instance = new packet(frame).deserialize();     
            } catch(error: any) { 
                Logger.warn(`Offset is out of bounds on packet ${id}!`)
                continue;
            }
            this.emit(Packets[id].name, instance);
        }
    }
 
}
export default Client
