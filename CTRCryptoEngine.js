"use strict";

class CTRCryptoEngine
{
    constructor(c)
    {
        this.c = c;
        this.keySlotsX = [];
        this.keySlotsY = [];
    }

    /**
     * @param {string} key
     * @returns {Uint8Array}
     */
    static stringKeyToArrayBuffer(key)
    {
        const hexByteStrings = key.match(/[0-9A-Fa-f]{2}/g);
        const hexByteNumbers = hexByteStrings.map(
            function (element) {
                return parseInt(element, 16);
            }
        );

        return new Uint8Array(hexByteNumbers);
    }


    /**
     * @param {number} slot
     * @param {Uint8Array} keyX
     */
    writeKeySlotX(slot, keyX)
    {
        this.assertProperKeyLength(keyX);
        this.keySlotsX[slot] = keyX;
    }

    /**
     * @param {number} slot
     * @param {Uint8Array} keyY
     */
    writeKeySlotY(slot, keyY)
    {
        this.assertProperKeyLength(keyY);
        this.keySlotsY[slot] = keyY;
    }

    /**
     * @param {Uint8Array} data
     * @param {number} keySlot
     * @param {Uint8Array} counter
     * @param {function} callback
     */
    decrypt(data, keySlot, counter, callback)
    {
        let keyX = this.keySlotsX[keySlot];
        let keyY = this.keySlotsY[keySlot];
        let normalKey = this.scramble(keyX, keyY);

        crypto.subtle.importKey(
            'raw',
            normalKey,
            'AES-CTR',
            false,
            ['encrypt', 'decrypt']
        ).then(
            function (key) {
                return crypto.subtle.decrypt(
                    {
                        name: "AES-CTR",
                        counter: counter,
                        length: counter.byteLength * 8
                    },
                    key,
                    data.buffer
                )
            }
        ).then(
            callback
        ).catch(
            function (err) {
                console.error(err);
            }
        );
    }

    /**
     * KeyScrambler Function: F(KeyX, KeyY) = (((KeyX <<< 2) ^ KeyY) + c) <<< 87
     *
     * @param {Uint8Array} keyX
     * @param {Uint8Array} keyY
     * @returns {Uint8Array}
     */
    scramble(keyX, keyY)
    {
        return this.rotateLeft(this.sum(this.xor(this.rotateLeft(keyX, 2), keyY), this.c), 87);
    }

    /**
     * @param {Uint8Array} x
     * @param {Uint8Array} y
     */
    assertSameLength(x, y)
    {
        if (x.length !== y.length) {
            throw Error('Inputs must have same length');
        }
    }

    /**
     * @param {Uint8Array} key
     */
    assertProperKeyLength(key)
    {
        if (key.byteLength !== 16) {
            throw Error('Key is not of size 16');
        }
    }

    /**
     * @param {Uint8Array} x
     * @param {Uint8Array} y
     * @returns {Uint8Array}
     */
    sum(x, y)
    {
        this.assertSameLength(x, y);
        const len = x.length;
        let result = new Uint8Array(len);
        let carry = 0;
        for (let i = len - 1; i >= 0; --i) {
            let sum = x[i] + y[i];
            result[i] = sum + carry;
            carry = sum >> 8;
        }

        return result;
    }

    /**
     * @param {Uint8Array} x
     * @param {number} amount
     * @returns {Uint8Array}
     */
    add(x, amount)
    {
        const amountAsBuffer = new Uint8Array(x.length);
        const dataView = new DataView(amountAsBuffer.buffer);
        dataView.setUint32(amountAsBuffer.length - 4, amount, false);

        return this.sum(x, amountAsBuffer);
    }

    /**
     * @param {Uint8Array} x
     * @param {Uint8Array} y
     * @returns {Uint8Array}
     */
    xor(x, y)
    {
        this.assertSameLength(x, y);
        const result = new Uint8Array(x.length);
        for (let i = 0; i < x.length; ++i) {
            result[i] = x[i] ^ y[i];
        }

        return result;
    }

    /**
     * @param {Uint8Array} array
     * @param {number} bits
     * @returns {Uint8Array}
     */
    rotateLeft(array, bits)
    {
        if (bits < 0) {
            throw Error('Shift amount must not be negative');
        }

        const bitAmount = bits % 8;
        const byteAmount = (bits - bitAmount) / 8;

        const byteRotated = new Uint8Array(array.length);
        for (let i = 0; i < byteRotated.length; ++i) {
            let newPosition = this.mod(i - byteAmount, array.length);
            byteRotated[newPosition] = array[i];
        }

        let mask = 0x00;
        for (let i = 0; i < bitAmount; ++i) {
            mask = mask << 1;
            mask = mask | 1;
        }
        const result = new Uint8Array(byteRotated.length);
        let carry = 0x00;
        for (let i = byteRotated.length - 1; i >= 0; --i) {
            let elem = byteRotated[i];
            result[i] = (elem << bitAmount) | carry;
            carry = (elem >> (8 - bitAmount)) & mask;
        }
        result[byteRotated.length - 1] |= carry;

        return result;
    }

    /**
     * Modulo implementation that correctly handles negative numbers
     *
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    mod(a, b)
    {
        return (((a % b) + b ) % b)
    }
}