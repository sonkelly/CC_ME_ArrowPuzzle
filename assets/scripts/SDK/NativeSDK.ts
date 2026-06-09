import { _decorator, Component, Node } from 'cc';
import { ConfigHelper } from "./../ConfigHelper";
import { AbstractPlatformSDK } from "./AbstractPlatformSDK";
import { DefaultNativeTemplate } from "./../DefaultNativeTemplate";
import { LogUtils } from "./../Utils/LogUtils";
import { PlatformUtils } from "./../Utils/PlatformUtils";
import { EngineUtils } from "./../Utils/EngineUtils";
import { AdControlUtils } from "./../Utils/AdControlUtils";
import { EventHelper } from "./../Event/EventHelper";
import { AdEventKey } from "./../Event/AdEventKey";
import { StringUtils } from "./../Utils/StringUtils";
import { StoreUtils, Type } from "./../Utils/StoreUtils";

const { ccclass, property } = _decorator;

@ccclass('NativeSDK')
export class NativeSDK extends AbstractPlatformSDK {
    private static _instance: NativeSDK;
    
    private bridge: any;
    private platform: any;
    private nativeAdUrl: string;
    private nativeTitle: string;
    private nativeDesc: string;
    private nativeIconAdUrl: string;
    private nativeIconTitle: string;
    private nativeIconDesc: string;
    private nativeInterUrl: string;
    private nativeInterTitle: string;
    private nativeInterDesc: string;
    private videoCallback: Function;
    private nativeAdImagePanelNode: any;
    private nativeAdImageNode: any;
    private nativeAdIntertNode: any;
    private nativeAdIconPanelNode: any;
    private nativeAdIconNode: any;
    private xiaoMiSysInsterShowTime: number = 0;
    private xiaoMiInsterShowTime: number = 0;
    private videoLocation: string;
    private intertShowTotalNumber: number = 0;

    constructor() {
        super();
        this.bridge = undefined;
        this.platform = undefined;
        this.nativeAdUrl = undefined;
        this.nativeTitle = undefined;
        this.nativeDesc = undefined;
        this.nativeIconAdUrl = undefined;
        this.nativeIconTitle = undefined;
        this.nativeIconDesc = undefined;
        this.nativeInterUrl = undefined;
        this.nativeInterTitle = undefined;
        this.nativeInterDesc = undefined;
        this.videoCallback = undefined;
        this.nativeAdImagePanelNode = undefined;
        this.nativeAdImageNode = undefined;
        this.nativeAdIntertNode = undefined;
        this.nativeAdIconPanelNode = undefined;
        this.nativeAdIconNode = undefined;
        this.xiaoMiSysInsterShowTime = 0;
        this.xiaoMiInsterShowTime = 0;
        this.videoLocation = undefined;
        this.intertShowTotalNumber = 0;

        LogUtils.info("NativeSDK constructor 注册全局变量");
        this.intertShowTotalNumber = StoreUtils.getInstance().get(StoreUtils.intertShowTotalNumber, Type.Int, 0);

        if (PlatformUtils.isIOS()) {
            this.bridge = window.PlatformClass.createClass("JSBridge");
        } else {
            this.bridge = window.PlatformClass.createClass("demo.JSBridge");
        }

        if (PlatformUtils.isAndroid()) {
            this.bridge.call("initNativeAds");
        }

        /*window.setNativeImgUrl = (url: string) => {
            this.nativeAdUrl = StringUtils.removeTheParameters(url);
            console.log("get nativeAd image url from java: " + this.nativeAdUrl);
        };

        window.setNativeTitle = (title: string) => {
            this.nativeTitle = title;
            console.log("get setNativeTitle from java: " + this.nativeTitle);
        };

        window.setNativeDesc = (desc: string) => {
            this.nativeDesc = desc;
            console.log("get setNativeDesc from java: " + this.nativeDesc);
        };

        window.setNativeIconUrl = (url: string) => {
            this.nativeIconAdUrl = StringUtils.removeTheParameters(url);
            console.log("get nativeAd icon url from java: " + this.nativeIconAdUrl);
        };

        window.setNativeIconTitle = (title: string) => {
            this.nativeIconTitle = title;
            console.log("get NativeIconTitle from java: " + this.nativeIconTitle);
        };

        window.setNativeIconDesc = (desc: string) => {
            this.nativeIconDesc = desc;
            console.log("get NativeIconDesc from java: " + this.nativeIconDesc);
        };

        window.setNativeInterUrl = (url: string) => {
            this.nativeInterUrl = StringUtils.removeTheParameters(url);
            console.log("get nativeInterUrl url from java: " + this.nativeInterUrl);
        };

        window.setNativeInterTitle = (title: string) => {
            this.nativeInterTitle = title;
            console.log("get nativeInterTitle from java: " + this.nativeInterTitle);
        };

        window.setNativeInterDesc = (desc: string) => {
            this.nativeInterDesc = desc;
            console.log("get nativeInterDesc from java: " + this.nativeInterDesc);
        };

        window.videoShowSuccess = () => {
            Laya.SoundManager.muted = true;
        };

        window.videoShowComplete = (success: boolean) => {
            console.log("videoShowComplete: " + success);
            Laya.SoundManager.muted = false;
            if (this.videoCallback) {
                if (success) {
                    EventHelper.getInstance().videoComplete(this.videoLocation);
                } else {
                    EventHelper.getInstance().videoNotFinished(this.videoLocation);
                }
                this.videoCallback(success);
            }
        };

        window.closeInsertAd = () => {
            console.log("closeInsertAd =====");
        };

        window.insertAdonShow = () => {
            console.log("insertAdonShow=====");
        };*/
    }

    public static getInstance(): NativeSDK {
        if (this._instance === undefined) {
            this._instance = new NativeSDK();
        }
        return this._instance;
    }

    public initAdService(): void {
        LogUtils.info("NativeSDK initAdService ===");
        window.conch.setOnBackPressedFunction(() => {
            if (PlatformUtils.isXiaoMiNative()) {
                this.showInsertVideoAd();
            }
            this.exitGame();
        });
    }

    public showBannerAd(params: any = {}): void {
        LogUtils.info("showBannerAd ===");
        if (AdControlUtils.isShowBanner()) {
            this.bridge.call("showBannerAd");
            EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.sysBanner + "_" + AdEventKey.showSuccess);
        }
    }

    public hideBannerAd(): void {
        LogUtils.info("hideBannerAd ===");
        this.bridge.call("hideBannerAd");
    }

    public showIntertAd(params: any = {}): void {
        LogUtils.info("showIntertAd ===");
        if (AdControlUtils.isShowInter() === false) {
            return;
        }

        EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.sysInter + "_" + AdEventKey.showSuccess);

        if (PlatformUtils.isXiaoMiNative()) {
            const currentTime = new Date().getTime();
            if (currentTime - this.xiaoMiInsterShowTime < 5000) {
                return;
            }
            this.xiaoMiInsterShowTime = currentTime;
            if (currentTime - this.xiaoMiSysInsterShowTime > 30000) {
                setTimeout(() => {
                    this.bridge.call("showIntersAd");
                    AdControlUtils.setShowInterTime();
                }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
                this.xiaoMiSysInsterShowTime = currentTime;
            } else {
                this.showNativeInsertAd(params);
            }
            return;
        }

        if (PlatformUtils.isHuaWeiAbroadNative() || PlatformUtils.isHuaWeiNative()) {
            if (ConfigHelper.getGameConfig().systemInsertSwitch && ConfigHelper.getGameConfig().nativeInsertSwitch) {
                if (this.intertShowTotalNumber < ConfigHelper.getGameConfig().systemInsertToNativeInsertNumber) {
                    setTimeout(() => {
                        this.bridge.call("showIntersAd");
                        AdControlUtils.setShowInterTime();
                    }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
                } else {
                    this.showNativeInsertAd(params);
                }
                this.intertShowTotalNumber++;
                StoreUtils.getInstance().set(StoreUtils.intertShowTotalNumber, Type.Int, this.intertShowTotalNumber);
            } else if (ConfigHelper.getGameConfig().nativeInsertSwitch) {
                this.showNativeInsertAd(params);
            } else if (ConfigHelper.getGameConfig().systemInsertSwitch) {
                setTimeout(() => {
                    this.intertShowTotalNumber++;
                    StoreUtils.getInstance().set(StoreUtils.intertShowTotalNumber, Type.Int, this.intertShowTotalNumber);
                    this.bridge.call("showIntersAd");
                    AdControlUtils.setShowInterTime();
                }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
            }
        } else {
            if (params.showSysInterAd) {
                setTimeout(() => {
                    this.bridge.call("showIntersAd");
                    AdControlUtils.setShowInterTime();
                }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
            } else {
                this.showNativeInsertAd(params);
            }
        }
    }

    public showVideoAd(params: any = {}): void {
        LogUtils.info("showVideoAd ===");
        if (AdControlUtils.isShowVideo() === false) {
            this.showToast("当前暂无可播放广告");
            if (params.videoCallback) {
                params.videoCallback(false);
            }
            return;
        }

        this.videoLocation = params.adLocation;
        EventHelper.getInstance().videoStartEvent(this.videoLocation);
        this.videoCallback = params.videoCallback;

        this.bridge.callWithBack(() => {
            if (PlatformUtils.isIOS() && this.videoCallback) {
                EventHelper.getInstance().videoComplete(this.videoLocation);
                this.videoCallback(true);
            }
            AdControlUtils.setShowVideoTime();
        }, "showVideoAd");
    }

    public autoClickVideo(callback: Function): void {
        if (PlatformUtils.isFourThreeNineNineNative() && AdControlUtils.autoClickVideo()) {
            callback(true);
        } else {
            callback(false);
        }
    }

    public showInsertVideoAd(params: any = {}): void {
        LogUtils.info("showInsertVideoAd ===");
        if (AdControlUtils.isShowInterVideo() !== false) {
            setTimeout(() => {
                this.bridge.call("showInsertVideoAd");
                AdControlUtils.setShowInterVideoTime();
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
            EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.insertVideo + "_" + AdEventKey.showSuccess);
        }
    }

    public showNativeImageAd(params: any): void {
        LogUtils.info("showNativeImageAd ===");
        if (AdControlUtils.isShowNativeAd() === false) {
            return;
        }

        const originalParams = params;

        if (PlatformUtils.isOppoNative()) {
            if (this.nativeIsValid()) {
                if (this.nativeAdUrl === "" || this.nativeAdUrl === undefined) {
                    if (params.resultCallback) {
                        params.resultCallback(false);
                    }
                    this.loadNativeAd();
                    LogUtils.info("展示原生广告失败， url为空！！！");
                    return;
                }

                this.hideNativeImage();
                LogUtils.info("showNativeImageAd  hideNativeImage ===");
                this.nativeAdImagePanelNode = params.panelNode;

                const adData = {
                    adId: "",
                    title: this.nativeTitle,
                    desc: this.nativeDesc,
                    imgUrl: this.nativeAdUrl,
                    iconUrl: this.nativeAdUrl
                };
                this.nativeAdUrl = undefined;

                const currentParams = params;
                LogUtils.info("showNativeImageAd  createNativeAdImageUINode ===");
                DefaultNativeTemplate.createNativeAdImageUINode(adData, currentParams, (node: any) => {
                    LogUtils.info("createNativeAdImageUINode success 回调");
                    this.nativeAdImageNode = node;
                    this.reportNativeAdImageShow();
                    if (originalParams.resultCallback) {
                        originalParams.resultCallback(true);
                    }
                    AdControlUtils.setShowNativeAdTime();
                    EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeImage + "_" + AdEventKey.showSuccess);
                }, () => {
                    LogUtils.info("点击了关闭回调");
                    if (originalParams.closeCallback) {
                        originalParams.closeCallback();
                    }
                }, () => {
                    LogUtils.info("点击了广告");
                    this.reportNativeAdImageClick();
                });
            } else {
                LogUtils.info("showNativeImageAd fail.");
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            }
        } else {
            if (params.width || params.height) {
                params.width = params.parentNode.width;
                params.height = params.parentNode.height;
            }

            let point = new Laya.Point(params.parentNode.x, params.parentNode.y);
            let globalPoint = params.parentNode.parent.localToGlobal(point);

            if (params.parentNode.parent) {
                const parentNode = params.parentNode.parent;
                params.width = parentNode.width;
                params.height = parentNode.height / Laya.stage.height;
                point = new Laya.Point(parentNode.x, parentNode.y);
                globalPoint = parentNode.parent.localToGlobal(point);
            }

            LogUtils.info("showNativeAd", globalPoint.x / Laya.stage.width, globalPoint.y / Laya.stage.height, params.width / Laya.stage.width, params.height / Laya.stage.height);
            this.bridge.call("showNativeAd", globalPoint.x / Laya.stage.width, globalPoint.y / Laya.stage.height, params.width / Laya.stage.width, params.height / Laya.stage.height);
            AdControlUtils.setShowNativeAdTime();
            if (params.resultCallback) {
                params.resultCallback(true);
            }
            EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeImage + "_" + AdEventKey.showSuccess);
        }
    }

    public nativeIsValid(): boolean {
        LogUtils.info("nativeIsValid ===");
        return PlatformUtils.isAndroid() && this.bridge.call("nativeIsValid");
    }

    public loadNativeAd(): void {
        LogUtils.info("loadNativeAd ===");
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("loadNative");
        }
    }

    public hideNativeImage(): void {
        LogUtils.info("hideNativeImage ===");
        if (PlatformUtils.isOppoNative()) {
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
        } else {
            this.bridge.call("hideNativeAd");
        }
    }

    public showNativeIconAd(params: any): void {
        LogUtils.info("showNativeIconAd ===");
        if (AdControlUtils.isShowNativeAd() === false) {
            return;
        }

        const originalParams = params;

        if (PlatformUtils.isOppoNative()) {
            if (!EngineUtils.isCocos() && params.parentNode) {
                params.parentNode.offAll();
            }

            if (this.nativeIconIsValid()) {
                if (this.nativeIconAdUrl === "" || this.nativeIconAdUrl === undefined) {
                    if (params.resultCallback) {
                        params.resultCallback(false);
                    }
                    LogUtils.info("展示原生ICON广告失败， url为空！！！");
                    this.loadNativeIconAd();
                    return;
                }

                this.hideNativeIconAd();

                const adData = {
                    adId: "",
                    title: this.nativeIconTitle,
                    desc: this.nativeIconDesc,
                    imgUrl: this.nativeIconAdUrl,
                    iconUrl: this.nativeIconAdUrl
                };

                DefaultNativeTemplate.createNativeAdImageUINode(adData, params, (node: any) => {
                    LogUtils.info("createNativeAdIconUINode success 回调");
                    this.hideBannerAd();
                    this.hideNativeIconAd();
                    this.nativeAdIconPanelNode = originalParams.panelNode;
                    this.nativeAdIconNode = node;
                    this.reportNativeAdIconShow();
                    if (originalParams.resultCallback) {
                        originalParams.resultCallback(true);
                    }
                    AdControlUtils.setShowNativeAdTime();
                    EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeIcon + "_" + AdEventKey.showSuccess);
                }, () => {
                    LogUtils.info("createNativeAdIconUINode close 回调");
                    if (originalParams.closeCallback) {
                        originalParams.closeCallback();
                    }
                }, () => {
                    LogUtils.info("createNativeAdIconUINode click 回调");
                    this.reportNativeAdIconClick();
                });
            } else {
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            }
        } else {
            this.showNativeImageAd(params);
        }
    }

    public nativeIconIsValid(): boolean {
        LogUtils.info("nativeIconIsValid ===");
        return PlatformUtils.isAndroid() && this.bridge.call("nativeIconIsValid");
    }

    public loadNativeIconAd(): void {
        LogUtils.info("loadNativeIconAd ===");
        this.bridge.call("loadNativeIcon");
    }

    public hideNativeIconAd(): void {
        LogUtils.info("hideNativeIconAd ===");
        if (PlatformUtils.isOppoNative()) {
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
        } else {
            this.bridge.call("hideNativeAd");
        }
    }

    public showNativeInsertAd(params: any = {}): void {
        LogUtils.info("showNativeInsertAd ===");
        if (AdControlUtils.isShowInter() === false) {
            return;
        }

        EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeInsert + "_" + AdEventKey.showSuccess);

        if (PlatformUtils.isOppoNative()) {
            if (this.nativeInterUrl === "" || this.nativeInterUrl === undefined || !this.nativeInterIsValid()) {
                LogUtils.info("展示原生插屏广告失败， url为空！！");
                this.loadNativeInterAd();
                setTimeout(() => {
                    this.bridge.call("showIntersAd");
                    AdControlUtils.setShowInterTime();
                }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
                return;
            }

            const adParams = {
                parentNode: params.parentNode
            };

            setTimeout(() => {
                if (this.nativeInterUrl) {
                    this.hideBannerAd();
                    this.hideNativeImage();

                    const adData = {
                        adId: "",
                        title: this.nativeInterTitle,
                        desc: this.nativeInterDesc,
                        imgUrl: this.nativeInterUrl,
                        iconUrl: this.nativeInterUrl
                    };
                    this.nativeInterUrl = undefined;

                    DefaultNativeTemplate.createNativeIntertAdUINode(adData, adParams, (node: any) => {
                        LogUtils.info("createNativeIntertAdUINode success 回调");
                        this.hideNativeIntert();
                        this.nativeAdIntertNode = node;
                        if (params.resultCallback) {
                            params.resultCallback(true);
                        }
                        this.nativeInterAdReportShow();
                        AdControlUtils.setShowInterTime();
                    }, () => {
                        LogUtils.info("点击了关闭回调");
                        this.autoClickNativeInsertAd();
                        if (params.closeCallback) {
                            params.closeCallback();
                        }
                    }, () => {
                        LogUtils.info("点击了广告");
                        this.nativeInterAdReportClick();
                    });
                }
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
        } else {
            setTimeout(() => {
                if (PlatformUtils.isIOS()) {
                    this.bridge.call("showNativeInterAd:", AdControlUtils.autoClickNativeInsertAd());
                } else {
                    this.bridge.call("showNativeInterAd", AdControlUtils.autoClickNativeInsertAd());
                }
                AdControlUtils.setShowInterTime();
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
        }
    }

    public hideNativeIntert(): void {
        LogUtils.info("hideNativeIntert ===");
        if (this.nativeAdIntertNode) {
            if (EngineUtils.isCocos()) {
                this.nativeAdIntertNode.removeFromParent();
            } else {
                this.nativeAdIntertNode.removeSelf();
            }
        }
    }

    public nativeInterIsValid(): boolean {
        LogUtils.info("nativeInterIsValid ===");
        return PlatformUtils.isAndroid() && this.bridge.call("nativeInterIsValid");
    }

    public nativeInterAdReportShow(): void {
        LogUtils.info("nativeInterAdReportShow ===");
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("nativeInterAdReportShow");
        }
    }

    public nativeInterAdReportClick(): void {
        LogUtils.info("nativeInterAdReportClick ===");
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("nativeInterAdReportClick");
        }
    }

    public loadNativeInterAd(): void {
        LogUtils.info("loadNativeInterAd ===");
        if (PlatformUtils.isAndroid()) {
            return this.bridge.call("loadNativeInterAd");
        }
    }

    public vibrateShort(): void {
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("vibrate", false);
        } else if (PlatformUtils.isIOS()) {
            this.bridge.call("myVibrat");
        }
    }

    public vibrateLong(): void {
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("vibrate", true);
        } else if (PlatformUtils.isIOS()) {
            this.bridge.call("myVibrat");
        }
    }

    public showToast(message: string): void {
        LogUtils.info("showToast ===");
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("showToast", message);
        } else if (PlatformUtils.isIOS()) {
            this.bridge.call("showToast:", message);
        }
    }

    public getNativeAdImageData(): any {
        return {
            adId: "",
            title: this.nativeTitle,
            desc: this.nativeDesc,
            imgUrl: this.nativeAdUrl,
            iconUrl: this.nativeAdUrl
        };
    }

    public getNativeAdIconData(): any {
        return {
            adId: "",
            title: this.nativeIconTitle,
            desc: this.nativeIconDesc,
            imgUrl: this.nativeIconAdUrl,
            iconUrl: this.nativeIconAdUrl
        };
    }

    public reportNativeAdImageShow(): void {
        LogUtils.info("reportNativeAdImageShow ===");
        this.bridge.call("nativeAdReportShow");
    }

    public reportNativeAdImageClick(): void {
        LogUtils.info("reportNativeAdImageClick ===");
        this.bridge.call("nativeAdReportClick");
    }

    public reportNativeAdIconShow(): void {
        LogUtils.info("reportNativeAdIconShow ===");
        this.bridge.call("nativeIconAdReportShow");
    }

    public reportNativeAdIconClick(): void {
        LogUtils.info("reportNativeAdIconClick ===");
        this.bridge.call("nativeIconAdReportClick");
    }

    public autoClickNativeInsertAd(): void {
        if (PlatformUtils.isOppoNative() && this.nativeInterUrl && AdControlUtils.autoClickNativeInsertAd()) {
            this.nativeInterAdReportClick();
        }
    }

    public autoClickNativeAdImage(callback: Function): void {
        if (PlatformUtils.isOppoNative() && this.nativeAdUrl && AdControlUtils.autoClickNativeAdImage()) {
            callback(true);
            this.reportNativeAdImageClick();
        } else {
            callback(false);
        }
    }

    public autoClickNativeAdIcon(callback: Function): void {
        if (PlatformUtils.isOppoNative()) {
            if (this.nativeIconAdUrl && AdControlUtils.autoClickNativeAdIcon()) {
                callback(true);
                this.reportNativeAdIconClick();
            } else {
                callback(false);
            }
        }
    }

    public exitGame(): void {
        LogUtils.info("exitGame ===");
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("exitGame");
        }
    }

    public login(): void {
        LogUtils.info("login ===");
        if (PlatformUtils.isAndroid() && PlatformUtils.isXiaoMiNative()) {
            this.bridge.call("login");
        }
    }

    public logout(): void {
        LogUtils.info("logout===");
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("logout");
        }
    }

    public showAuthenticationView(): void {
        LogUtils.info("showAuthenticationView ===");
        if (PlatformUtils.isIOS() || PlatformUtils.isAndroid()) {
            this.bridge.call("showCertificationView");
        }
    }

    public exitApp(): void {
        LogUtils.info("exitApp ===");
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("exitApp");
        }
    }

    public getPlatformVersionCode(): void {
        // Empty implementation
    }

    public jumpLeisureSubject(): void {
        LogUtils.info("LogUtils ===");
        this.bridge.call("jumpLeisureSubject");
    }

    public showGameDoingSplash(): void {
        LogUtils.info("showGameDoingSplash ===");
        if (AdControlUtils.isShowGameDoingSplash()) {
            this.bridge.call("showGameDoingSplash");
        } else {
            LogUtils.info("不满足两次开屏时间间隔");
        }
    }

    public platformVersionSupport(version: any): boolean {
        return true;
    }

    public showAppPolicy(): void {
        LogUtils.info("showAppPolicy ===");
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("openPolicy");
        }
    }

    public copyString(text: string): void {
        LogUtils.info("copyString: ", text);
        this.bridge.call("copyString", text);
    }

    public registerEvent(): void {
        LogUtils.info("registerEvent");
        this.bridge.call("registerEvent");
    }

    public purchaseEvent(param1: any, param2: any, param3: any, param4: any, param5: any, param6: any, param7: any): void {
        LogUtils.info("purchaseEvent");
        this.bridge.call("purchaseEvent", param1, param2, param3, param4, param5, param6, param7);
    }

    public openUrl(url: string): void {
        LogUtils.info("openUrl: ", url);
        if (PlatformUtils.isAndroid()) {
            this.bridge.call("openUrl", "(Ljava/lang/String;)V", url);
        }
    }

    public getGameVersion(): string {
        if (PlatformUtils.isAndroid()) {
            return this.bridge.call("getApkVersion", "()Ljava/lang/String;");
        }
        return "";
    }
}