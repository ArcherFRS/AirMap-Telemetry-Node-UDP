import { expect } from "chai";
import "mocha";
import sinon from "sinon";
import * as Encryption from "./encryption.service";
import crypto from "crypto";

it("encrypts in a way we can read from", () => {
    // Arrange
    const secretKey = crypto.randomBytes(32);
    const message = "message";
    const initializationVector = crypto.randomBytes(16);
    const algorithm = 'aes-256-cbc';
    // Act
    const encrypted = Encryption.encrypt(message, secretKey, initializationVector);

    // Assert
    let iv = Buffer.from(initializationVector);
    let encryptedText = Buffer.from(encrypted);
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const decryptedMessage = decrypted.toString();
    expect(decryptedMessage).to.equal(message);
});