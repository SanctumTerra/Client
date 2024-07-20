import { ServerToClientHandshakePacket } from "@serenityjs/protocol";
import { BaseHandler } from "../BaseHandler";
import { ClientToServerHandshakePacket } from "../../packets/game/ClientToServerHandshakePacket";
import { Priority } from "@serenityjs/raknet";
import { createHash, createPublicKey, ECKeyPairKeyObjectOptions } from "crypto";
import { PacketEncryptor } from "../../packets/PacketEncryptor";
import * as crypto from 'crypto'

class ServerToClientHandshakeHandler extends BaseHandler {
    public name: string = ServerToClientHandshakePacket.name;

    handle(packet: ServerToClientHandshakePacket){
        const jwt = packet.token;

        const [header, payload] = jwt.split('.').map(k => Buffer.from(k, 'base64'));

        const head = JSON.parse(String(header))
        const body = JSON.parse(String(payload))

        const pubKeyDer = createPublicKey({ key: Buffer.from(head.x5u, 'base64'), type: "spki", format: "der" })
        _client.data.sharedSecret = createSharedSecret(_client.data.loginData.ecdhKeyPair.privateKey, pubKeyDer)

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
function createSharedSecret(privateKey: crypto.KeyObject , publicKey: crypto.KeyObject) {
    if (!(privateKey instanceof crypto.KeyObject) || !(publicKey instanceof crypto.KeyObject)) {
      throw new Error('Both privateKey and publicKey must be crypto.KeyObject instances');
    }
    
    if (privateKey.type !== 'private' || publicKey.type !== 'public') {
      throw new Error('Invalid key types. Expected private and public keys.');
    }
    
    if(!privateKey.asymmetricKeyDetails || !privateKey.asymmetricKeyDetails.namedCurve) {
        throw new Error('Invalid private key format. Expected JWK.');
    }

    const curve = privateKey.asymmetricKeyDetails.namedCurve;
    const ecdh = crypto.createECDH(curve);
    const privateKeyJwk = privateKey.export({ format: 'jwk' });
    if(!privateKeyJwk.d) throw new Error("Error ");
    const privateKeyHex = Buffer.from(privateKeyJwk.d, 'base64').toString('hex');
    ecdh.setPrivateKey(privateKeyHex, 'hex');
    const publicKeyJwk = publicKey.export({ format: 'jwk' });
    if(!publicKeyJwk.x || !publicKeyJwk.y) throw new Error("Error ");

    const publicKeyX = Buffer.from(publicKeyJwk.x, 'base64').toString('hex');
    const publicKeyY = Buffer.from(publicKeyJwk.y, 'base64').toString('hex');
    const publicKeyHex = '04' + publicKeyX + publicKeyY;
    return ecdh.computeSecret(publicKeyHex, 'hex');
}


export { ServerToClientHandshakeHandler, createSharedSecret }