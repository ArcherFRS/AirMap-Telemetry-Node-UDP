import { expect } from "chai";
import "mocha";
import sinon from "sinon";
import { IPosition } from "./position.interface";
import { encodeProtoBuf } from "./protobuf-encoder.service";

describe("Protobuf Encoder Service", () => {
    it("encodes position object to a string", async () => {
        // Arrange
        // // const position: IPosition = {
        // //     timestamp: 1585149313098,
        // //     latitude: 34.017802,
        // //     longitude: -118.449303,
        // //     altitude_agl: 1.0,
        // //     altitude_msl: 1.0,
        // //     horizontal_accuracy: 1.0
        // // }
        // const position: IPosition = {
        //     timestamp: 1,
        //     latitude: 1.1,
        //     longitude: 1.1,
        //     altitude_agl: 1.100000023841858,
        //     altitude_msl: 1.100000023841858,
        //     horizontal_accuracy: 1.100000023841858
        // }

        // // Assert
        // const result = await encodeProtoBuf("./dist/telemetry.proto", "airmap.telemetry.Position", position);
        // console.log("result", result);

        // // const bytestringExpected = 'b'\x08\x01\x11\x9a\x99\x99\x99\x99\x99\xf1?\x19\x9a\x99\x99\x99\x99\x99\xf1?%\xcd\xcc\x8c?-\xcd\xcc\x8c?5\xcd\xcc\x8c?''
        // // const byteStringExpected: ["08", "01", "11", "9a", "99", "99", "99", "99", "99", "3f", "19", "9a", "99", "99", "99", "99", "99", "f1", "3f"]
        // expect(result).to.equal("\x08\x01\x11\x9a\x99\x99\x99\x99\x99\xf1?\x19\x9a\x99\x99\x99\x99\x99\xf1?%\xcd\xcc\x8c?-\xcd\xcc\x8c?5\xcd\xcc\x8c?");

    });
});