import { cclegacy, game } from "cc";
import { GameLogicConfig } from "./../GameLogicConfig";
import { AdEventKey } from "./../Event/AdEventKey";
import { EventHelper } from "./../Event/EventHelper";
import { LocalConfig } from "./../LocalConfig";
import { AbstractPlatformSDK } from "./AbstractPlatformSDK";
import { ConfigHelper } from "./../ConfigHelper";
import { AdControlUtils } from "./../Utils/AdControlUtils";
import { EngineUtils } from "./../Utils/EngineUtils";
import { LogUtils } from "./../Utils/LogUtils";
import { PayApi } from "./../PayApi";
import { PayUtils } from "./../Utils/PayUtils";
import { VersionUtils } from "./../Utils/VersionUtils";

export class QqSDK extends AbstractPlatformSDK {
    private static _instance: QqSDK;

    private bannerAd: any = undefined;
    private insertAd: any = undefined;
    private videoAd: any = undefined;
    private blockAd: any = undefined;
    private videoAdLodeSuccess: boolean = false;
    private videoCallback: Function | undefined = undefined;
    private resultCallbackNativeInsert: Function | undefined = undefined;
    private closeCallbackNativeInsert: Function | undefined = undefined;
    private adRefreshTimer: number | undefined = undefined;
    private systemInfo: any = undefined;
    private videoLocation: string = "";
    private insertLocation: string = "";
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
    private api: any = undefined;

    public static getInstance(): QqSDK {
        if (this._instance === undefined) {
            this._instance = new QqSDK();
        }
        return this._instance;
    }

    public initAdService(): void {
        this.createVideoAd();
        this.doAdRefresh();
        this.createBannerAd();
        this.api = qq;
        this.api.showShareMenu({
            showShareItems: ["qq", "qzone"]
        });
        this.api.onShareAppMessage(() => {
            return {
                title: ConfigHelper.getShareConfig().title,
                imageUrl: ConfigHelper.getShareConfig().imageUrl
            };
        });
    }

    public login(params: any = {}): void {
        LogUtils.info("login===========");
        qq.login({
            success: (res: any) => {
                LogUtils.info("登录成功");
                const requestData = {
                    code: res.code,
                    payConfigAppkey: PayUtils.payConfigAppkey
                };
                PayApi.qqCodeToSession(requestData).then((response: string) => {
                    const responseData = JSON.parse(response);
                    console.log("response", responseData);
                    if (responseData.code == 200) {
                        PayUtils.openId = responseData.data.openid;
                        PayUtils.sessionKey = responseData.data.session_key;
                        this.userInfo.openId = responseData.data.openid;
                        this.userInfo.nickName = "勇者555";
                        this.userInfo.avatarUrl = "";
                        if (params.resultCallback) {
                            params.resultCallback(true, this.userInfo);
                        }
                    } else {
                        if (params.resultCallback) {
                            params.resultCallback(false);
                        }
                        SDKInstance.showToast(responseData.msg);
                        LogUtils.info("codeToSession fail: ", responseData.msg);
                    }
                });
            },
            fail: (error: any) => {
                LogUtils.info("登录失败: ", JSON.stringify(error));
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            }
        });
    }

    private doAdRefresh(): void {
        if (this.adRefreshTimer) {
            clearInterval(this.adRefreshTimer);
        }
        this.adRefreshTimer = setInterval(() => {
            if (this.videoAd && !this.videoAdLodeSuccess) {
                this.videoAd.load();
            }
        }, 15000);
    }

    private createVideoAd(): void {
        LogUtils.info("createVideoAd ===");
        if (ConfigHelper.getGameConfig().rewardedVideoId) {
            this.videoAd = qq.createRewardedVideoAd({
                adUnitId: ConfigHelper.getGameConfig().rewardedVideoId
            });
            this.videoAd.offLoad();
            this.videoAd.onLoad(() => {
                LogUtils.info("videoAd loaded");
                this.videoAdLodeSuccess = true;
            });
            this.videoAd.load();
            this.videoAd.offError();
            this.videoAd.onError((error: any) => {
                LogUtils.info("videoAd error:", JSON.stringify(error));
            });
            this.videoAd.offClose();
            this.videoAd.onClose((res: any) => {
                this.videoAdLodeSuccess = false;
                if (EngineUtils.isCocos()) {
                    game.resume();
                }
                if (res && res.isEnded) {
                    LogUtils.info("视频播放完成发放奖励");
                    AdControlUtils.setShowVideoTime();
                    if (this.videoCallback) {
                        this.videoCallback(true);
                    }
                    EventHelper.getInstance().videoComplete(this.videoLocation);
                } else {
                    if (this.videoCallback) {
                        this.videoCallback(false);
                    }
                    this.showToast("未观看完整视频，无法获得奖励");
                    EventHelper.getInstance().videoNotFinished(this.videoLocation);
                }
            });
        } else {
            LogUtils.warn("缺少videoId", ConfigHelper.getGameConfig().rewardedVideoId);
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
        if (this.videoAdLodeSuccess) {
            if (params.videOnStartCallback) {
                params.videOnStartCallback();
            }
            if (params.adLocation) {
                this.videoLocation = params.adLocation;
            }
            this.videoAd.show().then(() => {
                LogUtils.info("激励视频开始播放");
                if (EngineUtils.isCocos()) {
                    game.pause();
                }
                EventHelper.getInstance().videoStartEvent(this.videoLocation);
                this.videoCallback = params.videoCallback;
                this.videoAdLodeSuccess = false;
            }).catch((error: any) => {
                LogUtils.info("激励视频 广告显示失败", JSON.stringify(error));
                this.showToast("当前暂无可播放广告");
                if (params.videoCallback) {
                    params.videoCallback(false);
                }
                if (params.videoOnError) {
                    params.videoOnError();
                }
            });
        } else {
            this.showToast("当前暂无可播放广告");
            if (params.videoCallback) {
                params.videoCallback(false);
            }
            if (params.videoOnError) {
                params.videoOnError();
            }
        }
    }

    private createBannerAd(): void {
        LogUtils.info("createBannerAd ===");
        const systemInfo = this.getSystemInfo();
        const windowWidth = systemInfo.windowWidth;
        const windowHeight = systemInfo.windowHeight;
        if (ConfigHelper.getGameConfig().systemBannerId) {
            const left = 0.5 * windowWidth - 150;
            const top = windowHeight - 72;
            if (ConfigHelper.getGameConfig().systemBannerRefreshTime < 30) {
                ConfigHelper.getGameConfig().systemBannerRefreshTime = 30;
            }
            this.bannerAd = qq.createBannerAd({
                adUnitId: ConfigHelper.getGameConfig().systemBannerId,
                adIntervals: ConfigHelper.getGameConfig().systemBannerRefreshTime,
                style: {
                    left: left,
                    top: top,
                    width: 300,
                    height: 72
                }
            });
            this.bannerAd.onLoad(() => {
                LogUtils.info("banner loaded");
            });
            this.bannerAd.onError((error: any) => {
                LogUtils.info("banner error:", JSON.stringify(error));
            });
            this.bannerAd.onResize((res: any) => {
                LogUtils.info("banner:", JSON.stringify(res));
            });
        } else {
            LogUtils.warn("缺少:bannerId", ConfigHelper.getGameConfig().systemBannerId);
        }
    }

    public showBannerAd(params: any = {}): void {
        LogUtils.info("showBannerAd===");
        if (this.bannerAd) {
            this.bannerAd.show();
        }
        if (this.bannerAd) {
            EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.sysBanner + "_" + AdEventKey.showSuccess);
        }
    }

    public hideBannerAd(): void {
        LogUtils.info("hideBannerAd===");
        if (this.bannerAd) {
            this.bannerAd.hide();
        }
    }

    private createIntertAd(): void {
        LogUtils.info("createIntertAd ===");
        if (ConfigHelper.getGameConfig().systemInsertId) {
            if (this.platformVersionSupport("createInterstitialAd") !== false) {
                if (this.insertAd) {
                    this.insertAd.destroy();
                }
                this.insertAd = qq.createInterstitialAd({
                    adUnitId: ConfigHelper.getGameConfig().systemInsertId
                });
                this.insertAd.offLoad(() => {});
                this.insertAd.onLoad(() => {
                    LogUtils.info("插屏加载成功===");
                    this.insertAd.show().then(() => {
                        if (this.resultCallbackNativeInsert) {
                            this.resultCallbackNativeInsert(true);
                        }
                        LogUtils.info("show insertAd success");
                        EventHelper.getInstance().recordAdvert(this.insertLocation + "_" + AdEventKey.sysInter + "_" + AdEventKey.showSuccess);
                    }).catch((error: any) => {
                        if (this.resultCallbackNativeInsert) {
                            this.resultCallbackNativeInsert(false);
                        }
                        LogUtils.info("show insertAd err:", JSON.stringify(error));
                    });
                });
                this.insertAd.offClose(() => {});
                this.insertAd.onClose(() => {
                    if (this.closeCallbackNativeInsert) {
                        this.closeCallbackNativeInsert();
                    }
                });
                this.insertAd.offError(() => {});
                this.insertAd.onError((error: any) => {
                    LogUtils.info("插屏加载失败===:", JSON.stringify(error));
                    if (this.resultCallbackNativeInsert) {
                        this.resultCallbackNativeInsert(false);
                    }
                    if (error) {
                        switch (error.errCode) {
                            case 2001:
                                LogUtils.info("2001 触发频率限制\t小程序启动一定时间内不允许展示插屏广告");
                                break;
                            case 2002:
                                LogUtils.info("2002 触发频率限制\t距离小程序插屏广告或者激励视频广告上次播放时间间隔不足，不允许展示插屏广告");
                                break;
                            case 2003:
                                LogUtils.info("2003\t触发频率限制\t当前正在播放激励视频广告或者插屏广告，不允许再次展示插屏广告");
                                break;
                            case 2004:
                                LogUtils.info("2004\t广告渲染失败\t该项错误不是开发者的异常情况，或因小程序页面切换导致广告渲染失败");
                                break;
                            case 2005:
                                LogUtils.info("2005\t广告调用异常\t插屏广告实例不允许跨页面调用");
                                break;
                        }
                    }
                });
            } else {
                this.showToast(LocalConfig.VERSION_NUMBER_SUPPORT_TIPS);
            }
        } else {
            LogUtils.warn("缺少insertId", ConfigHelper.getGameConfig().systemInsertId);
        }
    }

    public showIntertAd(params: any = {}): void {
        LogUtils.info("showIntertAd ===");
        if (AdControlUtils.isShowInter() !== false) {
            setTimeout(() => {
                this.resultCallbackNativeInsert = params.resultCallback;
                this.closeCallbackNativeInsert = params.closeCallback;
                if (!this.insertAd) {
                    this.createIntertAd();
                }
                if (this.insertAd) {
                    this.insertAd.load();
                }
                if (this.insertAd && params.adLocation) {
                    this.insertLocation = params.adLocation;
                }
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
        } else {
            if (params.resultCallback) {
                params.resultCallback(false);
            }
        }
    }

    public vibrateShort(): void {
        qq.vibrateShort();
    }

    public vibrateLong(): void {
        qq.vibrateLong();
    }

    public showToast(title: string): void {
        qq.showToast({
            title: title
        });
    }

    public addDesktopIcon(params: any = {}): void {
        LogUtils.info("addDesktopIcon===");
        qq.saveAppToDesktop({
            success: () => {
                LogUtils.info("创建桌面图标成功======");
                if (params.callbackFunction) {
                    params.callbackFunction(true);
                }
                EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.addDesktopIcon + "_" + AdEventKey.showSuccess);
            },
            fail: (error: any) => {
                LogUtils.info("创建桌面图标失败======:", JSON.stringify(error));
                if (params.callbackFunction) {
                    params.callbackFunction(false);
                }
            },
            complete: () => {}
        });
    }

    public getPlatformVersionCode(): string {
        return this.getSystemInfo().SDKVersion;
    }

    public platformVersionSupport(feature: string): boolean {
        let supported = true;
        const versionCode = this.getPlatformVersionCode();
        switch (feature) {
            case "createInterstitialAd":
                supported = VersionUtils.versionSupport(versionCode, "1.12.0");
                break;
            case "createAppBox":
                supported = VersionUtils.versionSupport(versionCode, "1.7.1");
                break;
            case "createBlockAd":
                supported = VersionUtils.versionSupport(versionCode, "1.15.0");
                break;
            default:
                supported = true;
        }
        return supported;
    }

    public showAppBox(params: any = {}): void {
        LogUtils.info("showAppBox");
        if (ConfigHelper.getGameConfig().appBoxId) {
            if (this.platformVersionSupport("createAppBox") === false) {
                LogUtils.info("showAppBox" + LocalConfig.VERSION_NUMBER_SUPPORT_TIPS);
                this.showToast(LocalConfig.VERSION_NUMBER_SUPPORT_TIPS);
            }
            const appBoxAd = qq.createAppBox({
                adUnitId: ConfigHelper.getGameConfig().appBoxId
            });
            appBoxAd.load().then(() => {
                appBoxAd.show().then(() => {
                    LogUtils.info("盒子广告显示成功");
                    EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.appBox + "_" + AdEventKey.showSuccess);
                }).catch(() => {
                    this.showToast("暂无盒子广告");
                });
            }).catch((error: any) => {
                LogUtils.info("load error", JSON.stringify(error));
            });
            appBoxAd.onClose((res: any) => {
                LogUtils.info("appBoxAd clonse", JSON.stringify(res));
            });
        } else {
            LogUtils.warn("缺少appBoxId", ConfigHelper.getGameConfig().appBoxId);
        }
    }

    public showBlockAd(params: any): void {
        LogUtils.info("showBlockAd ===");
        LogUtils.info("left:", params.left, "top:", params.top, "size:", params.size, "orientation:", params.orientation);
        if (ConfigHelper.getGameConfig().blockId) {
            if (this.platformVersionSupport("createBlockAd") === false) {
                LogUtils.info("showBlockAd" + LocalConfig.VERSION_NUMBER_SUPPORT_TIPS);
                this.showToast(LocalConfig.VERSION_NUMBER_SUPPORT_TIPS);
            }
            if (this.blockAd) {
                this.blockAd.destroy();
            }
            this.blockAd = qq.createBlockAd({
                adUnitId: ConfigHelper.getGameConfig().blockId,
                style: {
                    left: params.left,
                    top: params.top
                },
                size: params.size,
                orientation: params.orientation
            });
            this.blockAd.offLoad(() => {});
            this.blockAd.onLoad(() => {
                LogUtils.info("blockAd onLoad ====");
                this.blockAd.show().then(() => {
                    LogUtils.info("blockAd 展示成功=====");
                    EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.blockAd + "_" + AdEventKey.showSuccess);
                }).catch((error: any) => {
                    LogUtils.info("blockAd 展示失败=====", JSON.stringify(error));
                });
            });
            this.blockAd.offError(() => {});
            this.blockAd.onError((error: any) => {
                LogUtils.info("blockAd onError=====", JSON.stringify(error));
            });
            this.blockAd.offResize(() => {});
            this.blockAd.onResize((res: any) => {
                LogUtils.info("blockAd onResize: ", JSON.stringify(res));
            });
        } else {
            LogUtils.warn("缺少blockId", ConfigHelper.getGameConfig().blockId);
        }
    }

    public hideBlockAd(): void {
        LogUtils.info("hideBlockAd=====");
        if (this.blockAd) {
            this.blockAd.hide();
        }
    }

    public getSystemInfo(): any {
        return qq.getSystemInfoSync();
    }

    public shareAppMessage(params: any = {}): void {
        LogUtils.info("shareAppMessage==========");
        if (!params.title) {
            params.title = ConfigHelper.getShareConfig().title;
        }
        if (!params.imageUrl) {
            params.imageUrl = ConfigHelper.getShareConfig().imageUrl;
        }
        qq.shareAppMessage({
            title: params.title,
            imageUrl: params.imageUrl,
            success: () => {
                if (params.resultCallback) {
                    params.resultCallback(true);
                }
            },
            fail: () => {
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            }
        });
    }

    public getNetworkType(callback: Function): void {
        qq.getNetworkType({
            success: (res: any) => {
                const networkType = res.networkType;
                callback(networkType == "none" ? 0 : 1);
            },
            fail: () => {
                callback(1);
            }
        });
    }

    public getGameVersion(): string {
        return GameLogicConfig.miniGameVersion;
    }
}