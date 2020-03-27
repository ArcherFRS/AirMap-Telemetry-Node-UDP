import * as dgram from "dgram";
import moment from "moment";
import * as config from "./airmap.config.json";
import { encodeProtoBuf } from "./protobuf-encoder.service";
import { IPosition } from "./position.interface";
import * as Encryption from "./encryption.service";
import * as AirMapService from "./airmap.service";
import { access } from "fs";

//  simple sawtooth wave simulation

class Simulator {
    public position: IPosition = {
        latitude: 49.444126,
        longitude: -2.359227,
        altitude_agl: 0.0,
        altitude_msl: 0.0,
        horizontal_accuracy: 0.0,
        timestamp: 0
    }
    public yaw = 0.0;
    public pitch = -90.0;
    public roll = -90.0;
    public velocity_x = 10.0;
    public velocity_y = 10.0;
    public velocity_z = 10.0;
    public pressure = 1012.0;

    public update(val: number, dt: number, mx: number, initval: number) {
        val = val + dt;
        if (val > mx) {
            val = initval;
        }
        return val;
    }

    public getTimestamp() {
        // Plus is unary to convert string to number
        const d = +moment().format('x');
        return d;
    }

    public getLatitude() {
        this.position.latitude = this.update(this.position.latitude, 0.002, 49.444, 49.450);
        return this.position.latitude;
    }

    public getLongitude() {
        this.position.longitude = this.update(this.position.longitude, 0.002, -2.359, -2.366);
        return this.position.longitude;
    }

    public getAgl() {
        this.position.altitude_agl = this.update(this.position.altitude_agl, 1.0, 100.0, 0.0);
        return this.position.altitude_agl;
    }

    public getMsl() {
        this.position.altitude_msl = this.update(this.position.altitude_msl, 1.0, 100.0, 0.0);
        return this.position.altitude_msl;
    }

    public getHorizAccuracy() {
        this.position.horizontal_accuracy = this.update(this.position.horizontal_accuracy, 1.0, 10.0, 0.0);
        return this.position.horizontal_accuracy;
    }

    public getYaw() {
        this.yaw = this.update(this.yaw, 1, 360, 0);
        return this.yaw;
    }

    public getPitch() {
        this.pitch = this.update(this.pitch, 1, 90, -90);
        return this.pitch;
    }

    public getRoll() {
        this.roll = this.update(this.roll, 1, 90, -90);
        return this.roll;
    }

    public getVelocityX() {
        this.velocity_x = this.update(this.velocity_x, 1, 100, 10);
        return this.velocity_x;
    }

    public getVelocityY() {
        this.velocity_y = this.update(this.velocity_y, 1, 100, 10);
        return this.velocity_y;
    }

    public getVelocityZ() {
        this.velocity_z = this.update(this.velocity_z, 1, 100, 10);
        return this.velocity_z;
    }

    public getPressure() {
        this.pressure = this.update(this.pressure, 1, 1013, 1012);
        return this.pressure;
    }
}


function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function init() {
    try {

        // get token
        const jwtResponse = await AirMapService.getAccessTokenFromUsernameAndPassword();
        if (!jwtResponse) {
            throw Error("Error with authentication");
        }
        console.log("JWT", jwtResponse);
        const accessToken = jwtResponse.access_token;

        // get pilot id
        const pilotId = await AirMapService.getPilotId(accessToken);
        console.log("pilotId", pilotId);

        // create flight plan
        const planId = await AirMapService.createPlan(config.apiKey, accessToken, pilotId);
        console.log("planId", planId);
        if (!planId) {
            throw Error("Error creating plan");
        }

        // submit flight plan
        const flightId = await AirMapService.submitPlan(config.apiKey, accessToken, planId);
        console.log("flightId", flightId);
        if (!flightId) {
            throw Error("Error creating flight");
        }

        // start comms
        const secretKey = await AirMapService.startComm(config.apiKey, accessToken, flightId);
        console.log("secretKey", secretKey);
        if (!secretKey) {
            throw Error("Error starting communication");
        }

        // messages
        const position: IPosition = {
            timestamp: 0,
            latitude: 0,
            longitude: 0,
            altitude_agl: 0,
            altitude_msl: 0,
            horizontal_accuracy: 0
        }

        const sim = new Simulator();
        const client = dgram.createSocket("udp4");
        const hostname = 'telemetry.airmap.com';
        const portNumber = 16060;

        let counter = 1;

        try {
            // send 100 messages at 5Hz

            for (let i = 0; i < 100; i++) {
                const timestamp = sim.getTimestamp();
                position.timestamp = timestamp;
                position.latitude = sim.getLatitude();
                position.longitude = sim.getLongitude();
                position.altitude_agl = sim.getAgl();
                position.altitude_msl = sim.getMsl();
                position.horizontal_accuracy = sim.getHorizAccuracy();

                // build payload

                /* PACKAGE HEADER */
                // 1 Add serial number (start at one): uint32, 4 bytes
                const serialNumberBuffer = Buffer.alloc(4);
                const serialNumber = counter;
                serialNumberBuffer.writeUInt32BE(serialNumber);

                // 2 Add length of flight id: uint8, 1 bytes
                const flightIdLength = Buffer.byteLength(flightId, 'utf8')
                const flightIdLengthBuffer = Buffer.alloc(1);
                flightIdLengthBuffer.writeInt8(flightIdLength);

                // 3 Flight ID
                const flightIdMessage = flightId;

                // 4 Add Encryption type: uint8, 1 bytes (currently only 'aes-256-cbc' is supported; 1 is the appropriate value here)
                const encryptionTypeBuffer = Buffer.alloc(1);
                const encryptionType = 1; //Special value for airmap
                encryptionTypeBuffer.writeUInt8(encryptionType);

                // 5 Add Initialization Vector: raw, 16 bytes
                const initializationVector = Encryption.getInitializationVector();
                console.log("Initialization Vector", initializationVector);

                /* Message Header */
                // 6 Add Message Type ID: uint16, 2 bytes
                const messageTypeIdBuffer = Buffer.alloc(2);
                const positionMessageTypeId = 1;
                messageTypeIdBuffer.writeUInt16BE(positionMessageTypeId);

                // 8 Create Message (aka payload): Serialized protocol buffer (protobuf)
                const positionPayloadBuffer = await encodeProtoBuf("./dist/telemetry.proto", "airmap.telemetry.Position", position);

                // 7 Add serialized message length (max is 64kb): uint 16, 2 bytes
                const messageLengthBuffer = Buffer.alloc(2);
                const messageLength = positionPayloadBuffer.byteLength;
                messageLengthBuffer.writeUInt16BE(messageLength);

                // Encrypt Payload
                const messageToBeEncrypted = Buffer.concat([messageTypeIdBuffer, messageTypeIdBuffer, positionPayloadBuffer]);
                const payloadEncryptedBuffer = Encryption.encrypt(messageToBeEncrypted, secretKey, initializationVector);

                //AIRMAP QUESTION: Will this array of mixed Buffers and Strings be able to be understood and parsed by the UDP server?
                const payload = [
                    serialNumberBuffer,
                    flightIdLengthBuffer,
                    flightIdMessage,
                    encryptionTypeBuffer,
                    initializationVector,
                    payloadEncryptedBuffer
                ];

                const rawData = [
                    serialNumber,
                    flightIdLength,
                    flightIdMessage,
                    encryptionType,
                    initializationVector,
                    positionMessageTypeId,
                    messageLength,
                    position
                ]

                console.log("Data", rawData);
                console.log("Payload", payload);
                client.send(payload, portNumber, hostname, (err: any, bytes: any) => {
                    if (err) {
                        console.log("Error sending payload", err);
                    }
                    console.log("Bytes sent", bytes);
                });

                // increment sequence number
                counter += 1;

                // wait to send next message (5 hz)
                const milliseconds = 1000;
                await sleep(milliseconds);
                console.log("Sleeping before sending next message");
            }
        }
        catch (e) {
            console.log("Error sending telemetry", e);
        }
        client.close();
        await AirMapService.endComm(config.apiKey, accessToken, flightId);
        await AirMapService.endFlight(config.apiKey, accessToken, flightId);
    }
    catch (e) {
        console.log("Error", e);
    }

}

// Call the init function automatically and let's get this party started

init();