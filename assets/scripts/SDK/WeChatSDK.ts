import { cclegacy, game } from "cc";
import { ConfigHelper } from "./../ConfigHelper";
import { EPlatformSceneCode, AbstractPlatformSDK } from "./AbstractPlatformSDK";
import { LogUtils } from "./../Utils/LogUtils";
import { AdControlUtils } from "./../Utils/AdControlUtils";
import { EventHelper } from "./../Event/EventHelper";
import { AdEventKey } from "./../Event/AdEventKey";
import { DefaultNativeTemplate } from "./../DefaultNativeTemplate";
import { EngineUtils } from "./../Utils/EngineUtils";
import { GameLogicConfig } from "./../GameLogicConfig";
import { AudioManager } from "./../AudioManager";
import { PayUtils } from "./../Utils/PayUtils";
import { WXBizDataCrypt } from "./WXBizDataCrypt";
import { Api } from "./../Api";
import { LieyouSDK } from "./LieyouSDK";
import { DnSdkManager } from "./../DnSdkManager";

export enum WeChatMiniGameScene {
    Default = 1000,
    DesktopIcon = 1023,
    MyMiniGame = 1104
}

const sceneCodeMap: Record<EPlatformSceneCode, number> = {
    [EPlatformSceneCode.NONE]: 0,
    [EPlatformSceneCode.DESKTOP]: 1023,
    [EPlatformSceneCode.MYGAME]: 1104
};

export class WeChatSDK extends AbstractPlatformSDK {
    private static _instance: WeChatSDK;
    static weChatMiniGameScene: number;
    static myFriendsInviteCode: string = "";
    static query: any;

    private bannerAd: any;
    private insertAd: any;
    private videoAd: any;
    private gridAd: any;
    private customAd: any;
    private videoAdLodeSuccess: boolean = false;
    private closeCallbackIntert: Function;
    private videoCallback: Function;
    private bannerResize: boolean = false;
    private griadResize: boolean = false;
    private refreshBannerAdTimer: number;
    private adRefreshTimer: number;
    private systemInfo: any;
    private api: any;
    private videoAdLocation: string = "";
    private userInfo: any = {
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
    private videoIdIndex: number = 0;
    private pendingReports: any[] = [];
    private currentReportData: any = null;

    static getInstance(): WeChatSDK {
        if (this._instance === undefined) {
            this._instance = new WeChatSDK();
        }
        return this._instance;
    }

    initAdService(): void {
        const self = this;
        this.api = wx;
        this.api.showShareMenu({
            menus: ["shareAppMessage", "shareTimeline"],
            success: () => {
                LogUtils.info("分享开启成功");
            },
            fail: (error: any) => {
                LogUtils.info("分享开启失败", JSON.stringify(error));
            }
        });

        this.api.onShareAppMessage(() => {
            const sdk = DnSdkManager.instance.sdk;
            if (sdk) {
                sdk.track("SHARE", { target: "APP_MESSAGE" });
            }
            return {
                title: ConfigHelper.getShareConfig().title,
                imageUrl: ConfigHelper.getShareConfig().imageUrl
            };
        });

        this.api.onShareTimeline(() => {
            const sdk = DnSdkManager.instance.sdk;
            if (sdk) {
                sdk.track("SHARE", { target: "TIME_LINE" });
            }
        });

        this.api.onAddToFavorites(() => {
            const sdk = DnSdkManager.instance.sdk;
            if (sdk) {
                sdk.onAddToWishlist();
            }
        });

        EventHelper.channel = "";
        EventHelper.wxClickID = "";

        wx.onShow((res: any) => {
            wx.setKeepScreenOn({
                keepScreenOn: true,
                success: () => {
                    console.log("keepScreenOn111 success=========");
                },
                fail: (error: any) => {
                    console.log("keepScreenOn111 fail: ", error);
                }
            });
            if (EngineUtils.isCocos()) {
                game.resume();
            }
        });

        const launchOptions = wx.getLaunchOptionsSync();
        if (launchOptions) {
            WeChatSDK.weChatMiniGameScene = launchOptions.scene;
            console.log("启动小游戏的场景值: ", WeChatSDK.weChatMiniGameScene);
        }

        if (launchOptions && launchOptions.query) {
            WeChatSDK.query = launchOptions.query;
            const queryData = launchOptions.query;
            console.log("queryData: ", queryData);

            if (queryData.InviteCode) {
                WeChatSDK.myFriendsInviteCode = queryData.InviteCode;
            }

            const gdtVid = queryData.gdt_vid;
            console.log("gdt_vid22是: ", gdtVid);
            if (gdtVid) {
                EventHelper.wxClickID = gdtVid;
            }

            const channel = queryData.channel;
            if (channel != null && channel !== "") {
                console.log("微信透传参数3channel：" + channel);
                EventHelper.channel = channel;
                const channelParts = EventHelper.channel.split("_");
                if (channelParts.length > 2) {
                    EventHelper.accountid = channelParts[2];
                    console.log("EventHelper.accountid: ", EventHelper.accountid);
                }
            } else {
                console.log("微信平台无透传参数3channel");
            }

            const weixinAdInfo = queryData.weixinadinfo;
            console.log("weixinadinfo: ", weixinAdInfo);
            let adId = "";
            if (EventHelper.channel === "" && weixinAdInfo) {
                adId = weixinAdInfo.split(".")[0];
                EventHelper.channel = adId;
            }
            console.log("来源广告的广告id是: " + adId);

            const clickId = queryData.clickid;
            if (clickId != null && clickId !== "" && clickId != null) {
                console.log("巨量引擎 三方（微信）转化回传透传参数,clickid：" + clickId);
                console.log("巨量引擎 三方（微信）转化回传透传参数,channel：" + EventHelper.channel);
                EventHelper.juliang_clickid = clickId;
            } else {
                console.log("巨量引擎 三方（微信）转化回传，无透传参数");
            }

            const callback = queryData.callback;
            if (callback != null && callback !== "" && callback != null) {
                console.log("ks微信透传参数callback：" + callback);
                EventHelper.ksCallback = callback;
            } else {
                console.log("微信平台无透传参数callback");
            }
        }

        setTimeout(() => {
            self.createVideoAd();
        }, 1000);

        wx.setKeepScreenOn({
            keepScreenOn: true,
            success: () => {
                console.log("keepScreenOn222 success=========");
            },
            fail: (error: any) => {
                console.log("keepScreenOn222 fail: ", error);
            }
        });
    }

    login(params: any = {}): void {
        LogUtils.info("login ===");
        this.userInfo.avatarUrl = "";
        this.userInfo.openId = params.openId;
        if (params.resultCallback) {
            params.resultCallback(true, this.userInfo);
        }
    }

    getUserInfo(params: any = {}): void {
        const self = this;
        wx.getSetting({
            success: (res: any) => {
                if (res.authSetting["scope.userInfo"] === true) {
                    console.log("userInfo: 已授权");
                    wx.getUserInfo({
                        success: (res: any) => {
                            console.log("userInfo:", res);
                            const userInfo = res.userInfo;
                            const avatarUrl = userInfo.avatarUrl;
                            self.userInfo.avatarUrl = avatarUrl;
                            self.userInfo.nickName = userInfo.nickName;
                            if (params.resultCallback) {
                                params.resultCallback(true, self.userInfo);
                            }
                        },
                        fail: (error: any) => {
                            LogUtils.info("获取头像失败,但是返回openid.");
                            if (params.resultCallback) {
                                params.resultCallback(true, self.userInfo);
                            }
                        }
                    });
                } else {
                    console.log("userInfo: 没授权过");
                    wx.getUserProfile({
                        desc: "用于排行榜展示用户头像、昵称",
                        success: (res: any) => {
                            LogUtils.info("getUserInfo success");
                            self.userInfo.avatarUrl = res.userInfo.avatarUrl;
                            self.userInfo.nickName = res.userInfo.nickName;
                            if (params.resultCallback) {
                                params.resultCallback(true, self.userInfo);
                            }
                        },
                        fail: (error: any) => {
                            LogUtils.info("用户拒绝授权头像和昵称,但是返回openid:", error);
                            if (params.resultCallback) {
                                params.resultCallback(true, self.userInfo);
                            }
                        }
                    });
                }
            }
        });
    }

    getUserProfile(): void {}

    doAdRefresh(): void {
        const self = this;
        if (this.adRefreshTimer) {
            clearInterval(this.adRefreshTimer);
        }
        this.adRefreshTimer = setInterval(() => {
            if (!self.videoAdLodeSuccess && self.videoAd) {
                LogUtils.info("doAdRefresh videoAd ===");
                self.videoIdIndex++;
                if (self.videoIdIndex > 2) {
                    self.videoIdIndex = 0;
                }
                if (self.videoAd) {
                    console.log("video destroy====");
                    self.videoAd.destroy();
                    self.videoAd = null;
                }
                setTimeout(() => {
                    self.createVideoAd();
                }, 1000);
            }
        }, 15000);
    }

    createBannerAd(): void {
        const self = this;
        LogUtils.info("createBannerAd==========");
        if (ConfigHelper.getGameConfig().systemBannerId) {
            const systemInfo = wx.getSystemInfoSync();
            if (this.bannerAd) {
                this.bannerAd.destroy();
            }
            let top = systemInfo.windowHeight - 80;
            if (ConfigHelper.getGameConfig().systemBannerBottomDistance) {
                top -= ConfigHelper.getGameConfig().systemBannerBottomDistance;
            }
            this.bannerAd = wx.createBannerAd({
                adUnitId: ConfigHelper.getGameConfig().systemBannerId,
                adIntervals: ConfigHelper.getGameConfig().systemBannerRefreshTime,
                style: {
                    left: (systemInfo.windowWidth - 300) / 2,
                    top: top,
                    width: 300,
                    height: 80
                }
            });
            this.bannerAd.offLoad(() => {});
            this.bannerAd.onLoad(() => {
                LogUtils.info("banner loaded======");
            });
            this.bannerAd.offError(() => {});
            this.bannerAd.onError((error: any) => {
                LogUtils.info("banner load error: " + JSON.stringify(error));
            });
            this.bannerResize = false;
            this.bannerAd.offResize(() => {});
            this.bannerAd.onResize((res: any) => {
                self.bannerAd.style.top = systemInfo.windowHeight - res.height;
                self.bannerAd.style.left = (systemInfo.windowWidth - res.width) / 2;
            });
        } else {
            LogUtils.warn("缺少bannerId：", ConfigHelper.getGameConfig().systemBannerId);
        }
    }

    showBannerAd(params: any = {}): void {
        LogUtils.info("showBannerAd======");
        if (this.bannerAd) {
            this.bannerAd.show().then(() => {
                LogUtils.info("广告显示成功");
                if (params.resultCallback) {
                    params.resultCallback(true);
                }
                EventInstance.recordAdvert(params.adLocation + "_" + AdEventKey.sysBanner + "_showSuccess");
            }).catch((error: any) => {
                LogUtils.info("banner广告显示失败:", JSON.stringify(error));
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            });
        } else if (params.resultCallback) {
            params.resultCallback(false);
        }
    }

    hideBannerAd(): void {
        LogUtils.info("hideBannerAd======");
        if (this.bannerAd) {
            this.bannerAd.hide();
        }
        if (this.refreshBannerAdTimer) {
            clearInterval(this.refreshBannerAdTimer);
        }
    }

    createInsertAd(): void {
        const self = this;
        LogUtils.info("createInsertAd==========");
        if (ConfigHelper.getGameConfig().systemInsertId) {
            LogUtils.info("createInsertAd()...");
            if (this.insertAd) {
                this.insertAd.destroy();
            }
            this.insertAd = wx.createInterstitialAd({
                adUnitId: ConfigHelper.getGameConfig().systemInsertId
            });
            this.insertAd.offLoad(() => {});
            this.insertAd.onLoad(() => {
                LogUtils.info("加载插屏成功");
            });
            this.insertAd.load();
            this.insertAd.offError(() => {});
            this.insertAd.onError((error: any) => {
                LogUtils.info("加载插屏失败:", JSON.stringify(error));
            });
            this.insertAd.offClose(() => {});
            this.insertAd.onClose(() => {
                if (self.closeCallbackIntert) {
                    self.closeCallbackIntert();
                }
                LogUtils.info("关闭了插屏");
            });
        } else {
            LogUtils.warn("缺少insertId:", ConfigHelper.getGameConfig().systemInsertId);
        }
    }

    showIntertAd(params: any = {}): void {
        const self = this;
        LogUtils.info("showIntertAd==========");
        if (AdControlUtils.isShowInter() !== false) {
            setTimeout(() => {
                if (self.insertAd) {
                    self.insertAd.show().then(() => {
                        EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.sysInter + "_showSuccess");
                    });
                }
                if (params.resultCallback) {
                    params.resultCallback(true);
                }
                self.closeCallbackIntert = params.closeCallback;
                AdControlUtils.setShowInterTime();
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
        } else if (params.resultCallback) {
            params.resultCallback(false);
        }
    }

    createVideoAd(): void {}

    showVideoAd(params: any = {}): void {
        LogUtils.info("showVideoAd==========");
        this.videoCallback = params.videoCallback;
        if (LieyouSDK.getHaveVideo()) {
            LieyouSDK.showRewardedVideoAd(params);
        } else {
            this.showToast("当前暂无可播放广告");
        }
    }

    vibrateShort(): void {
        wx.vibrateShort();
    }

    vibrateLong(): void {
        wx.vibrateLong();
    }

    showToast(title: string): void {
        wx.showToast({
            title: title,
            icon: "none"
        });
    }

    toMiniGame(params: any): void {
        const appId = params.appId;
        const path = params.path;
        const extraData = params.extraData;
        const callbackFunction = params.callbackFunction;
        const envVersion = params.envVersion !== undefined ? params.envVersion : "release";
        wx.navigateToMiniProgram({
            appId: appId,
            path: path,
            extraData: extraData,
            envVersion: envVersion,
            success: () => {
                LogUtils.info("toMiniGame success");
                if (callbackFunction) {
                    callbackFunction(true);
                }
            },
            fail: () => {
                LogUtils.info("toMiniGame fail err:");
                if (callbackFunction) {
                    callbackFunction(false);
                }
            }
        });
    }

    getPlatformVersionCode(): void {}

    showCustomAd(params: any): void {
        const self = this;
        LogUtils.info("showCustomAd ===", "left:", params.left, "top:", params.top);
        if (ConfigHelper.getGameConfig().nativeTemplateId) {
            if (this.customAd) {
                this.customAd.destroy();
            }
            this.customAd = wx.createCustomAd({
                adUnitId: ConfigHelper.getGameConfig().nativeTemplateId,
                adIntervals: 30,
                style: {
                    left: params.left,
                    top: params.top,
                    fixed: true
                }
            });
            this.customAd.offLoad(() => {});
            this.customAd.onLoad(() => {
                LogUtils.info("原生模板广告加载成功...");
                self.customAd.show().then(() => {
                    LogUtils.info("customAd 展示成功=====");
                    EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.customAd + "_showSuccess");
                }).catch((error: any) => {
                    LogUtils.info("customAd 展示失败=====", JSON.stringify(error));
                });
            });
            this.customAd.offError(() => {});
            this.customAd.onError((error: any) => {
                LogUtils.info("原生模板广告加载失败", JSON.stringify(error));
            });
        } else {
            LogUtils.warn("缺少nativeTemplateId：", ConfigHelper.getGameConfig().nativeTemplateId);
        }
    }

    hideCustomAd(): void {
        if (this.customAd) {
            this.customAd.destroy();
        }
    }

    shareAppMessage(params: any = {}): void {
        LogUtils.info("shareAppMessage==========");
        if (LieyouSDK.getShareEnabled()) {
            LieyouSDK.shareTo(params.adLocation, +params.templateId);
            if (params.resultCallback) {
                params.resultCallback(true);
            }
        } else {
            this.showToast("当前分享不可用");
        }
    }

    shareImage(params: any = {}): void {
        wx.downloadFile({
            url: params.imageUrl ? params.imageUrl : "https://www.quduoduodata.top/ossfile/cocos/Famine2D/share.jpg",
            success: (res: any) => {
                wx.showShareImageMenu({
                    path: res.tempFilePath,
                    needShowEntrance: true,
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
        });
    }

    platformVersionSupport(version: string): boolean {
        return true;
    }

    autoClickVideo(callback: Function): void {
        if (this.videoAdLodeSuccess && AdControlUtils.autoClickVideo()) {
            callback(true);
        } else {
            callback(false);
        }
    }

    getSystemInfo(): any {
        return wx.getSystemInfoSync();
    }

    showRecommendList(params: any = {}): void {
        const self = this;
        LogUtils.info("wx showRecommendList===");
        DefaultNativeTemplate.createRecommendList({
            resultCallback: params.resultCallback,
            parentNode: params.parentNode,
            closeCallback: params.closeCallback,
            recommendGameList: params.recommendGameList,
            toGameCallback: (gameInfo: any) => {
                self.toMiniGame({
                    appId: gameInfo.appId,
                    path: gameInfo.path
                });
            }
        });
    }

    showRecommendIcon(params: any = { top: 0, left: 0, refreshTime: 5 }): void {
        const self = this;
        LogUtils.info("wx showRecommendIcon===");
        DefaultNativeTemplate.createRecommendIcon({
            top: params.top,
            left: params.left,
            refreshTime: params.refreshTime,
            toGameCallback: (gameInfo: any) => {
                self.toMiniGame({
                    appId: gameInfo.appId,
                    path: gameInfo.path
                });
            },
            parentNode: params.parentNode
        });
    }

    getNetworkType(callback: Function): void {
        wx.getNetworkType({
            success: (res: any) => {
                const networkType = res.networkType;
                callback(networkType === "none" ? 0 : 1);
            },
            fail: () => {
                callback(1);
            }
        });
    }

    copyString(text: string): void {
        LogUtils.info("copyString: ", text);
        wx.setClipboardData({
            data: text,
            success: (res: any) => {
                LogUtils.info("copyString success: ", res);
            },
            fail: (error: any) => {
                LogUtils.info("copyString fail: ", error);
            },
            complete: () => {
                LogUtils.info("copyString complete=========");
            }
        });
    }

    getGameVersion(): string {
        return GameLogicConfig.miniGameVersion;
    }

    getUserInfoImpl(): any {
        return this.userInfo;
    }

    isSceneCodeEqual(sceneCode: EPlatformSceneCode): boolean {
        LogUtils.info("isSceneCodeEqual: ", sceneCodeMap[sceneCode], WeChatSDK.weChatMiniGameScene);
        return sceneCodeMap[sceneCode] === WeChatSDK.weChatMiniGameScene;
    }

    getQuery(): any {
        return WeChatSDK.query;
    }

    genIAAReposrtData(data: any, param1: any, param2: any, param3: any): void {}

    scheduleReport(data: any): void {
        const self = this;
        const timer = setTimeout(() => {
            self.executeReport(data);
            const index = self.pendingReports.findIndex((report: any) => report.timer === timer);
            if (index !== -1) {
                self.pendingReports.splice(index, 1);
            }
        }, 30000);
        this.pendingReports.push({
            data: data,
            timer: timer
        });
    }

    executeReport(data: any): void {
        const self = this;
        if (GameGlobal.miniGameCommon) {
            LogUtils.info("IAA上报数据:", data);
            GameGlobal.miniGameCommon.getUserLabel({
                reportData: data,
                labelId: "iaa_feature"
            }).then((result: any) => {
                LogUtils.info("getUserLabel success:", result);
                self.decryptSensitiveData(result.encryptedData, result.iv);
            }).catch((error: any) => {
                LogUtils.info("getUserLabel fail:", error);
            });
        }
    }

    private async decryptSensitiveData(encryptedData: string, iv: string): Promise<any> {
        try {
            const crypt = new WXBizDataCrypt(ConfigHelper.getGameInfo().appId, WeChatSDK.query.sessionKey);
            const decryptedData = await crypt.decryptData(encryptedData, iv);
            LogUtils.log("解密后的敏感数据:", decryptedData);
            if (decryptedData) {
                Api.rushRpgIAAValue(decryptedData.value);
            }
        } catch (error) {
            console.error("Data decryption failed:", error);
            return null;
        }
    };

    cleanupPendingReports(): void {
        this.pendingReports.forEach((report: any) => {
            clearTimeout(report.timer);
        });
        this.pendingReports = [];
        this.currentReportData = null;
    }

    invite(): void {
        this.shareAppMessage({
            adLocation: "rank",
            templateId: "1"
        });
    }

    getPlatform(): string {
        return "ANDROID";
    }
}