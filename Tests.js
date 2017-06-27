function testStringKeyToArrayBuffer(engine)
{
    let stringKey = '00112233445566778899AABBCCDDEEFF';
    let expectedResult = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);
    let actualResult = CTRCryptoEngine.stringKeyToArrayBuffer(stringKey);
    assertAreSame(expectedResult, actualResult);
}

function testSum(engine)
{
    let a = new Uint8Array([0x97, 0xAB, 0xCE, 0xFD, 0xC8, 0x92, 0x30, 0x12]);
    let b = new Uint8Array([0x12, 0x9E, 0xF0, 0x75, 0xBA, 0xCE, 0xDE, 0x22]);
    let expectedResult = new Uint8Array([0xAA, 0x4A, 0xBF, 0x73, 0x83, 0x61, 0x0E, 0x34]);
    let actualResult = engine.sum(a, b);
    assertAreSame(expectedResult, actualResult);
}

function testAdd(engine)
{
    let a = new Uint8Array([0x97, 0xAB, 0xCE, 0xFD, 0x11, 0x22, 0x33, 0x44]);
    let amount = 0xEEDDCCBB;
    let expectedResult = new Uint8Array([0x97, 0xAB, 0xCE, 0xFD, 0xFF, 0xFF, 0xFF, 0xFF]);
    let actualResult = engine.add(a, amount);
    assertAreSame(expectedResult, actualResult);
}

function testXor(engine)
{
    let a = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F]);
    let b = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);
    let expectedResult = new Uint8Array([0x00, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80, 0x90, 0xA0, 0xB0, 0xC0, 0xD0, 0xE0, 0xF0]);
    let actualResult = engine.xor(a, b);
    assertAreSame(expectedResult, actualResult);
}

function testRotate(engine)
{
    let a = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F]);
    let expectedResult = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x00]);
    let actualResult = engine.rotateLeft(a, 8);
    assertAreSame(expectedResult, actualResult);
}

function testRotate2(engine)
{
    let a = new Uint8Array([0x10, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F]);
    let expectedResult = new Uint8Array([0x00, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80, 0x90, 0xA0, 0xB0, 0xC0, 0xD0, 0xE0, 0xF1]);
    let actualResult = engine.rotateLeft(a, 4);
    assertAreSame(expectedResult, actualResult);
}

function testRotate3(engine)
{
    let a = new Uint8Array([0x10, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F]);
    const bytes = 8;
    const bits = 7;
    let bitwiseResult = engine.rotateLeft(a, bits);
    for (let i = 0; i < 2 * bytes; ++i) {
        bitwiseResult = engine.rotateLeft(bitwiseResult, 4);
    }
    let bytewiseResult = engine.rotateLeft(a, bytes * 8 + bits);
    assertAreSame(bitwiseResult, bytewiseResult);
}


function testScrambler(engine)
{
    let keyX = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F]);
    let keyY = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);
    let normalKeyExpected = new Uint8Array([0x3A, 0x2D, 0x1E, 0x26, 0xA6, 0x90, 0x07, 0x89, 0xF5, 0x0D, 0x1F, 0xC1, 0x39, 0xD5, 0x81, 0x8A]);
    let normalKeyActual = engine.scramble(keyX, keyY);
    assertAreSame(normalKeyActual, normalKeyExpected);
}

function assertAreSame(expected, actual)
{
    for (let i = 0; i < expected.length; ++i) {
        if (actual[i] !== expected[i]) {
            console.warn("Expected:");
            console.log(expected);
            console.warn("Actual:");
            console.log(actual);
            throw Error('Not the same');
        }
    }
}


const secretProvider = new SecretProvider();
secretProvider.getKeyScramblerConstant().then(
    function (c) {
        const engine = new CTRCryptoEngine(CTRCryptoEngine.stringKeyToArrayBuffer(c));

        const testFunctions = [
            testStringKeyToArrayBuffer,
            testSum,
            testAdd,
            testXor,
            testRotate,
            testRotate2,
            testRotate3,
            testScrambler,
        ];
        let testFunctionName = null;
        try {
            for (let testFunction of testFunctions) {
                testFunctionName = testFunction.name;
                testFunction.call(null, engine);
                console.log(testFunctionName + " passed");
            }
        } catch (exception) {
            console.warn(testFunctionName + " failed");
            console.warn(exception);
        }
    }
);