import { AudioManager } from './../AudioManager';
import { Toast } from './../Toast';
import { AbstractPlatformSDK } from './AbstractPlatformSDK';
import { ConfigHelper } from './../ConfigHelper';
import { ShareImage } from './../ShareData';
import { LogUtils } from './../Utils/LogUtils';

const shareTexts: string[] = [
    "Time to relax and help the Arrows Out.",
    "Play Arrows Escape and keep brain young."
];

export class FacebookSDK extends AbstractPlatformSDK {
    private static _instance: FacebookSDK;

    public videoCallback: ((success: boolean) => void) | undefined;
    public videOnStartCallback: (() => void) | undefined;
    public videoLocation: string = "";
    public userInfo: {
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
    public videoOnError: (() => void) | null = null;
    public RewardVideoADId: string = ""; //1551416846116771_1557828262142296
    public InterstitialAdId: string = ""; //1551416846116771_1604865850771870
    private _maxAdCount: number = 1;
    private _validRewardsADIntance: any[] = [];
    private _validInterstitialAdInstance: any[] = [];
    public overlayView: any = null;

    public static getInstance(): FacebookSDK {
        if (this._instance === undefined) {
            this._instance = new FacebookSDK();
        }
        return this._instance;
    }

    public initAdService(): void {
        this.createVideoAd();
        this.preLoadInterstitialAd();
    }

    public createBannerAd(): void {
        LogUtils.info("createBannerAd==========");
    }

    public showBannerAd(options?: any): void {
        LogUtils.info("showBannerAd ==========");
    }

    public hideBannerAd(): void {
        LogUtils.info("hideBannerAd ==========");
    }

    public createVideoAd(): void {
        /*LogUtils.info("createVideoAd11 ==========", ConfigHelper.getGameConfig().rewardedVideoId);
        try {
            const adCount: number = this._maxAdCount - this._validRewardsADIntance.length;
            const self: FacebookSDK = this;
            for (let i: number = 0; i < adCount; i++) {
                let rewardVideo: any = null;
                FBInstant.getRewardedVideoAsync(this.RewardVideoADId)
                    .then((video: any) => {
                        rewardVideo = video;
                        return video.loadAsync();
                    })
                    .then(() => {
                        self._validRewardsADIntance.push(rewardVideo);
                        console.log("preLoadRewardVideo succ!", self._validRewardsADIntance.length);
                    })
                    .catch((error: any) => {
                        console.log("Rewarded video error", error);
                    });
            }
        } catch (error: any) {
            console.log("preLoadRewardVideo error", error);
        }*/
    }

    public showVideoAd(options?: any): void {
        /*if (options === undefined) {
            options = {};
        }
        LogUtils.info("showVideoAd ==========");
        this.videoCallback = options.videoCallback;
        if (this._validRewardsADIntance.length > 0) {
            const self: FacebookSDK = this;
            const rewardVideo: any = this._validRewardsADIntance.shift();
            AudioManager.instance.stop_bgm();
            if (options.videOnStartCallback) {
                options.videOnStartCallback();
            }
            rewardVideo.showAsync()
                .then(() => {
                    if (this.videoCallback) {
                        this.videoCallback(true);
                    }
                    console.log("Rewarded video success");
                    AudioManager.instance.resume_bgm();
                    self.createVideoAd();
                })
                .catch((error: any) => {
                    if (this.videoCallback) {
                        this.videoCallback(false);
                    }
                    self.createVideoAd();
                    console.log("Rewarded video error", error);
                    AudioManager.instance.resume_bgm();
                });
        } else {
            if (this.videoCallback) {
                this.videoCallback(false);
            }
            Toast.instance.tip_div("Ads not ready!");
            this.createVideoAd();
        }*/

        LogUtils.info("showVideoAd ==========");
        this.videoCallback = options.videoCallback;

        AudioManager.instance.stop_bgm();
        if (options.videOnStartCallback) {
            options.videOnStartCallback();
        }    

        setTimeout(()=>{
            this.videoCallback?.(true);
            AudioManager.instance.resume_bgm();
        }, 200)
    }

    public showNativeImageAd(options?: any): void {
        LogUtils.info("showNativeImageAd ===");
    }

    public hideNativeImage(): void {
        // Empty implementation
    }

    public preLoadInterstitialAd(): void {
        /*try {
            const adCount: number = this._maxAdCount - this._validInterstitialAdInstance.length;
            const self: FacebookSDK = this;
            for (let i: number = 0; i < adCount; i++) {
                let interstitialAd: any = null;
                FBInstant.getInterstitialAdAsync(this.InterstitialAdId)
                    .then((ad: any) => {
                        interstitialAd = ad;
                        return ad.loadAsync();
                    })
                    .then(() => {
                        self._validInterstitialAdInstance.push(interstitialAd);
                        console.log("preLoadInterstitialAd succ!", self._validInterstitialAdInstance.length);
                    })
                    .catch((error: any) => {
                        console.log("InterstitialAd  error", error);
                    });
            }
        } catch (error: any) {
            console.log("preLoadInterstitialAd error", error);
        }*/
    }

    public showIntertAd(options?: any): void {
        /*if (options === undefined) {
            options = {};
        }
        LogUtils.info("showIntertAd ==========");
        if (this._validInterstitialAdInstance.length > 0) {
            const self: FacebookSDK = this;
            const interstitialAd: any = this._validInterstitialAdInstance.shift();
            AudioManager.instance.stop_bgm();
            if (options.resultCallback) {
                options.resultCallback(true);
            }
            interstitialAd.showAsync()
                .then(() => {
                    AudioManager.instance.resume_bgm();
                    self.preLoadInterstitialAd();
                    if (options.closeCallback) {
                        options.closeCallback();
                    }
                })
                .catch((error: any) => {
                    AudioManager.instance.resume_bgm();
                    if (options.resultCallback) {
                        options.resultCallback(false);
                    }
                    self.preLoadInterstitialAd();
                    console.log("InterstitialAd video error", error);
                });
        } else {
            console.log("InterstitialAd Ads not ready!");
            if (options.resultCallback) {
                options.resultCallback(false);
            }
            this.preLoadInterstitialAd();
        }*/

        options?.closeCallback?.();
    }

    public vibrateShort(): void {
        /*FBInstant.performHapticFeedbackAsync().catch((error: any) => {
            // Empty catch
        });*/
    }

    public vibrateLong(): void {
        /*FBInstant.performHapticFeedbackAsync().catch((error: any) => {
            // Empty catch
        });*/
    }

    public showToast(message: string): void {
        // Empty implementation
    }

    public login(options?: any): void {
        if (options === undefined) {
            options = {};
        }
        /*LogUtils.info("登录成功: ");
        let countryCode: string = "US";
        const locale: string = FBInstant.getLocale();
        if (locale) {
            countryCode = locale.split("_")[1];
        } else {
            const geoCode: string = this._getLangGeoCode();
            if (geoCode !== "") {
                countryCode = geoCode;
            }
        }
        LogUtils.info("geo: ", locale);
        this.userInfo.openId = FBInstant.player.getID();
        this.userInfo.nickName = "";
        this.userInfo.avatarUrl = "";
        this.userInfo.country = countryCode;
        if (options.resultCallback) {
            options.resultCallback(true, this.userInfo);
        }*/

        let countryCode: string = "US";
        this.userInfo.openId = "test123";
        this.userInfo.nickName = "";
        this.userInfo.avatarUrl = "";
        this.userInfo.country = countryCode;
        if (options.resultCallback) {
            options.resultCallback(true, this.userInfo);
        }
    }

    private _getLangGeoCode(): string {
        try {
            if (!navigator || !navigator.language) {
                return "";
            }
            const geoCode: string = navigator.language.split("-")[1];
            return geoCode ? geoCode.toUpperCase() : "";
        } catch (error: any) {
            console.warn("语言代码解析国家代码失败：", error);
            return "";
        }
    }

    public getUserInfo(options?: any): void {
        if (options === undefined) {
            options = {};
        }
        if (options.resultCallback) {
            options.resultCallback(true, this.userInfo);
        }
    }

    public shareImage(options?: any): void {
        /*if (options === undefined) {
            options = {};
        }
        const randomText: string = shareTexts[Math.floor(Math.random() * shareTexts.length)];
        FBInstant.shareAsync({
            intent: "REQUEST",
            image: ShareImage,
            text: randomText,
            shareDestination: ["NEWSFEED", "GROUP", "COPY_LINK", "MESSENGER"],
            switchContext: false
        })
        .then(() => {
            console.log("share success");
            if (options.resultCallback) {
                options.resultCallback(true);
            }
        })
        .catch((error: any) => {
            console.log("share error", error);
            if (options.resultCallback) {
                options.resultCallback(false);
            }
        });
        */
    }

    public invite(): void {
        /*const randomText: string = shareTexts[Math.floor(Math.random() * shareTexts.length)];
        FBInstant.inviteAsync({
            image: ShareImage,
            text: {
                default: randomText
            }
        })
        .then(() => {
            console.log("invite success");
        })
        .catch((error: any) => {
            console.log("invite error", error);
        });
        */
    }

    public createShortcut(): void {
        /*console.log("createShortcut===================");
        FBInstant.canCreateShortcutAsync()
            .then((canCreate: boolean) => {
                if (canCreate) {
                    FBInstant.createShortcutAsync()
                        .then(() => {
                            console.log("Shortcut created");
                        })
                        .catch(() => {
                            console.log("Shortcut not created");
                        });
                } else {
                    console.log("can not create shortcut");
                }
            })
            .catch((error: any) => {
                console.log("canCreateShortcutAsync error", error);
            });
            */
    }

    public subscribeBot(): void {
        /*FBInstant.player.canSubscribeBotAsync()
            .then((canSubscribe: boolean) => {
                if (canSubscribe) {
                    FBInstant.subscribeBotAsync()
                        .then(() => {
                            console.log("Subscribed to bot");
                        })
                        .catch((error: any) => {
                            console.log("Failed to subscribe to bot", error);
                        });
                }
            })
            .catch((error: any) => {
                console.log("Failed to check if can subscribe to bot", error);
            });
            */
    }

    public officialPage(): void {
        /*FBInstant.community.canFollowOfficialPageAsync()
            .then((canFollow: boolean) => {
                if (canFollow) {
                    FBInstant.community.followOfficialPageAsync()
                        .then(() => {
                            console.log("Followed official page");
                        })
                        .catch((error: any) => {
                            console.log("Failed to follow official page", error);
                        });
                } else {
                    console.log("can not follow official page");
                }
            })
            .catch((error: any) => {
                console.log("Failed to check if can follow official page", error);
            });
            */
    }

    public officialGroup(): void {
        /*FBInstant.community.canJoinOfficialGroupAsync()
            .then((canJoin: boolean) => {
                if (canJoin) {
                    FBInstant.community.joinOfficialGroupAsync()
                        .then(() => {
                            console.log("Joined official group");
                        })
                        .catch((error: any) => {
                            console.log("Failed to join official group", error);
                        });
                } else {
                    console.log("can not join official group");
                }
            })
            .catch((error: any) => {
                console.log("Failed to check if can join official group", error);
            });
            */
    }

    public getGameVersion(): string {
        return "1.0.12";
    }

    public copyString(text: string): void {
        LogUtils.info("copyString: ", text);
    }

    public getUserInfoImpl(): any {
        return this.userInfo;
    }

    public getPlatformVersionCode(): string {
        return "";
    }

    public platformVersionSupport(version: string): boolean {
        return false;
    }

    public async showProfile(): Promise<void> {
        /*console.log("showProfile");
        this.overlayView = await FBInstant.overlayViews.createProfilePictureOverlayViewAsync(
            document.body,
            "width: 100px; height: 100px;",
            "width: 100px; height: 100px;"
        );
        this.overlayView.showAsync();
        LogUtils.log("this.overlayView:", this.overlayView);
        const nameOverlayView: any = await FBInstant.overlayViews.createProfileNameOverlayViewAsync(
            document.body,
            "width: 100px; height: 100px;",
            "width: 100px; height: 100px;"
        );
        nameOverlayView.showAsync();
        LogUtils.log("overlayView:", nameOverlayView);
        */
    }

    public hideProfile(): void {
        /*console.log("hideProfile");
        if (this.overlayView != null) {
            this.overlayView.dismissAsync();
        }
        this.overlayView = null;
        */
    }

    public getPlatform(): string {
        /*if (!SDKInstance.isFacebookMiniGame()) {
            return "WEB";
        }
        const platform: string = FBInstant.getPlatform();
        console.log("getPlatform:", platform);
        return platform;*/

        return "WEB";
    }
}