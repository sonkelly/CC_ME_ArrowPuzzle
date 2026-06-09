import { _decorator, Component, game, view } from 'cc';
import { AbstractPlatformSDK } from './AbstractPlatformSDK';
import { ConfigHelper } from './../ConfigHelper';
import { AdControlUtils } from './../Utils/AdControlUtils';
import { EngineUtils } from './../Utils/EngineUtils';
import { LogUtils } from './../Utils/LogUtils';

export class FourThreeNineNineGameBox extends AbstractPlatformSDK {
    private static _instance: FourThreeNineNineGameBox;

    private bannerAd: any = undefined;
    private insertAd: any = undefined;
    private videoAd: any = undefined;
    private videoAdLocation: string = "";
    private videoCallback: Function | undefined = undefined;
    private userInfo: {
        openId: string;
        nickName: string;
        avatarUrl: string;
        gender: number;
        age: number;
        city: string;
        province: string;
        country: string;
    } = {
        openId: "",
        nickName: "",
        avatarUrl: "",
        gender: 0,
        age: 0,
        city: "",
        province: "",
        country: ""
    };

    public static getInstance(): FourThreeNineNineGameBox {
        if (this._instance === undefined) {
            this._instance = new FourThreeNineNineGameBox();
        }
        return this._instance;
    }

    public initAdService(): void {
        const self = this;
        setTimeout(() => {
            self.createBannerAd();
        }, 1200);
        setTimeout(() => {
            self.createInsertAd();
        }, 1400);
        setTimeout(() => {
            self.createVideoAd();
        }, 1600);
    }

    public createVideoAd(): void {
        const self = this;
        LogUtils.info("createVideoAd==========");
        if (this.videoAd) {
            this.videoAd.destroy();
        }
        this.videoAd = gamebox.createRewardedVideoAd();

        const loadCallback = (res: any) => {
            LogUtils.info("loadCallbackFunction", res);
        };
        this.videoAd.offLoad(loadCallback);
        this.videoAd.onLoad(loadCallback);

        const errorCallback = (res: any) => {
            LogUtils.info("errorCallbackFunction", res);
        };
        this.videoAd.offError(errorCallback);
        this.videoAd.onError(errorCallback);

        const closeCallback = (res: any) => {
            LogUtils.info("closeCallbackFunction", res);
            if (EngineUtils.isCocos()) {
                game.resume();
            }
            if (self.videoCallback) {
                if (res && res.isEnded) {
                    AdControlUtils.setShowVideoTime();
                    if (self.videoCallback) {
                        self.videoCallback(true);
                    }
                    EventInstance.videoComplete(self.videoAdLocation);
                } else {
                    if (self.videoCallback) {
                        self.videoCallback(false);
                    }
                    EventInstance.videoNotFinished(self.videoAdLocation);
                }
                self.videoCallback = undefined;
            }
        };
        this.videoAd.offClose(closeCallback);
        this.videoAd.onClose(closeCallback);

        const completedCallback = (res: any) => {
            LogUtils.info("completedCallbackFunction", res);
        };
        this.videoAd.offCompleted(completedCallback);
        this.videoAd.onCompleted(completedCallback);
    }

    public showVideoAd(params: any = {}): void {
        const self = this;
        if (params.videOnStartCallback) {
            params.videOnStartCallback();
        }
        LogUtils.info("showVideoAd==========");
        if (AdControlUtils.isShowVideo() === false) {
            this.showToast("当前暂无可播放广告");
            if (params.videoCallback) {
                params.videoCallback(false);
            }
            return;
        }
        if (params.adLocation) {
            this.videoAdLocation = params.adLocation;
        }
        this.videoCallback = params.videoCallback;
        if (this.videoAd) {
            this.videoAd.show().then((res: any) => {
                LogUtils.log("激励视频开始播放", res);
                EventInstance.videoStartEvent(self.videoAdLocation);
                if (EngineUtils.isCocos()) {
                    game.pause();
                }
            }).catch(() => {
                self.videoAd.load().then(() => {
                    return self.videoAd.show().then((res: any) => {
                        LogUtils.log("激励视频开始播放 res2", res);
                        if (EngineUtils.isCocos()) {
                            game.pause();
                        }
                    }).catch((error: any) => {
                        LogUtils.warn("激励视频 广告显示失败 error2", error);
                        if (params.videoCallback) {
                            params.videoCallback(false);
                        }
                        self.showToast("当前暂无可播放广告");
                    });
                }).catch((error: any) => {
                    LogUtils.warn("激励视频 广告显示失败", error);
                    if (params.videoCallback) {
                        params.videoCallback(false);
                    }
                    self.showToast("当前暂无可播放广告");
                });
            });
        }
    }

    public autoClickVideo(callback: Function): void {
        if (AdControlUtils.autoClickVideo()) {
            callback(true);
        } else {
            callback(false);
        }
    }

    public createBannerAd(): void {
        LogUtils.info("createBannerAd==========");
        const pixelRatio = gamebox.getSystemInfoSync().pixelRatio;
        const screenWidth = gamebox.getSystemInfoSync().screenWidth;
        const screenHeight = gamebox.getSystemInfoSync().screenHeight;
        LogUtils.error("screenWidth", screenWidth, "screenHeight", screenHeight);

        let width: number, height: number, top: number, left: number;
        if (view.getVisibleSize().width < view.getVisibleSize().height) {
            width = screenWidth * pixelRatio;
            height = width * (50 / 320);
            top = screenHeight * pixelRatio - height;
            left = 0;
        } else {
            width = screenWidth * pixelRatio * 0.4;
            height = width * (50 / 320);
            top = screenHeight * pixelRatio - height;
            left = (screenWidth * pixelRatio - width) / 2;
            LogUtils.info("leftleftleftleftleftleft ", left);
        }

        if (this.bannerAd) {
            this.bannerAd.destroy();
        }
        this.bannerAd = gamebox.createBannerAd({
            style: {
                width: width,
                height: height,
                left: left,
                top: top
            }
        });

        if (this.bannerAd) {
            const loadCallback = (res: any) => {
                LogUtils.info("Banner onLoad", res);
            };
            const errorCallback = (res: any) => {
                LogUtils.info("Banner onError", res);
            };
            this.bannerAd.offLoad(loadCallback);
            this.bannerAd.onLoad(loadCallback);
            this.bannerAd.offError(errorCallback);
            this.bannerAd.onError(errorCallback);
        }
    }

    public showBannerAd(): void {
        const self = this;
        LogUtils.info("showBannerAd======");
        setTimeout(() => {
            if (self.bannerAd) {
                self.bannerAd.show().then((res: any) => {
                    LogUtils.info("Banner 广告显示成功", res);
                }).catch((error: any) => {
                    LogUtils.warn("Banner 广告显示失败", error);
                });
            }
        }, 1000 * ConfigHelper.getGameConfig().systemBannerDelayTime);
    }

    public hideBannerAd(): void {
        LogUtils.info("hideBannerAd======");
        if (this.bannerAd) {
            this.bannerAd.hide();
        }
    }

    public createInsertAd(): void {
        LogUtils.info("createInsertAd==========");
        if (this.insertAd) {
            this.insertAd.destroy();
        }
        this.insertAd = gamebox.createInterstitialAd();
        if (this.insertAd) {
            const loadCallback = (res: any) => {
                LogUtils.info("InserttitialAd onLoad", res);
            };
            const closeCallback = (res: any) => {
                LogUtils.info("InserttitialAd onClose", res);
            };
            const errorCallback = (res: any) => {
                LogUtils.warn("InserttitialAd onError", res);
            };
            this.insertAd.onLoad(loadCallback);
            this.insertAd.offLoad(loadCallback);
            this.insertAd.offClose(closeCallback);
            this.insertAd.onClose(closeCallback);
            this.insertAd.offError(errorCallback);
            this.insertAd.onError(errorCallback);
        }
    }

    public showIntertAd(params: any = {}): void {
        const self = this;
        LogUtils.info("showIntertAd==========");
        if (AdControlUtils.isShowInter() !== false) {
            setTimeout(() => {
                if (self.insertAd) {
                    self.insertAd.show().then((res: any) => {
                        LogUtils.log("InserttitialAd 广告显示成功", res);
                        AdControlUtils.setShowInterTime();
                    }).catch((error: any) => {
                        LogUtils.warn("InserttitialAd 广告显示失败", error);
                        if (params.resultCallback) {
                            params.resultCallback(false);
                        }
                        self.insertAd.load().then(() => {
                            return self.insertAd.show().then((res: any) => {
                                LogUtils.log("InserttitialAd2 广告显示成功 res2", res);
                                AdControlUtils.setShowInterTime();
                            }).catch((error: any) => {
                                LogUtils.warn("InserttitialAd2 广告显示失败 error2", error);
                            });
                        }).catch((error: any) => {
                            LogUtils.warn("InserttitialAd2 广告显示失败", error);
                            if (params.resultCallback) {
                                params.resultCallback(false);
                            }
                        });
                    });
                }
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
        } else {
            if (params.resultCallback) {
                params.resultCallback(false);
            }
        }
    }

    public vibrateShort(): void {
        // Empty implementation
    }

    public vibrateLong(): void {
        // Empty implementation
    }

    public showToast(title: string): void {
        gamebox.showToast({
            title: title,
            icon: "none"
        });
    }

    public getPlatformVersionCode(): void {
        // Empty implementation
    }

    public platformVersionSupport(version: string): boolean {
        return true;
    }

    public login(params: any = {}): void {
        const self = this;
        gamebox.login({
            success: (res: any) => {
                if (res.code) {
                    LogUtils.log("登录成功", res);
                    self.userInfo.openId = res.uid;
                    if (params.resultCallback) {
                        params.resultCallback(true, self.userInfo);
                    }
                } else {
                    LogUtils.log("登录失败！", res);
                    if (params.resultCallback) {
                        params.resultCallback(true, self.userInfo);
                    }
                }
            },
            fail: (res: any) => {
                LogUtils.log("登录失败！", res);
                if (params.resultCallback) {
                    params.resultCallback(true, self.userInfo);
                }
            }
        });
    }

    public getNetworkType(callback: Function): void {
        callback(1);
    }

    public getGameVersion(): string {
        return "1.0.0";
    }

    public getUserInfo(params: any = {}): void {
        const self = this;
        gamebox.getUserInfo({
            success: (res: any) => {
                const userInfo = res.userInfo;
                self.userInfo.nickName = userInfo.nickName;
                self.userInfo.avatarUrl = userInfo.avatarUrl;
                if (params.resultCallback) {
                    params.resultCallback(true, self.userInfo);
                }
            },
            fail: (res: any) => {
                LogUtils.info("获取头像失败,但是返回openid.");
                if (params.resultCallback) {
                    params.resultCallback(true, self.userInfo);
                }
            }
        });
    }

    public copyString(text: string): void {
        LogUtils.info("copyString: ", text);
        gamebox.setClipboardData({
            data: text,
            success: (res: any) => {
                LogUtils.info("copyString: ", res);
            }
        });
    }
}