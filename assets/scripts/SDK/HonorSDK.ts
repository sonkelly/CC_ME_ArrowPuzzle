import { _decorator, Component, game } from 'cc';
import { AbstractPlatformSDK } from './AbstractPlatformSDK';
import { LogUtils } from './../Utils/LogUtils';
import { DefaultNativeTemplate } from './../DefaultNativeTemplate';
import { ConfigHelper } from './../ConfigHelper';
import { EngineUtils } from './../Utils/EngineUtils';
import { AdControlUtils } from './../Utils/AdControlUtils';
import { EventHelper } from './../Event/EventHelper';
import { AdEventKey } from './../Event/AdEventKey';

const { ccclass, property } = _decorator;

declare const qg: any;

@ccclass('HonorSDK')
export class HonorSDK extends AbstractPlatformSDK {
    private static _instance: HonorSDK;

    private bannerAd: any = undefined;
    private videoAd: any = undefined;
    private nativeImageAd: any = undefined;
    private inserttitialAd: any = undefined;
    private videoCallback: Function | undefined = undefined;
    private videOnStartCallback: Function | undefined = undefined;
    private resultCallbackNativeImage: Function | undefined = undefined;
    private closeCallbackNativeImage: Function | undefined = undefined;
    private resultCallbackNativeInsert: Function | undefined = undefined;
    private closeCallbackNativeInsert: Function | undefined = undefined;
    private nativeAdImageData: any = undefined;
    private nativeAdIntertData: any = undefined;
    private nativeAdImageParams: any = undefined;
    private nativeAdIntertParams: any = undefined;
    private nativeAdImageNode: any = undefined;
    private nativeAdIntertNode: any = undefined;
    private nativeAdImagePanelNode: any = undefined;
    private nativeAdImageButtonNode: any = undefined;
    private showNativeAdType: string = "";
    private videoLocation: string = "";
    private nativeInsertLocation: string = "";
    private nativeImageLocation: string = "";
    private userInfo: any = {
        openId: "",
        nickName: "",
        avatarUrl: "",
        gender: 0,
        age: 0,
        city: "",
        province: "",
        country: ""
    };
    private lastShowBannerTime: number = 0;
    private videoOnError: Function | null = null;

    constructor() {
        super();
        qg.onHide(() => {
            this.hideNativeIntert();
            this.hideNativeImage();
        });
    }

    public static getInstance(): HonorSDK {
        if (this._instance === undefined) {
            this._instance = new HonorSDK();
        }
        return this._instance;
    }

    public initAdService(): void {
        // Empty implementation
    }

    public createBannerAd(): void {
        LogUtils.info("createBannerAd==========");
        if (ConfigHelper.getGameConfig().systemBannerId) {
            if (this.bannerAd) {
                this.bannerAd.destroy();
            }

            const screenWidth = qg.getSystemInfoSync().screenWidth;
            const screenHeight = qg.getSystemInfoSync().screenHeight;
            const windowWidth = qg.getSystemInfoSync().windowWidth;
            const windowHeight = qg.getSystemInfoSync().windowHeight;
            const systemInfo = qg.getSystemInfoSync();
            const safeAreaHeight = systemInfo.safeArea.height;
            const safeAreaWidth = systemInfo.safeArea.width;
            const top = safeAreaHeight - 57;
            const left = safeAreaWidth < safeAreaHeight ? (safeAreaWidth - 360) / 2 : 0;

            LogUtils.info("top：", top, "left: ", left);

            this.bannerAd = qg.createBannerAd({
                adUnitId: ConfigHelper.getGameConfig().systemBannerId,
                adIntervals: ConfigHelper.getGameConfig().systemBannerRefreshTime,
                style: {
                    top: top,
                    left: left,
                    height: 57,
                    width: 360
                }
            });

            this.bannerAd.onLoad(() => {
                LogUtils.info("bannerAd onLoad==========");
                const currentTime = new Date().getTime();
                this.lastShowBannerTime = currentTime;
            });

            this.bannerAd.onError((error: any) => {
                LogUtils.info("bannerAd onError: " + JSON.stringify(error));
            });

            this.bannerAd.onClose(() => {
                LogUtils.info("bannerAd close==========");
            });

            this.bannerAd.onResize((resizeData: any) => {
                if (resizeData.width !== 360) {
                    this.bannerAd.style.top = windowHeight - resizeData.height;
                    this.bannerAd.style.left = (windowWidth - resizeData.width) / 2;
                }
            });
        } else {
            LogUtils.warn("缺少:bannerId", ConfigHelper.getGameConfig().systemBannerId);
        }
    }

    public showBannerAd(params: any = {}): void {
        LogUtils.info("showBannerAd ==========");
        const currentTime = new Date().getTime();
        if (currentTime - this.lastShowBannerTime > 30000) {
            if (this.bannerAd === undefined) {
                this.createBannerAd();
                return;
            }
            this.lastShowBannerTime = currentTime;
            this.bannerAd.show();
            EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.sysBanner + "_" + AdEventKey.showSuccess);
        } else {
            LogUtils.info("showBannerAd CD 中，不显示！！！！");
        }
    }

    public hideBannerAd(): void {
        LogUtils.info("hideBannerAd ==========");
        if (this.bannerAd) {
            this.bannerAd.destroy();
        }
        this.bannerAd = undefined;
    }

    public createVideoAd(): void {
        LogUtils.info("createVideoAd11 ==========", ConfigHelper.getGameConfig().rewardedVideoId);
        if (ConfigHelper.getGameConfig().rewardedVideoId) {
            if (this.videoAd) {
                this.videoAd.destroy();
            }

            this.videoAd = qg.createRewardedVideoAd({
                adUnitId: ConfigHelper.getGameConfig().rewardedVideoId
            });

            this.videoAd.onLoad((loadData: any) => {
                LogUtils.info("videoAd loaded1======:", loadData);
                if (this.videOnStartCallback) {
                    this.videOnStartCallback();
                }
                if (this.videoAd) {
                    this.videoAd.show().then(() => {
                        if (EngineUtils.isCocos()) {
                            game.pause();
                        }
                        LogUtils.info("开始播放视频");
                        EventHelper.getInstance().videoStartEvent(this.videoLocation);
                    }).catch((error: any) => {
                        this.showToast("当前没有可播放的广告");
                        if (this.videoOnError) {
                            this.videoOnError();
                        }
                        LogUtils.warn("当前没有可播放的广告 err:", JSON.stringify(error));
                    });
                } else {
                    this.showToast("当前没有可播放的广告");
                    if (this.videoOnError) {
                        this.videoOnError();
                    }
                }
            });

            this.videoAd.onError((error: any) => {
                LogUtils.info("videoAd error: " + JSON.stringify(error));
                if (this.videoOnError) {
                    this.videoOnError();
                }
            });

            this.videoAd.onClose((closeData: any) => {
                LogUtils.info("videoAd onClose: " + JSON.stringify(closeData));
                if (EngineUtils.isCocos()) {
                    game.resume();
                }
                if (closeData && closeData.isEnded) {
                    if (this.videoCallback) {
                        this.videoCallback(true);
                    }
                    LogUtils.info("播放完成，发放奖励");
                    AdControlUtils.setShowVideoTime();
                    EventHelper.getInstance().videoComplete(this.videoLocation);
                } else {
                    if (this.videoCallback) {
                        this.videoCallback(false);
                    }
                    this.showToast("未观看完整视频，无法获得奖励");
                    EventHelper.getInstance().videoNotFinished(this.videoLocation);
                }
            });

            this.videoAd.onReward((rewardData: any) => {
                LogUtils.info("videoAd onReward: " + JSON.stringify(rewardData));
            });
        } else {
            LogUtils.warn("缺少videoId：", ConfigHelper.getGameConfig().rewardedVideoId);
        }
    }

    public showVideoAd(params: any = {}): void {
        LogUtils.info("showVideoAd ==========");
        if (AdControlUtils.isShowVideo() === false) {
            if (params.videoCallback) {
                params.videoCallback(false);
            }
            this.showToast("当前暂无可播放广告");
            return;
        }

        AdControlUtils.setShowVideoTime();
        if (this.videoAd === undefined) {
            this.createVideoAd();
        }

        this.videOnStartCallback = params.videOnStartCallback;
        this.videoCallback = params.videoCallback;
        this.videoOnError = params.videoOnError;
        if (params.adLocation) {
            this.videoLocation = params.adLocation;
        }
        this.videoAd.load();
    }

    public showNativeImageAd(params: any): void {
        LogUtils.info("showNativeImageAd ===");
        if (AdControlUtils.isShowNativeAd() !== false) {
            if (this.nativeImageAd === undefined) {
                this.createNativeAd();
            }

            if (params.width) {
                params.height = 607 / (1080 / params.width);
                LogUtils.info("华为不允许拉伸，已重新计算高");
            }

            this.nativeAdImageParams = params;
            this.hideNativeImage();
            this.showNativeAdType = "nativeBanner";
            this.resultCallbackNativeImage = params.resultCallback;
            this.closeCallbackNativeImage = params.closeCallback;
            this.nativeAdImageButtonNode = params.buttonNode;
            this.nativeAdImagePanelNode = params.panelNode;
            this.nativeImageAd.load();
        }
    }

    public hideNativeImage(): void {
        if (this.nativeAdImageNode) {
            LogUtils.info("隐藏原生大图");
            if (EngineUtils.isCocos()) {
                this.nativeAdImageNode.removeFromParent();
            } else {
                this.nativeAdImageNode.removeSelf();
            }
        }

        if (this.nativeAdImagePanelNode) {
            LogUtils.info("隐藏原生面板");
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

    public showIntertAd(params: any = {}): void {
        LogUtils.info("showIntertAd ==========");
        if (params.showSysInterAd) {
            this.showSysIntertAd(params);
        } else {
            this.showNativeIntertAd(params);
        }
    }

    public showSysIntertAd(params: any = {}): void {
        LogUtils.info("showSysIntertAd ==========");
        if (AdControlUtils.isShowInter() !== false) {
            this.inserttitialAd = qg.createInterstitialAd({
                adUnitId: ConfigHelper.getGameConfig().systemInsertId
            });

            setTimeout(() => {
                this.inserttitialAd.load();
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);

            this.inserttitialAd.offLoad();
            this.inserttitialAd.onLoad((loadData: any) => {
                LogUtils.info("inserttitialAd onLoad: ", JSON.stringify(loadData));
                if (this.inserttitialAd) {
                    this.inserttitialAd.show();
                    AdControlUtils.setShowInterTime();
                    if (params.resultCallback) {
                        params.resultCallback(true);
                    }
                }
            });

            this.inserttitialAd.offError();
            this.inserttitialAd.onError((error: any) => {
                LogUtils.info("inserttitialAd onError: ", JSON.stringify(error));
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            });

            this.inserttitialAd.offClose();
            this.inserttitialAd.onClose(() => {
                LogUtils.info("inserttitialAd onClose");
            });

            this.inserttitialAd.offClick();
            this.inserttitialAd.onClick(() => {
                LogUtils.info("inserttitialAd onClick");
            });
        } else {
            if (params.resultCallback) {
                params.resultCallback(false);
            }
        }
    }

    public showNativeIntertAd(params: any = {}): void {
        LogUtils.info("showNativeIntertAd ==========");
        if (AdControlUtils.isShowNativeInter() !== 0) {
            if (this.nativeImageAd === undefined) {
                this.createNativeAd();
            }

            this.nativeAdIntertParams = {
                parentNode: params.parentNode
            };

            setTimeout(() => {
                this.showNativeAdType = "nativeIntert";
                this.resultCallbackNativeInsert = params.resultCallback;
                this.closeCallbackNativeInsert = params.closeCallback;
                if (params.adLocation) {
                    this.nativeInsertLocation = params.adLocation;
                }
                this.nativeImageAd.load();
            }, 1000 * ConfigHelper.getGameConfig().nativeInsertDelayTime);
        } else {
            if (params.resultCallback) {
                params.resultCallback(false);
            }
        }
    }

    public createNativeAd(): void {
        LogUtils.info("createNativeAd ==========");
        if (ConfigHelper.getGameConfig().nativeImageId) {
            if (this.nativeImageAd) {
                this.nativeImageAd.destroy();
                this.nativeImageAd = undefined;
            }

            this.nativeImageAd = qg.createNativeAd({
                adUnitId: ConfigHelper.getGameConfig().nativeImageId,
                success: (data: any) => {
                    console.log("createNativeAd success============");
                },
                fail: (data: any, code: any) => {
                    console.log("createNativeAd fail============", "data: ", data, "code: ", code);
                },
                complete: () => {
                    console.log("createNativeAd complete============");
                }
            });

            this.nativeImageAd.onLoad((loadData: any) => {
                LogUtils.info("nativeAd loaded======", JSON.stringify(loadData));
                const adItem = loadData.adList.pop();
                const nativeAdData = {
                    adId: adItem.adId,
                    title: adItem.title,
                    desc: adItem.source,
                    imgUrl: adItem.imgUrlList[0],
                    iconUrl: adItem.imgUrlList[0]
                };

                if (this.showNativeAdType === "nativeBanner") {
                    this.showNativeAdType = "";
                    this.nativeAdImageData = nativeAdData;
                    this.createNativeAdImageUINode();
                } else if (this.showNativeAdType === "nativeIntert") {
                    this.showNativeAdType = "";
                    this.nativeAdIntertData = nativeAdData;
                    this.createNativeIntertUINode();
                }
            });

            this.nativeImageAd.onError((error: any) => {
                LogUtils.warn("原生广告加载失败: " + JSON.stringify(error));
                LogUtils.warn("this.showNativeAdType", this.showNativeAdType);
            });
        } else {
            LogUtils.warn("缺少nativeImageId:", ConfigHelper.getGameConfig().nativeImageId);
        }
    }

    public nativeAdReport(adId: string): void {
        if (this.nativeImageAd) {
            LogUtils.info("nativeAdReport()...", adId);
            this.nativeImageAd.reportAdShow({
                adId: adId
            });
        }
    }

    public nativeAdClick(adId: string): void {
        if (this.nativeImageAd) {
            LogUtils.info("nativeAdClick()...", adId);
            this.nativeImageAd.reportAdClick({
                adId: adId
            });
        }
    }

    public vibrateShort(): void {
        qg.vibrateShort({
            success: () => {},
            fail: () => {},
            complete: () => {}
        });
    }

    public vibrateLong(): void {
        qg.vibrateLong({
            success: () => {},
            fail: () => {},
            complete: () => {}
        });
    }

    public showToast(title: string): void {
        qg.showToast({
            title: title,
            icon: "none"
        });
    }

    public addDesktopIcon(params: any = {}): void {
        qg.installShortcut({
            success: () => {
                LogUtils.info("桌面图标创建成功...");
                if (params.callbackFunction) {
                    params.callbackFunction(true);
                }
                EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.addDesktopIcon);
            },
            fail: (error: any) => {
                if (params.callbackFunction) {
                    params.callbackFunction(false);
                }
            },
            complete: () => {}
        });
    }

    public hasDesktopIcon(params: any = {}): void {
        qg.hasShortcutInstalled({
            success: (result: any) => {
                console.log("hasInstalledsuccess： " + result);
                if (result) {
                    if (params.callbackFunction) {
                        params.callbackFunction(true);
                    }
                } else {
                    if (params.callbackFunction) {
                        params.callbackFunction(false);
                    }
                }
            },
            fail: (error: any) => {
                console.log("hasInstalled fail: " + error);
            },
            complete: () => {
                console.log("hasInstalled complete");
            }
        });
    }

    public createNativeAdImageUINode(): void {
        LogUtils.info("createNativeAdImageUINode ==========");
        const nativeAdData = this.nativeAdImageData;
        const nativeAdParams = this.nativeAdImageParams;

        if (nativeAdData && nativeAdParams) {
            DefaultNativeTemplate.createNativeAdImageUINode(nativeAdData, nativeAdParams, 
                (node: any) => {
                    if (this.resultCallbackNativeImage) {
                        this.resultCallbackNativeImage(true);
                    }
                    this.nativeAdImageNode = node;
                    this.nativeAdReport(nativeAdData.adId);
                    AdControlUtils.setShowNativeAdTime();
                    EventHelper.getInstance().recordAdvert(this.nativeImageLocation + "_" + AdEventKey.nativeImage + "_showSuccess");
                },
                () => {
                    if (this.closeCallbackNativeImage) {
                        this.closeCallbackNativeImage();
                    }
                },
                (adId: string) => {
                    this.nativeAdClick(adId);
                    this.hideNativeImage();
                }
            );
        }
    }

    public createNativeIntertUINode(): void {
        LogUtils.info("createNativeIntertUINode ==========");
        const nativeAdData = this.nativeAdIntertData;
        const nativeAdParams = this.nativeAdIntertParams;

        if (nativeAdData && nativeAdParams) {
            DefaultNativeTemplate.createNativeIntertAdUINode(nativeAdData, nativeAdParams,
                (node: any) => {
                    LogUtils.info("createNativeIntertUINode success 回调");
                    this.hideNativeIntert();
                    if (this.resultCallbackNativeInsert) {
                        this.resultCallbackNativeInsert(true);
                    }
                    this.nativeAdIntertNode = node;
                    this.nativeAdReport(nativeAdData.adId);
                    AdControlUtils.setShowInterTime();
                    EventHelper.getInstance().recordAdvert(this.nativeInsertLocation + "_" + AdEventKey.nativeInsert + "_showSuccess");
                },
                () => {
                    if (this.closeCallbackNativeInsert) {
                        this.closeCallbackNativeInsert();
                    }
                },
                (adId: string) => {
                    this.nativeAdClick(adId);
                    this.hideNativeIntert();
                    if (this.closeCallbackNativeInsert) {
                        this.closeCallbackNativeInsert();
                    }
                }
            );
        } else {
            if (this.resultCallbackNativeInsert) {
                this.resultCallbackNativeInsert(false);
            }
        }
    }

    public hideNativeIntert(): void {
        LogUtils.info("隐藏原生插屏");
        if (this.nativeAdIntertNode) {
            if (EngineUtils.isCocos()) {
                this.nativeAdIntertNode.removeFromParent();
            } else {
                this.nativeAdIntertNode.removeSelf();
            }
            this.nativeAdIntertNode = undefined;
        }
    }

    public getPlatformVersionCode(): string {
        return qg.getSystemInfoSync().platformVersionCode;
    }

    public platformVersionSupport(version: string): boolean {
        return true;
    }

    public getSystemInfo(): any {
        return qg.getSystemInfoSync();
    }

    public login(params: any = {}): void {
        if (!ConfigHelper.getGameInfo().appId) {
            LogUtils.error("华为登陆在初始化之前，备用参数缺少appId");
            if (params.resultCallback) {
                params.resultCallback(false);
            }
            return;
        }

        qg.login({
            success: (loginData: any) => {
                LogUtils.info("登录成功: ", loginData);
                this.userInfo.openId = loginData.openId;
                this.userInfo.nickName = loginData.nickname;
                this.userInfo.avatarUrl = loginData.avatarUrl;
                if (params.resultCallback) {
                    params.resultCallback(true, this.userInfo);
                }
            },
            fail: (error: any) => {
                const errorCode = error.errCode;
                const errorMsg = error.errMsg;
                LogUtils.info("登录失败: " + errorCode + " - " + errorMsg);
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            },
            complete: () => {
                console.log("login接口 compelete");
            }
        });
    }

    public getUserInfo(params: any = {}): void {
        if (params.resultCallback) {
            params.resultCallback(true, this.userInfo);
        }
    }

    public getNetworkType(callback: Function): void {
        qg.getNetworkType({
            success: (result: any) => {
                const networkType = result.networkType;
                callback(networkType === "none" ? 0 : 1);
            },
            fail: (error: any) => {
                callback(1);
            }
        });
    }

    public getGameVersion(): string {
        return "1.0.12";
    }

    public copyString(text: string): void {
        LogUtils.info("copyString: ", text);
        qg.setClipboardData({
            data: text,
            success: () => {
                LogUtils.info("copyString success");
            },
            fail: () => {
                LogUtils.info("copyString fail");
            },
            complete: () => {
                LogUtils.info("copyString complete=========");
            }
        });
    }

    public getUserInfoImpl(): any {
        return this.userInfo;
    }
}