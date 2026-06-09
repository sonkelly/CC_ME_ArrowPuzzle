import { input, Input, KeyCode, native, view, sys, game } from "cc";
import { AdEventKey } from "./../Event/AdEventKey";
import { EventHelper } from "./../Event/EventHelper";
import { AbstractPlatformSDK } from "./AbstractPlatformSDK";
import { ConfigHelper } from "./../ConfigHelper";
import { DefaultNativeTemplate } from "./../DefaultNativeTemplate";
import { AdControlUtils } from "./../Utils/AdControlUtils";
import { EngineUtils } from "./../Utils/EngineUtils";
import { LogUtils } from "./../Utils/LogUtils";
import { PayApi } from "./../PayApi";
import { PayUtils } from "./../Utils/PayUtils";
import { PlatformUtils } from "./../Utils/PlatformUtils";
import { StoreUtils, Type } from "./../Utils/StoreUtils";
import { StringUtils } from "./../Utils/StringUtils";
import { Utils } from "./../Utils";
import { Toast } from "./../Toast";
import { VibrateType } from "./../YZ_Constant";

declare const SDKInstance: any; // Biến toàn cục từ native

export class NativeCocosSDK extends AbstractPlatformSDK {
    private static _instance: NativeCocosSDK | undefined;

    public static getInstance(): NativeCocosSDK {
        if (this._instance === undefined) {
            this._instance = new NativeCocosSDK();
        }
        return this._instance;
    }

    public nativeInterDesc: string = "";
    public videoCallback: ((success: boolean) => void) | undefined;
    public videoErrorCb: (() => void) | undefined;
    public nativeTitle: string = "";
    public nativeDesc: string = "";
    public nativeAdUrl: string = "";
    public nativeIconAdUrl: string = "";
    public nativeIconTitle: string = "";
    public nativeIconDesc: string = "";
    public nativeInterUrl: string = "";
    public nativeInterTitle: string = "";
    public nativeAdImagePanelNode: any;
    public nativeAdImageNode: any;
    public nativeAdIntertNode: any;
    public nativeAdIconPanelNode: any;
    public nativeAdIconNode: any;
    public videoLocation: string | undefined;
    public xiaoMiSysInsterShowTime: number = 0;
    public xiaoMiInsterShowTime: number = 0;
    public intertShowTotalNumber: number = 0;
    public loginCallback: ((success: boolean, data: any) => void) | undefined;
    public iosAppVersion: string = "1.0.0";
    public userInfo = {
        openId: "",
        nickName: "",
        avatarUrl: "",
        gender: 0,
        age: 0,
        city: "",
        province: "",
        country: "",
        code: ""
    };

    public constructor() {
        super();
        LogUtils.info("constructor 注册全局变量");
        this.intertShowTotalNumber = StoreUtils.getInstance().get(StoreUtils.intertShowTotalNumber, Type.Int, 0) as number;

        if (SDKInstance.isIOS()) {
            (window as any).dengluchenggong = (nickName: string, avatarUrl: string, openId: string) => {
                LogUtils.info("dengluchenggong: ", nickName, avatarUrl, openId);
                if (openId) {
                    const user = { nickName, avatarUrl, openId };
                    if (this.loginCallback) this.loginCallback(true, user);
                } else {
                    if (this.loginCallback) this.loginCallback(false, null);
                }
            };

            (window as any).xiafajiangli = (result: boolean) => {
                LogUtils.info("cocos videoShowComplete: " + result);
                game.resume();
                if (this.videoCallback) {
                    if (result) {
                        EventHelper.getInstance().videoComplete(this.videoLocation);
                    } else {
                        EventHelper.getInstance().videoNotFinished(this.videoLocation);
                    }
                    this.videoCallback(result);
                }
            };

            (window as any).shipinkaishibofang = () => {
                game.pause();
            };

            (window as any).guangbishipin = () => {
                game.resume();
            };
        } else {
            (window as any).videoShowComplete = (result: boolean) => {
                LogUtils.info("cocos videoShowComplete: " + result);
                game.resume();
                if (this.videoCallback) {
                    if (result) {
                        EventHelper.getInstance().videoComplete(this.videoLocation);
                    } else {
                        EventHelper.getInstance().videoNotFinished(this.videoLocation);
                    }
                    this.videoCallback(result);
                }
            };

            (window as any).videoShowSuccess = () => {
                console.log("videoShowSuccess=================");
                game.pause();
            };

            (window as any).onVideoPlayClose = () => {
                console.log("onVideoPlayClose=================");
                game.resume();
            };
        }

        (window as any).onVideoError = () => {
            if (this.videoErrorCb) this.videoErrorCb();
        };

        (window as any).setNativeImgUrl = (url: string) => {
            LogUtils.info("get nativeAd image url from java: ", url);
            this.nativeAdUrl = StringUtils.removeTheParameters(url);
        };

        (window as any).setNativeTitle = (title: string) => {
            LogUtils.info("get setNativeTitle java: ", title);
            this.nativeTitle = title;
        };

        (window as any).setNativeDesc = (desc: string) => {
            LogUtils.info("get setNativeDesc from java: ", desc);
            this.nativeDesc = desc;
        };

        (window as any).setNativeIconUrl = (url: string) => {
            LogUtils.info("get nativeAd icon url from java: ", url);
            this.nativeIconAdUrl = StringUtils.removeTheParameters(url);
        };

        (window as any).setNativeIconTitle = (title: string) => {
            this.nativeIconTitle = title;
            LogUtils.info("get NativeIconTitle from java: " + this.nativeIconTitle);
        };

        (window as any).setNativeIconDesc = (desc: string) => {
            this.nativeIconDesc = desc;
            LogUtils.info("get NativeIconDesc from java: " + this.nativeIconDesc);
        };

        (window as any).setNativeInterUrl = (url: string) => {
            this.nativeInterUrl = StringUtils.removeTheParameters(url);
            LogUtils.info("get nativeInterUrl url from java: " + this.nativeInterUrl);
        };

        (window as any).setNativeInterTitle = (title: string) => {
            this.nativeInterTitle = title;
            LogUtils.info("get nativeInterTitle from java: " + this.nativeInterTitle);
        };

        (window as any).setNativeInterDesc = (desc: string) => {
            this.nativeInterDesc = desc;
            LogUtils.info("get nativeInterDesc from java: " + this.nativeInterDesc);
        };

        (window as any).onLoginComplete = (data: any) => {
            LogUtils.info("onLoginComplete: ", data);
            if (data) {
                const user = {
                    nickName: data.name,
                    avatarUrl: data.avatar,
                    openId: data.openid,
                    country: data.countryCode
                };
                PayUtils.openId = data.openid;
                this.userInfo.openId = data.openid;
                this.userInfo.nickName = data.name;
                this.userInfo.avatarUrl = data.avatar;
                if (this.loginCallback) this.loginCallback(true, user);
            } else {
                if (this.loginCallback) this.loginCallback(false, null);
            }
        };

        (window as any).deliveryNotice = (orderSn: string) => {
            PayApi.deliveryNotice({ orderSn }).then((res: any) => {
                LogUtils.info("通知服务器发货成功： ", res);
            });
        };

        if (PlatformUtils.isAndroid() && PlatformUtils.isOppoNative()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "initNativeAds", "()V");
        }

        if (PlatformUtils.isAndroid()) {
            if (PlatformUtils.isJuLiangYinQingNative()) {
                const humeChannel = native.reflection.callStaticMethod("com/cocos/game/JSBridge", "getHumeChannel", "()Ljava/lang/String;") as string;
                LogUtils.info("getHumeChannel: ", humeChannel);
                EventHelper.channel = humeChannel !== "" ? humeChannel : "jl_344_0_ad_l_1";
            } else if (PlatformUtils.isM233mlApp()) {
                EventHelper.channel = "233_390_1_a_l_1";
            }
        } else if (PlatformUtils.isIOS()) {
            (window as any).getIdfaComplete = (idfa: string, mac: string, ip: string, idfv: string) => {
                console.log("getIdfaComplete===============");
                console.log("idfa: ", idfa);
                console.log("mac:", mac);
                console.log("ip: ", ip);
                console.log("idfv: ", idfv);
                EventHelper.idfa = idfa;
                EventHelper.macAddress = mac;
                EventHelper.ipAddress = ip;
                EventHelper.idfv = idfv;
                EventHelper.getInstance().xGameActivateTracking();
            };
        }

        if (PlatformUtils.isIOS()) {
            LogUtils.info("iosAppVersion: ", this.iosAppVersion);
        }
    }

    public initAdService(): void {
        LogUtils.info("initAdService ===");
        if (PlatformUtils.isAndroid()) {
            input.on(Input.EventType.KEY_DOWN, (event: any) => {
                switch (event.keyCode) {
                    case KeyCode.MOBILE_BACK:
                    case KeyCode.BACKSPACE:
                        this.exitGame();
                        if (PlatformUtils.isXiaoMiNative()) {
                            this.showInsertVideoAd();
                        }
                        break;
                }
            }, this);
        }
    }

    public showBannerAd(params: any = {}): void {
        LogUtils.info("showBannerAd ===");
        if (AdControlUtils.isShowBanner()) {
            if (!PlatformUtils.isIOS() && PlatformUtils.isAndroid()) {
                native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showBannerAd", "()V");
            }
            EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.sysBanner + "_" + AdEventKey.showSuccess);
        }
    }

    public hideBannerAd(): void {
        LogUtils.info("hideBannerAd ===");
        if (!PlatformUtils.isIOS() && PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "hideBannerAd", "()V");
        }
    }

    public showIntertAd(params: any = {}): void {
        LogUtils.info("showIntertAd ===");
        if (PlatformUtils.isGooglePlayNative()) {
            if (params.resultCallback) params.resultCallback(false);
            return;
        }

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
                    native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showIntersAd", "()V");
                    AdControlUtils.setShowInterTime();
                }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
                this.xiaoMiSysInsterShowTime = currentTime;
            } else {
                this.showNativeInsertAd(params);
            }
            return;
        }

        if (PlatformUtils.isIOS()) {
            setTimeout(() => {
                native.reflection.callStaticMethod("NativeOcClass", "zhanshichaping");
                AdControlUtils.setShowInterTime();
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
        } else if (PlatformUtils.isHuaWeiAbroadNative() || PlatformUtils.isHuaWeiNative()) {
            const config = ConfigHelper.getGameConfig();
            if (config.systemInsertSwitch && config.nativeInsertSwitch) {
                if (this.intertShowTotalNumber < config.systemInsertToNativeInsertNumber) {
                    setTimeout(() => {
                        native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showIntersAd", "()V");
                        AdControlUtils.setShowInterTime();
                    }, 1000 * config.systemInsertDelayTime);
                } else {
                    this.showNativeInsertAd(params);
                }
                this.intertShowTotalNumber++;
                StoreUtils.getInstance().set(StoreUtils.intertShowTotalNumber, Type.Int, this.intertShowTotalNumber);
            } else if (config.nativeInsertSwitch) {
                this.showNativeInsertAd(params);
            } else if (config.systemInsertSwitch) {
                setTimeout(() => {
                    this.intertShowTotalNumber++;
                    StoreUtils.getInstance().set(StoreUtils.intertShowTotalNumber, Type.Int, this.intertShowTotalNumber);
                    native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showIntersAd", "()V");
                    AdControlUtils.setShowInterTime();
                }, 1000 * config.systemInsertDelayTime);
            }
        } else {
            if (params.showSysInterAd) {
                setTimeout(() => {
                    native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showIntersAd", "()V");
                    AdControlUtils.setShowInterTime();
                }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
            } else {
                this.showNativeInsertAd(params);
            }
        }
    }

    public showVideoAd(params: any = {}): void {
        LogUtils.info("showVideoAd ===");
        if (PlatformUtils.isGooglePlayNative()) {
            Utils.instance.adManager.ShowVideo(
                (success: boolean, error: string = "") => {
                    if (success) {
                        console.log("看完视频，获得奖励");
                        if (params.videoCallback) params.videoCallback(true);
                    } else {
                        console.log("视频出错：", success, error);
                        Toast.instance.tip_div(error || "Ads not ready!");
                    }
                }
            );
        } else {
            if (AdControlUtils.isShowVideo() === false) {
                this.showToast("当前暂无可播放广告");
                if (params.videoCallback) params.videoCallback(false);
                return;
            }

            this.videoLocation = params.adLocation;
            EventHelper.getInstance().videoStartEvent(this.videoLocation);
            this.videoCallback = params.videoCallback;
            this.videoErrorCb = params.videoOnError;

            if (PlatformUtils.isIOS()) {
                native.reflection.callStaticMethod("NativeOcClass", "bofangshipin");
            } else if (PlatformUtils.isAndroid()) {
                native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showVideoAd", "()V");
            }
            AdControlUtils.setShowVideoTime();
        }
    }

    public autoClickVideo(callback: (result: boolean) => void): void {
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
                if (!PlatformUtils.isIOS()) {
                    native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showInsertVideoAd", "()V");
                }
                AdControlUtils.setShowInterVideoTime();
                EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.insertVideo + "_" + AdEventKey.showSuccess);
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
        }
    }

    public showNativeImageAd(params: any): void {
        LogUtils.info("showNativeImageAd ====");
        if (AdControlUtils.isShowNativeAd() === false) {
            return;
        }

        if (!params.parentNode) {
            LogUtils.warn("缺少parentNode节点");
            return;
        }

        const self = this;
        if (PlatformUtils.isOppoNative()) {
            if (this.nativeIsValid()) {
                if (this.nativeAdUrl === "" || this.nativeAdUrl === undefined) {
                    if (params.resultCallback) params.resultCallback(false);
                    this.loadNativeAd();
                    LogUtils.info("展示原生广告失败， url为空！！！");
                    return;
                }
                this.hideNativeImage();
                this.nativeAdImagePanelNode = params.panelNode;
                const adData = {
                    adId: "",
                    title: this.nativeTitle,
                    desc: this.nativeDesc,
                    imgUrl: this.nativeAdUrl,
                    iconUrl: this.nativeAdUrl
                };
                DefaultNativeTemplate.createNativeAdImageUINode(
                    adData,
                    params,
                    (node: any) => {
                        LogUtils.info("createNativeAdImageUINode success 回调");
                        self.nativeAdImageNode = node;
                        self.reportNativeAdImageShow();
                        if (params.resultCallback) params.resultCallback(true);
                        AdControlUtils.setShowNativeAdTime();
                        EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeImage + "_" + AdEventKey.showSuccess);
                    },
                    () => {
                        LogUtils.info("点击了关闭回调");
                        if (params.closeCallback) params.closeCallback();
                    },
                    () => {
                        LogUtils.info("点击了广告");
                        self.reportNativeAdImageClick();
                    }
                );
            } else {
                LogUtils.info("showNativeImageAd fail.");
                if (params.resultCallback) params.resultCallback(false);
            }
        } else {
            const parentNode = params.parentNode;
            let width = params.width !== undefined ? params.width : parentNode.width;
            let height = params.height !== undefined ? params.height : parentNode.height;

            EngineUtils.getMainCamera((camera: any) => {
                if (camera) {
                    let worldPos = camera.node.convertToNodeSpaceAR(parentNode.parent.convertToWorldSpaceAR(parentNode.position));
                    if (params.panelNode) {
                        width = params.panelNode.width;
                        height = params.panelNode.height;
                        worldPos = params.panelNode.parent.convertToWorldSpaceAR(params.panelNode.position);
                    }
                    LogUtils.info("传递过来的宽高", "width: ", width, "height: ", height);
                    LogUtils.info("parentNode.position.x: ", parentNode.position.x, "parentNode.position.y: ", parentNode.position.y);
                    LogUtils.info("worldPos", "worldPos.x: ", worldPos.x, "worldPos.y: ", worldPos.y);

                    const x = worldPos.x;
                    const y = view.getVisibleSize().height - worldPos.y - 0.5 * height;
                    const designSize = view.getDesignResolutionSize();

                    LogUtils.info("转换后得到的x", "x: ", x, "y: ", y);

                    native.reflection.callStaticMethod(
                        "com/cocos/game/JSBridge",
                        "showNativeAd",
                        "(FFFF)V",
                        x / view.getVisibleSize().width,
                        y / view.getVisibleSize().height,
                        width / designSize.width,
                        height / designSize.height
                    );
                    AdControlUtils.setShowNativeAdTime();
                    if (params.resultCallback) params.resultCallback(true);
                    EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeImage + "_" + AdEventKey.showSuccess);
                }
            });
        }
    }

    public nativeIsValid(): boolean | undefined {
        LogUtils.info("nativeIsValid ===");
        if (PlatformUtils.isAndroid()) {
            return native.reflection.callStaticMethod("com/cocos/game/JSBridge", "nativeIsValid", "()Z") as boolean;
        }
    }

    public loadNativeAd(): void {
        LogUtils.info("loadNativeAd ===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "loadNative", "()V");
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
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "hideNativeAd", "()V");
        }
    }

    public showNativeIconAd(params: any): void {
        LogUtils.info("showNativeIconAd ===");
        if (AdControlUtils.isShowNativeAd() === false) {
            return;
        }

        const self = this;
        if (PlatformUtils.isOppoNative()) {
            if (params.parentNode) {
                params.parentNode.offAll();
            }
            if (this.nativeIconIsValid()) {
                if (this.nativeIconAdUrl === "" || this.nativeIconAdUrl === undefined) {
                    if (params.resultCallback) params.resultCallback(false);
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

                DefaultNativeTemplate.createNativeAdImageUINode(
                    adData,
                    params,
                    (node: any) => {
                        LogUtils.info("createNativeAdIconUINode success 回调");
                        self.hideBannerAd();
                        self.hideNativeIconAd();
                        self.nativeAdIconPanelNode = params.panelNode;
                        self.nativeAdIconNode = node;
                        self.reportNativeAdIconShow();
                        if (params.resultCallback) params.resultCallback(true);
                        AdControlUtils.setShowNativeAdTime();
                        EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeIcon + "_" + AdEventKey.showSuccess);
                    },
                    () => {
                        LogUtils.info("createNativeAdIconUINode close 回调");
                        if (params.closeCallback) params.closeCallback();
                    },
                    () => {
                        LogUtils.info("createNativeAdIconUINode click 回调");
                        self.reportNativeAdIconClick();
                    }
                );
            } else {
                if (params.resultCallback) params.resultCallback(false);
            }
        } else {
            this.showNativeImageAd(params);
        }
    }

    public nativeIconIsValid(): boolean {
        LogUtils.info("nativeIconIsValid ===");
        if (PlatformUtils.isAndroid()) {
            return native.reflection.callStaticMethod("com/cocos/game/JSBridge", "nativeIconIsValid", "()Z") as boolean;
        }
        return false;
    }

    public loadNativeIconAd(): void {
        LogUtils.info("loadNativeIconAd ===");
        native.reflection.callStaticMethod("com/cocos/game/JSBridge", "loadNativeIcon", "()V");
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
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "hideNativeAd", "()V");
        }
    }

    public showNativeInsertAd(params: any = {}): boolean {
        LogUtils.info("showNativeInsertAd ===");
        if (AdControlUtils.isShowInter() === false) {
            return false;
        }

        EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeInsert + "_" + AdEventKey.showSuccess);

        if (!PlatformUtils.isOppoNative()) {
            setTimeout(() => {
                native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showNativeInterAd", "(Z)V", AdControlUtils.autoClickNativeInsertAd());
                AdControlUtils.setShowInterTime();
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
            return true;
        }

        if (this.nativeInterUrl === "" || this.nativeInterUrl === undefined || !this.nativeInterIsValid()) {
            LogUtils.info("展示原生插屏广告失败， url为空！！！");
            this.loadNativeInterAd();
            setTimeout(() => {
                native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showIntersAd", "()V");
                AdControlUtils.setShowInterTime();
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
            if (params.resultCallback) params.resultCallback(false);
            return false;
        }

        const self = this;
        const adOptions = { parentNode: params.parentNode };

        setTimeout(() => {
            if (self.nativeInterUrl) {
                const adData = {
                    adId: "",
                    title: self.nativeInterTitle,
                    desc: self.nativeInterDesc,
                    imgUrl: self.nativeInterUrl,
                    iconUrl: self.nativeInterUrl
                };
                DefaultNativeTemplate.createNativeIntertAdUINode(
                    adData,
                    adOptions,
                    (node: any) => {
                        LogUtils.info("createNativeIntertAdUINode success 回调");
                        self.hideNativeIntert();
                        self.nativeAdIntertNode = node;
                        if (params.resultCallback) params.resultCallback(true);
                        self.nativeInterAdReportShow();
                        AdControlUtils.setShowInterTime();
                    },
                    () => {
                        LogUtils.info("点击了关闭回调");
                        self.autoClickNativeInsertAd();
                        if (params.closeCallback) params.closeCallback();
                    },
                    () => {
                        LogUtils.info("点击了广告");
                        self.nativeInterAdReportClick();
                    }
                );
            }
        }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);

        return true;
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
        if (PlatformUtils.isAndroid()) {
            return native.reflection.callStaticMethod("com/cocos/game/JSBridge", "nativeInterIsValid", "()Z") as boolean;
        }
        return false;
    }

    public nativeInterAdReportShow(): void {
        LogUtils.info("nativeInterAdReportShow ===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "nativeInterAdReportShow", "()V");
        }
    }

    public nativeInterAdReportClick(): void {
        LogUtils.info("nativeInterAdReportClick ===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "nativeInterAdReportClick", "()V");
        }
    }

    public loadNativeInterAd(): void {
        LogUtils.info("loadNativeInterAd ===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "loadNativeInterAd", "()V");
        }
    }

    public vibrateShort(): void {
        if (PlatformUtils.isGooglePlayNative()) {
            Utils.instance.vibrate();
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "zhendong:", false);
        } else if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "vibrate", "(Z)V", false);
        }
    }

    public vibrateLong(): void {
        if (PlatformUtils.isGooglePlayNative()) {
            Utils.instance.vibrate(VibrateType.Long);
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "zhendong:", true);
        } else if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "vibrate", "(Z)V", true);
        }
    }

    public showToast(msg: string): void {
        LogUtils.info("showToast ===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showToast", "(Ljava/lang/String;)V", msg);
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "showToast:", msg);
        }
    }

    public showAuthenticationView(): void {
        LogUtils.info("showAuthenticationView ===");
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
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "nativeAdReportShow", "()V");
        }
    }

    public reportNativeAdImageClick(): void {
        LogUtils.info("reportNativeAdImageClick ===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "nativeAdReportClick", "()V");
        }
    }

    public reportNativeAdIconShow(): void {
        LogUtils.info("reportNativeAdIconShow===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "nativeIconAdReportShow", "()V");
        }
    }

    public reportNativeAdIconClick(): void {
        LogUtils.info("reportNativeAdIconClick===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "nativeIconAdReportClick", "()V");
        }
    }

    public autoClickNativeInsertAd(): void {
        if (PlatformUtils.isOppoNative() && this.nativeInterUrl && AdControlUtils.autoClickNativeInsertAd()) {
            this.nativeInterAdReportClick();
        }
    }

    public autoClickNativeAdImage(callback: (result: boolean) => void): void {
        if (PlatformUtils.isOppoNative() && this.nativeAdUrl && AdControlUtils.autoClickNativeAdImage()) {
            callback(true);
            this.reportNativeAdImageClick();
        } else {
            callback(false);
        }
    }

    public autoClickNativeAdIcon(callback: (result: boolean) => void): void {
        if (PlatformUtils.isOppoNative()) {
            if (this.nativeIconAdUrl && AdControlUtils.autoClickNativeAdIcon()) {
                callback(true);
                this.reportNativeAdIconClick();
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    }

    public exitGame(): void {
        LogUtils.info("exitGame ===");
        if (!PlatformUtils.isAndroid() && PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "exitGame");
        }
    }

    public login(params: any = {}): void {
        LogUtils.info("login ===");
        if (PlatformUtils.isAndroid()) {
            const user = {
                nickName: "",
                avatarUrl: "",
                openId: "123456",
                country: ""
            };
            PayUtils.openId = "";
            this.userInfo.openId = "123456";
            this.userInfo.nickName = "";
            this.userInfo.avatarUrl = "";
            if (params.resultCallback) params.resultCallback(true, user);
        } else if (PlatformUtils.isIOS()) {
            if (params.resultCallback) params.resultCallback(true, null);
        }
    }

    public loginQQ(params: any = {}): void {
        LogUtils.info("login by qq===");
        this.loginCallback = params.resultCallback;
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "loginQQ", "()V");
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "qqdenglu");
        }
    }

    public isWxAppInstalled(): boolean {
        if (PlatformUtils.isIOS()) {
            const installed = native.reflection.callStaticMethod("NativeOcClass", "anzhuangwx") as boolean;
            LogUtils.info("isWxAppInstalled: ", installed);
            return installed;
        }
        return true;
    }

    public loginWX(params: any = {}): void {
        LogUtils.info("login by wechat===");
        this.loginCallback = params.resultCallback;
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "loginWX", "()V");
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "wxdenglu");
        }
    }

    public loginApple(params: any = {}): void {
        LogUtils.info("login by apple===");
        this.loginCallback = params.resultCallback;
        if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "pgdenglu");
        }
    }

    public loginTapTap(params: any = {}): void {
        LogUtils.info("login by TapTap===");
        this.loginCallback = params.resultCallback;
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "loginTapTap", "()V");
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "ttdenglu");
        }
    }

    public logout(): void {
        LogUtils.info("logout===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "logout", "()V");
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "tuichudenglu");
        }
    }

    public setGameRoleInfo(roleInfo: string, isNew: boolean): void {
        LogUtils.info("setGameRoleInfo==============");
        if (PlatformUtils.isQuickApp()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "setGameRoleInfo", "(Ljava/lang/String;Z)V", roleInfo, isNew);
        }
    }

    public setHYGameRoleInfo(roleInfo: string, level: number): void {
        if (PlatformUtils.isHuiyaoApp()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "setHYGameRoleInfo", "(Ljava/lang/String;I)V", roleInfo, level);
        } else if (PlatformUtils.isJileApp()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "setGameRoleInfo", "(Ljava/lang/String;I)V", roleInfo, level);
        }
    }

    public setExtData(arg1: string, arg2: string, arg3: number, arg4: number): void {
        if (PlatformUtils.isJileApp()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "setExtData", "(Ljava/lang/String;Ljava/lang/String;II)V", arg1, arg2, arg3, arg4);
        }
    }

    public exitApp(): void {
        LogUtils.info("exitApp===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "exitApp", "()V");
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "exitApp");
        }
    }

    public getPlatformVersionCode(): void {
        // No implementation
    }

    public jumpLeisureSubject(): void {
        LogUtils.info("jumpLeisureSubject ===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "jumpLeisureSubject", "()V");
        }
    }

    public showGameDoingSplash(): void {
        LogUtils.info("showGameDoingSplash ===");
        if (AdControlUtils.isShowGameDoingSplash()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "showGameDoingSplash", "()V");
        } else {
            LogUtils.info("不满足两次开屏时间间隔");
        }
    }

    public platformVersionSupport(version: string): boolean {
        return true;
    }

    public showAppPolicy(): void {
        LogUtils.info("showAppPolicy ===");
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "openPolicy", "()V");
        }
    }

    public copyString(text: string): void {
        LogUtils.info("copyString: ", text);
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "copyString", "(Ljava/lang/String;)V", text);
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "copyString:", text);
        }
    }

    public registerEvent(): void {
        LogUtils.info("registerEvent");
        if (PlatformUtils.isJuLiangYinQingNative() || PlatformUtils.isBaiduApp() || PlatformUtils.isJuliangXingwan()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "registerEvent", "()V");
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "registerEvent");
        }
    }

    public purchaseEvent(productName: string, productID: string, payType: string, productNum: number, userId: string, result: boolean, amount: number): void {
        if (PlatformUtils.isJuLiangYinQingNative() || PlatformUtils.isJuliangXingwan()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "purchaseEvent", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;ZI)V", productName, productID, payType, productNum, userId, result, amount);
        } else if (PlatformUtils.isBaiduApp()) {
            if (result) {
                native.reflection.callStaticMethod("com/cocos/game/JSBridge", "purchaseEvent", "(I)V", 100 * amount);
            }
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "purchaseEvent:productName:productID:productNum:payType:result:amount:", productName, productID, productNum, payType, result, amount);
        }
    }

    public onCharge(orderId: string, productName: string, payType: string, amount: string): void {
        if (PlatformUtils.isTapTapNative()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "onCharge", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", orderId, productName, payType, amount);
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "onCharge:productName:payType:amount:", orderId, productName, payType, amount);
        }
    }

    public setUserID(userId: string): void {
        if (PlatformUtils.isTapTapNative()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "setUserID", "(Ljava/lang/String;)V", userId);
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "setUserID:", userId);
        }
    }

    public registerWithAccount(account: string): void {
        LogUtils.info("registerWithAccount");
        if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "registerWithAccount:", account);
        }
    }

    public loginWithAccount(account: string): void {
        LogUtils.info("loginWithAccount");
        if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "loginWithAccount:", account);
        } else if (PlatformUtils.isBaiduApp()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "loginAction", "()V");
        }
    }

    public startPayEvent(orderId: string, productName: string, amount: string): void {
        LogUtils.info("startPayEvent");
        if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "startPayEventWithOrderId:andProductName:andAmount:", orderId, productName, amount);
        } else if (PlatformUtils.isBaiduApp()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "completeOrderAction", "()V");
        }
    }

    public paySuccessEvent(orderId: string, productName: string, amount: string): void {
        LogUtils.info("loginWithAccount");
        if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "paySuccessEventWithOrderId:andProductName:andAmount:", orderId, productName, amount);
        }
    }

    public openUrl(url: string): void {
        LogUtils.info("openUrl: ", url);
        if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "openUrl", "(Ljava/lang/String;)V", url);
        } else if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "openUrl:", url);
        }
    }

    public initMySDK(): void {
        LogUtils.info("initMySDK: ");
        if (!PlatformUtils.isAndroid() && PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "initMySDK");
        }
    }

    public openAppStoreReview(): boolean | undefined {
        LogUtils.info("openAppStoreReview==========");
        if (PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "openAppStoreReview");
            return true;
        } else if (PlatformUtils.isAndroid()) {
            native.reflection.callStaticMethod("com/cocos/game/JSBridge", "openAppStoreReview", "()V");
            return undefined;
        }
        return undefined;
    }

    public removeAccount(): void {
        LogUtils.info("removeAccount: ");
        if (!PlatformUtils.isAndroid() && PlatformUtils.isIOS()) {
            native.reflection.callStaticMethod("NativeOcClass", "removeAccount");
        }
    }

    public getGameVersion(): string | undefined {
        if (PlatformUtils.isAndroid()) {
            return "1.0.0";
        } else if (PlatformUtils.isIOS()) {
            return this.iosAppVersion;
        }
        return undefined;
    }

    public getNetworkType(callback: (type: number) => void): void {
        if (PlatformUtils.isAndroid() || PlatformUtils.isIOS()) {
            callback(sys.getNetworkType());
        }
    }

    public getUserInfo(params: any = {}): void {
        if (params.resultCallback) {
            params.resultCallback(true, this.userInfo);
        }
    }

    public getPlatform(): string {
        return "ANDROID";
    }
}