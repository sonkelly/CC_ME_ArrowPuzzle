import { assetManager, JsonAsset, Font, SpriteFrame, Sprite, Texture2D, ImageAsset, AudioClip, Material, Prefab, TextAsset, sp, Node, warn, dragonBones } from "cc";
import { AssetUrlManager } from "./AssetUrlManager";
import { BundleManager } from "./BundleManager";
import { GameLogicConfig } from "./GameLogicConfig";
import { ConfigHelper } from "./ConfigHelper";

const headImgExt = ".head";

function parseHeadImage(url: string, data: any, callback: Function): HTMLImageElement {
    const img = new Image();
    
    function onLoad(): void {
        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
        if (callback) {
            callback(null, img);
        }
    }
    
    function onError(): void {
        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
        if (callback) {
            callback(new Error(url));
        }
    }
    
    if (window.location.protocol !== "file:") {
        img.crossOrigin = "anonymous";
    }
    
    img.addEventListener("load", onLoad);
    img.addEventListener("error", onError);
    img.src = url;
    
    return img;
}

function registerHeadImgLoader(): void {
    assetManager.downloader.register(headImgExt, (url: string, options: any, callback: Function) => {
        callback(null, url);
    });
    
    assetManager.parser.register(headImgExt, parseHeadImage);
    
    assetManager.factory.register(headImgExt, (uuid: string, data: any, options: any, callback: Function) => {
        let texture: Texture2D | null = null;
        let error: Error | null = null;
        
        try {
            texture = new Texture2D();
            texture._uuid = uuid;
            texture._nativeUrl = uuid;
            texture._nativeAsset = data;
            texture.image = new ImageAsset(data);
        } catch (err) {
            error = err as Error;
        }
        
        if (callback) {
            callback(error, texture);
        }
    });
}

export class GameAssetManager {
    static pathAssets: Record<string, Map<string, any>> = Object.create(null);
    static remoteConfig: Map<string, any> = new Map();

    static loadAssetByPath(bundleName: string, path: string, type: any, callback?: Function): Promise<any> {
        return new Promise((resolve: Function, reject: Function) =>{
            if (!GameAssetManager.pathAssets[bundleName]) {
                GameAssetManager.pathAssets[bundleName] = new Map();
            }
            
            let asset = GameAssetManager.pathAssets[bundleName].get(path);
            if (asset && !asset.isValid) {
                asset = null;
            }
            
            if (asset && asset.isValid) {
                if (callback) {
                    callback(1, 1);
                }
                resolve(asset);
                return;
            }
            
            if (path) {
                let finalPath = path;
                if (type === SpriteFrame) {
                    finalPath += "/spriteFrame";
                } else if (type === Texture2D) {
                    finalPath += "/texture";
                } else if (type === TextAsset) {
                    finalPath += ".atlas";
                }
                
                const cachedAsset = GameAssetManager.pathAssets[bundleName].get(finalPath);
                if (cachedAsset && cachedAsset.isValid) {
                    resolve(cachedAsset);
                } else {
                    //if(!BundleManager.instance.getBundle(bundleName)) debugger
                    BundleManager.instance.getBundle(bundleName).load(finalPath, type, 
                        (error: Error | null, data: any) => {
                            if (callback) {
                                callback(error, data);
                            }
                        },
                        (error: Error | null, data: any) => {
                            if (error) {
                                console.warn(bundleName, finalPath, "加载失败");
                                resolve(null);
                            } else {
                                resolve(data);
                                GameAssetManager.pathAssets[bundleName].set(finalPath, data);
                            }
                        }
                    );
                }
            } else {
                console.warn("找不到该资源路径", bundleName, path);
                resolve(null);
            }
        });
    }

    static release(bundleName: string, path: string): void {
        BundleManager.instance.getBundle(bundleName).release(path);
    }

    static releaseDir(bundleName: string, dir: string): void {
        BundleManager.instance.getBundle(bundleName).release(dir);
    }

    static loadAsset(bundleName: string, assetName: string, type: any, customUrl?: string, callback?: Function): Promise<any> {
        const self = this;
        return new Promise((resolve: Function, reject: Function) => {
            const cachedAsset = AssetUrlManager[bundleName].get(assetName);
            if (cachedAsset && cachedAsset.isValid) {
                if (callback) {
                    callback(1, 1);
                }
                resolve(cachedAsset);
                return;
            }
            
            let url = self.getAssetUrl(type);
            if (customUrl) {
                url = customUrl;
            }
            
            const assetData = AssetUrlManager.instance.moduleType[bundleName][url][assetName];
            if (assetData) {
                const parsedPath = self.pathParse(assetData);
                const { bundleName: parsedBundle, path: assetPath, name: assetRealName } = parsedPath;
                
                if (assetPath) {
                    let finalPath = assetPath;
                    if (type === SpriteFrame) {
                        finalPath += "/spriteFrame";
                    } else if (type === Texture2D) {
                        finalPath += "/texture";
                    }
                    
                    const existingAsset = AssetUrlManager[bundleName].get(assetName);
                    if (existingAsset && !existingAsset.isValid) {
                        existingAsset.destroy();
                    }
                    
                    if (existingAsset && existingAsset.isValid) {
                        resolve(existingAsset);
                    } else {
                        BundleManager.instance.getBundle(bundleName).load(finalPath, type,
                            (error: Error | null, data: any) => {
                                if (callback) {
                                    callback(error, data);
                                }
                            },
                            (error: Error | null, data: any) => {
                                if (error) {
                                    console.warn(bundleName, assetName, "加载失败");
                                    reject(error);
                                } else {
                                    resolve(data);
                                    AssetUrlManager[bundleName].set(assetName, data);
                                }
                            }
                        );
                    }
                } else {
                    reject(console.error("找不到该资源路径", bundleName, url, assetName));
                }
            } else {
                console.warn("没有这个东西 ", bundleName, "  ", assetName, "  ", type);
            }
        });
    }

    static loadSpine(bundleName: string, path: string, skeletonComponent?: sp.Skeleton): Promise<sp.Skeleton | null> {
        const self = this;
        return new Promise(async (resolve: Function, reject: Function) => {
            const skeletonData = await self.loadAssetByPath(bundleName, path, sp.SkeletonData);
            
            if (skeletonData) {
                let skeleton = skeletonComponent;
                if (!skeleton) {
                    const node = new Node();
                    skeleton = node.addComponent(sp.Skeleton);
                }
                
                if (skeleton) {
                    skeleton.skeletonData = skeletonData;
                    skeleton.premultipliedAlpha = false;
                }
                
                await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 0));
                resolve(skeleton);
            } else {
                resolve(null);
            }
        });
    }

    static getAsset(bundleName: string, assetName: string): any {
        return AssetUrlManager[bundleName].get(assetName);
    }

    static hasAsset(bundleName: string, assetName: string): boolean {
        return Boolean(AssetUrlManager[bundleName].get(assetName));
    }

    static getAssetByPath(bundleName: string, path: string): any {
        return GameAssetManager.pathAssets[bundleName].get(path);
    }

    static hasAssetByPath(bundleName: string, path: string): boolean {
        return Boolean(GameAssetManager.pathAssets[bundleName].get(path));
    }

    static loadConfDir(configName?: string): Promise<any> {
        if (!configName || AssetUrlManager.instance.moduleType.core.config[configName]) {
            const cachedConfig = AssetUrlManager.core.get(configName);
            if (cachedConfig) {
                return cachedConfig;
            }
            
            return new Promise((resolve, reject) => {
                if (configName) {
                    return GameAssetManager.loadAsset("core", configName, JsonAsset, "config");
                }
                
                const startTime = Date.now();
                BundleManager.instance.getBundle("core").loadDir("config", JsonAsset, 
                    (error: Error | null, assets: any[]) => {
                        if (error) {
                            reject(error);
                        } else {
                            assets.forEach((asset: any) => {
                                AssetUrlManager.core.set(asset.name, asset);
                            });
                            
                            const endTime = Date.now();
                            console.log("加载配置表: " + (endTime - startTime));
                            resolve(assets);
                        }
                    }
                );
            });
        }
        
        console.error("配置: " + configName + " 不存在");
    }

    static loadRemoteImg(url: string, sprite?: Sprite): Promise<SpriteFrame | null> {
        if (url && !url.includes("tapimg")) {
            let ext = ".png";
            if (SDKInstance.isTtPlatform()) {
                ext = ".head";
            }
            
            return new Promise((resolve, reject) => {
                assetManager.loadRemote(url, { ext: ext }, 
                    (error: Error | null, imageAsset: ImageAsset) => {
                        if (error) {
                            warn("图片: " + url + " 加载异常");
                            resolve(null);
                        } else {
                            const spriteFrame = new SpriteFrame();
                            const texture = new Texture2D();
                            texture.image = imageAsset;
                            spriteFrame.texture = texture;
                            
                            if (sprite && sprite.isValid) {
                                sprite.spriteFrame = spriteFrame;
                            }
                            
                            resolve(spriteFrame);
                        }
                    }
                );
            });
        }
    }

    static loadRemoteImgTT(url: string, sprite?: Sprite): Promise<SpriteFrame | null> {
        return new Promise((resolve, reject) => {
            assetManager.loadRemote(url, { ext: ".head" },
                (error: Error | null, texture: Texture2D) => {
                    if (error) {
                        warn("图片: " + url + " 加载异常");
                        resolve(null);
                    } else {
                        const spriteFrame = new SpriteFrame();
                        spriteFrame.texture = texture;
                        
                        if (sprite && sprite.isValid) {
                            sprite.spriteFrame = spriteFrame;
                        }
                        
                        resolve(spriteFrame);
                    }
                }
            );
        });
    }

    static loadRemoteText(url: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            if(url){
                assetManager.loadRemote(url, 
                (error: Error | null, data: any) => {
                    if (error) {
                        warn("文本: " + url + "  加载异常=>" + error);
                    } else {
                        resolve(data.text);
                    }
                }
                );
            }else{
                resolve(null)
            }
            
        });

    }

    static preloadAssest(bundleName: string, assetName: string, type: any, customUrl?: string): Promise<void> {
        const self = this;
        return new Promise((resolve: Function, reject: Function) => {
            const cachedAsset = AssetUrlManager[bundleName].get(assetName);
            if (cachedAsset && cachedAsset.isValid) {
                resolve(cachedAsset);
            } else {
                let url = self.getAssetUrl(type);
                if (customUrl) {
                    url = customUrl;
                }
                
                const assetData = AssetUrlManager.instance.moduleType[bundleName][url][assetName];
                if (!assetData) {
                    console.warn("没有这个东西", bundleName, assetName, type);
                    return;
                }
                
                const parsedPath = self.pathParse(assetData);
                const { bundleName: parsedBundle, path: assetPath, name: assetRealName } = parsedPath;
                
                if (assetPath) {
                    let finalPath = assetPath;
                    if (type === SpriteFrame) {
                        finalPath += "/spriteFrame";
                    } else if (type === Texture2D) {
                        finalPath += "/texture";
                    }
                    
                    BundleManager.instance.getBundle(bundleName).preload(finalPath, type, () => {
                        resolve(null);
                    });
                } else {
                    reject(console.warn("找不到该资源路径", bundleName, url, assetName));
                }
            }
        });
    }

    static changeDragonRes(node: Node | null, dirPath: string, callback?: Function): Promise<any[]> {
        if (dirPath) {
            return new Promise((resolve: Function, reject: Function) => {
                BundleManager.instance.getBundle("game").loadDir(dirPath, 
                    (error: Error | null, assets: any[]) => {
                        if (error) {
                            console.log("load DragonRes " + dirPath + " error: " + error);
                            reject(null);
                        } else if (assets.length <= 0) {
                            console.log("load DragonRes " + dirPath + " fail: no res...");
                            reject(null);
                        } else {
                            if (!node || !node.isValid) {
                                resolve(assets);
                                return;
                            }
                            
                            const armatureDisplay = node.getComponent(dragonBones.ArmatureDisplay);
                            if (armatureDisplay) {
                                armatureDisplay.enabled = false;
                                armatureDisplay.dragonAsset = null;
                                armatureDisplay.dragonAtlasAsset = null;
                                armatureDisplay.armatureName = null;
                                
                                for (const key in assets) {
                                    if (assets[key] instanceof dragonBones.DragonBonesAsset) {
                                        armatureDisplay.dragonAsset = assets[key];
                                    }
                                    if (assets[key] instanceof dragonBones.DragonBonesAtlasAsset) {
                                        armatureDisplay.dragonAtlasAsset = assets[key];
                                    }
                                }
                                
                                armatureDisplay.enabled = true;
                                if (callback) {
                                    callback();
                                }
                            }
                            
                            resolve(assets);
                        }
                    }
                );
            });
        }
    }

    static loadMapConf(configName: string, bundleName: string = "game"): Promise<any> {
        return this.loadAssetByPath(bundleName, configName, JsonAsset);
    }

    static loadRemoteConfig(configName: string): Promise<any> {
        if (configName) {
            if (!configName || AssetUrlManager.instance.moduleType.core.config[configName]) {
                const configVersion = GameLogicConfig.configVersion;
                let cdnPath = "";
                
                ConfigHelper.getGameConfig().gameConfigCDNPath.split("|").forEach((path: string) => {
                    if (path) {
                        const parts = path.split(":");
                        if (parts[0] === configVersion) {
                            cdnPath = parts[1];
                        }
                    }
                });
                
                const remoteUrl = "https://www.quduoduodata.top/ossfile/cocos/RushRPG/game_config/" + 
                    configVersion + "/" + cdnPath + "/" + configName + ".json";
                
                if (GameAssetManager.remoteConfig.has(configName)) {
                    return GameAssetManager.remoteConfig.get(configName);
                }
                
                return new Promise((resolve, reject) => {
                    assetManager.loadRemote(remoteUrl, 
                        (error: Error | null, data: any) => {
                            if (error) {
                                warn("配置: " + remoteUrl + " 加载异常");
                                resolve(null);
                            } else {
                                GameAssetManager.remoteConfig.set(configName, data);
                                resolve(data);
                            }
                        }
                    );
                });
            }

            console.error("配置: " + configName + " 不存在");
            return Promise.reject();

        }else{
            return Promise.reject();
        }
    }

    static async loadRemoteConfDir(): Promise<any[]> {
        const startTime = Date.now();
        console.log("loadRemoteConfDir start ", startTime);
        
        const configKeys = Object.keys(AssetUrlManager.instance.moduleType.core.config);
        const loadedConfigs: any[] = [];
        
        for (const key of configKeys) {
            const config = await GameAssetManager.loadRemoteConfig(key);
            config.name = key;
            loadedConfigs.push(config);
        }
        
        console.log("loadRemoteConfDir end cost", Date.now() - startTime);
        return loadedConfigs;
    }

    static getAssetUrl(type: any): string {
        let url = "";
        
        switch (type) {
            case Prefab:
                url = "prefab";
                break;
            case Material:
                url = "shader";
                break;
            case AudioClip:
                url = "sounds";
                break;
            case ImageAsset:
            case Texture2D:
            case Sprite:
            case SpriteFrame:
                url = "texture";
                break;
            case JsonAsset:
                url = "data";
                break;
            case Font:
                url = "font";
                break;
            default:
                console.warn("没有该资源类型", type);
        }
        
        return url;
    }

    static pathParse(path: string): { bundleName: string; path: string; name: string } {
        const parts = path.split("/");
        let bundleName = "";
        let assetPath = "";
        let name = "";
        
        if (parts.length > 1) {
            bundleName = parts[0];
            assetPath = path.slice(bundleName.length + 1);
            name = parts[parts.length - 1];
        } else {
            bundleName = path;
            assetPath = "";
        }
        
        return {
            bundleName: bundleName,
            path: assetPath,
            name: name
        };
    }
}