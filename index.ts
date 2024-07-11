import "reflect-metadata"
import Client from "./src/Client";
import { authenticate } from "./src/client/auth/Auth";
import { ClientData } from "./src/client/ClientData";
import { defaultOptions, Options } from "./src/client/ClientOptions";
import { BaseHandler, PacketHandler } from "./src/client/handlers";
import { ClientToServerHandshakePacket } from "./src/client/packets/game/ClientToServerHandshakePacket";
import { LoginPacket } from "./src/client/packets/game/LoginPacket";
import { PacketEncryptor } from "./src/client/packets/PacketEncryptor";
import { Proto } from "./src/client/packets/proto";
import { Serialize } from "./src/client/packets/serialize";
import Skin from "./src/client/skin/Skin.json";
import { Logger } from "./src/utils/Logger"

export {
    authenticate,
    ClientData,
    defaultOptions,
    Options,
    BaseHandler,
    PacketHandler,
    ClientToServerHandshakePacket,
    LoginPacket,
    PacketEncryptor,
    Proto,
    Serialize,
    Skin,
    Logger,
    Client
}