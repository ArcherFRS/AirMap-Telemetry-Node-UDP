import * as dgram from "dgram";
import moment from "moment";
import request, { Options } from "request-promise";
import * as config from "./airmap.config.json";
import jwt from "jsonwebtoken";
import { encodeProtoBuf } from "./protobuf-encoder.service";

//  simple sawtooth wave simulation

class Simulator {
    public lat = 34.015802;
    public lon = -118.451303;
    public agl = 0.0;
    public msl = 0.0;
    public horizAccuracy = 0.0;
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
        this.lat = this.update(this.lat, 0.002, 34.02, 34.015802);
        return this.lat;
    }

    public getLongitude() {
        this.lon = this.update(this.lon, 0.002, -118.44, -118.451303);
        return this.lon;
    }

    public getAgl() {
        this.agl = this.update(this.agl, 1.0, 100.0, 0.0);
        return this.agl;
    }

    public getMsl() {
        this.msl = this.update(this.msl, 1.0, 100.0, 0.0);
        return this.msl;
    }

    public getHorizAccuracy() {
        this.horizAccuracy = this.update(this.horizAccuracy, 1.0, 10.0, 0.0);
        return this.horizAccuracy;
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

async function getToken(apiKey: string, userId: string) {
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
    return credentials;
}

// create plan (returns planId)

async function createPlan(apiKey: string, token: string, pilotId: string) {
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
            "takeoff_latitude": 33.85505651142062,
            "takeoff_longitude": -118.37099075317383,
            "pilot_id": pilotId,
            "start_time": "now",
            "end_time": "now",
            "max_altitude_agl": 100,
            "buffer": 1,
            "geometry": {
                "type": "Polygon", "coordinates": [[[-118.37099075317383, 33.85505651142062], [-118.37305068969727, 33.85502978214579], [
                    -118.37347984313963, 33.854673391015496], [-118.37306141853333, 33.85231226221667], [-118.37193489074707, 33.85174201755203], [-118.36997151374815, 33.85176874785573], [
                    -118.36995005607605, 33.8528112231754], [-118.37099075317383, 33.85505651142062]]]
            }
        }
    }

    const plan = await request(options).catch(err => {
        console.log("error creating plan", err);
    });
    console.log("Created Plan", plan);
    return plan;
}

// submit plan (returns flightId)

async function submitPlan(apiKey: string, token: string, planId: string) {
    const options: Options = {
        method: 'POST',
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
    return plan;
}

// start comm (returns secretKey)

async function startComm(apiKey: string, token: string, flightId: string) {
    const options: Options = {
        method: 'POST',
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
    return comm;
}

// end comm (returns 0)

async function EndComm(apiKey: string, token: string, flightId: string) {
    const options: Options = {
        method: 'POST',
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

async function EndFlight(apiKey: string, token: string, flightId: string) {
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
        const jwtResponse = await getToken(config.apiKey, config.username);
        if (!jwtResponse) {
            throw Error("Error with authentication");
        }
        console.log("JWT", jwtResponse);

        // get pilot id
        const decoded = jwt.decode(jwtResponse);
        console.log("Decoded JWT", decoded);
        const pilotId = decoded?.sub;

        // create flight plan
        const planId = await createPlan(config.apiKey, jwtResponse, pilotId);
        if (!planId) {
            throw Error("Error creating plan");
        }

        // submit flight plan
        const flightId = await submitPlan(config.apiKey, jwtResponse, planId);
        if (!flightId) {
            throw Error("Error creating flight");
        }

        // start comms
        const secretKey = await startComm(config.apiKey, jwtResponse, flightId);
        if (!secretKey) {
            throw Error("Error starting communication");
        }

        // decode key
        const buffer = new Buffer(secretKey, 'base64');
        const secretKeyDecoded = buffer.toString('ascii');

        // messages
        const position: any = {};
        const attitude: any = {};
        const speed: any = {};
        const barometer: any = {};

        const sim = new Simulator();
        const client = dgram.createSocket("udp4");
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

                attitude.timestamp = timestamp;
                attitude.yaw = sim.getYaw();
                attitude.pitch = sim.getPitch();
                attitude.roll = sim.getRoll();

                speed.timestamp = timestamp;
                speed.velocity_x = sim.getVelocityX();
                speed.velocity_y = sim.getVelocityY();
                speed.velocity_z = sim.getVelocityZ();

                barometer.timestamp = timestamp;
                barometer.pressure = sim.getPressure();

                // build payload

                const positionPayload = encodeProtoBuf("telemetry.proto", "airmap.telemetry.Position", position);

                const attitudePayload = encodeProtoBuf("telemetry.proto", "airmap.telemetry.Attitude", attitude);

                const speedPayload = encodeProtoBuf("telemetry.proto", "airmap.telemetry.Speed", speed);

                const barometerPayload = encodeProtoBuf("telemetry.proto", "airmap.telemetry.Barometer", barometer);

                // encrypt payload
                const hostname = 'telemetry.airmap.com';
                const portNumber = 16060;

                client.connect(portNumber, hostname, () => {
                    client.send([positionPayload, attitudePayload, speedPayload, barometerPayload], portNumber, (err, bytes) => {
                        if (err) {
                            console.log("Error sending payload", err);
                        }
                        console.log("Bytes sent", bytes);
                    });
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
    }
    catch (e) {
        console.log("Error", e);
    }

}

// Call the init function automatically and let's get this party started

init();