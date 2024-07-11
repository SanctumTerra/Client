import { ServerToClientHandshakePacket } from "@serenityjs/protocol";
import { BaseHandler } from "../BaseHandler";
import { ClientToServerHandshakePacket } from "../../packets/game/ClientToServerHandshakePacket";
import { Priority } from "@serenityjs/raknet";
import { createHash, createPublicKey, diffieHellman } from "crypto";
import { PacketEncryptor } from "../../packets/PacketEncryptor";

class ServerToClientHandshakeHandler extends BaseHandler {
    public name: string = ServerToClientHandshakePacket.name;

    handle(packet: ServerToClientHandshakePacket){
        const jwt = packet.token;

        const [header, payload] = jwt.split('.').map(k => Buffer.from(k, 'base64'));

        const head = JSON.parse(String(header))
        const body = JSON.parse(String(payload))

        const pubKeyDer = createPublicKey({ key: Buffer.from(head.x5u, 'base64'), type: "spki", format: "der" })
        _client.data.sharedSecret = diffieHellman({ privateKey: _client.data.loginData.ecdhKeyPair.privateKey, publicKey: pubKeyDer })

        const salt = Buffer.from(body.salt, 'base64')
        const secretHash = createHash('sha256')
        secretHash.update(salt)
        secretHash.update(_client.data.sharedSecret)

        _client.data.secretKeyBytes = secretHash.digest()

        const iv = _client.data.secretKeyBytes.slice(0, 16)
        _client.data.iv = iv;
        if(!globalThis._encryptor) globalThis._encryptor = new PacketEncryptor(_client.data.secretKeyBytes);
        _client._encryption = true;

        const handshake = new ClientToServerHandshakePacket();
        _client.sendPacket(handshake, Priority.Immediate);
    }

}  

export { ServerToClientHandshakeHandler }