import { assetManager, JsonAsset } from 'cc';
import { JsonClassStorage } from './JsonClass';
import { Global } from './Global';
import { GameChannel } from './GameChannel';

export class LevelLoader {
    static profileMain: any[] = [];
    static profileRescue: any[] = [];
    static maxLevel: number = 6000;
    static maxRescue: number = 660;
    static memoryCache: Map<string, any> = new Map();

    static getCacheKey(level: number, isRescue: boolean): string {
        return (isRescue ? "R" : "M") + "_" + level;
    }

    static getDomain(): string {
        let domain = "https://www.quduoduodata.top/ossfile/cocos/Arrow/";
        if (GameChannel.isCloneXJJ) {
            domain = "https://www.quduoduodata.top/ossfile/cocos/Arrow_xjj/";
        }
        return domain;
    }

    static getRemoteUrl(level: number, isRescue: boolean): string {
        const levelType = isRescue ? "rescue" : "main";
        const profile = this.getProfile(level, isRescue);
        let version = "0";
        if (profile) {
            const profileString = [
                profile.difficulty,
                profile.colorCount,
                profile.mapWidth,
                profile.mapHeight,
                profile.imageName || "",
                profile.minPathLen,
                profile.maxPathLen,
                profile.turnRate
            ].join("_");
            version = this.genSimpleHash(profileString);
        }
        return this.getDomain() + "wx/levels/" + levelType + "/Level_" + level + ".json?v=" + version;
    }

    static getProfile(level: number, isRescue: boolean): any {
        const isForeign = Global.isForeignGame();
        const profileName = isRescue 
            ? (isForeign ? "RescueProfileFB" : "RescueProfile")
            : (isForeign ? "DifficultyProfile" : "DifficultyProfileWx");
        
        const profileArray = isRescue ? this.profileRescue : this.profileMain;
        const foundProfile = profileArray.find((p: any) => p.level === level);
        
        return foundProfile || JsonClassStorage.instance.getOneJson(profileName, "level", level);
    }

    static genSimpleHash(input: string): string {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            hash = (hash << 5) - hash + input.charCodeAt(i);
            hash |= 0;
        }
        return (hash >>> 0).toString();
    }

    static async loadLevel(level: number, bundle: any, isRescue: boolean, localBundle: any, localAsset: any): Promise<any> {
        const cacheKey = this.getCacheKey(level, isRescue);
        if (this.memoryCache.has(cacheKey)) {
            return this.memoryCache.get(cacheKey);
        }

        try {
            const remoteUrl = this.getRemoteUrl(level, isRescue);
            const remoteData = await this.loadRemoteJson(remoteUrl);
            if (remoteData) {
                this.memoryCache.set(cacheKey, remoteData);
                return remoteData;
            }
        } catch (error) {
            console.warn("远程关卡加载失败，走本地 fallback");
        }

        return await this.loadLocal(localBundle, localAsset);
    }

    static loadRemoteJson(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            assetManager.loadRemote(url, { ext: ".json" }, (error: Error | null, asset: any) => {
                if (!error && asset) {
                    resolve(asset.json);
                } else {
                    reject(error);
                }
            });
        });
    }

    static loadLocal(bundle: any, assetPath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (bundle) {
                bundle.load(assetPath, JsonAsset, (error: Error | null, asset: JsonAsset | null) => {
                    if (!error && asset) {
                        resolve(asset.json);
                    } else {
                        reject(error);
                    }
                });
            } else {
                reject("bundle not loaded");
            }
        });
    }

    static preloadLevel(level: number, isRescue: boolean): void {
        const cacheKey = this.getCacheKey(level, isRescue);
        if (!this.memoryCache.has(cacheKey)) {
            const remoteUrl = this.getRemoteUrl(level, isRescue);
            assetManager.loadRemote(remoteUrl, { ext: ".json" }, (error: Error | null, asset: any) => {
                if (!error && asset) {
                    const jsonData = asset.json;
                    this.memoryCache.set(cacheKey, jsonData);
                }
            });
        }
    }

    static loadRemoteProfile(): void {
        if (Global.isUseLocalLevel()) {
            if (Global.isForeignGame()) {
                this.profileMain = JsonClassStorage.instance.getTableJson("DifficultyProfile").json;
                this.profileRescue = JsonClassStorage.instance.getTableJson("RescueProfileFB").json;
                this.maxLevel = this.profileMain.length + 1;
                this.maxRescue = this.profileRescue.length;
            } else {
                this.profileMain = JsonClassStorage.instance.getTableJson("DifficultyProfileWx").json;
                this.profileRescue = JsonClassStorage.instance.getTableJson("RescueProfile").json;
                this.maxLevel = this.profileMain.length + 1;
                this.maxRescue = this.profileRescue.length;
            }
        } else {
            const mainProfileUrl = this.getDomain() + "wx/levels/main/DifficultyProfileWx.json?v=" + Date.now();
            const rescueProfileUrl = this.getDomain() + "wx/levels/rescue/RescueProfile.json?v=" + Date.now();

            assetManager.loadRemote(mainProfileUrl, (error: Error | null, asset: any) => {
                if (error) {
                    console.warn("加载远程DifficultyProfileWx失败", error);
                    this.profileMain = JsonClassStorage.instance.getTableJson("DifficultyProfileWx").json;
                    this.maxLevel = this.profileMain.length + 1;
                } else {
                    const jsonData = asset.json;
                    this.profileMain = jsonData;
                    this.maxLevel = this.profileMain.length + 1;
                    console.log("加加载远程DifficultyProfileWx成功");
                }
            });

            assetManager.loadRemote(rescueProfileUrl, (error: Error | null, asset: any) => {
                if (error) {
                    console.warn("加载远程RescueProfile失败", error);
                    this.profileRescue = JsonClassStorage.instance.getTableJson("RescueProfile").json;
                    this.maxRescue = this.profileRescue.length;
                } else {
                    const jsonData = asset.json;
                    this.profileRescue = jsonData;
                    this.maxRescue = this.profileRescue.length;
                    console.log("加加载远程RescueProfile成功");
                }
            });
        }
    }
}