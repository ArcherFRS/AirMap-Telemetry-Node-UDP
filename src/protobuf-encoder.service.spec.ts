import { expect } from "chai";
import "mocha";
import sinon from "sinon";
import { IPosition } from "./position.interface";
import { encodeProtoBuf } from "./protobuf-encoder.service";
require("google-closure-library");
declare var goog: any;
goog.require("goog.crypt.Sha1");
describe("Protobuf Encoder Service", () => {
    it("encodes position object to a string", async () => {
        // Arrange
        // const position: IPosition = {
        //     timestamp: 1585149313098,
        //     latitude: 34.017802,
        //     longitude: -118.449303,
        //     altitude_agl: 1.0,
        //     altitude_msl: 1.0,
        //     horizontal_accuracy: 1.0
        // }
        const position: IPosition = {
            timestamp: 1,
            latitude: 1,
            longitude: 1,
            altitude_agl: 1,
            altitude_msl: 1,
            horizontal_accuracy: 1
        }

        // Act

        // Assert
        const result = await encodeProtoBuf("./dist/telemetry.proto", "airmap.telemetry.Position", position);
        console.log("result", result);
        // const bytestringExpected = 'b'\x00\x01\x00#\x08\x01\x11\x00\x00\x00\x00\x00\x00\xf0?\x19\x00\x00\x00\x00\x00\x00\xf0?%\x00\x00\x80?-\x00\x00\x80?5\x00\x00\x80?\x00\x02\x00\x16\x08\xf9\xef\x87\x9b\x91.\x15\x00\x00\x80?\x1d\x00\x00\xb2\xc2%\x00\x00\xb2\xc2\x00\x03\x00\x16\x08\xf9\xef\x87\x9b\x91.\x15\x00\x000A\x1d\x00\x000A%\x00\x000A\x00\x04\x00\x0c\x08\xf9\xef\x87\x9b\x91.\x15f\x06}D\x05\x05\x05\x05\x05'
        expect(0).to.equal(1);

    });
});