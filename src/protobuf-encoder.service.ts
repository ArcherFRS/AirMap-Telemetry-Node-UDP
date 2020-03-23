import * as protobuf from "protobufjs";

export function encodeProtoBuf(file: string, proto: string, payload: any) {
    protobuf.load(file).then((root) => {
        const awesomeMessage = root?.lookupType(proto);
        if (!awesomeMessage) {
            throw Error("message not found in root lookup type in encodeProtoBuf");
        }

        const errMsg = awesomeMessage.verify(payload);
        if (errMsg) {
            throw Error(errMsg);
        }

        const message = awesomeMessage.create(payload);
        const buffer = awesomeMessage.encode(message).finish();
        return buffer;
    }).catch(error => {
        console.log("Error encoding protobuf");
    });
}