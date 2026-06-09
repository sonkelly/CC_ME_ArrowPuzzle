import { _decorator } from 'cc';

class DigestUtils {
    private static _instance: DigestUtils;
    private hexcase: number = 0;
    private b64pad: string = "";
    private chrsz: number = 8;

    public static get instance(): DigestUtils {
        if (this._instance == null) {
            this._instance = new DigestUtils();
        }
        return this._instance;
    }

    public SHA256(input: string): string {
        this.chrsz = 8;
        this.hexcase = 0;
        input = this.Utf8Encode(input);
        return this.binb2hex(this.core_sha256(this.str2binb(input), input.length * this.chrsz));
    }

    public SHA1(input: string): string {
        return this.binb2hex(this.core_sha1(this.str2binb(input), input.length * this.chrsz));
    }

    private S(value: number, shift: number): number {
        return value >>> shift | value << 32 - shift;
    }

    private R(value: number, shift: number): number {
        return value >>> shift;
    }

    private Ch(x: number, y: number, z: number): number {
        return x & y ^ ~x & z;
    }

    private Maj(x: number, y: number, z: number): number {
        return x & y ^ x & z ^ y & z;
    }

    private Sigma0256(value: number): number {
        return this.S(value, 2) ^ this.S(value, 13) ^ this.S(value, 22);
    }

    private Sigma1256(value: number): number {
        return this.S(value, 6) ^ this.S(value, 11) ^ this.S(value, 25);
    }

    private Gamma0256(value: number): number {
        return this.S(value, 7) ^ this.S(value, 18) ^ this.R(value, 3);
    }

    private Gamma1256(value: number): number {
        return this.S(value, 17) ^ this.S(value, 19) ^ this.R(value, 10);
    }

    private core_sha256(words: number[], length: number): number[] {
        const K: number[] = new Array(1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298);
        const H: number[] = new Array(1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225);
        const W: number[] = new Array(64);
        
        words[length >> 5] |= 128 << 24 - length % 32;
        words[15 + (length + 64 >> 9 << 4)] = length;
        
        for (let i = 0; i < words.length; i += 16) {
            let a = H[0];
            let b = H[1];
            let c = H[2];
            let d = H[3];
            let e = H[4];
            let f = H[5];
            let g = H[6];
            let h = H[7];
            
            for (let j = 0; j < 64; j++) {
                if (j < 16) {
                    W[j] = words[j + i];
                } else {
                    W[j] = this.safe_add(this.safe_add(this.safe_add(this.Gamma1256(W[j - 2]), W[j - 7]), this.Gamma0256(W[j - 15])), W[j - 16]);
                }
                
                const T1 = this.safe_add(this.safe_add(this.safe_add(this.safe_add(h, this.Sigma1256(e)), this.Ch(e, f, g)), K[j]), W[j]);
                const T2 = this.safe_add(this.Sigma0256(a), this.Maj(a, b, c));
                
                h = g;
                g = f;
                f = e;
                e = this.safe_add(d, T1);
                d = c;
                c = b;
                b = a;
                a = this.safe_add(T1, T2);
            }
            
            H[0] = this.safe_add(a, H[0]);
            H[1] = this.safe_add(b, H[1]);
            H[2] = this.safe_add(c, H[2]);
            H[3] = this.safe_add(d, H[3]);
            H[4] = this.safe_add(e, H[4]);
            H[5] = this.safe_add(f, H[5]);
            H[6] = this.safe_add(g, H[6]);
            H[7] = this.safe_add(h, H[7]);
        }
        
        return H;
    }

    private core_sha1(words: number[], length: number): number[] {
        words[length >> 5] |= 128 << 24 - length % 32;
        words[15 + (length + 64 >> 9 << 4)] = length;
        
        const W: number[] = new Array(80);
        let a = 1732584193;
        let b = -271733879;
        let c = -1732584194;
        let d = 271733878;
        let e = -1009589776;
        
        for (let i = 0; i < words.length; i += 16) {
            const oldA = a;
            const oldB = b;
            const oldC = c;
            const oldD = d;
            const oldE = e;
            
            for (let j = 0; j < 80; j++) {
                if (j < 16) {
                    W[j] = words[i + j];
                } else {
                    W[j] = this.rol(W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16], 1);
                }
                
                const temp = this.safe_add(this.safe_add(this.rol(a, 5), this.sha1_ft(j, b, c, d)), this.safe_add(this.safe_add(e, W[j]), this.sha1_kt(j)));
                
                e = d;
                d = c;
                c = this.rol(b, 30);
                b = a;
                a = temp;
            }
            
            a = this.safe_add(a, oldA);
            b = this.safe_add(b, oldB);
            c = this.safe_add(c, oldC);
            d = this.safe_add(d, oldD);
            e = this.safe_add(e, oldE);
        }
        
        return [a, b, c, d, e];
    }

    private rol(value: number, count: number): number {
        return value << count | value >>> 32 - count;
    }

    private sha1_ft(t: number, b: number, c: number, d: number): number {
        if (t < 20) return b & c | ~b & d;
        if (t < 40) return b ^ c ^ d;
        if (t < 60) return b & c | b & d | c & d;
        return b ^ c ^ d;
    }

    private sha1_kt(t: number): number {
        if (t < 20) return 1518500249;
        if (t < 40) return 1859775393;
        if (t < 60) return -1894007588;
        return -899497514;
    }

    private str2binb(str: string): number[] {
        const bin: number[] = [];
        const mask = (1 << this.chrsz) - 1;
        
        for (let i = 0; i < str.length * this.chrsz; i += this.chrsz) {
            bin[i >> 5] |= (str.charCodeAt(i / this.chrsz) & mask) << 24 - i % 32;
        }
        
        return bin;
    }

    private Utf8Encode(str: string): string {
        str = str.replace(/\r\n/g, "\n");
        let utfText = "";
        
        for (let n = 0; n < str.length; n++) {
            const c = str.charCodeAt(n);
            
            if (c < 128) {
                utfText += String.fromCharCode(c);
            } else if (c > 127 && c < 2048) {
                utfText += String.fromCharCode(c >> 6 | 192);
                utfText += String.fromCharCode(63 & c | 128);
            } else {
                utfText += String.fromCharCode(c >> 12 | 224);
                utfText += String.fromCharCode(c >> 6 & 63 | 128);
                utfText += String.fromCharCode(63 & c | 128);
            }
        }
        
        return utfText;
    }

    private binb2hex(binarray: number[]): string {
        const hexTab = this.hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        let str = "";
        
        for (let i = 0; i < 4 * binarray.length; i++) {
            str += hexTab.charAt(binarray[i >> 2] >> 8 * (3 - i % 4) + 4 & 15) + hexTab.charAt(binarray[i >> 2] >> 8 * (3 - i % 4) & 15);
        }
        
        return str;
    }

    public hex_md5(input: string, uppercase: boolean = false): string {
        this.hexcase = 0;
        this.b64pad = "";
        this.chrsz = 8;
        
        let hash = this.rstr2hex(this.rstr_md5(this.str2rstr_utf8(input))).toLowerCase();
        if (uppercase) {
            hash = hash.toUpperCase();
        }
        
        return hash;
    }

    public b64_md5(input: string): string {
        return this.rstr2b64(this.rstr_md5(this.str2rstr_utf8(input)));
    }

    public any_md5(input: string, encoding: string): string {
        return this.rstr2any(this.rstr_md5(this.str2rstr_utf8(input)), encoding);
    }

    public hex_hmac_md5(key: string, data: string): string {
        return this.rstr2hex(this.rstr_hmac_md5(this.str2rstr_utf8(key), this.str2rstr_utf8(data)));
    }

    public b64_hmac_md5(key: string, data: string): string {
        return this.rstr2b64(this.rstr_hmac_md5(this.str2rstr_utf8(key), this.str2rstr_utf8(data)));
    }

    public any_hmac_md5(key: string, data: string, encoding: string): string {
        return this.rstr2any(this.rstr_hmac_md5(this.str2rstr_utf8(key), this.str2rstr_utf8(data)), encoding);
    }

    public md5_vm_test(): boolean {
        return this.hex_md5("abc").toLowerCase() === "900150983cd24fb0d6963f7d28e17f72";
    }

    private rstr_md5(input: string): string {
        return this.binl2rstr(this.binl_md5(this.rstr2binl(input), 8 * input.length));
    }

    private rstr_hmac_md5(key: string, data: string): string {
        let bkey = this.rstr2binl(key);
        
        if (bkey.length > 16) {
            bkey = this.binl_md5(bkey, 8 * key.length);
        }
        
        const ipad: number[] = new Array(16);
        const opad: number[] = new Array(16);
        
        for (let i = 0; i < 16; i++) {
            ipad[i] = 909522486 ^ bkey[i];
            opad[i] = 1549556828 ^ bkey[i];
        }
        
        const hash = this.binl_md5(ipad.concat(this.rstr2binl(data)), 512 + 8 * data.length);
        return this.binl2rstr(this.binl_md5(opad.concat(hash), 640));
    }

    private rstr2hex(input: string): string {
        try {
            this.hexcase;
        } catch (e) {
            this.hexcase = 0;
        }
        
        const hexTab = this.hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        let output = "";
        
        for (let i = 0; i < input.length; i++) {
            const x = input.charCodeAt(i);
            output += hexTab.charAt(x >>> 4 & 15) + hexTab.charAt(15 & x);
        }
        
        return output;
    }

    private rstr2b64(input: string): string {
        try {
            this.b64pad;
        } catch (e) {
            this.b64pad = "";
        }
        
        let output = "";
        const len = input.length;
        
        for (let i = 0; i < len; i += 3) {
            const triplet = input.charCodeAt(i) << 16 | (i + 1 < len ? input.charCodeAt(i + 1) << 8 : 0) | (i + 2 < len ? input.charCodeAt(i + 2) : 0);
            
            for (let j = 0; j < 4; j++) {
                if (8 * i + 6 * j > 8 * input.length) {
                    output += this.b64pad;
                } else {
                    output += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(triplet >>> 6 * (3 - j) & 63);
                }
            }
        }
        
        return output;
    }

    private rstr2any(input: string, encoding: string): string {
        const divisor = encoding.length;
        const remainders: number[] = [];
        
        let i: number, j: number, x: number;
        let quotient: number[] = new Array(Math.ceil(input.length / 2));
        
        for (i = 0; i < quotient.length; i++) {
            quotient[i] = input.charCodeAt(2 * i) << 8 | input.charCodeAt(2 * i + 1);
        }
        
        const fullLength = Math.ceil(8 * input.length / (Math.log(encoding.length) / Math.log(2)));
        const result: number[] = new Array(fullLength);
        
        for (j = 0; j < fullLength; j++) {
            const newQuotient: number[] = [];
            let remainder = 0;
            
            for (i = 0; i < quotient.length; i++) {
                remainder = (remainder << 16) + quotient[i];
                x = Math.floor(remainder / divisor);
                remainder -= x * divisor;
                
                if (newQuotient.length > 0 || x > 0) {
                    newQuotient[newQuotient.length] = x;
                }
            }
            
            result[j] = remainder;
            quotient = newQuotient;
        }
        
        let output = "";
        for (i = result.length - 1; i >= 0; i--) {
            output += encoding.charAt(result[i]);
        }
        
        return output;
    }

    private str2rstr_utf8(input: string): string {
        let output = "";
        let i = -1;
        let x: number, y: number;
        
        while (++i < input.length) {
            x = input.charCodeAt(i);
            y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
            
            if (55296 <= x && x <= 56319 && 56320 <= y && y <= 57343) {
                x = 65536 + ((1023 & x) << 10) + (1023 & y);
                i++;
            }
            
            if (x <= 127) {
                output += String.fromCharCode(x);
            } else if (x <= 2047) {
                output += String.fromCharCode(192 | x >>> 6 & 31, 128 | 63 & x);
            } else if (x <= 65535) {
                output += String.fromCharCode(224 | x >>> 12 & 15, 128 | x >>> 6 & 63, 128 | 63 & x);
            } else if (x <= 2097151) {
                output += String.fromCharCode(240 | x >>> 18 & 7, 128 | x >>> 12 & 63, 128 | x >>> 6 & 63, 128 | 63 & x);
            }
        }
        
        return output;
    }

    private str2rstr_utf16le(input: string): string {
        let output = "";
        for (let i = 0; i < input.length; i++) {
            output += String.fromCharCode(255 & input.charCodeAt(i), input.charCodeAt(i) >>> 8 & 255);
        }
        return output;
    }

    private str2rstr_utf16be(input: string): string {
        let output = "";
        for (let i = 0; i < input.length; i++) {
            output += String.fromCharCode(input.charCodeAt(i) >>> 8 & 255, 255 & input.charCodeAt(i));
        }
        return output;
    }

    private rstr2binl(input: string): number[] {
        const bin: number[] = new Array(input.length >> 2);
        for (let i = 0; i < bin.length; i++) {
            bin[i] = 0;
        }
        for (let i = 0; i < 8 * input.length; i += 8) {
            bin[i >> 5] |= (255 & input.charCodeAt(i / 8)) << i % 32;
        }
        return bin;
    }

    private binl2rstr(binarray: number[]): string {
        let output = "";
        for (let i = 0; i < 32 * binarray.length; i += 8) {
            output += String.fromCharCode(binarray[i >> 5] >>> i % 32 & 255);
        }
        return output;
    }

    private binl_md5(words: number[], length: number): number[] {
        words[length >> 5] |= 128 << length % 32;
        words[14 + (length + 64 >>> 9 << 4)] = length;
        
        let a = 1732584193;
        let b = -271733879;
        let c = -1732584194;
        let d = 271733878;
        
        for (let i = 0; i < words.length; i += 16) {
            const oldA = a;
            const oldB = b;
            const oldC = c;
            const oldD = d;
            
            a = this.md5_ff(a, b, c, d, words[i + 0], 7, -680876936);
            d = this.md5_ff(d, a, b, c, words[i + 1], 12, -389564586);
            c = this.md5_ff(c, d, a, b, words[i + 2], 17, 606105819);
            b = this.md5_ff(b, c, d, a, words[i + 3], 22, -1044525330);
            a = this.md5_ff(a, b, c, d, words[i + 4], 7, -176418897);
            d = this.md5_ff(d, a, b, c, words[i + 5], 12, 1200080426);
            c = this.md5_ff(c, d, a, b, words[i + 6], 17, -1473231341);
            b = this.md5_ff(b, c, d, a, words[i + 7], 22, -45705983);
            a = this.md5_ff(a, b, c, d, words[i + 8], 7, 1770035416);
            d = this.md5_ff(d, a, b, c, words[i + 9], 12, -1958414417);
            c = this.md5_ff(c, d, a, b, words[i + 10], 17, -42063);
            b = this.md5_ff(b, c, d, a, words[i + 11], 22, -1990404162);
            a = this.md5_ff(a, b, c, d, words[i + 12], 7, 1804603682);
            d = this.md5_ff(d, a, b, c, words[i + 13], 12, -40341101);
            c = this.md5_ff(c, d, a, b, words[i + 14], 17, -1502002290);
            b = this.md5_ff(b, c, d, a, words[i + 15], 22, 1236535329);
            
            a = this.md5_gg(a, b, c, d, words[i + 1], 5, -165796510);
            d = this.md5_gg(d, a, b, c, words[i + 6], 9, -1069501632);
            c = this.md5_gg(c, d, a, b, words[i + 11], 14, 643717713);
            b = this.md5_gg(b, c, d, a, words[i + 0], 20, -373897302);
            a = this.md5_gg(a, b, c, d, words[i + 5], 5, -701558691);
            d = this.md5_gg(d, a, b, c, words[i + 10], 9, 38016083);
            c = this.md5_gg(c, d, a, b, words[i + 15], 14, -660478335);
            b = this.md5_gg(b, c, d, a, words[i + 4], 20, -405537848);
            a = this.md5_gg(a, b, c, d, words[i + 9], 5, 568446438);
            d = this.md5_gg(d, a, b, c, words[i + 14], 9, -1019803690);
            c = this.md5_gg(c, d, a, b, words[i + 3], 14, -187363961);
            b = this.md5_gg(b, c, d, a, words[i + 8], 20, 1163531501);
            a = this.md5_gg(a, b, c, d, words[i + 13], 5, -1444681467);
            d = this.md5_gg(d, a, b, c, words[i + 2], 9, -51403784);
            c = this.md5_gg(c, d, a, b, words[i + 7], 14, 1735328473);
            b = this.md5_gg(b, c, d, a, words[i + 12], 20, -1926607734);
            
            a = this.md5_hh(a, b, c, d, words[i + 5], 4, -378558);
            d = this.md5_hh(d, a, b, c, words[i + 8], 11, -2022574463);
            c = this.md5_hh(c, d, a, b, words[i + 11], 16, 1839030562);
            b = this.md5_hh(b, c, d, a, words[i + 14], 23, -35309556);
            a = this.md5_hh(a, b, c, d, words[i + 1], 4, -1530992060);
            d = this.md5_hh(d, a, b, c, words[i + 4], 11, 1272893353);
            c = this.md5_hh(c, d, a, b, words[i + 7], 16, -155497632);
            b = this.md5_hh(b, c, d, a, words[i + 10], 23, -1094730640);
            a = this.md5_hh(a, b, c, d, words[i + 13], 4, 681279174);
            d = this.md5_hh(d, a, b, c, words[i + 0], 11, -358537222);
            c = this.md5_hh(c, d, a, b, words[i + 3], 16, -722521979);
            b = this.md5_hh(b, c, d, a, words[i + 6], 23, 76029189);
            a = this.md5_hh(a, b, c, d, words[i + 9], 4, -640364487);
            d = this.md5_hh(d, a, b, c, words[i + 12], 11, -421815835);
            c = this.md5_hh(c, d, a, b, words[i + 15], 16, 530742520);
            b = this.md5_hh(b, c, d, a, words[i + 2], 23, -995338651);
            
            a = this.md5_ii(a, b, c, d, words[i + 0], 6, -198630844);
            d = this.md5_ii(d, a, b, c, words[i + 7], 10, 1126891415);
            c = this.md5_ii(c, d, a, b, words[i + 14], 15, -1416354905);
            b = this.md5_ii(b, c, d, a, words[i + 5], 21, -57434055);
            a = this.md5_ii(a, b, c, d, words[i + 12], 6, 1700485571);
            d = this.md5_ii(d, a, b, c, words[i + 3], 10, -1894986606);
            c = this.md5_ii(c, d, a, b, words[i + 10], 15, -1051523);
            b = this.md5_ii(b, c, d, a, words[i + 1], 21, -2054922799);
            a = this.md5_ii(a, b, c, d, words[i + 8], 6, 1873313359);
            d = this.md5_ii(d, a, b, c, words[i + 15], 10, -30611744);
            c = this.md5_ii(c, d, a, b, words[i + 6], 15, -1560198380);
            b = this.md5_ii(b, c, d, a, words[i + 13], 21, 1309151649);
            a = this.md5_ii(a, b, c, d, words[i + 4], 6, -145523070);
            d = this.md5_ii(d, a, b, c, words[i + 11], 10, -1120210379);
            c = this.md5_ii(c, d, a, b, words[i + 2], 15, 718787259);
            b = this.md5_ii(b, c, d, a, words[i + 9], 21, -343485551);
            
            a = this.safe_add(a, oldA);
            b = this.safe_add(b, oldB);
            c = this.safe_add(c, oldC);
            d = this.safe_add(d, oldD);
        }
        
        return [a, b, c, d];
    }

    private md5_cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
        return this.safe_add(this.bit_rol(this.safe_add(this.safe_add(a, q), this.safe_add(x, t)), s), b);
    }

    private md5_ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return this.md5_cmn(b & c | ~b & d, a, b, x, s, t);
    }

    private md5_gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return this.md5_cmn(b & d | c & ~d, a, b, x, s, t);
    }

    private md5_hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return this.md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }

    private md5_ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return this.md5_cmn(c ^ (b | ~d), a, b, x, s, t);
    }

    private safe_add(x: number, y: number): number {
        const lsw = (65535 & x) + (65535 & y);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return msw << 16 | 65535 & lsw;
    }

    private bit_rol(num: number, cnt: number): number {
        return num << cnt | num >>> 32 - cnt;
    }

    public randomNumber(length: number): string {
        const digits = "0123456789";
        let result = "";
        
        for (let i = 0; i < length; i++) {
            result += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        
        return result;
    }
}

export { DigestUtils };