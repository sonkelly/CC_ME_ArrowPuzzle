import { view, Node, UITransform, Layers, assetManager, Sprite, SpriteFrame, director, game, Game } from "cc";
import { AbstractPlatformSDK } from "./AbstractPlatformSDK";
import { DefaultNativeTemplate } from "./../DefaultNativeTemplate";
import { AdControlUtils } from "./../Utils/AdControlUtils";
import { EngineUtils } from "./../Utils/EngineUtils";
import { LogUtils } from "./../Utils/LogUtils";

export class DebugSDK extends AbstractPlatformSDK {
    private static _instance: DebugSDK;

    public nativeAdImageData: any;
    public nativeAdIconData: any;
    public nativeAdImagePanelNode: any;
    public nativeAdImageButtonNode: any;
    public nativeAdIconPanelNode: any;
    public nativeAdIconButtonNode: any;
    public nativeAdImageNode: any;
    public nativeAdIntertNode: any;
    public nativeAdIconNode: any;
    public bannerNode: any;
    public customAdNode: any;
    public blockAdNode: any;
    public refreshNativeImageAdTimer: any;
    public intertCloseCallback: any;
    public intertResulectCallback: any;
    public nowNativeImageAdId: string = "";
    public nownativeIconAdId: string = "";
    public nowNativeInsertAdId: string = "";

    constructor() {
        super();
        if (EngineUtils.isCocos()) {
            game.on(Game.EVENT_HIDE, () => {
                this.hideNativeIntert();
                this.hideNativeImage();
            });
        } else {
            Laya.stage.on("visibilitychange", assertThisInitialized(this), () => {
                if (!Laya.stage.isFocused) {
                    this.hideNativeIntert();
                    this.hideNativeImage();
                }
            });
        }
    }

    public static getInstance(): DebugSDK {
        if (this._instance === undefined) {
            this._instance = new DebugSDK();
        }
        return this._instance;
    }

    public getGameVersion(): string {
        return "1.0.0";
    }

    public getNativeAdIconData(): void {
        LogUtils.info("getNativeAdIconData success");
    }

    public reportNativeAdImageShow(adId: string): void {
        LogUtils.info("reportNativeAdImageShow success", adId);
    }

    public reportNativeAdImageClick(adId: string): void {
        LogUtils.info("reportNativeAdImageClick success", adId);
    }

    public reportNativeAdIconShow(adId: string): void {
        LogUtils.info("reportNativeAdIconShow success", adId);
    }

    public reportNativeAdIconClick(adId: string): void {
        LogUtils.info("reportNativeAdIconClick success", adId);
    }

    public reportNativeAdInsertClick(adId: string): void {
        LogUtils.info("reportNativeAdInsertClick success", adId);
    }

    public initAdService(): void {}

    public showVideoAd(params: any = {}): void {
        LogUtils.info("showVideoAd 激励视频");
        if (params.videOnStartCallback) {
            params.videOnStartCallback();
        }
        if (params.videoCallback) {
            params.videoCallback(true);
        }
    }

    public showBannerAd(params: any): void {
        LogUtils.info("showBannerAd 系统banner");
        const imageUrl = ""; //https://www.quduoduodata.top/ossfile/qddSDKRes/native/ad/image.jpg

        if (EngineUtils.isCocos()) {
            const bannerWidth = 0.8 * view.getVisibleSize().width;
            const bannerY = 0.5 * -view.getVisibleSize().height + 65;
            console.log(view.getVisibleSize());

            const bannerNode = new Node();
            bannerNode.name = "bannerNode";
            bannerNode.addComponent(UITransform);
            bannerNode.layer = Layers.Enum.UI_2D;

            assetManager.loadRemote(imageUrl, (error: any, texture: any) => {
                bannerNode.addComponent(Sprite);
                bannerNode.getComponent(Sprite).spriteFrame = SpriteFrame.createWithImage(texture);
                bannerNode.getComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
                bannerNode.getComponent(UITransform).width = bannerWidth;
                bannerNode.getComponent(UITransform).height = 130;
                bannerNode.setPosition(0, bannerY);
                director.getScene().getChildByName("Canvas").addChild(bannerNode);
                this.bannerNode = bannerNode;
            });
        } else {
            const bannerWidth = 0.8 * Laya.stage.width;
            const bannerX = (Laya.stage.width - bannerWidth) / 2;
            const bannerY = Laya.stage.height - 130;

            const bannerNode = new Laya.Sprite();
            bannerNode.name = "bannerNode";

            Laya.loader.load(imageUrl, Laya.Handler.create(this, (texture: any) => {
                if (texture) {
                    bannerNode.graphics.clear();
                    bannerNode.graphics.drawTexture(texture, 0, 0, bannerWidth, 130);
                    bannerNode.visible = true;
                    bannerNode.width = bannerWidth;
                    bannerNode.height = 130;
                    bannerNode.x = bannerX;
                    bannerNode.y = bannerY;
                }
            }), Laya.Handler.create(this, (error: any) => {}), Laya.Loader.IMAGE, 1, false, "res", true);

            const closeNode = new Laya.Sprite();
            closeNode.name = "closeNode";
            bannerNode.addChild(closeNode);
            closeNode.loadImage(""); //https://www.quduoduodata.top/ossfile/qddSDKRes/native/close.png
            closeNode.width = 28;
            closeNode.height = 28;
            closeNode.on("click", this, (event: any) => {
                LogUtils.info("点击了原生大图 关闭按钮");
                bannerNode.removeSelf();
                event.stopPropagation();
            });

            Laya.stage.addChild(bannerNode);
            this.bannerNode = bannerNode;
        }
    }

    public hideBannerAd(): void {
        LogUtils.info("hideBannerAd===");
        if (EngineUtils.isCocos()) {
            if (this.bannerNode) {
                this.bannerNode.removeFromParent();
            }
        } else {
            if (this.bannerNode) {
                this.bannerNode.removeSelf();
            }
        }
    }

    public vibrateShort(): void {}

    public vibrateLong(): void {}

    public showToast(message: string): void {
        LogUtils.info("msg ", message);
    }

    public showNativeImageAd(params: any): void {
        LogUtils.info("showNativeImageAd 原生大图");
        this.nowNativeImageAdId = "";

        const adData = {
            adId: "", //52fe7e1e-67b0-486b-ba42-bc9dd05e9081
            title: "标题",
            desc: "desc",
            imgUrl: "", //https://www.quduoduodata.top/ossfile/qddSDKRes/native/ad/image.jpg
            iconUrl: "" //https://www.quduoduodata.top/ossfile/qddSDKRes/native/ad/image.jpg
        };

        this.hideNativeImage();
        this.nativeAdImagePanelNode = params.panelNode;
        this.nativeAdImageButtonNode = params.buttonNode;

        DefaultNativeTemplate.createNativeAdImageUINode(adData, params, (node: any) => {
            this.nativeAdImageNode = node;
            this.nowNativeImageAdId = adData.adId;
            if (params.resultCallback) {
                params.resultCallback(true);
            }
        }, () => {
            this.nowNativeImageAdId = "";
            if (params.closeCallback) {
                params.closeCallback();
            }
        }, (event: any) => {
            this.nowNativeImageAdId = "";
        });
    }

    public hideNativeImage(): void {
        this.nowNativeImageAdId = "";

        if (this.nativeAdImageNode) {
            if (EngineUtils.isCocos()) {
                this.nativeAdImageNode.removeFromParent();
            } else {
                this.nativeAdImageNode.removeSelf();
            }
        }

        if (this.nativeAdImagePanelNode) {
            this.nativeAdImagePanelNode.active = false;
            if (!EngineUtils.isCocos()) {
                this.nativeAdImagePanelNode.visible = false;
            }
        }

        if (this.nativeAdImageButtonNode) {
            if (this.nativeAdImageButtonNode instanceof Array) {
                for (const buttonNode of this.nativeAdImageButtonNode) {
                    buttonNode.active = false;
                    if (!EngineUtils.isCocos()) {
                        buttonNode.visible = false;
                    }
                }
            } else {
                this.nativeAdImageButtonNode.active = false;
                if (!EngineUtils.isCocos()) {
                    this.nativeAdImageButtonNode.visible = false;
                }
            }
        }
    }

    public showNativeIconAd(params: any): void {
        LogUtils.info("showNativeIconAd 原生icon");
        this.nownativeIconAdId = "";

        const adData = {
            adId: "", //52fe7e1e-67b0-486b-ba42-bc9dd05e9081
            title: "标题",
            desc: "desc",
            imgUrl: "", //https://www.quduoduodata.top/ossfile/qddSDKRes/native/ad/image.jpg
            iconUrl: "" //https://www.quduoduodata.top/ossfile/qddSDKRes/native/ad/image.jpg
        };

        DefaultNativeTemplate.createNativeAdImageUINode(adData, params, (node: any) => {
            this.hideNativeIconAd();
            this.nativeAdIconPanelNode = params.panelNode;
            this.nativeAdIconButtonNode = params.buttonNode;
            this.nativeAdIconNode = node;
            this.nownativeIconAdId = adData.adId;
            if (params.resultCallback) {
                params.resultCallback(true);
            }
        }, () => {
            console.log("创建icon 关闭 回调");
            this.nownativeIconAdId = "";
            if (params.closeCallback) {
                params.closeCallback();
            }
        }, (event: any) => {
            console.log("创建icon 点击 回调");
            this.nownativeIconAdId = "";
        });
    }

    public hideNativeIconAd(): void {
        LogUtils.info("hideNativeIconAd===");
        this.nownativeIconAdId = "";

        if (this.nativeAdIconNode) {
            if (EngineUtils.isCocos()) {
                this.nativeAdIconNode.removeFromParent();
            } else {
                this.nativeAdIconNode.removeSelf();
            }
        }

        if (this.nativeAdIconPanelNode) {
            this.nativeAdIconPanelNode.active = false;
            if (!EngineUtils.isCocos()) {
                this.nativeAdIconPanelNode.visible = false;
            }
        }

        if (this.nativeAdIconButtonNode) {
            if (this.nativeAdIconButtonNode instanceof Array) {
                for (const buttonNode of this.nativeAdIconButtonNode) {
                    buttonNode.active = false;
                    if (!EngineUtils.isCocos()) {
                        buttonNode.visible = false;
                    }
                }
            } else {
                this.nativeAdIconButtonNode.active = false;
                if (!EngineUtils.isCocos()) {
                    this.nativeAdIconButtonNode.visible = false;
                }
            }
        }
    }

    public createNativeIntertUI(params: any): void {
        this.nowNativeInsertAdId = "";

        const adData = {
            adId: "", //52fe7e1e-67b0-486b-ba42-bc9dd05e9081
            title: "标题",
            desc: "desc",
            imgUrl: "", //https://www.quduoduodata.top/ossfile/qddSDKRes/native/ad/image.jpg
            iconUrl: "" //https://www.quduoduodata.top/ossfile/qddSDKRes/native/ad/image.jpg
        };

        DefaultNativeTemplate.createNativeIntertAdUINode(adData, params, (node: any) => {
            this.hideNativeIntert();
            this.nativeAdIntertNode = node;
            this.nowNativeInsertAdId = adData.adId;
            if (this.intertResulectCallback) {
                this.intertResulectCallback(true);
            }
        }, () => {
            this.hideNativeIntert();
            this.autoClickNativeInsertAd();
            this.nowNativeInsertAdId = "";
            if (this.intertCloseCallback) {
                this.intertCloseCallback();
            }
        }, (event: any) => {
            LogUtils.info("点击了广告");
            this.nowNativeInsertAdId = "";
            this.hideNativeIntert();
            if (this.intertCloseCallback) {
                this.intertCloseCallback();
            }
        });
    }

    public hideNativeIntert(): void {
        this.nowNativeInsertAdId = "";
        if (this.nativeAdIntertNode) {
            if (EngineUtils.isCocos()) {
                this.nativeAdIntertNode.removeFromParent();
            } else {
                this.nativeAdIntertNode.removeSelf();
            }
        }
    }

    public addDesktopIcon(params: any = {}): void {
        LogUtils.info("addDesktopIcon success");
        if (params.callbackFunction) {
            params.callbackFunction(true);
        }
    }

    public hasDesktopIcon(params: any = {}): void {
        LogUtils.info("hasDesktopIcon success");
        if (params.callbackFunction) {
            params.callbackFunction(false);
        }
    }

    public showGameBoxBannerAd(): void {}

    public hideGameBoxBannerAd(): void {}

    public showGameBoxPortalAd(): void {}

    public showIntertAd(params: any = {}): void {
        LogUtils.info("showIntertAd");
        const nativeParams = {
            parentNode: params.parentNode
        };
        this.intertResulectCallback = params.resultCallback;
        this.intertCloseCallback = params.closeCallback;
        this.createNativeIntertUI(nativeParams);
    }

    public showBlockAd(params: any): void {
        this.hideBlockAd();
        LogUtils.info("showBlockAd===111");

        const imageUrl = ""; //https://www.quduoduodata.top/ossfile/qddSDKRes/native/ad/image.jpg

        if (EngineUtils.isCocos()) {
            const blockNode = new Node();
            blockNode.layer = Layers.Enum.UI_2D;
            blockNode.addComponent(UITransform);

            assetManager.loadRemote(imageUrl, (error: any, texture: any) => {
                blockNode.addComponent(Sprite);
                blockNode.getComponent(Sprite).spriteFrame = SpriteFrame.createWithImage(texture);
                blockNode.getComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;

                if (params.orientation === "landscape") {
                    blockNode.getComponent(UITransform).width = 70 * params.size;
                    blockNode.getComponent(UITransform).height = 70;
                } else {
                    blockNode.getComponent(UITransform).width = 70;
                    blockNode.getComponent(UITransform).height = 70 * params.size;
                }

                blockNode.setPosition(params.left, params.top);
                director.getScene().getChildByName("Canvas").addChild(blockNode);
                this.blockAdNode = blockNode;
            });
        } else {
            const blockNode = new Laya.Sprite();

            Laya.loader.load(imageUrl, Laya.Handler.create(this, (texture: any) => {
                if (texture) {
                    blockNode.graphics.clear();
                    if (params.orientation === "landscape") {
                        blockNode.graphics.drawTexture(texture, 0, 0, 70 * params.size, 70);
                    } else {
                        blockNode.graphics.drawTexture(texture, 0, 0, 70, 70 * params.size);
                    }
                    blockNode.visible = true;
                    blockNode.x = params.left;
                    blockNode.y = params.top;
                }
            }), Laya.Handler.create(this, (error: any) => {}), Laya.Loader.IMAGE, 1, false, "res", true);

            Laya.stage.addChild(blockNode);
            this.blockAdNode = blockNode;
        }
    }

    public hideBlockAd(): void {
        LogUtils.info("hideBlockAd===");
        if (EngineUtils.isCocos()) {
            if (this.blockAdNode) {
                this.blockAdNode.removeFromParent();
            }
        } else {
            if (this.blockAdNode) {
                this.blockAdNode.removeSelf();
            }
        }
    }

    public showCustomAd(params: any): void {
        this.hideCustomAd();
        LogUtils.info("showCustomAd===");

        const imageUrl = ""; //https://www.quduoduodata.top/ossfile/qddSDKRes/native/ad/image.jpg

        if (EngineUtils.isCocos()) {
            const customNode = new Node();
            customNode.addComponent(UITransform);
            customNode.layer = Layers.Enum.UI_2D;

            assetManager.loadRemote(imageUrl, (error: any, texture: any) => {
                customNode.addComponent(Sprite);
                customNode.getComponent(Sprite).spriteFrame = SpriteFrame.createWithImage(texture);
                customNode.getComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
                customNode.getComponent(UITransform).width = view.getVisibleSize().width;
                customNode.getComponent(UITransform).height = 70;
                customNode.setPosition(params.left, params.top);
                director.getScene().getChildByName("Canvas").addChild(customNode);
                this.customAdNode = customNode;
            });
        } else {
            const customNode = new Laya.Sprite();

            Laya.loader.load(imageUrl, Laya.Handler.create(this, (texture: any) => {
                if (texture) {
                    customNode.graphics.clear();
                    customNode.graphics.drawTexture(texture, 0, 0, Laya.stage.width, 70);
                    customNode.visible = true;
                    customNode.x = params.left;
                    customNode.y = params.top;
                }
            }), Laya.Handler.create(this, (error: any) => {}), Laya.Loader.IMAGE, 1, false, "res", true);

            Laya.stage.addChild(customNode);
            this.customAdNode = customNode;
        }
    }

    public hideCustomAd(): void {
        LogUtils.info("hideCustomAd===");
        if (EngineUtils.isCocos()) {
            if (this.customAdNode) {
                this.customAdNode.removeFromParent();
            }
        } else {
            if (this.customAdNode) {
                this.customAdNode.removeSelf();
            }
        }
    }

    public getPlatformVersionCode(): number {
        return 1000;
    }

    public platformVersionSupport(version: any): boolean {
        return true;
    }

    public autoClickNativeInsertAd(): void {
        if (this.nowNativeInsertAdId && AdControlUtils.autoClickNativeInsertAd()) {
            this.reportNativeAdInsertClick(this.nowNativeInsertAdId);
            this.nowNativeInsertAdId = "";
            this.hideNativeIntert();
        }
    }

    public autoClickNativeAdImage(callback: Function): void {
        if (this.nowNativeImageAdId && AdControlUtils.autoClickNativeAdImage()) {
            callback(true);
            this.reportNativeAdImageClick(this.nowNativeImageAdId);
            this.nowNativeImageAdId = "";
            this.hideNativeImage();
        } else {
            callback(false);
        }
    }

    public autoClickNativeAdIcon(callback: Function): void {
        if (this.nownativeIconAdId && AdControlUtils.autoClickNativeAdIcon()) {
            callback(true);
            this.reportNativeAdIconClick(this.nownativeIconAdId);
            this.nownativeIconAdId = "";
            this.hideNativeIconAd();
        } else {
            callback(false);
        }
    }

    public autoClickVideo(callback: Function): void {
        if (AdControlUtils.autoClickVideo()) {
            callback(true);
        } else {
            callback(false);
        }
    }

    public showRecommendList(params: any = {}): void {
        DefaultNativeTemplate.createRecommendList({
            resultCallback: params.resultCallback,
            parentNode: params.parentNode,
            closeCallback: params.closeCallback,
            recommendGameList: params.recommendGameList,
            toGameCallback: (gameId: string) => {}
        });
    }

    public showRecommendIcon(params: any = { top: 0, left: 0, refreshTime: 5 }): void {
        DefaultNativeTemplate.createRecommendIcon({
            top: params.top,
            left: params.left,
            refreshTime: params.refreshTime,
            toGameCallback: (gameId: string) => {},
            parentNode: params.parentNode
        });
    }

    public getNetworkType(callback: Function): void {
        callback(1);
    }

    public getPlatform(): string {
        return "WEB";
    }
}