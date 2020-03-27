import * as crypto from "crypto";

export function encrypt(value: string, key: Buffer, initializationVector: Buffer) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), initializationVector);
    let encrypted = cipher.update(value);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted;
}

export function getInitializationVector() {
    const initializationVector = crypto.randomBytes(16).toString('utf-8');
    return initializationVector;
}