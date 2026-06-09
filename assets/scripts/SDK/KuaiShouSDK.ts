import { game, sys } from "cc";
import { EventHelper } from "./../Event/EventHelper";
import { AbstractPlatformSDK } from "./AbstractPlatformSDK";
import { ConfigHelper } from "./../ConfigHelper";
import { AdControlUtils } from "./../Utils/AdControlUtils";
import { EngineUtils } from "./../Utils/EngineUtils";
import { LogUtils } from "./../Utils/LogUtils";
import { PayUtils } from "./../Utils/PayUtils";

export class KuaiShouSDK extends AbstractPlatformSDK {
    private static _instance: KuaiShouSDK;
    static recorderPath: string | undefined;
    static newRecord: boolean = false;

    private bannerAd: any;
    private insertAd: any;
    private videoAd: any;
    private videoAdLodeSuccess: boolean = false;
    private videoCallback: Function | undefined;
    private adRefreshTimer: number | undefined;
    private bannerResize: boolean = false;
    private insertAdStatus: number = 0;
    private recorder: any;
    private recording: boolean = false;
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
    private videoLocation: string = "";
    private insertLocation: string = "";
    private systemInfo: any;
    private accessToken: string = "";
    private showBannerState: boolean = false;
    private resultCallbackInsert: Function | undefined;
    private closeCallbackInsert: Function | undefined;

    private constructor() {
        super();
        this.onShareAppMessage();
    }

    static getInstance(): KuaiShouSDK {
        if (this._instance === undefined) {
            this._instance = new KuaiShouSDK();
        }
        return this._instance;
    }

    initAdService(): void {
        this.createVideoAd();
        this.doAdRefresh();
        this.createIntertAd();
    }

    onShareAppMessage(): void {}

    doAdRefresh(): void {
        if (this.adRefreshTimer) {
            clearInterval(this.adRefreshTimer);
        }
        this.adRefreshTimer = setInterval(() => {
            if (!this.videoAd) {
                LogUtils.info("doAdRefresh createVideoAd ===");
                this.createVideoAd();
            }
        }, 30000);
    }

    createVideoAd(): void {
        LogUtils.info("createVideoAd===");
        if (this.videoAd) {
            this.videoAd.destroy();
        }

        const rewardedVideoId = ConfigHelper.getGameConfig().rewardedVideoId;
        if (rewardedVideoId) {
            this.videoAd = ks.createRewardedVideoAd({
                adUnitId: rewardedVideoId
            });

            this.videoAd.offError(() => {});
            this.videoAd.onError((error: any) => {
                LogUtils.info("videoAd error: ", JSON.stringify(error));
            });

            this.videoAd.offClose(() => {});
            this.videoAd.onClose((result: any) => {
                this.videoAdLodeSuccess = false;
                if (EngineUtils.isCocos()) {
                    game.resume();
                }
                LogUtils.info("关闭广告:", JSON.stringify(result));
                if (result && result.isEnded) {
                    LogUtils.info("观看视频成功");
                    if (this.videoCallback) {
                        this.videoCallback(true);
                    }
                    AdControlUtils.setShowVideoTime();
                    EventHelper.getInstance().videoComplete(this.videoLocation);
                } else {
                    if (this.videoCallback) {
                        this.videoCallback(false);
                    }
                    KuaiShouSDK.getInstance().showToast("未观看完整视频，无法获得奖励");
                    EventHelper.getInstance().videoNotFinished(this.videoLocation);
                }
            });
        } else {
            LogUtils.warn("缺少 videoId", ConfigHelper.getGameConfig().rewardedVideoId);
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

        this.videoAd.show().then(() => {
            LogUtils.info("视频开始播放");
            if (EngineUtils.isCocos()) {
                game.pause();
            }
            EventHelper.getInstance().videoStartEvent(this.videoLocation);
        }).catch((error: any) => {
            LogUtils.info("视频播放失败", JSON.stringify(error));
            KuaiShouSDK.getInstance().showToast("暂无视频广告");
            if (params.videoCallback) {
                params.videoCallback(false);
            }
            if (params.videoOnError) {
                params.videoOnError();
            }
        });
    }

    createBannerAd(): void {}

    showBannerAd(params: any): void {}

    hideBannerAd(): void {}

    vibrateShort(): void {
        ks.vibrateShort({
            success: (res: any) => {},
            fail: (res: any) => {
                LogUtils.info("vibrateShort调用失败");
            }
        });
    }

    vibrateLong(): void {
        ks.vibrateLong({
            success: (res: any) => {},
            fail: (res: any) => {
                LogUtils.info("vibrateLong调用失败");
            }
        });
    }

    showToast(title: string): void {
        LogUtils.info("showToast====", title);
        ks.showToast({
            title: title,
            icon: "none",
            duration: 2000,
            success: (res: any) => {
                LogUtils.info("res:", JSON.stringify(res));
            },
            fail: (res: any) => {
                LogUtils.info("showToast调用失败", JSON.stringify(res));
            }
        });
    }

    getPlatformVersionCode(): number {
        const version = ks.getSystemInfoSync().SDKVersion();
        return Number(version);
    }

    platformVersionSupport(version: string): boolean {
        return true;
    }

    getSystemInfo(): any {
        return ks.getSystemInfoSync();
    }

    getAppName(): string {
        return ks.getSystemInfoSync().appName;
    }

    createIntertAd(): void {
        LogUtils.info("createIntertAd ===");
        const systemInsertId = ConfigHelper.getGameConfig().systemInsertId;
        if (systemInsertId) {
            if (this.insertAd) {
                this.insertAd.offClose();
                this.insertAd.offError();
                this.insertAd.destroy();
                this.insertAd = undefined;
            }

            this.insertAd = ks.createInterstitialAd({
                adUnitId: systemInsertId
            });

            if (this.insertAd) {
                this.insertAd.onClose((result: any) => {
                    console.log("show interstitial ad onClose, result is");
                    console.log(result);
                });

                this.insertAd.onError((error: any) => {
                    console.log("show interstitial ad onError, result is");
                    console.log(error);
                });
            }
        } else {
            LogUtils.warn("缺少systemInsertId:", ConfigHelper.getGameConfig().systemInsertId);
        }
    }

    showIntertAd(params: any = {}): void {
        LogUtils.info("showIntertAd ===");
        if (!this.insertAd) {
            console.log("创建插屏广告组件失败");
            this.createIntertAd();
        }

        if (AdControlUtils.isShowInter() !== false) {
            const delayTime = ConfigHelper.getGameConfig().systemInsertDelayTime;
            setTimeout(() => {
                this.resultCallbackInsert = params.resultCallback;
                this.closeCallbackInsert = params.closeCallback;
                if (params.adLocation) {
                    this.insertLocation = params.adLocation;
                }

                this.insertAd.show().then((result: any) => {
                    console.log("show insertAd ad success, result is");
                    console.log(result);
                }).catch((error: any) => {
                    console.log("show insertAd ad failed, error is ");
                    console.log(error);
                    if (error.code === -10005) {
                        console.log("前app版本不支持插屏广告，可以提醒用户升级app版本");
                    }
                });
            }, 1000 * delayTime);
        } else {
            if (params.resultCallback) {
                params.resultCallback(false);
            }
        }
    }

    login(params: any = {}): void {
        LogUtils.info("login===========");
        ks.login({
            success: (res: any) => {
                LogUtils.info("登录成功,去获得用户信息:", res);
                PayUtils.openId = res.gameUserId;
                this.userInfo.openId = res.gameUserId;
                if (params.resultCallback) {
                    params.resultCallback(true, this.userInfo);
                }
            },
            fail: (error: any) => {
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
                LogUtils.info("登录失败：", JSON.stringify(error));
            }
        });
    }

    getUserInfo(params: any = {}): void {
        ks.authorize({
            scope: "scope.userInfo",
            success: () => {
                console.log("授权获取用户信息成功");
                ks.getUserInfo({
                    success: (res: any) => {
                        LogUtils.info("获取用户信息成功：", JSON.stringify(res));
                        this.userInfo.nickName = res.userName;
                        this.userInfo.avatarUrl = res.userHead;
                        this.userInfo.age = parseInt(res.age);
                        if (res.gender === "M") {
                            this.userInfo.gender = 1;
                        } else if (res.gender === "F") {
                            this.userInfo.gender = 2;
                        } else {
                            this.userInfo.gender = 0;
                        }
                        this.getToken();
                        if (params.resultCallback) {
                            params.resultCallback(true, this.userInfo);
                        }
                    },
                    fail: (error: any) => {
                        console.log("获取用户信息失败: " + JSON.stringify(error));
                        if (params.resultCallback) {
                            params.resultCallback(true, this.userInfo);
                        }
                    },
                    complete: () => {
                        console.log("获取用户信息完成");
                    }
                });
            },
            fail: (error: any) => {
                console.log("授权获取用户信息失败: " + JSON.stringify(error));
                if (params.resultCallback) {
                    params.resultCallback(true, this.userInfo);
                }
            },
            complete: () => {
                console.log("授权获取用户信息完成");
            }
        });
    }

    getNetworkType(callback: Function): void {
        callback(sys.getNetworkType());
    }

    getGameVersion(): string {
        return "1.0.2";
    }

    getToken(): void {}

    textCheck(text: string, callback: Function): void {}

    copyString(text: string): void {
        LogUtils.info("copyString: ", text);
        ks.setClipboardData({
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

    getUserInfoImpl(): any {
        return this.userInfo;
    }

    addDesktopIcon(params: any = {}): void {
        ks.addShortcut({
            success: () => {
                console.log("添加桌面成功");
                if (params.callbackFunction) {
                    params.callbackFunction(true);
                }
            },
            fail: (error: any) => {
                if (params.callbackFunction) {
                    params.callbackFunction(false);
                }
                if (error.code === -10005) {
                    this.showToast("暂不支持该功能");
                } else {
                    console.log("添加桌面失败", error.msg);
                }
            }
        });
    }

    hasDesktopIcon(params: any = {}): void {
        ks.checkShortcut({
            success: (result: any) => {
                console.log("是否已添加快捷方式", result.installed);
                if (params.callbackFunction) {
                    params.callbackFunction(result.installed);
                }
            },
            fail: (error: any) => {
                if (error.code === -10005) {
                    console.log("暂不支持该功能");
                    if (params.callbackFunction) {
                        params.callbackFunction(true);
                    }
                } else {
                    if (params.callbackFunction) {
                        params.callbackFunction(false);
                    }
                    console.log("检查快捷方式失败", error.msg);
                }
            }
        });
    }
}