import { expect } from "chai";
import "mocha";
import sinon from "sinon";
import * as Encryption from "./encryption.service";
import crypto from "crypto";

it("encrypts in a way we can read from", () => {
    // Arrange
    const secretKey = crypto.randomBytes(32).toString('base64');
    const message = "message";
    const messageBuffer = Buffer.from("message", 'utf8');
    const initializationVector = crypto.randomBytes(16);

    // Act
    const encrypted = Encryption.encrypt(messageBuffer, secretKey, initializationVector);

    // Assert
    let iv = initializationVector;
    const algorithm = 'aes-256-cbc';
    const decodedKey = Buffer.from(secretKey, 'base64');
    let decipher = crypto.createDecipheriv(algorithm, decodedKey, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const decryptedMessage = decrypted.toString();
    expect(decryptedMessage).to.equal(message);
});