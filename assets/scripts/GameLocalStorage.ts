import { sys } from "cc";
import { GameLogicConfig } from "./GameLogicConfig";
import { Utilsqdd } from "./Utils/Utilsqdd";

export class GameLocalStorage {
    public key: string | undefined;

    public static encKeyList: string[] = [];
    public static map: Map<string, string | null> = new Map();

    public static async synItem(this: typeof GameLocalStorage) {
        const data = await FBInstant.player.getDataAsync(["bgm", "sound", "shake", "skin", "modifyName"]);
        console.log("setting data:", data);
        if (data) {
            if (!Utilsqdd.isNil(data.bgm)) {
                this.setItem("last_setting_music_bg", data.bgm, true);
            }
            if (!Utilsqdd.isNil(data.sound)) {
                this.setItem("last_setting_music_effect", data.sound, true);
            }
            if (!Utilsqdd.isNil(data.shake)) {
                this.setItem("last_setting_shake", data.shake, true);
            }
            if (!Utilsqdd.isNil(data.skin)) {
                this.setItem("curSkin", data.skin, true);
            }
            if (!Utilsqdd.isNil(data.modifyName)) {
                this.setItem("modifyName", data.modifyName, true);
            }
        }
    };

    public static saveItem(this: typeof GameLocalStorage, key: string) {
        
        //@todo store data here
        /*if (SDKInstance.isFacebookMiniGame() && 
            (key === "last_setting_music_bg" || key === "last_setting_music_effect" || 
             key === "last_setting_shake" || key === "curSkin" || key === "modifyName")) {
            const data = {
                bgm: Number(this.getItem("last_setting_music_bg") || 0),
                sound: Number(this.getItem("last_setting_music_effect") || 1),
                shake: Number(this.getItem("last_setting_shake") || 1),
                skin: Number(this.getItem("curSkin") || 0),
                modifyName: Number(this.getItem("modifyName") || 0)
            };
            FBInstant.player.setDataAsync(data)
                .then(FBInstant.player.flushDataAsync)
                .then(() => {
                    console.log("setting Data saving");
                })
                .catch((error: any) => {
                    console.log("setting Error saving data:", error);
                });
        }*/
    };

    public static setItem(key: string, value: any, saveToFB: boolean = false): void {
        const isEncrypted = !!GameLocalStorage.encKeyList.find((item) => item === key);
        const storageKey = GameLogicConfig.GameTag + "_" + key;
        
        let processedValue: string;
        if (typeof value === "object") {
            processedValue = JSON.stringify(value);
        } else {
            processedValue = value.toString();
        }

        if (isEncrypted) {
            sys.localStorage.setItem(storageKey, Utilsqdd.encode(processedValue));
            GameLocalStorage.map.set(storageKey, Utilsqdd.encode(processedValue));
        } else {
            sys.localStorage.setItem(storageKey, processedValue);
            GameLocalStorage.map.set(storageKey, processedValue);
        }

        if (!saveToFB) {
            this.saveItem(key);
        }
    }

    public static getItem(key: string): any {
        const isEncrypted = !!GameLocalStorage.encKeyList.find((item) => item === key);
        const storageKey = GameLogicConfig.GameTag + "_" + key;
        
        let value: string | null = null;
        if (GameLocalStorage.map.has(storageKey)) {
            value = GameLocalStorage.map.get(storageKey) as string;
        } else {
            value = sys.localStorage.getItem(storageKey);
        }

        if (!value) {
            GameLocalStorage.map.set(storageKey, null);
            return null;
        }

        if (isEncrypted) {
            value = Utilsqdd.decode(value);
        }

        try {
            if (typeof value !== "object") {
                if (typeof value === "string" && (value.indexOf("{") !== -1 || value.indexOf("[") !== -1)) {
                    value = JSON.parse(value);
                }
            }
        } catch (error) {
            console.log("解析本地数据异常");
        }

        return value;
    }

    public static delItem(key: string): void {
        const storageKey = GameLogicConfig.GameTag + "_" + key;
        GameLocalStorage.map.delete(storageKey);
        sys.localStorage.removeItem(storageKey);
    }

    public static clear(): void {
        /*if (SDKInstance.isFacebookMiniGame()) {
            FBInstant.player.setDataAsync({
                bgm: 0,
                sound: 1,
                shake: 1,
                skin: 0,
                modifyName: 0
            })
                .then(FBInstant.player.flushDataAsync)
                .then(() => {
                    console.log("setting Data saving");
                })
                .catch((error: any) => {
                    console.log("setting Error saving data:", error);
                });
        }*/

        GameLocalStorage.map.clear();
        Object.keys(sys.localStorage)
            .filter((key) => key.includes(GameLogicConfig.GameTag))
            .forEach((key) => {
                sys.localStorage.removeItem(key);
            });
    }
}