import { GAME_BYTE } from "@serenityjs/network";
import { CompressionMethod } from "@serenityjs/protocol";
import { Frame, Reliability } from "@serenityjs/raknet";
import * as crypto from "crypto";
import * as Zlib from "zlib";

class PacketEncryptor {
    public secretKeyBytes: Buffer;
    public compressionThreshold: number;
    public sendCounter: bigint;
    public receiveCounter: bigint;
    public cipher: crypto.Cipher | null;
    public decipher: crypto.Decipher | null;

    constructor(secretKey: Buffer, compressionThreshold = 1) {
        this.secretKeyBytes = Buffer.from(secretKey);
        this.compressionThreshold = compressionThreshold;
        this.sendCounter = 0n;
        this.receiveCounter = 0n;
        this.cipher = null;
        this.decipher = null;

        this.initializeCipher(_client.data.iv);
        this.initializeDecipher(_client.data.iv);
    }

    initializeCipher(iv: Buffer) {
        if(this.cipher) return;
        const cipher = this.createCipher(this.secretKeyBytes, iv.slice(0, 12), 'aes-256-gcm') 
        if (!cipher) {
            throw new Error("Cipher not initialized");
        }
        this.cipher = cipher;
    }
    
    initializeDecipher(iv: Buffer) {
        if(this.decipher) return;
        this.decipher = crypto.createDecipheriv('aes-256-ctr', this.secretKeyBytes, Buffer.concat([iv.slice(0, 12), Buffer.from([0, 0, 0, 2])]));
    }
    
    public createCipher (secret: Buffer, initialValue: Buffer, cipherAlgorithm: string) {
        if (crypto.getCiphers().includes(cipherAlgorithm)) {
          return crypto.createCipheriv(cipherAlgorithm, secret, initialValue)
        }
    }
    
    computeCheckSum(packetPlaintext: Buffer, counter: bigint) {
        const digest = crypto.createHash('sha256');
        const counterBuffer = Buffer.alloc(8);
        counterBuffer.writeBigInt64LE(counter, 0);  
        digest.update(counterBuffer);
        digest.update(packetPlaintext);
        digest.update(this.secretKeyBytes);
        const hash = digest.digest();
        return hash.slice(0, 8);
    }

    encryptPacket(framed: Buffer): Frame {  
        let deflated;
        if (framed.byteLength > this.compressionThreshold) {
            deflated = Buffer.from([CompressionMethod.Zlib, ...Zlib.deflateRawSync(framed)]);
        } else {
            deflated = Buffer.from([CompressionMethod.None, ...framed]);
        }
    
        const checksum = this.computeCheckSum(deflated, this.sendCounter);
    
        const packetToEncrypt = Buffer.concat([deflated, checksum]);
    
        if (!this.cipher) {
            throw new Error("Cipher not initialized");
        }
        const encryptedPayload = this.cipher.update(packetToEncrypt);
    
        this.sendCounter++;
    
        const payload = Buffer.concat([Buffer.from([GAME_BYTE]), encryptedPayload]);
    
        const frame = new Frame();
        frame.reliability = Reliability.ReliableOrdered;
        frame.orderChannel = 0;
        frame.payload = payload;
    
        return frame;
    }

    decryptPacket(encryptedPayload: Buffer): Buffer {

        if (!this.decipher) {
            throw new Error("Decipher not initialized");
        }

        const decrypted = this.decipher.update(encryptedPayload);
        const packet = decrypted.slice(0, decrypted.length - 8);
        const receivedChecksum = decrypted.slice(decrypted.length - 8);

        const computedChecksum = this.computeCheckSum(packet, this.receiveCounter);
        this.receiveCounter++;

        if (!receivedChecksum.equals(computedChecksum)) {
            throw new Error("Checksum mismatch");
        }

        return packet;
    }
}

export { PacketEncryptor }