import * as dgram from "dgram";
import moment from "moment";
import request, { Options } from "request-promise";
import * as config from "./airmap.config.json";
import jwt from "jsonwebtoken";
import { encodeProtoBuf } from "./protobuf-encoder.service";
import { TextDecoder } from "util";
import { IPosition } from "./position.interface";
import * as Encryption from "./encryption.service";

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

// anonymous user (returns JWT)

async function getToken(apiKey: string, userId: string): Promise<string> {
    const options: Options = {
        method: 'POST',
        url: `https://api.airmap.com/auth/v1/anonymous/token`,
        json: true,
        headers: {
            "X-API-Key": apiKey
        },
        body: {
            "user_id": userId
        }
    }

    //If that doesn't work, try to get access token using username + password
    const credentials = await request(options).catch(err => {
        console.log("error getting token", err);
    });
    console.log("Credentials", credentials);
    const token = credentials?.data?.id_token as string;
    return token;
}

async function getAccessTokenFromUsernameAndPassword() {

    const options: Options = {
        method: 'POST',
        headers: {
            "X-API-Key": config.apiKey
        },
        url: `https://sso.airmap.io/oauth/ro`,
        json: true,
        body: {

            "grant_type": "password",
            "client_id": config.clientId,
            "connection": "Username-Password-Authentication",
            "username": config.username,
            "password": config.password,
            "scope": "openid offline_access",
            "device": ""
        }
    }

    //If that doesn't work, try to get access token using username + password
    const credentials = await request(options).catch(err => {
        console.log("error getting new access token using username & password", err);
    });

    return credentials;
}

async function getPilotId(accessToken: string): Promise<string> {
    console.log("AirmapService.getPilotId Started");
    const options: Options = {
        method: 'GET',
        url: `https://api.airmap.com/pilot/v2/profile`,
        json: true,
        headers: {
            'X-API-Key': config.apiKey,
            'Authorization': `Bearer ${accessToken}`
        }
    };

    const pilotProfileResponse: any = await request(options);
    console.log(`Airmap Pilot Response:`);
    console.log(pilotProfileResponse);

    const id: string = pilotProfileResponse.data.id;
    console.log("AirmapService.getPilotId Ended");
    return id;
}

// create plan (returns planId)

async function createPlan(apiKey: string, token: string, pilotId: string): Promise<string> {
    const options: Options = {
        method: 'POST',
        url: 'https://api.airmap.com/flight/v2/plan',
        json: true,
        headers: {
            "X-API-Key": apiKey,
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json; charset=utf-8"
        },
        body: {
            "takeoff_latitude": 49.45505651142062,
            "takeoff_longitude": -2.37099075317383,
            "pilot_id": pilotId,
            "start_time": "now",
            "end_time": "now",
            "max_altitude_agl": 100,
            "buffer": 1,
            "geometry": {
                "type": "Polygon", "coordinates": [[[-2.37099075317383, 49.45505651142062], [-2.37305068969727, 49.45502978214579], [
                    -2.37347984313963, 49.454673391015496], [-2.37306141853333, 49.45231226221667], [-2.37193489074707, 49.45174201755203], [-2.36997151374815, 49.45176874785573], [
                    -2.36995005607605, 49.4528112231754], [-2.37099075317383, 49.45505651142062]]]
            }
        }
    }

    const plan = await request(options).catch(err => {
        console.log("error creating plan", err);
    });
    console.log("Created Plan", plan);
    return plan?.data?.id;
}

// submit plan (returns flightId)

async function submitPlan(apiKey: string, token: string, planId: string): Promise<string> {
    const options: Options = {
        method: 'POST',
        json: true,
        url: `https://api.airmap.com/flight/v2/plan/${planId}/submit`,
        headers: {
            "X-API-Key": apiKey,
            "Authorization": `Bearer ${token}`
        }
    }

    const plan = await request(options).catch(err => {
        console.log("error submitting plan", err);
    });
    console.log("Submitted Plan", plan);
    const flightId = plan?.data?.flight_id;
    return flightId;
}

// start comm (returns secretKey)

async function startComm(apiKey: string, token: string, flightId: string) {
    const options: Options = {
        method: 'POST',
        json: true,
        url: `https://api.airmap.com/flight/v2/${flightId}/start-comm`,
        headers: {
            "X-API-Key": apiKey,
            "Authorization": `Bearer ${token}`
        }
    }
    const comm = await request(options).catch(err => {
        console.log("error starting comm", err);
    });
    console.log("Comm Started", comm);
    const key = comm?.data?.key;
    return key;
}

// end comm (returns 0)

async function endComm(apiKey: string, token: string, flightId: string) {
    const options: Options = {
        method: 'POST',
        json: true,
        url: `https://api.airmap.com/flight/v2/${flightId}/end-comm`,
        headers: {
            "X-API-Key": apiKey,
            "Authorization": `Bearer ${token}`
        }
    }
    const comm = await request(options).catch(err => {
        console.log("error ending comm", err);
    });
    console.log("Comm Ended", comm);
    return comm;
}

// end flight (returns 0)

async function endFlight(apiKey: string, token: string, flightId: string) {
    const options: Options = {
        method: 'POST',
        url: `https://api.airmap.com/flight/v2/${flightId}/end`,
        headers: {
            "X-API-Key": apiKey,
            "Authorization": `Bearer ${token}`
        }
    }
    const flight = await request(options).catch(err => {
        console.log("error ending flight", err);
    });
    console.log("Flight Ended", flight);
    return flight;
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function init() {
    try {

        // get token
        const jwtResponse = await getAccessTokenFromUsernameAndPassword();
        if (!jwtResponse) {
            throw Error("Error with authentication");
        }
        console.log("JWT", jwtResponse);

        // get pilot id
        const pilotId = await getPilotId(jwtResponse);
        console.log("pilotId", pilotId);

        // create flight plan
        const planId = await createPlan(config.apiKey, jwtResponse, pilotId);
        console.log("planId", planId);
        if (!planId) {
            throw Error("Error creating plan");
        }

        // submit flight plan
        const flightId = await submitPlan(config.apiKey, jwtResponse, planId);
        console.log("flightId", flightId);
        if (!flightId) {
            throw Error("Error creating flight");
        }

        // start comms
        const secretKey = await startComm(config.apiKey, jwtResponse, flightId);
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
        // const attitude: any = {};
        // const speed: any = {};
        // const barometer: any = {};

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

                // attitude.timestamp = timestamp;
                // attitude.yaw = sim.getYaw();
                // attitude.pitch = sim.getPitch();
                // attitude.roll = sim.getRoll();

                // speed.timestamp = timestamp;
                // speed.velocity_x = sim.getVelocityX();
                // speed.velocity_y = sim.getVelocityY();
                // speed.velocity_z = sim.getVelocityZ();

                // barometer.timestamp = timestamp;
                // barometer.pressure = sim.getPressure();

                // build payload

                /* PACKAGE HEADER */
                // 1 Add serial number (start at one): uint32, 4 bytes
                const serialNumberBuffer = Buffer.alloc(4);
                serialNumberBuffer.writeUInt32BE(counter);

                // 2 Add length of flight id: uint8, 1 bytes
                const flightIdLength = flightId.length;
                const flightIdLengthBuffer = Buffer.alloc(1);
                flightIdLengthBuffer.writeInt8(flightIdLength);

                // 3 Flight ID (added later)

                // 4 Add Encryption type: uint8, 1 bytes (currently only 'aes-256-cbc' is supported; 1 is the appropriate value here)
                const encryptionTypeBuffer = Buffer.alloc(1);
                const encryptionType = 1; //Special value for airmap
                encryptionTypeBuffer.writeUInt8(encryptionType);

                // 5 Add Initialization Vector: raw, 16 bytes
                const initializationVector = Encryption.getInitializationVector();
                console.log("Initialization Vector", initializationVector);

                // 6 Payload (added later)

                /* Message Header */
                // 7 Add Message Type ID: uint16, 2 bytes
                const messageTypeIdBuffer = Buffer.alloc(2);
                const positionMessageTypeId = 1;
                messageTypeIdBuffer.writeUInt16BE(positionMessageTypeId);

                // Add Message (aka payload): Serialized protocol buffer (protobuf)
                const positionPayload = await encodeProtoBuf("./dist/telemetry.proto", "airmap.telemetry.Position", position);
                const positionPayloadBuffer = Buffer.from(positionPayload);

                // encrypt payload
                const payloadEncrypted = Encryption.encrypt(positionPayloadBuffer, secretKey, initializationVector);

                // Add serialized message length (max is 64kb): uint 16, 2 bytes
                const messageLengthBuffer = Buffer.alloc(2);
                messageLengthBuffer.writeUInt16BE(payloadEncrypted.byteLength);


                // const attitudePayload = await encodeProtoBuf("./telemetry.proto", "airmap.telemetry.Attitude", attitude);

                // const speedPayload = await encodeProtoBuf("./telemetry.proto", "airmap.telemetry.Speed", speed);

                // const barometerPayload = await encodeProtoBuf("./telemetry.proto", "airmap.telemetry.Barometer", barometer);


                console.log("Message:", position);
                console.log("Encoded Message:", positionPayloadBuffer);
                console.log("Message Encrypted:", payloadEncrypted);
                console.log("Message Encrypted Length:", payloadEncrypted);
                const payload = [
                    serialNumberBuffer,
                    flightIdLengthBuffer,
                    flightId,
                    encryptionTypeBuffer,
                    initializationVector,
                    messageTypeIdBuffer,
                    messageLengthBuffer,
                    payloadEncrypted,
                ]
                client.send(payload, portNumber, hostname, (err: any, bytes: any) => {
                    if (err) {
                        console.log("Error sending payload", err);
                    }
                    console.log("Bytes sent", bytes);
                });

                // increment sequence number
                counter += 1;

                // wait to send next message (5 hz)
                const milliseconds = 200;
                await sleep(milliseconds);
                console.log("Sleeping before sending next message");
            }
        }
        catch (e) {
            console.log("Error sending telemetry", e);
        }
        client.close();
        await endComm(config.apiKey, jwtResponse, flightId);
        await endFlight(config.apiKey, jwtResponse, flightId);
    }
    catch (e) {
        console.log("Error", e);
    }

}

// Call the init function automatically and let's get this party started

init();