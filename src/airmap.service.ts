import request, { Options } from "request-promise";
import * as config from "./airmap.config.json";
// anonymous user (returns JWT)

export async function getToken(apiKey: string, userId: string): Promise<string> {
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

export async function getAccessTokenFromUsernameAndPassword() {

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

export async function getPilotId(accessToken: string): Promise<string> {
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

export async function createPlan(apiKey: string, token: string, pilotId: string): Promise<string> {
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

export async function submitPlan(apiKey: string, token: string, planId: string): Promise<string> {
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

export async function startComm(apiKey: string, token: string, flightId: string) {
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

export async function endComm(apiKey: string, token: string, flightId: string) {
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

export async function endFlight(apiKey: string, token: string, flightId: string) {
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