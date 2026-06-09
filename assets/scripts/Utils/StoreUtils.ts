import { sys } from "cc";
import { LocalConfig } from "./../LocalConfig";
import { EngineUtils } from "./EngineUtils";

export enum Type {
    String = 0,
    Int = 1,
    Float = 2,
    Boolean = 3,
    Array = 4,
    Map = 5
}

export class StoreUtils {
    public static keyAdConfigCache: string = "keyAdConfigCache";
    public static showPolicy: string = "showPolicy";
    public static intertShowTotalNumber: string = "intertShowTotalNumber";
    public static autoClickNativeInsertTotalNumber: string = "autoClickNativeInsertTotalNumber";
    public static autoClickVideoTotalNumber: string = "autoClickVideoTotalNumber";
    public static autoClickVideoLastTime: string = "autoClickVideoLastTime";
    public static autoClickNativeImageAndIconTotalNumber: string = "autoClickNativeImageAndIconTotalNumber";
    public static autoClickNativeImageAndIconLastTime: string = "autoClickNativeImageAndIconLastTime";
    public static autoClickNativeInsertLastTime: string = "autoClickNativeInsertLastTime";
    public static lastShowGameDoingSplashTime: string = "lastShowGameDoingSplashTime";
    public static nowFormatDate: string = "nowFormatDate";
    public static uuid: string = "uuid";
    public static nickName: string = "nickName";
    public static avatarUrl: string = "avatarUrl";
    public static videoTotalCount: string = "videoTotalCount";
    public static chargeTotal: string = "chargeTotal";
    public static isChargeReport: string = "isChargeReport";

    private static _instance: StoreUtils | undefined;

    private constructor() {}

    public static getInstance(): StoreUtils {
        if (this._instance === undefined) {
            this._instance = new StoreUtils();
        }
        return this._instance;
    }

    private getCompleteKey(key: string): string {
        return LocalConfig.GAME_APP_KEY ? LocalConfig.GAME_APP_KEY + "_" + key : key;
    }

    public set(key: string, type: Type, value: any): void {
        if (type === Type.Int || type === Type.Float) {
            this.setItem(key, value.toString());
        } else if (type === Type.Boolean) {
            this.setItem(key, (value ? 1 : 0).toString());
        } else if (type === Type.Array || type === Type.Map) {
            this.setItem(key, JSON.stringify(value));
        } else {
            this.setItem(key, value);
        }
    }

    public get(key: string, type: Type, defaultValue: any): any {
        if (type === Type.Int) {
            return Number(this.getItem(key) || defaultValue);
        } else if (type === Type.Float) {
            return parseFloat(this.getItem(key) || defaultValue);
        } else if (type === Type.Boolean) {
            const storedValue = this.getItem(key);
            if (storedValue && storedValue !== "undefined" && storedValue !== "null") {
                return storedValue === "1";
            }
            return defaultValue;
        } else if (type === Type.Array) {
            const storedValue = this.getItem(key);
            if (storedValue && storedValue !== "undefined" && storedValue !== "null") {
                return JSON.parse(storedValue);
            }
            return defaultValue;
        } else if (type === Type.Map) {
            return JSON.parse(this.getItem(key) || defaultValue);
        } else {
            return this.getItem(key) || defaultValue;
        }
    }

    public clear(): void {
        if (EngineUtils.isCocos()) {
            sys.localStorage.clear();
        } else {
            Laya.LocalStorage.clear();
        }
    }

    private setItem(key: string, value: string): void {
        const completeKey = this.getCompleteKey(key);
        if (EngineUtils.isCocos()) {
            sys.localStorage.setItem(completeKey, value);
        } else {
            Laya.LocalStorage.setItem(completeKey, value);
        }
    }

    private getItem(key: string): string | null {
        const completeKey = this.getCompleteKey(key);
        if (EngineUtils.isCocos()) {
            return sys.localStorage.getItem(completeKey);
        } else {
            return Laya.LocalStorage.getItem(completeKey);
        }
    }
}