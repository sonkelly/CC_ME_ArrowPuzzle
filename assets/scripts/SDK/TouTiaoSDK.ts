import { cclegacy, game } from "cc";
import { AdEventKey } from "./../Event/AdEventKey";
import { EventHelper } from "./../Event/EventHelper";
import { AbstractPlatformSDK } from "./AbstractPlatformSDK";
import { ConfigHelper } from "./../ConfigHelper";
import { AdControlUtils } from "./../Utils/AdControlUtils";
import { EngineUtils } from "./../Utils/EngineUtils";
import { LogUtils } from "./../Utils/LogUtils";
import { PayApi } from "./../PayApi";
import { PayUtils } from "./../Utils/PayUtils";
import { StoreUtils, Type } from "./../Utils/StoreUtils";
import { Global } from "./../Global";

export const TTMiniGameScene = {
    DouYinScene: "023040",
    DouJiScene: "103040"
};

class TouTiaoSDK extends AbstractPlatformSDK { 
    private static _instance: TouTiaoSDK;
    static recorderPath: string | undefined;
    static newRecord: boolean = false;
    static recordStopCb: ((success: boolean) => void) | null = null;
    static recordAutoStopCb: ((success: boolean) => void) | null = null;
    static isAutoStop: boolean = false;
    static showSizeBar: boolean = false;
    static launch_from: string = "";
    static location: string = "";
    static sceneValue: string = "";

    private bannerAd: any = undefined;
    private insertAd: any = undefined;
    private videoAd: any = undefined;
    private videoAdLodeSuccess: boolean = false;
    private videoCallback: ((success: boolean) => void) | undefined;
    private adRefreshTimer: number | undefined;
    private bannerResize: boolean = false;
    private insertAdStatus: number = 0;
    private recorder: any = undefined;
    private recording: boolean = false;
    private videoLocation: string = "";
    private insertLocation: string = "";
    private systemInfo: any = undefined;
    private recordTimeout: number | undefined;
    private recordTime: number = 0;
    private recordInterval: number | undefined;
    private showBannerState: boolean = false;
    private resultCallbackInsert: ((success: boolean) => void) | undefined;
    private closeCallbackInsert: (() => void) | undefined;
    private userInfo = {
        openId: "",
        nickName: "",
        avatarUrl: "",
        gender: 0,
        age: 0,
        city: "",
        province: "",
        country: ""
    };

    constructor() {
        super();
        this.registerGameRecorderManager();
        this.onShareAppMessage();
    }

    static getInstance(): TouTiaoSDK {
        if (this._instance === undefined) {
            this._instance = new TouTiaoSDK();
        }
        return this._instance;
    }

    initAdService(): void {
        const options = tt.getLaunchOptionsSync();
        console.log("tt options: ", options);

        if (options && options.query) {
            const queryData = options.query;
            console.log("tt queryData: ", queryData);

            const clickId = queryData.clickid;
            console.log("tt click: ", clickId);
            if (clickId) {
                EventHelper.clickid = clickId;
                console.log("tt click2: ", EventHelper.clickid);
            }

            const accountId = queryData.accountid;
            if (accountId) {
                EventHelper.accountid = accountId;
                console.log("tt accountid: ", EventHelper.accountid);
            }
        }

        if (options) {
            TouTiaoSDK.sceneValue = options.scene;
        }

        tt.checkScene({
            scene: "sidebar",
            success: (result: any) => {
                console.log("check scene success: ", result.isExist);
                TouTiaoSDK.showSizeBar = result.isExist;
            },
            fail: (error: any) => {
                console.log("check scene fail:", error);
            }
        });

        tt.onShow((result: any) => {
            TouTiaoSDK.launch_from = result.launch_from;
            TouTiaoSDK.location = result.location;
        });

        this.createVideoAd();
        this.doAdRefresh();
    }

    static checkLaunchSidebar(): boolean {
        return TouTiaoSDK.launch_from === "homepage" && TouTiaoSDK.location === "sidebar_card";
    }

    login(params: any = {}): void {
        LogUtils.info("login ===");
        tt.login({
            force: false,
            success: (loginResult: any) => {
                LogUtils.info("登录成功: ", loginResult.code, loginResult.anonymousCode);
                LogUtils.info("去换取openid");

                const requestData = {
                    code: loginResult.code,
                    payConfigAppkey: PayUtils.payConfigAppkey
                };

                PayApi.touTiaoCodeToSession(requestData).then((response: string) => {
                    const responseData = JSON.parse(response);
                    console.log("response", responseData);

                    if (responseData.code === 200) {
                        PayUtils.openId = responseData.data.openid;
                        PayUtils.sessionKey = responseData.data.session_key;
                        this.userInfo.openId = responseData.data.openid;
                        if (params.resultCallback) {
                            params.resultCallback(true, this.userInfo);
                        }
                    } else {
                        LogUtils.info("code2Session fail: ", responseData.msg);
                        if (params.resultCallback) {
                            params.resultCallback(false);
                        }
                    }
                });
            },
            fail: (error: any) => {
                LogUtils.info("登录失败：", JSON.stringify(error));
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            }
        });
    }

    getUserInfo(params: any = {}): void {
        tt.getUserInfo({
            success: (result: any) => {
                this.userInfo.nickName = result.userInfo.nickName;
                this.userInfo.avatarUrl = result.userInfo.avatarUrl;
                if (params.resultCallback) {
                    params.resultCallback(true, this.userInfo);
                }
                LogUtils.info("getUserInfo success=====");
            },
            fail: (error: any) => {
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
                LogUtils.info("getUserInfo fail: ", JSON.stringify(error));
            }
        });
    }

    onShareAppMessage(): void {
        tt.onShareAppMessage((shareParams: any) => {
            if (shareParams.channel === "video") {
                return {
                    title: ConfigHelper.getShareConfig().title,
                    query: "",
                    success: () => {
                        LogUtils.info("分享成功");
                    },
                    fail: (error: any) => {
                        LogUtils.info("分享失败: " + JSON.stringify(error));
                    }
                };
            }
        });
    }

    registerGameRecorderManager(): void {
        this.recorder = tt.getGameRecorderManager();

        this.recorder.onStart((event: any) => {
            LogUtils.info("录屏开始");
        });

        this.recorder.onStop((event: any) => {
            LogUtils.info("录屏停止:", JSON.stringify(event));
            TouTiaoSDK.recorderPath = event.videoPath;
            LogUtils.info("TouTiaoSDK.recorderPath", TouTiaoSDK.recorderPath);

            this.recorder.clipVideo({
                path: TouTiaoSDK.recorderPath,
                timeRange: [30, 0],
                success: (clipResult: any) => {
                    TouTiaoSDK.recorderPath = clipResult.videoPath;
                    LogUtils.info("视频剪辑成功: " + TouTiaoSDK.recorderPath);

                    if (TouTiaoSDK.isAutoStop) {
                        if (TouTiaoSDK.recordAutoStopCb) {
                            TouTiaoSDK.recordAutoStopCb(true);
                        }
                    } else {
                        if (TouTiaoSDK.recordStopCb) {
                            TouTiaoSDK.recordStopCb(true);
                        }
                    }
                },
                fail: (clipError: any) => {
                    LogUtils.info("视频剪辑失败: " + JSON.stringify(clipError));

                    if (TouTiaoSDK.isAutoStop) {
                        if (TouTiaoSDK.recordAutoStopCb) {
                            TouTiaoSDK.recordAutoStopCb(false);
                        }
                    } else {
                        if (TouTiaoSDK.recordStopCb) {
                            TouTiaoSDK.recordStopCb(false);
                        }
                    }
                }
            });
        });

        this.recorder.onError((error: any) => {
            LogUtils.info("recorder error " + error.errMsg);
        });
    }

    doAdRefresh(): void {
        if (ConfigHelper.getGameConfig().gameSplashSwitch) {
            if (this.adRefreshTimer) {
                clearInterval(this.adRefreshTimer);
            }

            this.adRefreshTimer = setInterval(() => {
                if (!this.videoAdLodeSuccess && this.videoAd) {
                    LogUtils.info("doAdRefresh videoAd ===");
                    this.videoAd.load();
                }
            }, 10000);
        }
    }

    createVideoAd(): void {
        LogUtils.info("createVideoAd===");

        if (this.videoAd) {
            this.videoAd.destroy();
        }

        const rewardedVideoId = ConfigHelper.getGameConfig().rewardedVideoId;

        if (rewardedVideoId) {
            this.videoAd = tt.createRewardedVideoAd({
                adUnitId: rewardedVideoId
            });

            this.videoAd.offLoad(() => {});
            this.videoAd.onLoad(() => {
                LogUtils.info("videoAd loaded");
                this.videoAdLodeSuccess = true;
            });

            this.videoAd.offError(() => {});
            this.videoAd.onError((error: any) => {
                LogUtils.info("videoAd error: ", JSON.stringify(error));
            });

            this.videoAd.offClose(() => {});
            this.videoAd.onClose((closeResult: any) => {
                this.videoAdLodeSuccess = false;

                if (EngineUtils.isCocos()) {
                    game.resume();
                }

                LogUtils.info("关闭广告:", JSON.stringify(closeResult));

                if (closeResult && closeResult.isEnded) {
                    LogUtils.info("观看视频成功");

                    if (this.videoCallback) {
                        this.videoCallback(true);
                    }

                    AdControlUtils.setShowVideoTime();
                    EventHelper.getInstance().videoComplete(this.videoLocation);

                    const videoCount = StoreUtils.getInstance().get(StoreUtils.videoTotalCount, Type.Int, 0) + 1;
                    StoreUtils.getInstance().set(StoreUtils.videoTotalCount, Type.Int, videoCount);
                    LogUtils.info("ipu num2: ", videoCount);

                    EventHelper.getInstance().conversion("game_addiction", videoCount);

                    if (Global.ge) {
                        Global.ge.adShowEvent("reward", rewardedVideoId, {
                            custom_param: ""
                        });
                    }
                } else {
                    if (this.videoCallback) {
                        this.videoCallback(false);
                    }
                    TouTiaoSDK.getInstance().showToast("未观看完整视频");
                    EventHelper.getInstance().videoNotFinished(this.videoLocation);
                }

                if (ConfigHelper.getGameConfig().gameSplashSwitch) {
                    this.videoAd.load();
                }
            });

            if (ConfigHelper.getGameConfig().gameSplashSwitch) {
                this.videoAd.load();
            }
        } else {
            LogUtils.warn("缺少 videoId", rewardedVideoId);
        }
    }

    showVideoAd(params: any = {}): void {
        LogUtils.info("resultCallback ===");

        if (AdControlUtils.isShowVideo() === false) {
            this.showToast("当前暂无可播放广告");
            if (params.videoCallback) {
                params.videoCallback(false);
            }
            return;
        }

        this.videoCallback = params.videoCallback;

        if (params.videOnStartCallback) {
            params.videOnStartCallback();
        }

        if (params.adLocation) {
            this.videoLocation = params.adLocation;
        }

        if (ConfigHelper.getGameConfig().gameSplashSwitch) {
            if (this.videoAdLodeSuccess) {
                this.videoAd.show()
                    .then(() => {
                        LogUtils.info("视频开始播放");
                        if (EngineUtils.isCocos()) {
                            game.pause();
                        }
                        EventHelper.getInstance().videoStartEvent(this.videoLocation);
                    })
                    .catch((error: any) => {
                        LogUtils.info("视频播放失败", JSON.stringify(error));
                        TouTiaoSDK.getInstance().showToast("暂无视频广告");
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
        } else {
            this.videoAd.show()
                .then(() => {
                    LogUtils.info("视频开始播放");
                    if (EngineUtils.isCocos()) {
                        game.pause();
                    }
                    EventHelper.getInstance().videoStartEvent(this.videoLocation);
                })
                .catch((error: any) => {
                    LogUtils.info("视频播放失败", JSON.stringify(error));
                    TouTiaoSDK.getInstance().showToast("暂无视频广告");
                    if (params.videoCallback) {
                        params.videoCallback(false);
                    }
                    if (params.videoOnError) {
                        params.videoOnError();
                    }
                });
        }
    }

    createBannerAd(): void {
        LogUtils.info("createBannerAd ===");

        if (ConfigHelper.getGameConfig().systemBannerId) {
            const systemInfo = tt.getSystemInfoSync();

            if (this.bannerAd) {
                this.bannerAd.destroy();
            }

            const leftOffset = 0.1 * systemInfo.windowWidth;

            this.bannerAd = tt.createBannerAd({
                adUnitId: ConfigHelper.getGameConfig().systemBannerId,
                adIntervals: ConfigHelper.getGameConfig().systemBannerRefreshTime,
                style: {
                    top: systemInfo.windowHeight - 72,
                    left: leftOffset,
                    width: 128
                }
            });

            this.bannerAd.offLoad(() => {});
            this.bannerAd.onLoad(() => {
                LogUtils.info("banner loaded");

                if (this.showBannerState) {
                    this.bannerAd.show()
                        .then(() => {
                            LogUtils.info("广告显示成功");
                        })
                        .catch((error: any) => {
                            LogUtils.info("广告组件出现问题" + JSON.stringify(error));
                        });
                }
            });

            this.bannerAd.offError(() => {});
            this.bannerAd.onError((error: any) => {
                LogUtils.info("banner error " + error.errCode + error.errMsg);
            });

            this.bannerAd.offResize(() => {});
            this.bannerAd.onResize((resizeResult: any) => {
                LogUtils.info("onResize res:", JSON.stringify(resizeResult));

                if (resizeResult.width !== 128) {
                    LogUtils.info("bannerAd onResize res:", JSON.stringify(resizeResult));
                    this.bannerResize = true;
                    this.bannerAd.style.top = systemInfo.windowHeight - resizeResult.height;
                    this.bannerAd.style.left = (systemInfo.windowWidth - resizeResult.width) / 2;
                }
            });
        } else {
            LogUtils.warn("缺少bannerId:", ConfigHelper.getGameConfig().systemBannerId);
        }
    }

    showBannerAd(params: any = {}): void {
        LogUtils.info("showBannerAd===");
        this.showBannerState = true;
        this.bannerResize = false;
        this.createBannerAd();
        EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.sysBanner + "_" + AdEventKey.showSuccess);
    }

    hideBannerAd(): void {
        LogUtils.info("hideBannerAd()");
        this.showBannerState = false;

        if (this.bannerAd) {
            this.bannerAd.hide();
        }

        if (this.bannerAd) {
            this.bannerAd.destroy();
        }
    }

    createIntertAd(): void {
        LogUtils.info("createIntertAd ===");

        this.insertAd = tt.createInterstitialAd({
            adUnitId: ConfigHelper.getGameConfig().systemInsertId
        });

        this.insertAdStatus = 1;

        this.insertAd.offLoad(() => {});
        this.insertAd.onLoad((event: any) => {
            LogUtils.info("插屏加载成功===");

            this.insertAd.show()
                .then(() => {
                    if (this.resultCallbackInsert) {
                        this.resultCallbackInsert(true);
                    }

                    AdControlUtils.setShowInterTime();
                    LogUtils.info("插屏展示 成功===");
                    this.insertAdStatus = 2;
                    EventHelper.getInstance().recordAdvert(this.insertLocation + "_" + AdEventKey.sysInter + "_" + AdEventKey.showSuccess);
                })
                .catch((error: any) => {
                    if (this.resultCallbackInsert) {
                        this.resultCallbackInsert(false);
                    }
                    LogUtils.info("插屏展示 失败===", JSON.stringify(error));
                });
        });

        this.insertAd.offError(() => {});
        this.insertAd.onError((error: any) => {
            LogUtils.info("插屏加载失败======= " + JSON.stringify(error));
        });

        this.insertAd.offClose(() => {});
        this.insertAd.onClose(() => {
            if (this.closeCallbackInsert) {
                this.closeCallbackInsert();
            }
        });
    }

    showIntertAd(params: any = {}): void {
        if (!ConfigHelper.getGameConfig().systemInsertId) {
            LogUtils.warn("缺少insertId:", ConfigHelper.getGameConfig().systemInsertId);
            if (params.resultCallback) {
                params.resultCallback(false);
            }
            return;
        }

        if (AdControlUtils.isShowInter() !== false) {
            setTimeout(() => {
                this.resultCallbackInsert = params.resultCallback;
                this.closeCallbackInsert = params.closeCallback;

                if (params.adLocation) {
                    this.insertLocation = params.adLocation;
                }

                if (this.insertAdStatus === 0 || this.insertAdStatus === 2) {
                    if (this.insertAd) {
                        this.insertAd.destroy();
                    }
                    this.insertAd = undefined;
                    this.createIntertAd();
                } else {
                    this.insertAd.load();
                }
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
        } else {
            if (params.resultCallback) {
                params.resultCallback(false);
            }
        }
    }

    vibrateShort(): void {
        tt.vibrateShort({
            success: (result: any) => {},
            fail: (error: any) => {
                LogUtils.info("vibrateShort调用失败");
            }
        });
    }

    vibrateLong(): void {
        tt.vibrateLong({
            success: (result: any) => {},
            fail: (error: any) => {
                LogUtils.info("vibrateLong调用失败");
            }
        });
    }

    showToast(message: string): void {
        LogUtils.info("showToast====", message);
        tt.showToast({
            title: message,
            icon: "none",
            duration: 2000,
            success: (result: any) => {
                LogUtils.info("res:", JSON.stringify(result));
            },
            fail: (error: any) => {
                LogUtils.info("showToast调用失败", JSON.stringify(error));
            }
        });
    }

    getPlatformVersionCode(): number {
        const versionCode = tt.getSystemInfoSync().SDKVersion();
        return Number(versionCode);
    }

    shareAppMessage(params: any = {}): void {
        LogUtils.info("shareAppMessage ===");
        tt.shareAppMessage({
            templateId: params.templateId,
            query: "",
            success: () => {
                LogUtils.info("分享成功");
                if (params.resultCallback) {
                    params.resultCallback(true);
                }
            },
            fail: (error: any) => {
                LogUtils.info("分享失败: e", JSON.stringify(error));
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            }
        });
    }

    shareGameRecorder(params: any = {}): void {
        LogUtils.info("shareGameRecorder ===");

        if (TouTiaoSDK.recorderPath) {
            if (this.recordTime <= 4) {
                TouTiaoSDK.getInstance().showToast("录屏少于3秒");
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            } else {
                tt.shareAppMessage({
                    channel: "video",
                    query: "",
                    templateId: undefined,
                    title: ConfigHelper.getShareConfig().title,
                    desc: "",
                    extra: {
                        withVideoId: true,
                        videoPath: TouTiaoSDK.recorderPath,
                        videoTopics: [ConfigHelper.getShareConfig().title],
                        hashtag_list: [ConfigHelper.getShareConfig().title]
                    },
                    success: (result: any) => {
                        LogUtils.info("分享视频成功== ", JSON.stringify(result));
                        TouTiaoSDK.newRecord = false;
                        if (params.resultCallback) {
                            params.resultCallback(true);
                        }
                    },
                    fail: (error: any) => {
                        LogUtils.info("分享视频失败== ", JSON.stringify(error));

                        const errorMessage = String(error.errMsg);

                        if (errorMessage.indexOf("short") > 0) {
                            if (params.resultCallback) {
                                params.resultCallback(false);
                            }
                            TouTiaoSDK.getInstance().showToast("录屏少于3秒");
                        } else if (errorMessage.indexOf("cancel") > 0) {
                            if (params.resultCallback) {
                                params.resultCallback(false);
                            }
                            TouTiaoSDK.getInstance().showToast("分享取消");
                        } else {
                            if (params.resultCallback) {
                                params.resultCallback(false);
                            }
                            TouTiaoSDK.getInstance().showToast("分享失败");
                        }
                    }
                });
            }
        } else {
            TouTiaoSDK.getInstance().showToast("没有可分享的录屏");
        }
    }

    gameRecorderStart(callback: (success: boolean) => void): void {
        LogUtils.info("=========gameRecorderStart()");

        if (this.recorder) {
            this.recordTime = 0;
            clearInterval(this.recordInterval);

            this.recordInterval = setInterval(() => {
                this.recordTime++;
            }, 1000);

            TouTiaoSDK.isAutoStop = false;

            this.recorder.start({
                duration: 300
            });

            this.recording = true;
            TouTiaoSDK.recordAutoStopCb = callback;

            this.recordTimeout = setTimeout(() => {
                if (this.recording) {
                    LogUtils.info("recordTimeout===========");
                    TouTiaoSDK.isAutoStop = true;
                    this.recorder.stop();
                    this.recording = false;
                    TouTiaoSDK.newRecord = true;
                    clearTimeout(this.recordTimeout);
                }
            }, 250000);
        }
    }

    gameRecorderPause(): void {
        LogUtils.info("=======gameRecorderPause()");

        if (this.recording) {
            this.recorder.pause();
        }
    }

    gameRecorderResume(): void {
        LogUtils.info("=======gameRecorderResume()");

        if (this.recording) {
            this.recorder.resume();
        }
    }

    gameRecorderStop(callback: (success: boolean) => void): void {
        LogUtils.info("=========gameRecorderStop()");

        if (this.recording) {
            clearInterval(this.recordInterval);
            clearTimeout(this.recordTimeout);

            TouTiaoSDK.isAutoStop = false;
            TouTiaoSDK.recordStopCb = callback;

            this.recorder.stop();
            this.recording = false;
            TouTiaoSDK.newRecord = true;
        }
    }

    addDesktopIcon(params: any = {}): void {
        LogUtils.info("addShortcut==================");

        if (this.getAppName() === "Douyin" || this.getAppName() === "douyin_lite") {
            tt.addShortcut({
                success: () => {
                    LogUtils.info("addDesktopIcon success");
                    if (params.callbackFunction) {
                        params.callbackFunction(true);
                    }
                    EventHelper.getInstance().recordAdvert(AdEventKey.addDesktopIcon + "_" + AdEventKey.showSuccess);
                },
                fail: (error: any) => {
                    LogUtils.info("addDesktopIcon err: ", JSON.stringify(error));
                    if (params.callbackFunction) {
                        params.callbackFunction(false);
                    }
                },
                complete: () => {}
            });
        } else {
            this.showToast("暂不支持此功能");
        }
    }

    hasDesktopIcon(params: any = {}): void {
        LogUtils.info("hasDesktopIcon==================");

        if (this.getAppName() === "Douyin" || this.getAppName() === "douyin_lite") {
            tt.checkShortcut({
                success: (result: any) => {
                    LogUtils.info("checkShortcut: ", result);

                    if (result.status.exist === false) {
                        if (params.callbackFunction) {
                            params.callbackFunction(false);
                        }
                    } else {
                        if (params.callbackFunction) {
                            params.callbackFunction(true);
                        }
                    }
                },
                fail: (error: any) => {
                    if (params.callbackFunction) {
                        params.callbackFunction(true);
                    }
                },
                complete: () => {}
            });
        } else {
            if (params.callbackFunction) {
                params.callbackFunction(true);
            }
        }
    }

    platformVersionSupport(version: string): boolean {
        return true;
    }

    getNetworkType(callback: (type: number) => void): void {
        tt.getNetworkType({
            success: (result: any) => {
                const networkType = result.networkType;
                callback(networkType === "none" ? 0 : 1);
            },
            fail: () => {
                callback(1);
            }
        });
    }

    copyString(text: string, callback?: (success: boolean) => void): void {
        LogUtils.info("copyString: ", text);

        tt.setClipboardData({
            data: text,
            success: (result: any) => {
                if (callback) {
                    callback(true);
                }
                this.showToast("复制成功");
                console.log("setClipboardData调用成功");
            },
            fail: (error: any) => {
                if (callback) {
                    callback(false);
                }
                console.log("setClipboardData调用失败");
            }
        });
    }

    navigateToScene(): void {
        tt.navigateToScene({
            scene: "sidebar",
            success: (result: any) => {
                console.log("navigate to scene success");
            },
            fail: (error: any) => {
                console.log("navigate to scene fail: ", error);
            }
        });
    }

    getSystemInfo(): any {
        return tt.getSystemInfoSync();
    }

    isShieldPay(): boolean {
        return this.getAppName() === "Toutiao" || this.getAppName() === "news_article_lite";
    }

    getAppName(): string {
        return tt.getSystemInfoSync().appName;
    }

    getGameVersion(): string {
        return "1.0.3";
    }

    getUserInfoImpl(): any {
        return this.userInfo;
    }
}

export default TouTiaoSDK;