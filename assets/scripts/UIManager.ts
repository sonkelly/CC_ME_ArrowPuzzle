import { _decorator, Vec3, Asset, Font, JsonAsset, SpriteFrame, Sprite, Texture2D, ImageAsset, AudioClip, Material, Prefab, find, Widget, instantiate, director, assetManager, Button, EventHandler, tween, v3 } from 'cc';
import { GameLogicConfig } from './GameLogicConfig';
import { LogUtils } from './Utils/LogUtils';
import { AssetUrlManager } from './AssetUrlManager';
import { BasePanel } from './BasePanel';
import { BundleManager } from './BundleManager';
import { UILayerManager } from './UILayerManager';
import { GameAssetManager } from './GameAssetManager';
import { AudioUtils } from './Utils/AudioUtils';
import { EventManager } from './Event/EventManager';
import { ModuleEventKey } from './IGameRawData';

export class UIManager {
    private static _viewStack: Map<string, any> = new Map();
    private static _openStack: Map<string, boolean> = new Map();
    private static _loadingMap: Map<string, boolean> = new Map();
    static default_parent: any = null;
    static default_pos: Vec3 = new Vec3(0, 0, -1);

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

    static loadMoudleAssets(moduleName: string, progressCallback: Function): void {
        const moduleType = AssetUrlManager.instance.moduleType[moduleName];
        const assetPaths: string[] = [];
        const loadPromises: Promise<any>[] = [];
        let loadedCount = 0;
        this.digui(moduleType, assetPaths);
        const totalCount = assetPaths.length;
        for (let i = 0; i < assetPaths.length; i++) {
            const assetPath = assetPaths[i];
            const pathParts = assetPath.split("/");
            const assetType = this.getAssetType(pathParts[1]);
            loadPromises.push(this.loadAsset(moduleName, pathParts[pathParts.length - 1], assetType).then((result: any) => {
                loadedCount++;
                progressCallback(loadedCount / totalCount * 100, false);
            }));
        }
        Promise.all(loadPromises).then((results: any[]) => {
            LogUtils.info(moduleName + "加载完成，准备起飞✈️ ", AssetUrlManager[moduleName]);
            progressCallback(loadedCount / totalCount * 100, true);
        }).catch((error: any) => {
            console.error("加载失败", error);
        });
    }

    private static digui(obj: any, result: string[]): void {
        const entries = Object.entries(obj);
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const value = entry[1];
            if (value instanceof Object) {
                this.digui(value, result);
            } else {
                result.push(value);
            }
        }
    }

    static async loadAsset(moduleName: string, assetName: string, assetType: any): Promise<any> {
        const isLocal = GameLogicConfig.configSource === "local";
        if (moduleName !== "core" || assetType !== JsonAsset || isLocal) {
            return new Promise(async (resolve, reject) => {
                const cachedAsset = AssetUrlManager[moduleName].get(assetName);
                if (cachedAsset && cachedAsset.isValid) {
                    resolve(cachedAsset);
                } else {
                    const urlKey = this.getAssetUrl(assetType);
                    const assetPath = AssetUrlManager.instance.moduleType[moduleName][urlKey][assetName];
                    if (!assetPath) {
                        console.error("没有这个东西", moduleName, assetName, assetType);
                        return;
                    }
                    const parsedPath = this.pathParse(assetPath);
                    const bundleName = parsedPath.bundleName;
                    let relativePath = parsedPath.path;
                    const name = parsedPath.name;
                    if (relativePath) {
                        if (assetType === SpriteFrame) {
                            relativePath += "/spriteFrame";
                        } else if (assetType === Texture2D) {
                            relativePath += "/texture";
                        }
                        BundleManager.instance.getBundle(moduleName).load(relativePath, assetType, (error: Error | null, loadedAsset: any) => {
                            if (error) {
                                console.error(moduleName, assetName, "加载失败");
                                reject(error);
                            } else {
                                resolve(loadedAsset);
                                AssetUrlManager[moduleName].set(assetName, loadedAsset);
                            }
                        });
                    } else {
                        reject(console.error("找不到该资源路径", moduleName, urlKey, assetName));
                    }
                }
            });
        } else {
            return GameAssetManager.loadRemoteConfig(assetName);
        }
    }

    static async loadUrlAsset(bundleName: string, url: string, assetType: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            BundleManager.instance.getBundle(bundleName).load(url, assetType, (error: Error | null, loadedAsset: any) => {
                if (error) {
                    console.error(bundleName, url, "加载失败");
                    reject(error);
                } else {
                    resolve(loadedAsset);
                }
            });
        });
    }

    static loadDirAssets(bundleName: string, dirPath: string, progressCallback: Function): void {
        BundleManager.instance.getBundle(bundleName).loadDir(dirPath, Asset, (completedCount: number, totalCount: number, item: any) => {
            const progress = Math.floor(completedCount / totalCount * 100);
            if (progressCallback) {
                progressCallback(progress, null, false);
            }
        }, (finished: Error | null, assets: any[]) => {
            if (finished) {
                console.error(finished);
            } else {
                for (let i = 0; i < assets.length; i++) {
                    AssetUrlManager[bundleName].set(assets[i].name, assets[i]);
                    if (progressCallback) {
                        progressCallback(100, assets[i], true);
                    }
                }
                if (progressCallback) {
                    progressCallback(100, null, true);
                }
                console.log(dirPath + "加载完成，准备起飞✈️ ", AssetUrlManager[bundleName]);
            }
        });
    }

    static getAssetUrl(assetType: any): string {
        let url = "";
        switch (assetType) {
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
                console.warn("没有该资源类型", assetType);
        }
        return url;
    }

    static getAssetType(typeName: string): any {
        let assetType = null;
        switch (typeName) {
            case "data":
                assetType = JsonAsset;
                break;
            case "font":
                assetType = Font;
                break;
            case "prefab":
                assetType = Prefab;
                break;
            case "shader":
                assetType = Material;
                break;
            case "sounds":
                assetType = AudioClip;
                break;
            case "texture":
                assetType = SpriteFrame;
                break;
            default:
                console.error("没有这个属性哦");
        }
        return assetType;
    }

    static isShow(viewName: string): boolean {
        return !!this._viewStack.has(viewName);
    }

    static isLoad(viewName: string): boolean {
        let node = UILayerManager.instance.UIMenuLayer.getChildByName(viewName);
        if (!!node) {
            return true;
        }
        node = UILayerManager.instance.UILayer.getChildByName(viewName);
        return node != null;
    }

    static getTopView(): any {
        const uiLayerChildren = UILayerManager.instance.UILayer.children;
        for (let i = uiLayerChildren.length - 1; i >= 0; i--) {
            const child = uiLayerChildren[i];
            if (child.name !== "TipsFrame" && child.active) {
                return child;
            }
        }
        const uiMenuLayerChildren = UILayerManager.instance.UIMenuLayer.children;
        for (let i = uiMenuLayerChildren.length - 1; i >= 0; i--) {
            const child = uiMenuLayerChildren[i];
            if (child.name !== "TipsFrame" && child.active) {
                return child;
            }
        }
        return null;
    }

    static getTopView2(): any {
        const uiLayerChildren = UILayerManager.instance.UILayer.children;
        const excludeNames = ["GoldHallNaviView", "GalleryView", "CavernMainView", "InvasionMainView", "SmelterView", "GodlyCopyView", "MazeView", "SailMainView", "SailIntanceView", "BagView", "PvpMainView", "ArenaMainView", "MallHallNaviView", "FundView", "WeekActiveView", "RuneTreeMainView", "RuneView", "SpecialMainView", "EquipNaviView", "FlagView", "PetMainView", "DailyDealView", "WorldBossView"];
        for (let i = uiLayerChildren.length - 1; i >= 0; i--) {
            const child = uiLayerChildren[i];
            if (excludeNames.includes(child.name) && child.active) {
                return child;
            }
        }
        const uiMenuLayerChildren = UILayerManager.instance.UIMenuLayer.children;
        for (let i = uiMenuLayerChildren.length - 1; i >= 0; i--) {
            const child = uiMenuLayerChildren[i];
            if (child.name !== "TipsFrame" && child.active) {
                return child;
            }
        }
        return null;
    }

    static closeAllView(): void {
        console.log("closeAllView====================");
        const uiLayerChildren = UILayerManager.instance.UILayer.children;
        for (let i = 0; i < uiLayerChildren.length; i++) {
            const child = uiLayerChildren[i];
            if (child && this.isShow(child.name)) {
                console.log("closeAllView: ", child.name);
                this.deleteNode(child.name);
            }
        }
    }

    static getPanelScript(viewName: string): any {
        const node = this._viewStack.get(viewName);
        return node ? node.getComponent(BasePanel) : null;
    }

    static async waitOneFrame(): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, 1000 / 60));
    }

    static async createPanel(moduleName: string, panelName: string, options: any = {}): Promise<any> {
        await this.waitOneFrame();
        return new Promise(async (resolve, reject) => {
            const nodeParent = options.nodeParent !== undefined ? options.nodeParent : this.default_parent;
            let position = options.position !== undefined ? options.position : this.default_pos;
            const angle = options.angle !== undefined ? options.angle : 0;
            const setData = options.setData;
            const showAnimation = options.showAnimation !== undefined ? options.showAnimation : false;
            const isLoading = options.isLoading;
            const openFunction = options.openFuncion !== undefined ? options.openFuncion : null;
            const closeFunction = options.closeFuncion !== undefined ? options.closeFuncion : null;
            let parent = nodeParent;
            if (!parent) {
                parent = find("Canvas/Camera");
            }
            const panelKey = panelName;
            const panelKeyStr = String(panelKey);
            if (this._loadingMap.get(panelKeyStr)) {
                this._loadingMap.delete(panelKeyStr);
                resolve(null);
                return;
            }
            this._loadingMap.set(panelKeyStr, true);
            const timeoutId = setTimeout(() => {
                if (!SDKInstance.isKsPlatform()) {
                    this._loadingMap.delete(panelKeyStr);
                    this._viewStack.delete(panelKey);
                    this._openStack.delete(panelKey);
                    resolve(null);
                }
            }, 11000);
            try {
                let newNode = null;
                if (this._viewStack.has(panelName)) {
                    newNode = this._viewStack.get(panelKey);
                    clearTimeout(timeoutId);
                    resolve(newNode);
                    console.warn("模块：" + moduleName + "名字：" + panelName + "的预制重复创建");
                    return;
                }
                this._openStack.set(panelKey, true);
                this._viewStack.set(panelKey, null);
                const cleanup = () => {
                    clearTimeout(timeoutId);
                    this._loadingMap.delete(panelKeyStr);
                    this._viewStack.delete(panelKey);
                    this._openStack.delete(panelKey);
                };
                if (AssetUrlManager[moduleName].has(panelName) && AssetUrlManager[moduleName].get(panelName).isValid) {
                    newNode = this.instantiate(panelName, AssetUrlManager[moduleName].get(panelName));
                } else {
                    try {
                        const loadPromise = GameAssetManager.loadAsset(moduleName, panelKey, Prefab);
                        const timeoutPromise = new Promise((resolve, reject) => setTimeout(() => reject("Load Timeout1"), 10000));
                        const loadedPrefab = await Promise.race([loadPromise, timeoutPromise]);
                        if (!this._openStack.has(panelKey)) {
                            cleanup();
                            reject("[UI] " + panelKeyStr + " canceled");
                            return;
                        }
                        newNode = this.instantiate(panelName, loadedPrefab);
                    } catch (error) {
                        cleanup();
                        reject(error);
                        return;
                    }
                }
                if (newNode == null || !newNode.isValid) {
                    cleanup();
                    reject("[UI] " + panelKeyStr + " create failed");
                    return;
                }
                if (!this._openStack.has(panelKey)) {
                    newNode.destroy();
                    cleanup();
                    return;
                }
                this._viewStack.set(panelKey, newNode);
                newNode.openFuncion = openFunction;
                newNode.closeFuncion = closeFunction;
                const panelScript = newNode.getComponent(panelName);
                if (panelScript) {
                    panelScript.panelName = panelKeyStr;
                }
                const closeButton = find("all/close", newNode);
                if (closeButton && closeButton.isValid && !closeButton.getComponent(Button)) {
                    const buttonComponent = closeButton.addComponent(Button);
                    buttonComponent.transition = Button.Transition.SCALE;
                    const eventHandler = new EventHandler();
                    eventHandler.target = newNode;
                    eventHandler.component = newNode.name;
                    eventHandler.handler = "clickClose";
                    if (panelScript && !panelScript.clickClose) {
                        panelScript.clickClose = () => {
                            AudioUtils.btn_close_sound();
                            this.deleteNode(panelKey);
                        };
                    }
                    buttonComponent.clickEvents.push(eventHandler);
                }
                if (setData !== undefined) {
                    if (panelScript && panelScript.setData) {
                        panelScript.setData(setData);
                    } else {
                        console.warn("没有setData函数", newNode.name);
                    }
                }
                if (newNode.openFuncion) {
                    newNode.openFuncion();
                }
                if (parent && parent.isValid) {
                    newNode.parent = parent;
                }
                if (panelScript && panelScript.onShow) {
                    panelScript.onShow();
                }
                if (panelScript && panelScript.adapted) {
                    panelScript.adapted();
                }
                this.updateWidgets(newNode);
                if (showAnimation) {
                    let animNode = find("all", newNode);
                    if (!animNode) {
                        animNode = find("container", newNode);
                    }
                    if (animNode && animNode.isValid) {
                        tween(animNode)
                            .set({ scale: v3(0, 0, 0) })
                            .to(0.25, { scale: v3(1, 1, 1) }, { easing: "backOut" })
                            .start();
                    }
                }
                AudioUtils.btn_open_sound();
                newNode.position = position;
                newNode.angle = angle;
                clearTimeout(timeoutId);
                this._loadingMap.delete(panelKeyStr);
                resolve(newNode);
            } catch (error) {
                this._viewStack.delete(panelKey);
                this._openStack.delete(panelKey);
                reject(error);
            } finally {
                clearTimeout(timeoutId);
                this._loadingMap.delete(panelKeyStr);
            }
        });
    }

    static updateWidgets(node: any): void {
        const camera = find("Canvas/Camera") || find("game-canvas/game-camera");
        const originalPosition = camera.position.clone();
        const widgets = node.getComponentsInChildren(Widget);
        for (const widget of widgets) {
            if (widget.enabled) {
                widget.updateAlignment();
                widget.enabled = false;
            }
        }
        camera.position = originalPosition;
    }

    static instantiate(name: string, prefab: any): any {
        const newNode = instantiate(prefab);
        const basePanel = this.getBasePanel(newNode);
        if (basePanel) {
            basePanel.autoReleaseRes(prefab);
            return newNode;
        } else {
            console.warn("节点创建成功，但是未拥有自动释放资源功能" + newNode.name);
            return newNode;
        }
    }

    static getBasePanel(node: any, addIfMissing: boolean = true): any {
        if (node) {
            const basePanel = node.getComponent(BasePanel);
            if (!basePanel && addIfMissing) {
                return node.addComponent(BasePanel);
            }
            return basePanel;
        }
        return null;
    }

    static assignWith(sourceNode: any, targetNode: any): any {
        const basePanel = this.getBasePanel(targetNode);
        if (basePanel && sourceNode) {
            basePanel.autoReleaseRes(sourceNode);
            return sourceNode;
        } else {
            console.error("AssignWith " + sourceNode + " to " + targetNode + " faile");
            return null;
        }
    }

    static deleteNode(viewName: string, options: any = {}): void {
        const hideAnimation = options.hideAnimation;
        if (this._openStack.has(viewName)) {
            this._openStack.delete(viewName);
        }
        this._loadingMap.delete(viewName);
        if (this._viewStack.has(viewName)) {
            const node = this._viewStack.get(viewName);
            this._viewStack.delete(viewName);
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ON_PANEL_HIDE, viewName);
            if (!node || !node.isValid) {
                return;
            }
            if (node.closeFuncion) {
                node.closeFuncion();
            }
            find("all", node);
            this._deleteNode(node, viewName);
        } else {
            console.warn("局部缓存中没有 " + viewName + " 节点");
        }
    }

    static deleteNodeIgnoreNodeList(keepNodeList: string[]): void {
        const keys = this._viewStack.keys();
        for (const key of keys) {
            if (!keepNodeList.includes(key)) {
                const node = this._viewStack.get(key);
                if (!node || !node.isValid) {
                    return;
                }
                if (node.closeFuncion) {
                    node.closeFuncion();
                }
                find("all", node);
                this._deleteNode(node, key);
            }
        }
    }

    private static _deleteNode(node: any, viewName: string): void {
        if (node && node.isValid) {
            const component = node.getComponent(node.name);
            if (component && component.onHide) {
                component.onHide();
            }
            if (node && node.isValid) {
                this._viewStack.delete(viewName);
                node.destroy();
            }
        }
    }

    static replaceScene(sceneName: string, callback: Function, releaseAssets: boolean = false): void {
        const currentSceneName = director.getScene().name.split("Scene")[0];
        director.loadScene(sceneName, () => {
            this.deleteAll();
            if (releaseAssets) {
                for (let i = 0; i < AssetUrlManager.moduleArr.length; i++) {
                    const moduleName = AssetUrlManager.moduleArr[i];
                    if (moduleName === currentSceneName) {
                        AssetUrlManager[moduleName].forEach((value: any, key: string) => {
                            assetManager.releaseAsset(value);
                        });
                    }
                }
            }
            const sceneScript = find("Canvas").getComponent(sceneName);
            if (sceneScript && sceneScript.onShow) {
                sceneScript.onShow();
            } else {
                console.warn("Scene没有onShow函数", sceneName);
            }
            if (callback) {
                callback();
            }
        });
    }

    static preloadScene(sceneName: string, onProgress: Function, onLoaded: Function): void {
        director.preloadScene(sceneName, onProgress, onLoaded);
    }

    static deleteAll(): void {
        this._viewStack.forEach((node: any, viewName: string, map: Map<string, any>) => {
            if (node && node.isValid) {
                this.deleteNode(viewName, { hideAnimation: false });
            } else {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ON_PANEL_HIDE, viewName);
            }
        });
        this._viewStack.clear();
    }
}