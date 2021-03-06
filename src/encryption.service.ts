import * as crypto from "crypto";

export function encrypt(value: Uint8Array, base64EncodedKey: string, initializationVector: Buffer) {
    const decodedKey = decodeKey(base64EncodedKey);
    let cipher = crypto.createCipheriv('aes-256-cbc', decodedKey, initializationVector);
    let encrypted = cipher.update(value);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted;
}

export function getInitializationVector(): Buffer {
    const initializationVector = crypto.randomBytes(16);
    return initializationVector;
}

export function decodeKey(base64EncodedKey: string): Buffer {
    const decoded = Buffer.from(base64EncodedKey, 'base64');
    return decoded;
}