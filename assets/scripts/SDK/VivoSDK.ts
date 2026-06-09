import { cclegacy, game } from "cc";
import { AbstractPlatformSDK } from "./AbstractPlatformSDK";
import { LogUtils } from "./../Utils/LogUtils";
import { DefaultNativeTemplate } from "./../DefaultNativeTemplate";
import { ConfigHelper } from "./../ConfigHelper";
import { EngineUtils } from "./../Utils/EngineUtils";
import { StoreUtils, Type } from "./../Utils/StoreUtils";
import { StringUtils } from "./../Utils/StringUtils";
import { AdControlUtils } from "./../Utils/AdControlUtils";
import { EventHelper } from "./../Event/EventHelper";
import { AdEventKey } from "./../Event/AdEventKey";
import { DigestUtils } from "./../Utils/DigestUtils";
import { PayUtils } from "./../Utils/PayUtils";

const { info, warn } = LogUtils;

export class VivoSDK extends AbstractPlatformSDK {
    private static _instance: VivoSDK;
    
    private bannerAd: any = undefined;
    private videoAd: any = undefined;
    private inserttitialAd: any = undefined;
    private nativeImageAd: any = undefined;
    private nativeIconAd: any = undefined;
    private nativeInsertAd: any = undefined;
    private videoAdLodeSuccess: boolean = false;
    private insertAdLoadSuccess: boolean = false;
    private nativeImageAdLoadSuccess: boolean = false;
    private nativeIconAdLoadSuccess: boolean = false;
    private nativeInsertAdLoadSuccess: boolean = false;
    private gameBoxBannerAd: any = undefined;
    private gameBoxPortalAd: any = undefined;
    private cutMusicState: any = undefined;
    private videoLocation: string = "";
    private createSystemInsertErrorNumber: number = 0;
    private videoCallback: Function | undefined = undefined;
    private intertCloseCallback: Function | undefined = undefined;
    private systemInfo: any = undefined;
    private adRefreshTimer: any = undefined;
    private nativeAdImageData: any = undefined;
    private nativeAdIconData: any = undefined;
    private nativeAdInsertData: any = undefined;
    private nativeAdImageNode: any = undefined;
    private nativeAdIntertNode: any = undefined;
    private nativeAdIconNode: any = undefined;
    private nativeAdImagePanelNode: any = undefined;
    private nativeAdImageButtonNode: any = undefined;
    private nativeAdIconPanelNode: any = undefined;
    private nativeAdIconButtonNode: any = undefined;
    private intertShowTotalNumber: number = 0;
    private existIntert: boolean = false;
    private nativeImageAdNodeParams: any = undefined;
    private refreshNativeImageAdTimer: any = undefined;
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

    constructor() {
        super();
        this.intertShowTotalNumber = StoreUtils.getInstance().get(StoreUtils.intertShowTotalNumber, Type.Int, 0);
    }

    public static getInstance(): VivoSDK {
        if (this._instance === undefined) {
            this._instance = new VivoSDK();
        }
        return this._instance;
    }

    public login(params: any = {}): void {
        info("login===========");
        if (!this.checkVersion(1063)) return;

        qg.login().then((response: any) => {
            if (response.data.token) {
                PayUtils.token = response.data.token;
                const timestamp = new Date().getTime();
                const nonce = DigestUtils.instance.randomNumber(32);
                const signStr = `appKey=${ConfigHelper.getGameConfig().appKey}&appSecret=${ConfigHelper.getGameConfig().appSecret}&nonce=${nonce}&pkgName=${ConfigHelper.getGameInfo().packName}&timestamp=${timestamp}&token=${response.data.token}`;
                const signature = DigestUtils.instance.SHA256(signStr);
                const url = `https://quickgame.vivo.com.cn/api/quickgame/cp/account/userInfo?pkgName=${ConfigHelper.getGameInfo().packName}&token=${response.data.token}&timestamp=${timestamp}&nonce=${nonce}&signature=${signature}`;

                const xhr = new XMLHttpRequest();
                xhr.ontimeout = () => {
                    info("获取用户信息超时");
                    params.resultCallback && params.resultCallback(false);
                };
                xhr.onerror = (error: any) => {
                    info("获取用户信息出错：", JSON.stringify(error));
                    params.resultCallback && params.resultCallback(false);
                };
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
                        const responseData = JSON.parse(xhr.responseText);
                        info("获取用户信息成功: ", JSON.stringify(responseData));
                        this.userInfo.openId = responseData.data.openId;
                        this.userInfo.nickName = responseData.data.nickName;
                        this.userInfo.avatarUrl = responseData.data.smallAvatar;
                        this.userInfo.gender = responseData.data.gender;
                        params.resultCallback && params.resultCallback(true, this.userInfo);
                    }
                };
                xhr.open("GET", url, false);
                xhr.send();
            } else {
                info("获取用户信息失败,token为空");
                params.resultCallback && params.resultCallback(false);
            }
        }).catch((error: any) => {
            info("登录失败:", JSON.stringify(error));
            params.resultCallback && params.resultCallback(false);
        });
    }

    public getUserInfo(params: any = {}): void {
        params.resultCallback && params.resultCallback(true, this.userInfo);
    }

    public checkVersion(versionCode: number): boolean {
        if (qg.getSystemInfoSync().platformVersionCode >= versionCode) {
            return true;
        }
        info(`快应用平台版本低于${versionCode}, 暂不支持相关API`);
        return false;
    }

    public getNativeAdIconData(): any {
        return this.nativeAdIconData;
    }

    public getNativeAdImageData(): any {
        return this.nativeAdImageData;
    }

    public initAdService(): void {
        this.createnativeImageAd();
        setTimeout(() => {
            this.createNativeIconAd();
        }, 4000);
        setTimeout(() => {
            this.createVideoAd();
        }, 6000);
        setTimeout(() => {
            this.createNativeInsertAd();
        }, 8000);
        this.doAdRefresh();
    }

    public doAdRefresh(): void {
        if (this.adRefreshTimer) {
            clearInterval(this.adRefreshTimer);
        }
        this.adRefreshTimer = setInterval(() => {
            if (!this.videoAdLodeSuccess && this.videoAd) {
                info("doAdRefresh videoAd ===");
                this.videoAd.load();
            }
            if (!this.nativeImageAdLoadSuccess && this.nativeImageAd) {
                info("doAdRefresh nativeImageAd ===");
                this.nativeImageAd.load();
            }
            if (!this.nativeIconAdLoadSuccess && this.nativeIconAd) {
                info("doAdRefresh nativeIconAd ===");
                this.nativeIconAd.load();
            }
            if (!this.nativeInsertAdLoadSuccess && this.nativeInsertAd) {
                info("doAdRefresh nativeInsertAd ===");
                this.nativeInsertAd.load();
            }
        }, 15000);
    }

    public createBannerAd(): void {
        info("createBannerAd==========");
        if (ConfigHelper.getGameConfig().systemBannerId) {
            if (this.bannerAd) {
                this.bannerAd.destroy();
            }
            this.bannerAd = qg.createBannerAd({
                posId: ConfigHelper.getGameConfig().systemBannerId,
                adIntervals: ConfigHelper.getGameConfig().systemBannerRefreshTime,
                style: {}
            });
            this.bannerAd.onClose(() => {
                this.bannerAd = undefined;
                info("bannerAd onHide==========");
            });
            this.bannerAd.onLoad(() => {
                info("bannerAd onLoad==========");
            });
            this.bannerAd.onError((error: any) => {
                info("bannerAd onError: " + JSON.stringify(error));
            });
            this.bannerAd.onResize((size: any) => {
                info(`banner 宽度：${size.width}, banner 高度：${size.height}`);
            });
        } else {
            warn("----缺少bannerId", ConfigHelper.getGameConfig().systemBannerId);
        }
    }

    public showBannerAd(params: any = {}): void {
        info("showBannerAd==========");
        if (!this.bannerAd) {
            this.createBannerAd();
        }
        this.bannerAd.show();
        EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.sysBanner + "_" + AdEventKey.showSuccess);
    }

    public hideBannerAd(): void {
        if (this.bannerAd) {
            this.bannerAd.hide();
            this.bannerAd.destroy();
            this.bannerAd = undefined;
        }
    }

    public createVideoAd(): void {
        info("createVideoAd==========");
        if (ConfigHelper.getGameConfig().rewardedVideoId) {
            this.videoAd = qg.createRewardedVideoAd({
                adUnitId: ConfigHelper.getGameConfig().rewardedVideoId
            });
            setTimeout(() => {
                this.videoAd.load();
            }, 1500);
            this.videoAd.onLoad(() => {
                info("videoAd loaded======");
                this.videoAdLodeSuccess = true;
            });
            this.videoAd.onClose((result: any) => {
                this.videoAdLodeSuccess = false;
                if (EngineUtils.isCocos()) {
                    game.resume();
                } else {
                    Laya.SoundManager.muted = this.cutMusicState;
                    Laya.SoundManager.musicVolume = 1;
                    Laya.SoundManager.soundVolume = 1;
                }
                if (result.isEnded) {
                    info("激励视频广告完成，发放奖励");
                    this.videoCallback && this.videoCallback(true);
                    AdControlUtils.setShowVideoTime();
                    EventHelper.getInstance().videoComplete(this.videoLocation);
                } else {
                    this.videoCallback && this.videoCallback(false);
                    this.showToast("未观看完整视频，无法获得奖励");
                    EventHelper.getInstance().videoNotFinished(this.videoLocation);
                }
                this.videoAd.load();
            });
            this.videoAd.onError((error: any) => {
                this.videoAdLodeSuccess = false;
                info("videoAd error: " + JSON.stringify(error));
            });
        } else {
            warn("----缺少videoId", ConfigHelper.getGameConfig().rewardedVideoId);
        }
    }

    public showVideoAd(params: any = {}): void {
        info("showVideoAd==========");
        if (AdControlUtils.isShowVideo() === false) {
            this.showToast("当前暂无可播放广告");
            params.videoCallback && params.videoCallback(false);
            return;
        }
        if (this.videoAdLodeSuccess) {
            if (!EngineUtils.isCocos()) {
                this.cutMusicState = Laya.SoundManager.muted;
            }
            this.videoAdLodeSuccess = false;
            this.videoCallback = params.videoCallback;
            params.videOnStartCallback && params.videOnStartCallback();
            if (!EngineUtils.isCocos()) {
                Laya.SoundManager.musicVolume = 0;
                Laya.SoundManager.soundVolume = 0;
                Laya.SoundManager.muted = true;
            }
            if (params.adLocation) {
                this.videoLocation = params.adLocation;
            }
            this.videoAd.show().then(() => {
                info("视频开始播放");
                if (EngineUtils.isCocos()) {
                    game.pause();
                }
                EventHelper.getInstance().videoStartEvent(this.videoLocation);
            }).catch((error: any) => {
                warn("当前暂无可播放广告 err:", JSON.stringify(error));
                params.videoCallback && params.videoCallback(false);
                params.videoOnError && params.videoOnError();
            });
        } else {
            this.showToast("当前暂无可播放广告");
            params.videoCallback && params.videoCallback(false);
            params.videoOnError && params.videoOnError();
        }
    }

    public createSystemInsert(): void {
        info("createSystemInsert==========");
        if (ConfigHelper.getGameConfig().systemInsertId) {
            this.inserttitialAd = qg.createInterstitialAd({
                posId: ConfigHelper.getGameConfig().systemInsertId
            });
            this.inserttitialAd.onLoad(() => {
                this.insertAdLoadSuccess = true;
            });
            this.inserttitialAd.offClose(() => {});
            this.inserttitialAd.onClose(() => {
                this.insertAdLoadSuccess = false;
                this.existIntert = false;
                this.intertCloseCallback && this.intertCloseCallback();
                setTimeout(() => {
                    this.createSystemInsert();
                }, 10000);
            });
            this.inserttitialAd.offError(() => {});
            this.inserttitialAd.onError((error: any) => {
                this.insertAdLoadSuccess = false;
                info("inserttitialAd error:", JSON.stringify(error));
                this.createSystemInsertErrorNumber++;
                if (this.createSystemInsertErrorNumber < 5) {
                    setTimeout(() => {
                        info(`第${this.createSystemInsertErrorNumber}次尝试重新创建系统插屏广告 ===`);
                        this.createSystemInsert();
                    }, 10000);
                }
            });
        } else {
            warn("缺少 insertId ===", ConfigHelper.getGameConfig().systemInsertId);
        }
    }

    public showSysIntertAd(params: any = {}): void {
        info("showSysIntertAd==========");
        if (AdControlUtils.isShowInter() === false || this.existIntert === true) {
            params.resultCallback && params.resultCallback(false);
            return;
        }
        if (!this.inserttitialAd) {
            this.createSystemInsert();
        }
        if (this.insertAdLoadSuccess) {
            setTimeout(() => {
                this.hideNativeIntert();
                this.hideBannerAd();
                this.hideNativeImage();
                this.intertCloseCallback = params.closeCallback;
                this.inserttitialAd.show().then(() => {
                    this.existIntert = true;
                    params.resultCallback && params.resultCallback(true);
                    AdControlUtils.setShowInterTime();
                    this.intertShowTotalNumber++;
                    StoreUtils.getInstance().set(StoreUtils.intertShowTotalNumber, Type.Int, this.intertShowTotalNumber);
                    this.insertAdLoadSuccess = false;
                    EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.sysInter + "_" + AdEventKey.showSuccess);
                }).catch((error: any) => {
                    this.insertAdLoadSuccess = false;
                    info("系统插屏广告展示失败", JSON.stringify(error));
                });
            }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
        } else {
            params.resultCallback && params.resultCallback(false);
        }
    }

    public reportNativeAdImageShow(adId: string): void {
        if (adId) {
            this.nativeImageAd.reportAdShow({ adId: adId });
            this.nativeImageAd.load();
        }
    }

    public reportNativeAdImageClick(adId: string): void {
        if (adId) {
            this.nativeImageAd.reportAdClick({ adId: adId });
        }
    }

    public reportNativeAdIconShow(adId: string): void {
        if (adId) {
            this.nativeIconAd.reportAdShow({ adId: adId });
            this.nativeIconAd.load();
        }
    }

    public reportNativeAdIconClick(adId: string): void {
        this.nativeIconAd.reportAdClick({ adId: adId });
    }

    public reportNativeAdInsertShow(adId: string): void {
        if (adId) {
            this.nativeInsertAd.reportAdShow({ adId: adId });
            this.nativeInsertAd.load();
        }
    }

    public reportNativeAdInsertClick(adId: string): void {
        this.nativeInsertAd.reportAdClick({ adId: adId });
    }

    public createnativeImageAd(): void {
        info("createnativeImageAd==========");
        if (ConfigHelper.getGameConfig().nativeImageId) {
            this.nativeImageAd = qg.createNativeAd({
                posId: ConfigHelper.getGameConfig().nativeImageId
            });
            setTimeout(() => {
                this.nativeImageAd.load();
            }, 1500);
            this.nativeImageAd.offLoad();
            this.nativeImageAd.onLoad((response: any) => {
                if (response) {
                    const adItem = response.adList.pop();
                    const imgUrl = adItem.imgUrlList[0] !== undefined ? adItem.imgUrlList[0] : adItem.icon;
                    const iconUrl = adItem.icon !== undefined ? adItem.icon : adItem.imgUrlList[0];
                    this.nativeAdImageData = {
                        adId: adItem.adId,
                        title: adItem.title,
                        desc: adItem.desc,
                        imgUrl: StringUtils.removeTheParameters(imgUrl),
                        iconUrl: StringUtils.removeTheParameters(iconUrl)
                    };
                    this.nativeImageAdLoadSuccess = true;
                } else {
                    this.nativeImageAdLoadSuccess = false;
                }
            });
            this.nativeImageAd.onError((error: any) => {
                this.nativeImageAdLoadSuccess = false;
                warn("原生大图广告加载失败: " + JSON.stringify(error));
            });
        } else {
            warn("缺少nativeImageId", ConfigHelper.getGameConfig().nativeImageId);
        }
    }

    public showNativeImageAd(params: any): void {
        info("showNativeImageAd==========");
        if (AdControlUtils.isShowNativeAd() === false) return;

        const localParams = params;
        if (this.nativeImageAdLoadSuccess && this.nativeAdImageData) {
            this.hideBannerAd();
            this.hideNativeImage();
            this.nativeAdImagePanelNode = params.panelNode;
            this.nativeAdImageButtonNode = params.buttonNode;
            const adData = this.nativeAdImageData;
            const adId = adData.adId;
            DefaultNativeTemplate.createNativeAdImageUINode(adData, params, (node: any) => {
                info("createNativeAdImageUINode success 回调");
                this.nativeAdImageNode = node;
                this.reportNativeAdImageShow(adId);
                localParams.resultCallback && localParams.resultCallback(true);
                AdControlUtils.setShowNativeAdTime();
                EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeImage + "_" + AdEventKey.showSuccess);
            }, () => {
                info("点击了关闭回调");
                localParams.closeCallback && localParams.closeCallback();
            }, (clickAdId: string) => {
                info("点击了广告");
                this.reportNativeAdImageClick(clickAdId);
            });
        } else {
            info("showNativeImageAd fail.");
            params.resultCallback && params.resultCallback(false);
        }
    }

    public hideNativeImage(): void {
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
                for (const button of this.nativeAdImageButtonNode) {
                    button.active = false;
                    if (!EngineUtils.isCocos()) {
                        button.visible = false;
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

    public createNativeIconAd(): void {
        info("createNativeIconAd==========");
        if (ConfigHelper.getGameConfig().nativeIconId) {
            this.nativeIconAd = qg.createNativeAd({
                posId: ConfigHelper.getGameConfig().nativeIconId
            });
            setTimeout(() => {
                this.nativeIconAd.load();
            }, 1500);
            this.nativeIconAd.offLoad();
            this.nativeIconAd.onLoad((response: any) => {
                if (response) {
                    const adItem = response.adList.pop();
                    const imgUrl = adItem.imgUrlList[0] !== undefined ? adItem.imgUrlList[0] : adItem.icon;
                    const iconUrl = adItem.icon !== undefined ? adItem.icon : adItem.imgUrlList[0];
                    this.nativeAdIconData = {
                        adId: adItem.adId,
                        title: adItem.title,
                        desc: adItem.desc,
                        imgUrl: StringUtils.removeTheParameters(imgUrl),
                        iconUrl: StringUtils.removeTheParameters(iconUrl)
                    };
                    this.nativeIconAdLoadSuccess = true;
                } else {
                    this.nativeIconAdLoadSuccess = false;
                }
            });
            this.nativeIconAd.onError((error: any) => {
                this.nativeIconAdLoadSuccess = false;
                warn("原生ICON广告加载失败: " + JSON.stringify(error));
            });
        } else {
            warn("缺少nativeIconId", ConfigHelper.getGameConfig().nativeIconId);
        }
    }

    public showNativeIconAd(params: any): void {
        info("showNativeIconAd==========");
        const localParams = params;
        if (this.nativeIconAdLoadSuccess && this.nativeAdIconData) {
            const adData = this.nativeAdIconData;
            const adId = adData.adId;
            DefaultNativeTemplate.createNativeAdImageUINode(adData, params, (node: any) => {
                info("createNativeAdIconUINode success 回调");
                this.hideNativeIconAd();
                this.nativeAdIconPanelNode = localParams.panelNode;
                this.nativeAdIconButtonNode = localParams.buttonNode;
                this.nativeAdIconNode = node;
                this.reportNativeAdIconShow(adId);
                AdControlUtils.setShowNativeAdTime();
                localParams.resultCallback && localParams.resultCallback(true);
                EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeIcon + "_" + AdEventKey.showSuccess);
            }, () => {
                info("createNativeAdIconUINode close 回调");
                localParams.closeCallback && localParams.closeCallback();
            }, (clickAdId: string) => {
                info("createNativeAdIconUINode click 回调");
                this.reportNativeAdIconClick(clickAdId);
            });
        } else {
            params.resultCallback && params.resultCallback(false);
        }
    }

    public hideNativeIconAd(): void {
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
                for (const button of this.nativeAdIconButtonNode) {
                    button.active = false;
                    if (!EngineUtils.isCocos()) {
                        button.visible = false;
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

    public createNativeInsertAd(): void {
        info("createNativeInsertAd==========");
        if (ConfigHelper.getGameConfig().nativeInsertId) {
            this.nativeInsertAd = qg.createNativeAd({
                adUnitId: ConfigHelper.getGameConfig().nativeInsertId
            });
            setTimeout(() => {
                this.nativeInsertAd.load();
            }, 1500);
            this.nativeInsertAd.onLoad((response: any) => {
                if (response) {
                    const adItem = response.adList.pop();
                    const imgUrl = adItem.imgUrlList[0] !== undefined ? adItem.imgUrlList[0] : adItem.icon;
                    const iconUrl = adItem.icon !== undefined ? adItem.icon : adItem.imgUrlList[0];
                    this.nativeAdInsertData = {
                        adId: adItem.adId,
                        title: adItem.title,
                        desc: adItem.desc,
                        imgUrl: StringUtils.removeTheParameters(imgUrl),
                        iconUrl: StringUtils.removeTheParameters(iconUrl)
                    };
                    this.nativeInsertAdLoadSuccess = true;
                } else {
                    this.nativeInsertAdLoadSuccess = false;
                }
            });
            this.nativeInsertAd.onError((error: any) => {
                this.nativeInsertAdLoadSuccess = false;
                warn("原生插屏广告加载失败: " + JSON.stringify(error));
            });
        } else {
            warn("缺少nativeInsertId", ConfigHelper.getGameConfig().nativeInsertId);
        }
    }

    public showIntertAd(params: any = {}): void {
        if (!ConfigHelper.getGameConfig().nativeInsertId) {
            this.showSysIntertAd(params);
            return;
        }

        info("showIntertAd==========");
        if (AdControlUtils.isShowInter() === false || this.existIntert === true) {
            params.resultCallback && params.resultCallback(false);
            return;
        }

        if (params.showSysInterAd && this.intertShowTotalNumber < ConfigHelper.getGameConfig().systemInsertToNativeInsertNumber) {
            this.showSysIntertAd(params);
            return;
        }

        const adParams = {
            parentNode: params.parentNode
        };
        setTimeout(() => {
            if (this.nativeInsertAdLoadSuccess && this.nativeAdInsertData) {
                const adData = this.nativeAdInsertData;
                const adId = adData.adId;
                DefaultNativeTemplate.createNativeIntertAdUINode(adData, adParams, (node: any) => {
                    info("createNativeIntertAdUINode success 回调");
                    this.hideNativeIntert();
                    this.hideBannerAd();
                    this.hideNativeImage();
                    this.nativeAdIntertNode = node;
                    this.existIntert = true;
                    this.reportNativeAdInsertShow(adId);
                    AdControlUtils.setShowInterTime();
                    params.resultCallback && params.resultCallback(true);
                    EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.nativeInsert + "_" + AdEventKey.showSuccess);
                }, () => {
                    info("点击了关闭回调");
                    this.existIntert = false;
                    params.closeCallback && params.closeCallback();
                }, (clickAdId: string) => {
                    info("点击了广告");
                    this.reportNativeAdInsertClick(clickAdId);
                    this.hideNativeIntert();
                    params.closeCallback && params.closeCallback();
                });
            } else {
                this.showSysIntertAd(params);
            }
        }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
    }

    public hideNativeIntert(): void {
        if (this.nativeAdIntertNode) {
            info("隐藏原生插屏");
            if (EngineUtils.isCocos()) {
                this.nativeAdIntertNode.removeFromParent();
            } else {
                this.nativeAdIntertNode.removeSelf();
            }
        }
        this.existIntert = false;
    }

    public vibrateShort(): void {
        qg.vibrateShort();
    }

    public vibrateLong(): void {
        qg.vibrateLong();
    }

    public showToast(message: string): void {
        qg.showToast({ message: message });
    }

    public addDesktopIcon(params: any = {}): void {
        qg.installShortcut({
            success: () => {
                info("桌面图标创建成功...");
                params.callbackFunction && params.callbackFunction(true);
                EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.addDesktopIcon + "_" + AdEventKey.showSuccess);
            },
            fail: (error: any) => {
                info("桌面图标创建 失败...", JSON.stringify(error));
                params.callbackFunction && params.callbackFunction(false);
            },
            complete: () => {}
        });
    }

    public hasDesktopIcon(params: any = {}): void {
        qg.hasShortcutInstalled({
            success: (result: boolean) => {
                if (result) {
                    params.callbackFunction && params.callbackFunction(true);
                } else {
                    params.callbackFunction && params.callbackFunction(false);
                }
            }
        });
    }

    public getPlatformVersionCode(): number {
        return qg.getSystemInfoSync().platformVersionCode;
    }

    public platformVersionSupport(versionCode: number): boolean {
        return true;
    }

    public createGameBoxBannerAd(): void {
        info("createGameBoxBannerAd===");
        if (ConfigHelper.getGameConfig().gameBannerId) {
            if (qg.createBoxBannerAd) {
                this.gameBoxBannerAd = qg.createBoxBannerAd({
                    posId: ConfigHelper.getGameConfig().gameBannerId
                });
                this.gameBoxBannerAd.onLoad(() => {
                    info("互推盒子横幅广告加载成功");
                });
                this.gameBoxBannerAd.onError((error: any) => {
                    info("盒子横幅广告加载失败", JSON.stringify(error));
                });
            } else {
                info("暂不支持互推盒子相关 API");
            }
        } else {
            warn("互推盒子横幅广告ID");
        }
    }

    public showGameBoxBannerAd(params: any = {}): void {
        info("showGameBoxBannerAd===");
        if (this.gameBoxBannerAd === undefined) {
            this.createGameBoxBannerAd();
        }
        if (this.gameBoxBannerAd) {
            this.gameBoxBannerAd.show();
            EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.gameBoxBanner + "_" + AdEventKey.showSuccess);
        }
    }

    public hideGameBoxBannerAd(): void {
        info("hideGameBoxBannerAd===");
        if (this.gameBoxBannerAd) {
            this.gameBoxBannerAd.hide();
        }
    }

    public createGameBoxPortalAd(marginTop: number, image: string): void {
        info("createGameBoxPortalAd===");
        if (ConfigHelper.getGameConfig().gamePortalId) {
            if (qg.createBoxPortalAd) {
                this.gameBoxPortalAd = qg.createBoxPortalAd({
                    posId: ConfigHelper.getGameConfig().gamePortalId,
                    image: image,
                    marginTop: marginTop
                });
                this.gameBoxPortalAd.onLoad(() => {
                    info("互推盒子九宫格广告加载成功");
                });
                this.gameBoxPortalAd.onClose(() => {
                    info("互推盒子九宫格广告关闭");
                    this.gameBoxPortalAd.show();
                });
                this.gameBoxPortalAd.onError((error: any) => {
                    info("互推盒子九宫格加载失败 err:", JSON.stringify(error));
                });
            } else {
                info("暂不支持互推盒子相关 API");
            }
        } else {
            warn("缺少互推盒子九宫格广告ID");
        }
    }

    public showGameBoxPortalAd(params: any = {}): void {
        if (!params.image) {
            params.image = "https://www.quduoduodata.top/ossfile/qddSDKRes/btnMore.png";
        }
        info("showGameBoxPortalAd===");
        if (this.gameBoxPortalAd === undefined) {
            this.createGameBoxPortalAd(params.marginTop, params.image);
        }
        if (this.gameBoxPortalAd) {
            this.gameBoxPortalAd.show().then(() => {
                EventHelper.getInstance().recordAdvert(params.adLocation + "_" + AdEventKey.gameBoxPortal + "_" + AdEventKey.showSuccess);
                info("show gameBoxPortalAd success ===");
            }).catch(() => {
                info("show gameBoxPortalAd fail ===");
            });
        }
    }

    public hideGameBoxPortalAd(): void {
        if (this.gameBoxPortalAd) {
            this.gameBoxPortalAd.hide().then(() => {
                info("hide success");
            }).catch((error: any) => {
                info(`hide fail with:${error.errCode},${error.errMsg}`);
            });
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

    public getSystemInfo(): any {
        return qg.getSystemInfoSync();
    }

    public getGameVersion(): string {
        return "1.0.11";
    }

    public copyString(text: string): void {
        info("copyString: ", text);
        qg.setClipboardData({
            data: text,
            success: () => {
                info("copyString success");
            },
            fail: () => {
                info("copyString fail");
            },
            complete: () => {
                info("copyString complete=========");
            }
        });
    }

    public getUserInfoImpl(): any {
        return this.userInfo;
    }
}