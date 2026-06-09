import { tween } from "cc";
import { LevelType } from "./../GlobalEnum";
import { AwardItemInfo } from "./../GlobalInterfaces";

export class Utilsqdd {
    static isNil(value: any): boolean {
        return value == null;
    }

    static randomTwoNum(min: number, max: number): number {
        const range = max - min + 1;
        return Math.floor(Math.random() * range + min);
    }

    static getUniqueRandomNumbers(min: number, max: number, count: number): number[] {
        const range = max - min + 1;
        const numbers: number[] = [];
        for (let i = 0; i < range; i++) {
            numbers.push(min + i);
        }
        for (let i = numbers.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = numbers[randomIndex];
            numbers[randomIndex] = numbers[i];
            numbers[i] = temp;
        }
        return numbers.slice(0, count);
    }

    static getFirstNItems<T>(items: T[], n: number): T[] {
        return n <= 0 ? [] : items.slice(0, n);
    }

    static clamp(value: number, min: number, max: number): number {
        return value < min ? min : value > max ? max : value;
    }

    static getDateType(value: any): string {
        const typeString = Object.prototype.toString.call(value);
        return typeString.substring(typeString.lastIndexOf(" ") + 1, typeString.lastIndexOf("]"));
    }

    static split_to_number(str: string, separator: string): number[] {
        return str ? str.split(separator).map((item: string) => Number(item)) : [];
    }

    static formatInternationalNumber(value: number, decimalPlaces: number = 1): string {
        if (value === 0) return "0";
        if (value < 10000) return value.toString();

        let isNegative = value < 0;
        let absValue = Math.abs(value);
        const suffixes = ["", "K", "M", "B", "T"];
        let suffixIndex = 0;

        while (absValue >= 1000 && suffixIndex < suffixes.length - 1) {
            absValue /= 1000;
            suffixIndex++;
        }

        let formattedValue: string;
        if (decimalPlaces > 0) {
            formattedValue = absValue.toFixed(decimalPlaces);
            formattedValue = formattedValue.replace(/(\..*?[1-9])0+$/, "$1").replace(/\.$/, "");
        } else {
            formattedValue = Math.round(absValue).toString();
            while (formattedValue.length > 3 && suffixIndex < suffixes.length - 1) {
                absValue /= 1000;
                suffixIndex++;
                formattedValue = Math.round(absValue).toString();
            }
        }

        if (formattedValue.includes("e")) {
            const parts = formattedValue.split("e").map(Number);
            const base = parts[0];
            const exponent = parts[1];
            formattedValue = (base * Math.pow(10, exponent)).toFixed(decimalPlaces);
        }

        return (isNegative ? "-" : "") + formattedValue + suffixes[suffixIndex];
    }

    static formatNumberWithSeparator(value: number | string, separator: string = ","): string {
        if (value === 0 || value === "0" || value == null) return "0";

        let strValue = typeof value === "number" ? value.toString() : value;

        if (strValue.includes("e")) {
            const parts = strValue.split("e");
            const base = parts[0];
            const exponent = parts[1];
            strValue = parseFloat(base) * Math.pow(10, parseInt(exponent)) + "";
        }

        const parts = strValue.split(".");
        const integerPart = parts[0];
        const decimalPart = parts[1];
        const isNegative = integerPart.startsWith("-");
        const absIntegerPart = isNegative ? integerPart.slice(1) : integerPart;

        let result = "";
        let count = 0;
        for (let i = absIntegerPart.length - 1; i >= 0; i--) {
            result = absIntegerPart[i] + result;
            count++;
            if (count % 3 === 0 && i !== 0) {
                result = separator + result;
            }
        }

        return (isNegative ? "-" : "") + result + (decimalPart ? "." + decimalPart : "");
    }

    static numRollWithFormat(
        label: any,
        startValue: number,
        endValue: number,
        options: {
            time?: number;
            before?: string;
            after?: string;
            separator?: string;
            cb?: (start: number, end: number, current: number, progress: number) => void;
            delay?: number;
            finishCal?: () => void;
        } = {}
    ): void {
        const {
            time = 1,
            before = "",
            after = "",
            cb = null,
            delay = 0,
            finishCal = null
        } = options;

        startValue = Math.floor(startValue);
        endValue = Math.floor(endValue);

        label.string = `${before}${startValue}${after}`;
        label.numRollValue = startValue;

        tween(label)
            .delay(delay)
            .to(time, { numRollValue: endValue }, {
                progress: (start: number, end: number, current: number, progress: number) => {
                    const currentValue = Math.floor(start + (end - start) * progress);
                    label.string = `${before}${currentValue}${after}`;
                    if (cb) cb(start, end, current, progress);
                    return 0;
                },
                easing: "quadOut"
            })
            .call(() => {
                label.string = `${before}${endValue}${after}`;
                if (finishCal) finishCal();
            })
            .start();
    }

    static getFlagEmoji(countryCode: string): string {
        if (countryCode === "" || countryCode == null || countryCode === "unknown" || countryCode === "undefined") {
            return "";
        }

        if (["tw", "mo", "hk"].includes(countryCode.toLowerCase())) {
            countryCode = "CN";
        }

        const codePoints = countryCode.toUpperCase().split("").map((char: string) => {
            return char.charCodeAt(0) - 65 + 127462;
        });

        return String.fromCodePoint(...codePoints);
    }

    static mergeArrays<T>(array1: T[], array2: T[]): T[] {
        if (array1.length !== array2.length) {
            throw new Error("数组长度必须一致");
        }

        const result: T[] = [];
        for (let i = 0; i < array1.length; i++) {
            result.push(array1[i]);
            result.push(array2[i]);
        }
        return result;
    }

    static isAllSame<T>(items: T[], property?: string): boolean {
        if (property) {
            return items.every((item: any) => item[property] === (items[0] as any)[property]);
        } else {
            return items.every((item: T) => item === items[0]);
        }
    }

    static encode(str: string): string {
        let result = String.fromCharCode(str.charCodeAt(0) + str.length);
        for (let i = 1; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) + str.charCodeAt(i - 1));
        }
        return "jiamimi" + escape(result);
    }

    static decode(str: string): string {
        if (str.indexOf("jiamimi") === -1) return str;

        str = str.replace("jiamimi", "");
        str = unescape(str);

        let result = String.fromCharCode(str.charCodeAt(0) - str.length);
        for (let i = 1; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) - result.charCodeAt(i - 1));
        }
        return result;
    }

    static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const uint8Array = new Uint8Array(buffer);
        let binaryString = "";
        for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binaryString);
    }

    static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const buffer = new ArrayBuffer(binaryString.length);
        const uint8Array = new Uint8Array(buffer);
        for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
        }
        return buffer;
    }

    static getTodayZeroTime(): number {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now.getTime();
    }

    static getNextTodayZeroTime(): number {
        return this.getTodayZeroTime() + 86400000;
    }

    static flatMergeArray<T>(array1: T[], array2: T[]): T[] {
        const result: T[] = [];
        for (let i = 0; i < array1.length; i++) {
            result.push(array1[i]);
            result.push(array2[i]);
        }
        return result;
    }

    static mergeArray<T>(array1: T[], array2: T[]): [T, T][] {
        const result: [T, T][] = [];
        for (let i = 0; i < array1.length; i++) {
            result.push([array1[i], array2[i]]);
        }
        return result;
    }

    static formatTime(seconds: number, showZeroMinutes: boolean = true): string {
        const absSeconds = Math.floor(Math.abs(seconds));
        const hours = Math.floor(absSeconds / 3600);
        const minutes = Math.floor((absSeconds % 3600) / 60);
        const secs = absSeconds % 60;
        const secsStr = secs < 10 ? "0" + secs : secs.toString();

        if (hours > 0) {
            const minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
            const hoursStr = hours < 10 ? "0" + hours : hours.toString();
            return `${hoursStr}:${minutesStr}:${secsStr}`;
        }

        if (showZeroMinutes) {
            const minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
            return `${minutesStr}:${secsStr}`;
        } else {
            return minutes <= 0 ? secs.toString() : `${minutes}:${secsStr}`;
        }
    }

    static getLevelType(level: number): LevelType {
        const type = (level - 1) % 5 + 1;
        if (type >= 1 && type <= 3) {
            return LevelType.NORMAL;
        } else if (type === 4) {
            return LevelType.HARD;
        } else {
            return LevelType.SUPER_HARD;
        }
    }

    static mergeSameCfgIdRewards(rewards: AwardItemInfo[]): AwardItemInfo[] {
        if (!rewards || rewards.length === 0) return [];

        const rewardMap = new Map<number, AwardItemInfo>();
        for (const reward of rewards) {
            if (!reward || reward.CfgId <= 0 || reward.Num <= 0) continue;

            if (rewardMap.has(reward.CfgId)) {
                rewardMap.get(reward.CfgId)!.Num += reward.Num;
            } else {
                const newReward = new AwardItemInfo();
                newReward.CfgId = reward.CfgId;
                newReward.Num = reward.Num;
                rewardMap.set(reward.CfgId, newReward);
            }
        }
        return Array.from(rewardMap.values());
    }

    static calculateProgress(current: number, total: number): number {
        if (total <= 0) return 0;

        const progress = Math.min(Math.max(current / total, 0), 1);
        const percentage = Math.round(100 * progress);
        return Math.min(Math.max(percentage, 0), 100);
    }
}