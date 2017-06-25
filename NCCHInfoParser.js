"use strict";

/**
 * #####
 * #ncchinfo.bin format
 * #
 * #4 bytes = 0xFFFFFFFF Meant to prevent previous versions of padgen from using these new files
 * #4 bytes   ncchinfo.bin version or'd with 0xF0000000, to prevent previous versions of padgen from using these new files
 * #4 bytes   Number of entries
 * #4 bytes   Reserved
 * #
 * #entry (168 bytes in size):
 * #  16 bytes   Counter
 * #  16 bytes   KeyY
 * #   4 bytes   Size in MB(rounded up)
 * #   4 bytes   Reserved
 * #   4 bytes   Uses 9x SeedCrypto (0 or 1)
 * #   4 bytes   Uses 7x crypto? (0 or 1)
 * #   8 bytes   Title ID
 * # 112 bytes   Output file name in UTF-8 (format used: "/titleId.partitionName.sectionName.xorpad")
 * #####
 */
class NCCHInfoParser
{
    parseNCCHInfo(buffer)
    {
        const view = new DataView(buffer);
        const header = view.getUint32(0, true);
        if (header !== 0xFFFFFFFF) {
            throw Error('File not supported');
        }

        const version = (view.getUint32(4, true) & 0x0FFFFFFF);
        if (version !== 4) {
            throw Error("Unsupported ncchinfo.bin version: " + version);
        }
        console.log('Parsing ncchinfo.bin version ' + version);

        const entryCount = view.getUint32(8, true);

        const entries = [];
        let entryOffset = 16;
        const decoder = new TextDecoder('utf-8');
        for (let i = 0; i < entryCount; ++i) {
            if (entryOffset + 168 > buffer.byteLength) {
                throw Error('ncchinfo.bin header specifies more entries than the file contains!');
            }

            const name = new Uint8Array(buffer.slice(entryOffset + 56, entryOffset + 168));
            let lastNonZeroByteIndex = name.length - 1;
            while (name[lastNonZeroByteIndex] === 0x00) {
                --lastNonZeroByteIndex;
                if (lastNonZeroByteIndex < 0) {
                    throw Error("ncchinfo.bin contains empty file name for entry " + i);
                }
            }

            const uses9xSeedCrypto = view.getUint32(entryOffset + 40, true);
            if (uses9xSeedCrypto !== 0x00000000 && uses9xSeedCrypto !== 0x00000001) {
                throw Error('Unsupported value for uses9xSeedCrypto flag: 0x' + uses9xSeedCrypto.toString(16));
            }
            const uses7xCrypto = view.getUint32(entryOffset + 44, true);
            if (uses7xCrypto !== 0x00000000 && uses7xCrypto !== 0x00000001) {
                throw Error('Unsupported value for uses7xCrypto flag: 0x' + uses7xCrypto.toString(16));
            }

            let entry = {
                ctr: new Uint8Array(buffer.slice(entryOffset, entryOffset + 16)),
                keyY: new Uint8Array(buffer.slice(entryOffset + 16, entryOffset + 32)),
                mbsize: view.getUint32(entryOffset + 32, true),
                uses9xSeedCrypto: (uses9xSeedCrypto === 0x00000001),
                uses7xCrypto: (uses7xCrypto === 0x00000001),
                titleID: new Uint8Array(buffer.slice(entryOffset + 48, entryOffset + 56)),
                outputName: decoder.decode(name.slice(0, lastNonZeroByteIndex + 1)),
            };
            entries.push(entry);
            entryOffset += 168;
        }

        return entries;
    }
}