export class WXBizDataCrypt {
    private appId: string;
    private sessionKey: string;
    private rcon: Uint32Array = new Uint32Array([0, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483648, 452984832, 905969664]);

    constructor(appId: string, sessionKey: string) {
        this.appId = appId;
        this.sessionKey = sessionKey;
    }

    public decryptData(encryptedData: string, iv: string): any {
        const sessionKeyArrayBuffer = this.base64ToArrayBuffer(this.sessionKey);
        const encryptedDataArrayBuffer = this.base64ToArrayBuffer(encryptedData);
        const ivArrayBuffer = this.base64ToArrayBuffer(iv);
        const decrypted = this.aes128CbcDecrypt(new Uint8Array(encryptedDataArrayBuffer), new Uint8Array(sessionKeyArrayBuffer), new Uint8Array(ivArrayBuffer));
        const unpadded = this.pkcs7Unpad(decrypted);
        const resultString = this.arrayBufferToString(unpadded);
        return JSON.parse(resultString);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const base64Data = base64.replace(/^data:\w+\/\w+;base64,/, "");
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        let binaryString = "";
        let index = 0;

        while (index < base64Data.length) {
            const char1 = chars.indexOf(base64Data.charAt(index++));
            const char2 = chars.indexOf(base64Data.charAt(index++));
            const char3 = chars.indexOf(base64Data.charAt(index++));
            const char4 = chars.indexOf(base64Data.charAt(index++));

            const byte1 = char1 << 2 | char2 >> 4;
            const byte2 = (15 & char2) << 4 | char3 >> 2;
            const byte3 = (3 & char3) << 6 | char4;

            binaryString += String.fromCharCode(byte1);
            if (64 !== char3) {
                binaryString += String.fromCharCode(byte2);
            }
            if (64 !== char4) {
                binaryString += String.fromCharCode(byte3);
            }
        }

        const arrayBuffer = new ArrayBuffer(binaryString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
        }
        return arrayBuffer;
    }

    private arrayBufferToString(buffer: ArrayBuffer | Uint8Array): string {
        if (typeof TextDecoder !== "undefined") {
            return new TextDecoder().decode(buffer);
        }

        let result = "";
        const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        for (let i = 0; i < uint8Array.length; i++) {
            result += String.fromCharCode(uint8Array[i]);
        }

        try {
            return decodeURIComponent(escape(result));
        } catch (error) {
            return result;
        }
    }

    private aes128CbcDecrypt(encryptedData: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
        const expandedKey = this.aesKeyExpansion(key);
        const blocks = this.splitIntoBlocks(encryptedData);
        const result = new Uint8Array(encryptedData.length);
        let previousBlock = iv;
        let resultIndex = 0;

        for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
            const currentBlock = blocks[blockIndex];
            const decryptedBlock = this.aesDecryptBlock(currentBlock, expandedKey);
            for (let byteIndex = 0; byteIndex < 16; byteIndex++) {
                result[resultIndex + byteIndex] = decryptedBlock[byteIndex] ^ previousBlock[byteIndex];
            }
            previousBlock = currentBlock;
            resultIndex += 16;
        }
        return result;
    }

    private aesKeyExpansion(key: Uint8Array): Uint32Array[] {
        const keyWords = Math.floor(key.length / 4) + 6;
        const expandedKeys: Uint32Array[] = new Array(keyWords + 1);
        expandedKeys[0] = new Uint32Array(4);

        for (let i = 0; i < 4; i++) {
            expandedKeys[0][i] = (key[4 * i] << 24 | key[4 * i + 1] << 16 | key[4 * i + 2] << 8 | key[4 * i + 3]) >>> 0;
        }

        for (let round = 1; round <= keyWords; round++) {
            expandedKeys[round] = new Uint32Array(4);
            let temp = expandedKeys[round - 1][3];
            temp = (this.subWord(this.rotWord(temp)) ^ this.rcon[round] | 0) >>> 0;
            expandedKeys[round][0] = (expandedKeys[round - 1][0] ^ temp) >>> 0;
            expandedKeys[round][1] = (expandedKeys[round - 1][1] ^ expandedKeys[round][0]) >>> 0;
            expandedKeys[round][2] = (expandedKeys[round - 1][2] ^ expandedKeys[round][1]) >>> 0;
            expandedKeys[round][3] = (expandedKeys[round - 1][3] ^ expandedKeys[round][2]) >>> 0;
        }
        return expandedKeys;
    }

    private aesDecryptBlock(block: Uint8Array, expandedKeys: Uint32Array[]): Uint8Array {
        const state = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            state[i] = block[i];
        }

        const lastRound = expandedKeys.length - 1;
        this.addRoundKey(state, expandedKeys[lastRound]);

        for (let round = lastRound - 1; round > 0; round--) {
            this.invShiftRows(state);
            this.invSubBytes(state);
            this.addRoundKey(state, expandedKeys[round]);
            this.invMixColumns(state);
        }

        this.invShiftRows(state);
        this.invSubBytes(state);
        this.addRoundKey(state, expandedKeys[0]);
        return state;
    }

    private addRoundKey(state: Uint8Array, roundKey: Uint32Array): void {
        for (let i = 0; i < 4; i++) {
            const keyWord = roundKey[i];
            state[4 * i] ^= keyWord >>> 24 & 255;
            state[4 * i + 1] ^= keyWord >>> 16 & 255;
            state[4 * i + 2] ^= keyWord >>> 8 & 255;
            state[4 * i + 3] ^= 255 & keyWord;
        }
    }

    private invShiftRows(state: Uint8Array): void {
        const temp = new Uint8Array(16);
        temp[0] = state[0];
        temp[4] = state[4];
        temp[8] = state[8];
        temp[12] = state[12];
        temp[1] = state[13];
        temp[5] = state[1];
        temp[9] = state[5];
        temp[13] = state[9];
        temp[2] = state[10];
        temp[6] = state[14];
        temp[10] = state[2];
        temp[14] = state[6];
        temp[3] = state[7];
        temp[7] = state[11];
        temp[11] = state[15];
        temp[15] = state[3];

        for (let i = 0; i < 16; i++) {
            state[i] = temp[i];
        }
    }

    private invSubBytes(state: Uint8Array): void {
        const sBox = new Uint8Array([82, 9, 106, 213, 48, 54, 165, 56, 191, 64, 163, 158, 129, 243, 215, 251, 124, 227, 57, 130, 155, 47, 255, 135, 52, 142, 67, 68, 196, 222, 233, 203, 84, 123, 148, 50, 166, 194, 35, 61, 238, 76, 149, 11, 66, 250, 195, 78, 8, 46, 161, 102, 40, 217, 36, 178, 118, 91, 162, 73, 109, 139, 209, 37, 114, 248, 246, 100, 134, 104, 152, 22, 212, 164, 92, 204, 93, 101, 182, 146, 108, 112, 72, 80, 253, 237, 185, 218, 94, 21, 70, 87, 167, 141, 157, 132, 144, 216, 171, 0, 140, 188, 211, 10, 247, 228, 88, 5, 184, 179, 69, 6, 208, 44, 30, 143, 202, 63, 15, 2, 193, 175, 189, 3, 1, 19, 138, 107, 58, 145, 17, 65, 79, 103, 220, 234, 151, 242, 207, 206, 240, 180, 230, 115, 150, 172, 116, 34, 231, 173, 53, 133, 226, 249, 55, 232, 28, 117, 223, 110, 71, 241, 26, 113, 29, 41, 197, 137, 111, 183, 98, 14, 170, 24, 190, 27, 252, 86, 62, 75, 198, 210, 121, 32, 154, 219, 192, 254, 120, 205, 90, 244, 31, 221, 168, 51, 136, 7, 199, 49, 177, 18, 16, 89, 39, 128, 236, 95, 96, 81, 127, 169, 25, 181, 74, 13, 45, 229, 122, 159, 147, 201, 156, 239, 160, 224, 59, 77, 174, 42, 245, 176, 200, 235, 187, 60, 131, 83, 153, 97, 23, 43, 4, 126, 186, 119, 214, 38, 225, 105, 20, 99, 85, 33, 12, 125]);
        for (let i = 0; i < 16; i++) {
            state[i] = sBox[state[i]];
        }
    }

    private invMixColumns(state: Uint8Array): void {
        for (let column = 0; column < 4; column++) {
            const byte0 = state[4 * column];
            const byte1 = state[4 * column + 1];
            const byte2 = state[4 * column + 2];
            const byte3 = state[4 * column + 3];

            state[4 * column] = this.gfMultiply(14, byte0) ^ this.gfMultiply(11, byte1) ^ this.gfMultiply(13, byte2) ^ this.gfMultiply(9, byte3);
            state[4 * column + 1] = this.gfMultiply(9, byte0) ^ this.gfMultiply(14, byte1) ^ this.gfMultiply(11, byte2) ^ this.gfMultiply(13, byte3);
            state[4 * column + 2] = this.gfMultiply(13, byte0) ^ this.gfMultiply(9, byte1) ^ this.gfMultiply(14, byte2) ^ this.gfMultiply(11, byte3);
            state[4 * column + 3] = this.gfMultiply(11, byte0) ^ this.gfMultiply(13, byte1) ^ this.gfMultiply(9, byte2) ^ this.gfMultiply(14, byte3);
        }
    }

    private gfMultiply(a: number, b: number): number {
        let result = 0;
        let tempB = b;
        let tempA = a;

        for (let i = 0; i < 8; i++) {
            if (1 & tempB) {
                result ^= tempA;
            }
            const highBit = 128 & tempA;
            tempA = tempA << 1 & 255;
            if (highBit) {
                tempA ^= 27;
            }
            tempB >>= 1;
        }
        return result;
    }

    private rotWord(word: number): number {
        return (word << 8 | word >>> 24) >>> 0;
    }

    private subWord(word: number): number {
        const sBox = new Uint8Array([99, 124, 119, 123, 242, 107, 111, 197, 48, 1, 103, 43, 254, 215, 171, 118, 202, 130, 201, 125, 250, 89, 71, 240, 173, 212, 162, 175, 156, 164, 114, 192, 183, 253, 147, 38, 54, 63, 247, 204, 52, 165, 229, 241, 113, 216, 49, 21, 4, 199, 35, 195, 24, 150, 5, 154, 7, 18, 128, 226, 235, 39, 178, 117, 9, 131, 44, 26, 27, 110, 90, 160, 82, 59, 214, 179, 41, 227, 47, 132, 83, 209, 0, 237, 32, 252, 177, 91, 106, 203, 190, 57, 74, 76, 88, 207, 208, 239, 170, 251, 67, 77, 51, 133, 69, 249, 2, 127, 80, 60, 159, 168, 81, 163, 64, 143, 146, 157, 56, 245, 188, 182, 218, 33, 16, 255, 243, 210, 205, 12, 19, 236, 95, 151, 68, 23, 196, 167, 126, 61, 100, 93, 25, 115, 96, 129, 79, 220, 34, 42, 144, 136, 70, 238, 184, 20, 222, 94, 11, 219, 224, 50, 58, 10, 73, 6, 36, 92, 194, 211, 172, 98, 145, 149, 228, 121, 231, 200, 55, 109, 141, 213, 78, 169, 108, 86, 244, 234, 101, 122, 174, 8, 186, 120, 37, 46, 28, 166, 180, 198, 232, 221, 116, 31, 75, 189, 139, 138, 112, 62, 181, 102, 72, 3, 246, 14, 97, 53, 87, 185, 134, 193, 29, 158, 225, 248, 152, 17, 105, 217, 142, 148, 155, 30, 135, 233, 206, 85, 40, 223, 140, 161, 137, 13, 191, 230, 66, 104, 65, 153, 45, 15, 176, 84, 187, 22]);
        return (sBox[word >>> 24 & 255] << 24 | sBox[word >>> 16 & 255] << 16 | sBox[word >>> 8 & 255] << 8 | sBox[255 & word]) >>> 0;
    }

    private splitIntoBlocks(data: Uint8Array): Uint8Array[] {
        const blocks: Uint8Array[] = [];
        const blockCount = Math.ceil(data.length / 16);

        for (let i = 0; i < blockCount; i++) {
            const block = new Uint8Array(16);
            const start = 16 * i;
            const end = Math.min(start + 16, data.length);
            block.set(data.slice(start, end));
            blocks.push(block);
        }
        return blocks;
    }

    private pkcs7Unpad(data: Uint8Array): Uint8Array {
        const paddingValue = data[data.length - 1];
        if (paddingValue < 1 || paddingValue > 16) {
            return data;
        }

        for (let i = 1; i <= paddingValue; i++) {
            if (data[data.length - i] !== paddingValue) {
                return data;
            }
        }
        return data.slice(0, data.length - paddingValue);
    }
}