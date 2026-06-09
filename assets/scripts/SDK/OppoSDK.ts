import { game } from 'cc';
import { AbstractPlatformSDK } from './AbstractPlatformSDK';
import { LogUtils } from './../Utils/LogUtils';
import { DefaultNativeTemplate } from './../DefaultNativeTemplate';
import { ConfigHelper } from './../ConfigHelper';
import { EngineUtils } from './../Utils/EngineUtils';
import { StringUtils } from './../Utils/StringUtils';
import { AdControlUtils } from './../Utils/AdControlUtils';
import { EventHelper } from './../Event/EventHelper';
import { AdEventKey } from './../Event/AdEventKey';
import { DigestUtils } from './../Utils/DigestUtils';
import { PayUtils } from './../Utils/PayUtils';

declare const qg: any;

export class OPPOSDK extends AbstractPlatformSDK {
    private static _instance: OPPOSDK;

    // 广告对象
    private bannerAd: any;
    private videoAd: any;
    private nativeImageAd: any;
    private nativeIconAd: any;
    private gameBoxBannerAd: any;
    private gameBoxPortalAd: any;
    private gameDrawerAd: any;

    // 状态标志
    private videoAdLodeSuccess: boolean = false;
    private nativeIconAdLoadSuccess: boolean = false;
    private nativeInsertAdLoadSuccess: boolean = false;
    private existIntert: boolean = false;
    private showNativeImageStatus: boolean = false;
    private initSuccess: boolean = false;

    private videoCallback: ((result: boolean) => void) | undefined;
    private bannerAdRefreshTimer: number | undefined;
    private lastLoadNativeAdTime: number = 0;

    // 原生广告数据
    private nativeAdImageData: {
        adId: string;
        title: string;
        desc: string;
        imgUrl: string;
        iconUrl: string;
        loadTime: number;
        firstShowTime: number;
        isReportAdShow: boolean;
        isReportAdClick: boolean;
    } = {
        adId: '',
        title: '',
        desc: '',
        imgUrl: '',
        iconUrl: '',
        loadTime: 0,
        firstShowTime: 0,
        isReportAdShow: true,
        isReportAdClick: true
    };

    private nativeAdIconData: any;
    private nativeAdInsertData: any;

    // 原生广告节点
    private nativeAdImageNode: any;
    private nativeAdIconNode: any;
    private nativeAdImagePanelNode: any;
    private nativeAdImageButtonNode: any;
    private nativeAdIconPanelNode: any;
    private nativeAdIconButtonNode: any;
    private nativeAdIntertNode: any;

    // 广告ID记录
    private videoAdLocation: string = '';
    private nowNativeImageAdId: string = '';
    private nownativeIconAdId: string = '';
    private nowNativeInsertAdId: string = '';
    private gameBoxPortalLoction: string = '';

    private systemInfo: any;
    private nativeImageParam: any;

    // 用户信息
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
        openId: '',
        nickName: '',
        avatarUrl: '',
        gender: 0,
        age: 0,
        city: '',
        province: '',
        country: ''
    };

    private videoIdIndex: number = 0;

    static getInstance(): OPPOSDK {
        if (!this._instance) {
            this._instance = new OPPOSDK();
        }
        return this._instance;
    }

    constructor() {
        super();
    }

    initAdService(): void {
        if (this.initSuccess) return;
        this.initSuccess = true;
        this.createVideoAd();
        if (this.videoAd) {
            this.videoAd.load();
        }
        this.createnativeImageAd();
        setTimeout(() => {
            this.createNativeIconAd();
        }, 4000);
        setTimeout(() => {
            this.createNativeInsertAd();
        }, 8000);
        setTimeout(() => {
            this.doImageAdRefresh();
        }, 6000);
        this.doAdRefresh();
    }

    login(options: any = {}): void {
        LogUtils.info('login===========');
        qg.getSystemInfo({
            success: (res: any) => {
                PayUtils.platformVersionCode = res.platformVersionCode;
            }
        });
        qg.login({
            success: (response: any) => {
                LogUtils.info('登录成功,去获得用户信息:', response);
                const timestamp = new Date().getTime();
                const rawString = 'appKey=' + ConfigHelper.getGameConfig().appKey +
                    '&appSecret=' + ConfigHelper.getGameConfig().appSecret +
                    '&pkgName=' + ConfigHelper.getGameInfo().packName +
                    '&timeStamp=' + timestamp +
                    '&token=' + response.data.token;
                const sign = DigestUtils.instance.hex_md5(rawString, true);
                const url = 'https://play.open.oppomobile.com/instant-game-open/userInfo?pkgName=' +
                    ConfigHelper.getGameInfo().packName +
                    '&timeStamp=' + timestamp +
                    '&token=' + response.data.token +
                    '&sign=' + sign +
                    '&version=1.0.0';
                PayUtils.token = response.data.token;
                const xhr = new XMLHttpRequest();
                xhr.ontimeout = () => {
                    LogUtils.info('获取用户信息超时');
                    if (options.resultCallback) {
                        options.resultCallback(false);
                    }
                };
                xhr.onerror = (error: any) => {
                    LogUtils.info('获取用户信息出错：', JSON.stringify(error));
                    if (options.resultCallback) {
                        options.resultCallback(false);
                    }
                };
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
                        const userResponse = JSON.parse(xhr.responseText);
                        LogUtils.info('获取用户信息成功：', JSON.stringify(userResponse));
                        if (userResponse.userInfo.userId) {
                            this.userInfo.openId = userResponse.userInfo.userId;
                            this.userInfo.nickName = userResponse.userInfo.userName;
                            this.userInfo.avatarUrl = userResponse.userInfo.avatar;
                            this.userInfo.age = parseInt(userResponse.userInfo.age, 10);
                            if (userResponse.userInfo.sex === 'M') {
                                this.userInfo.gender = 1;
                            } else if (userResponse.userInfo.sex === 'F') {
                                this.userInfo.gender = 2;
                            } else {
                                this.userInfo.gender = 0;
                            }
                            if (options.resultCallback) {
                                options.resultCallback(true, this.userInfo);
                            }
                        } else {
                            if (options.resultCallback) {
                                options.resultCallback(false);
                            }
                        }
                    }
                };
                xhr.open('GET', url, false);
                xhr.send();
            },
            fail: (error: any) => {
                if (options.resultCallback) {
                    options.resultCallback(false);
                }
                LogUtils.info('登录失败：', JSON.stringify(error));
            }
        });
    }

    getUserInfo(options: any = {}): void {
        if (options.resultCallback) {
            options.resultCallback(true, this.userInfo);
        }
    }

    doImageAdRefresh(): void {
        setInterval(() => {
            if (this.nativeImageAd && this.nativeAdImageData.isReportAdShow &&
                (new Date().getTime() - this.lastLoadNativeAdTime > 5000) &&
                ((new Date().getTime() - this.nativeAdImageData.firstShowTime > 1000 * ConfigHelper.getGameConfig().nativeImageRefreshTime) ||
                    this.nativeAdImageData.isReportAdClick)) {
                this.nativeImageAd.load();
            }
        }, 1000);
        setInterval(() => {
            if (this.showNativeImageStatus && this.nativeAdImageData.isReportAdShow === false) {
                this.showNativeImageAd(this.nativeImageParam);
            }
        }, 1000);
    }

    doAdRefresh(): void {
        setInterval(() => {
            if (!this.videoAdLodeSuccess && this.videoAd) {
                this.videoIdIndex++;
                if (this.videoIdIndex > 2) {
                    this.videoIdIndex = 0;
                }
                if (this.videoAd) {
                    console.log('video destroy====');
                    this.videoAd.destroy();
                    this.videoAd = null;
                }
                setTimeout(() => {
                    this.createVideoAd();
                }, 1000);
            }
        }, 15000);
        setInterval(() => {
            if (!this.nativeInsertAdLoadSuccess && this.nativeInsertAd) {
                this.nativeInsertAd.load();
            }
        }, 20000);
        setInterval(() => {
            if (!this.nativeIconAdLoadSuccess && this.nativeIconAd) {
                this.nativeIconAd.load();
            }
        }, 30000);
    }

    createBannerAd(): void {
        LogUtils.info('createBannerAd===');
        if (!ConfigHelper.getGameConfig().systemBannerId) {
            LogUtils.warn('----缺少bannerId');
            return;
        }
        if (this.bannerAd) {
            this.bannerAd.destroy();
        }
        const screenWidth = qg.getSystemInfoSync().screenWidth;
        const screenHeight = qg.getSystemInfoSync().screenHeight;
        this.bannerAd = qg.createBannerAd({
            adUnitId: ConfigHelper.getGameConfig().systemBannerId
        });
        this.bannerAd.onHide(() => {
            LogUtils.info('bannerAd onHide==========');
            this.bannerAd.destroy();
            if (this.bannerAdRefreshTimer) {
                clearInterval(this.bannerAdRefreshTimer);
            }
        });
        this.bannerAd.onLoad(() => {
            LogUtils.info('bannerAd onLoad==========');
        });
        this.bannerAd.onError((error: any) => {
            LogUtils.info('bannerAd onError: ' + JSON.stringify(error));
        });
        this.bannerAd.onResize((size: any) => {
            LogUtils.info('banner 宽度：' + size.width + ', banner 高度：' + size.height);
        });
    }

    doBannerRefresh(): void {
        if (this.bannerAdRefreshTimer !== undefined) {
            clearInterval(this.bannerAdRefreshTimer);
        }
        this.bannerAdRefreshTimer = setInterval(() => {
            if (this.bannerAd) {
                this.bannerAd.show();
            }
        }, 1000 * ConfigHelper.getGameConfig().systemBannerRefreshTime);
    }

    showBannerAd(options: any = {}): void {
        LogUtils.info('showBannerAd===');
        this.createBannerAd();
        this.bannerAd.show();
        this.doBannerRefresh();
        EventHelper.getInstance().recordAdvert(options.adLocation + '_' + AdEventKey.sysBanner + '_showSuccess');
    }

    hideBannerAd(): void {
        LogUtils.info('hideBannerAd===');
        if (this.bannerAd) {
            this.bannerAd.hide();
        }
        if (this.bannerAdRefreshTimer !== undefined) {
            clearInterval(this.bannerAdRefreshTimer);
        }
    }

    createNativeInsertAd(): void {
        LogUtils.info('createNativeInsertAd==========');
        if (!ConfigHelper.getGameConfig().nativeInsertId) {
            LogUtils.warn('缺少nativeInsertId', ConfigHelper.getGameConfig().nativeInsertId);
            return;
        }
        this.nativeInsertAd = qg.createNativeAd({
            adUnitId: ConfigHelper.getGameConfig().nativeInsertId
        });
        this.nativeInsertAd.load();
        this.nativeInsertAd.onLoad((adData: any) => {
            LogUtils.info('nativeInsertAd loaded=====', JSON.stringify(adData));
            if (adData) {
                const ad = adData.adList.pop();
                const imgUrl = ad.imgUrlList[0] !== undefined ? ad.imgUrlList[0] : ad.iconUrlList[0];
                const iconUrl = ad.iconUrlList[0] !== undefined ? ad.iconUrlList[0] : ad.imgUrlList[0];
                this.nativeAdInsertData = {
                    adId: ad.adId,
                    title: ad.title,
                    desc: ad.desc,
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
            LogUtils.warn('原生插屏广告加载失败: ' + JSON.stringify(error));
        });
    }

    showIntertAd(options: any = {}): void {
        LogUtils.info('showIntertAd==========');
        this.nowNativeInsertAdId = '';
        if (AdControlUtils.isShowInter() === false && this.existIntert === true) {
            if (options.resultCallback) {
                options.resultCallback(false);
            }
            return;
        }
        const params = {
            parentNode: options.parentNode
        };
        setTimeout(() => {
            if (this.nativeInsertAdLoadSuccess && this.nativeAdInsertData) {
                const adData = this.nativeAdInsertData;
                const adId = adData.adId;
                DefaultNativeTemplate.createNativeIntertAdUINode(adData, params,
                    (node: any) => {
                        LogUtils.info('createNativeIntertAdUINode success 回调');
                        this.hideNativeIntert();
                        this.nativeAdIntertNode = node;
                        this.existIntert = true;
                        this.reportNativeAdInsertShow(adId);
                        this.nowNativeInsertAdId = adId;
                        AdControlUtils.setShowInterTime();
                        if (options.resultCallback) {
                            options.resultCallback(true);
                        }
                        EventHelper.getInstance().recordAdvert(options.adLocation + '_' + AdEventKey.nativeInsert + '_showSuccess');
                    },
                    () => {
                        LogUtils.info('点击了关闭回调');
                        this.existIntert = false;
                        this.autoClickNativeInsertAd();
                        this.nowNativeInsertAdId = '';
                        if (options.closeCallback) {
                            options.closeCallback();
                        }
                    },
                    (clickedAdId: string) => {
                        LogUtils.info('点击了广告');
                        this.nowNativeInsertAdId = '';
                        this.reportNativeAdInsertClick(clickedAdId);
                        this.hideNativeIntert();
                        if (options.closeCallback) {
                            options.closeCallback();
                        }
                    }
                );
            } else {
                if (options.resultCallback) {
                    options.resultCallback(false);
                }
                LogUtils.info('showIntertAd fail.');
            }
        }, 1000 * ConfigHelper.getGameConfig().systemInsertDelayTime);
    }

    hideNativeIntert(): void {
        this.nowNativeInsertAdId = '';
        if (this.nativeAdIntertNode) {
            LogUtils.info('隐藏原生插屏');
            if (EngineUtils.isCocos()) {
                this.nativeAdIntertNode.removeFromParent();
            } else {
                this.nativeAdIntertNode.removeSelf();
            }
        }
        this.existIntert = false;
    }

    reportNativeAdInsertClick(adId: string): void {
        this.nativeInsertAd.reportAdClick({ adId });
    }

    reportNativeAdInsertShow(adId: string): void {
        if (adId) {
            this.nativeInsertAd.reportAdShow({ adId });
            this.nativeInsertAd.load();
        }
    }

    createVideoAd(): void {
        LogUtils.info('createVideoAd==========>', this.videoIdIndex);
        let adUnitId = ConfigHelper.getGameConfig().rewardedVideoId;
        if (this.videoIdIndex === 0) {
            adUnitId = ConfigHelper.getGameConfig().rewardedVideoId;
        } else if (this.videoIdIndex === 1) {
            adUnitId = ConfigHelper.getGameConfig().loginActivity;
        } else if (this.videoIdIndex === 2) {
            adUnitId = ConfigHelper.getGameConfig().regularActivity;
        }
        if (adUnitId === '') {
            adUnitId = ConfigHelper.getGameConfig().rewardedVideoId;
        }
        if (!adUnitId) {
            LogUtils.warn('缺少videoId:', adUnitId);
            return;
        }
        if (this.videoAd) {
            this.videoAd.destroy();
        }
        this.videoAd = qg.createRewardedVideoAd({ adUnitId });
        this.videoAd.offLoad(() => {});
        this.videoAd.onLoad(() => {
            LogUtils.info('videoAd loaded======');
            this.videoAdLodeSuccess = true;
        });
        this.videoAd.offClose(() => {});
        this.videoAd.onClose((result: any) => {
            this.videoAdLodeSuccess = false;
            if (EngineUtils.isCocos()) {
                game.resume();
            }
            if (result.isEnded) {
                AdControlUtils.setShowVideoTime();
                LogUtils.info('激励视频广告完成，发放奖励');
                EventHelper.getInstance().videoComplete(this.videoAdLocation);
                if (this.videoCallback) {
                    this.videoCallback(true);
                }
            } else {
                if (this.videoCallback) {
                    this.videoCallback(false);
                }
                this.showToast('未观看完整视频，无法获得奖励');
                EventHelper.getInstance().videoNotFinished(this.videoAdLocation);
            }
            this.videoAd.load();
        });
        this.videoAd.offError(() => {});
        this.videoAd.onError((error: any) => {
            this.videoAdLodeSuccess = false;
            if (this.videoCallback) {
                this.videoCallback(false);
            }
            LogUtils.info('videoAd error: ' + JSON.stringify(error));
            if (error && (error.code === 1004 || error.code === 1003)) {
                this.createVideoAd();
            }
        });
    }

    showVideoAd(options: any = {}): void {
        LogUtils.info('showVideoAd===');
        if (AdControlUtils.isShowVideo() === false) {
            if (options.videoCallback) {
                options.videoCallback(false);
            }
            this.showToast('当前暂无可播放广告');
            return;
        }
        if (this.videoAdLodeSuccess) {
            if (options.videOnStartCallback) {
                options.videOnStartCallback();
            }
            if (options.adLocation) {
                this.videoAdLocation = options.adLocation;
            }
            if (EngineUtils.isCocos()) {
                game.pause();
            }
            this.videoAd.show();
            EventHelper.getInstance().videoStartEvent(this.videoAdLocation);
            this.videoCallback = options.videoCallback;
        } else {
            if (options.videoCallback) {
                options.videoCallback(false);
            }
            if (options.videoOnError) {
                options.videoOnError();
            }
            this.showToast('当前没有可播放的广告');
        }
    }

    createnativeImageAd(): void {
        LogUtils.info('createnativeImageAd===');
        if (!ConfigHelper.getGameConfig().nativeImageId) {
            LogUtils.warn('缺少nativeImageId');
            return;
        }
        if (this.nativeImageAd) {
            this.nativeImageAd.destroy();
        }
        this.nativeImageAd = qg.createNativeAd({
            adUnitId: ConfigHelper.getGameConfig().nativeImageId
        });
        this.nativeImageAd.load();
        this.nativeImageAd.onLoad((adData: any) => {
            this.lastLoadNativeAdTime = new Date().getTime();
            LogUtils.info('createnativeImageAd loaded=====', JSON.stringify(adData));
            if (adData) {
                const ad = adData.adList.pop();
                const imgUrl = ad.imgUrlList[0] !== undefined ? ad.imgUrlList[0] : ad.iconUrlList[0];
                this.nativeAdImageData = {
                    adId: ad.adId,
                    title: ad.title,
                    desc: ad.desc,
                    imgUrl: StringUtils.removeTheParameters(imgUrl),
                    iconUrl: StringUtils.removeTheParameters(ad.iconUrlList[0]),
                    isReportAdClick: false,
                    isReportAdShow: false,
                    loadTime: new Date().getTime(),
                    firstShowTime: 0
                };
            }
        });
        this.nativeImageAd.onError((error: any) => {
            this.lastLoadNativeAdTime = new Date().getTime();
            LogUtils.warn('原生大图广告加载失败: ' + JSON.stringify(error));
        });
    }

    getNativeAdIconData(): any {
        return this.nativeAdIconData;
    }

    showNativeImageAd(options: any): void {
        LogUtils.info('showNativeImageAd===');
        this.nativeImageParam = options;
        const params = options;
        this.nowNativeImageAdId = '';
        if (AdControlUtils.isShowNativeAd() === false) {
            return;
        }
        if (this.nativeAdImageData && this.nativeAdImageData.isReportAdClick === false) {
            this.nativeAdImagePanelNode = options.panelNode;
            this.nativeAdImageButtonNode = options.buttonNode;
            const adData = this.nativeAdImageData;
            const adId = adData.adId;
            this.hideBannerAd();
            this.hideNativeImage();
            DefaultNativeTemplate.createNativeAdImageUINode(adData, options,
                (node: any) => {
                    LogUtils.info('createNativeAdImageUINode success 回调');
                    this.showNativeImageStatus = true;
                    this.nativeAdImageNode = node;
                    if (this.nativeAdImageData.isReportAdShow === false) {
                        this.reportNativeAdImageShow(adId);
                        this.nowNativeImageAdId = adId;
                        this.nativeAdImageData.isReportAdShow = true;
                        this.nativeAdImageData.firstShowTime = new Date().getTime();
                    }
                    AdControlUtils.setShowNativeAdTime();
                    if (params.resultCallback) {
                        params.resultCallback(true);
                    }
                    EventHelper.getInstance().recordAdvert(options.adLocation + '_' + AdEventKey.nativeImage + '_' + AdEventKey.showSuccess);
                },
                () => {
                    LogUtils.info('点击了关闭回调');
                    this.nowNativeImageAdId = '';
                    if (params.closeCallback) {
                        params.closeCallback();
                    }
                },
                (clickedAdId: string) => {
                    LogUtils.info('点击了广告');
                    this.nativeAdImageData.isReportAdClick = true;
                    this.nowNativeImageAdId = '';
                    this.reportNativeAdImageClick(clickedAdId);
                    if (this.nativeAdImageNode) {
                        this.nativeAdImageNode.active = false;
                        this.nativeAdImageNode.visible = false;
                    }
                }
            );
        } else {
            LogUtils.info('showNativeImageAd fail.');
            if (options.resultCallback) {
                options.resultCallback(false);
            }
        }
    }

    reportNativeAdImageShow(adId: string): void {
        if (adId) {
            this.nativeImageAd.reportAdShow({ adId });
        }
    }

    reportNativeAdImageClick(adId: string): void {
        if (adId) {
            this.nativeImageAd.reportAdClick({ adId });
        }
    }

    hideNativeImage(): void {
        LogUtils.info('hideNativeImage ====');
        this.nowNativeImageAdId = '';
        this.showNativeImageStatus = false;
        if (this.nativeAdImageNode) {
            LogUtils.info('节点存在 。。。。。。。。。。。。');
            if (EngineUtils.isCocos()) {
                this.nativeAdImageNode.removeFromParent();
            } else {
                this.nativeAdImageNode.removeSelf();
            }
        } else {
            LogUtils.info('节点不存在 ====');
        }
        if (this.nativeAdImagePanelNode) {
            this.nativeAdImagePanelNode.active = false;
            if (!EngineUtils.isCocos()) {
                this.nativeAdImagePanelNode.visible = false;
            }
        }
        if (this.nativeAdImageButtonNode) {
            if (this.nativeAdImageButtonNode instanceof Array) {
                for (const node of this.nativeAdImageButtonNode) {
                    node.active = false;
                    if (!EngineUtils.isCocos()) {
                        node.visible = false;
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

    createNativeIconAd(): void {
        LogUtils.info('createNativeIconAd===');
        if (!ConfigHelper.getGameConfig().nativeIconId) {
            LogUtils.warn('缺少nativeIconId');
            return;
        }
        if (this.nativeIconAd) {
            this.nativeIconAd.destroy();
        }
        this.nativeIconAd = qg.createNativeAd({
            adUnitId: ConfigHelper.getGameConfig().nativeIconId
        });
        this.nativeIconAd.load();
        this.nativeIconAd.onLoad((adData: any) => {
            LogUtils.info('createNativeIconAd loaded=====', JSON.stringify(adData));
            if (adData && adData.adList) {
                const ad = adData.adList.pop();
                const imgUrl = ad.imgUrlList[0] !== undefined ? ad.imgUrlList[0] : ad.iconUrlList[0];
                const iconUrl = ad.iconUrlList[0] !== undefined ? ad.iconUrlList[0] : ad.imgUrlList[0];
                this.nativeAdIconData = {
                    adId: ad.adId,
                    title: ad.title,
                    desc: ad.desc,
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
            LogUtils.warn('原生ICON广告加载失败: ' + JSON.stringify(error));
        });
    }

    showNativeIconAd(options: any): void {
        LogUtils.info('showNativeIconAd===');
        this.nownativeIconAdId = '';
        if (AdControlUtils.isShowNativeAd() === false) {
            return;
        }
        const params = options;
        if (this.nativeIconAdLoadSuccess && this.nativeAdIconData) {
            const adData = this.nativeAdIconData;
            const adId = adData.adId;
            DefaultNativeTemplate.createNativeAdImageUINode(adData, options,
                (node: any) => {
                    LogUtils.info('createNativeAdIconUINode success 回调');
                    this.hideNativeIconAd();
                    this.nativeAdIconPanelNode = params.panelNode;
                    this.nativeAdIconButtonNode = params.buttonNode;
                    this.nativeAdIconNode = node;
                    this.reportNativeAdIconShow(adId);
                    this.nownativeIconAdId = adId;
                    if (params.resultCallback) {
                        params.resultCallback(true);
                    }
                    AdControlUtils.setShowNativeAdTime();
                    EventHelper.getInstance().recordAdvert(options.adLocation + '_' + AdEventKey.nativeIcon + '_' + AdEventKey.showSuccess);
                },
                () => {
                    LogUtils.info('createNativeAdIconUINode close 回调');
                    this.nownativeIconAdId = '';
                    if (params.closeCallback) {
                        params.closeCallback();
                    }
                },
                (clickedAdId: string) => {
                    LogUtils.info('createNativeAdIconUINode click 回调');
                    this.nownativeIconAdId = '';
                    this.reportNativeAdIconClick(clickedAdId);
                }
            );
        } else {
            if (options.resultCallback) {
                options.resultCallback(false);
            }
        }
    }

    reportNativeAdIconShow(adId: string): void {
        if (adId) {
            this.nativeIconAd.reportAdShow({ adId });
            this.nativeIconAd.load();
        }
    }

    reportNativeAdIconClick(adId: string): void {
        this.nativeIconAd.reportAdClick({ adId });
    }

    hideNativeIconAd(): void {
        this.nownativeIconAdId = '';
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
                for (const node of this.nativeAdIconButtonNode) {
                    node.active = false;
                    if (!EngineUtils.isCocos()) {
                        node.visible = false;
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

    vibrateShort(): void {
        qg.vibrateShort({
            success: () => {},
            fail: () => {},
            complete: () => {}
        });
    }

    vibrateLong(): void {
        qg.vibrateLong({
            success: () => {},
            fail: () => {},
            complete: () => {}
        });
    }

    showToast(title: string): void {
        qg.showToast({
            title: title,
            icon: 'success',
            duration: 2000
        });
    }

    addDesktopIcon(options: any = {}): void {
        qg.installShortcut({
            success: () => {
                LogUtils.info('addDesktopIcon success');
                if (options.callbackFunction) {
                    options.callbackFunction(true);
                }
                EventHelper.getInstance().recordAdvert(AdEventKey.addDesktopIcon + '_' + AdEventKey.showSuccess);
            },
            fail: (error: any) => {
                LogUtils.info('addDesktopIcon err: ', JSON.stringify(error));
                if (options.callbackFunction) {
                    options.callbackFunction(false);
                }
            },
            complete: () => {}
        });
    }

    hasDesktopIcon(options: any = {}): void {
        qg.hasShortcutInstalled({
            success: (result: any) => {
                if (result === false) {
                    if (options.callbackFunction) {
                        options.callbackFunction(false);
                    }
                } else {
                    if (options.callbackFunction) {
                        options.callbackFunction(true);
                    }
                }
            },
            fail: () => {},
            complete: () => {}
        });
    }

    createGameBoxBannerAd(): void {
        LogUtils.info('createGameBoxBannerAd===');
        if (!ConfigHelper.getGameConfig().gameBannerId) {
            LogUtils.warn('互推盒子横幅广告ID');
            return;
        }
        if (qg.getSystemInfoSync().platformVersionCode <= 1076) {
            LogUtils.info('快应用平台版本号低于1076，暂不支持互推盒子相关 API');
            return;
        }
        this.gameBoxBannerAd = qg.createGameBannerAd({
            adUnitId: ConfigHelper.getGameConfig().gameBannerId
        });
        this.gameBoxBannerAd.onLoad(() => {
            LogUtils.info('互推盒子横幅广告加载成功');
        });
        this.gameBoxBannerAd.onError((error: any) => {
            LogUtils.info('互推盒子横幅广告加载失败: err:', JSON.stringify(error));
        });
    }

    showGameBoxBannerAd(options: any = {}): void {
        LogUtils.info('showGameBoxBannerAd===');
        if (this.gameBoxBannerAd === undefined) {
            this.createGameBoxBannerAd();
        }
        if (this.gameBoxBannerAd) {
            this.gameBoxBannerAd.show();
            EventHelper.getInstance().recordAdvert(options.adLocation + '_' + AdEventKey.gameBoxBanner + '_showSuccess');
        }
    }

    hideGameBoxBannerAd(): void {
        LogUtils.info('hideGameBoxBannerAd===');
        if (this.gameBoxBannerAd) {
            this.gameBoxBannerAd.hide();
        }
    }

    createGameBoxPortalAd(): void {
        LogUtils.info('createGameBoxPortalAd===');
        if (!ConfigHelper.getGameConfig().gamePortalId) {
            LogUtils.warn('缺少互推盒子九宫格广告ID');
            return;
        }
        if (qg.getSystemInfoSync().platformVersionCode <= 1076) {
            LogUtils.info('快应用平台版本号低于1076，暂不支持互推盒子相关 API');
            return;
        }
        this.gameBoxPortalAd = qg.createGamePortalAd({
            adUnitId: ConfigHelper.getGameConfig().gamePortalId
        });
        this.gameBoxPortalAd.onLoad(() => {
            LogUtils.info('互推盒子九宫格广告加载成功');
            this.gameBoxPortalAd.show();
            EventHelper.getInstance().recordAdvert(this.gameBoxPortalLoction + '_' + AdEventKey.gameBoxPortal + '_showSuccess');
        });
        this.gameBoxPortalAd.onClose(() => {
            LogUtils.info('互推盒子九宫格广告关闭');
        });
        this.gameBoxPortalAd.onError((error: any) => {
            LogUtils.info('互推盒子九宫格加载失败 err:', JSON.stringify(error));
        });
    }

    showGameBoxPortalAd(options: any): void {
        LogUtils.info('showGameBoxPortalAd===');
        this.hideBannerAd();
        this.hideNativeImage();
        this.hideNativeIconAd();
        if (options.adLocation) {
            this.gameBoxPortalLoction = options.adLocation;
        }
        if (this.gameBoxPortalAd === undefined) {
            this.createGameBoxPortalAd();
        } else {
            this.gameBoxPortalAd.load();
        }
    }

    createGameDrawerAd(top: number): void {
        if (qg.getSystemInfoSync().platformVersionCode < 1090) {
            LogUtils.log('快应用平台版本号低于1090，暂不支持互推盒子相关 API');
            return;
        }
        if (!ConfigHelper.getGameConfig().gameDrawerId) {
            LogUtils.warn('缺少互推抽屉广告id');
            return;
        }
        if (this.gameDrawerAd) {
            this.gameDrawerAd.destroy();
        }
        this.gameDrawerAd = qg.createGameDrawerAd({
            adUnitId: ConfigHelper.getGameConfig().gameDrawerId,
            style: {
                top: top
            }
        });
        this.gameDrawerAd.offShow(() => {});
        this.gameDrawerAd.onShow(() => {
            LogUtils.info('gameDrawerAd show');
        });
        this.gameDrawerAd.offError(() => {});
        this.gameDrawerAd.onError((error: any) => {
            LogUtils.info('createGameDrawerAd onError');
            if (error) {
                LogUtils.info(JSON.stringify(error));
            }
        });
    }

    showGameDrawerAd(options: any = {}): void {
        this.createGameDrawerAd(options.top);
        if (this.gameDrawerAd) {
            this.gameDrawerAd.show()
                .then(() => {
                    LogUtils.info('showGameDrawerAd success');
                    EventHelper.getInstance().recordAdvert(options.adLocation + '_' + AdEventKey.gameDrawer + '_showSuccess');
                })
                .catch((error: any) => {
                    if (error) {
                        LogUtils.info('showGameDrawerAd error: ', JSON.stringify(error));
                    }
                });
        }
    }

    hideGameDrawerAd(): void {
        if (this.gameDrawerAd) {
            this.gameDrawerAd.hide()
                .then(() => {
                    LogUtils.info('hideGameDrawerAd success');
                })
                .catch((error: any) => {
                    LogUtils.info('hideGameDrawerAd fail', JSON.stringify(error));
                });
        }
    }

    getNativeAdImageData(): any {
        return this.nativeAdImageData;
    }

    reportMonitor(): void {
        qg.reportMonitor('game_scene', 0);
    }

    reportNavigateData(gamePackageName: string, linkGamePackageName: string): void {
        const url = 'http://quduoduodata.top/Mutualstatistics/add?gamepackagename=' +
            gamePackageName + '&linkgamepackagename=' + linkGamePackageName;
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {
                LogUtils.info('reportNavigateData success');
            }
        };
        xhr.open('GET', url, true);
        xhr.send();
    }

    getPlatformVersionCode(): number {
        return this.getSystemInfo().platformVersionCode;
    }

    autoClickNativeInsertAd(): void {
        if (this.nowNativeInsertAdId && AdControlUtils.autoClickNativeInsertAd()) {
            this.reportNativeAdInsertClick(this.nowNativeInsertAdId);
            this.nowNativeInsertAdId = '';
            this.hideNativeIntert();
        }
    }

    autoClickNativeAdImage(callback: (result: boolean) => void): void {
        if (this.nowNativeImageAdId && AdControlUtils.autoClickNativeAdImage()) {
            callback(true);
            this.reportNativeAdImageClick(this.nowNativeImageAdId);
            this.nowNativeImageAdId = '';
            this.hideNativeImage();
        } else {
            callback(false);
        }
    }

    autoClickNativeAdIcon(callback: (result: boolean) => void): void {
        if (this.nownativeIconAdId && AdControlUtils.autoClickNativeAdIcon()) {
            callback(true);
            this.reportNativeAdIconClick(this.nownativeIconAdId);
            this.nownativeIconAdId = '';
            this.hideNativeIconAd();
        } else {
            callback(false);
        }
    }

    getNetworkType(callback: (type: number) => void): void {
        qg.getNetworkType({
            success: (res: any) => {
                const networkType = res.networkType;
                callback(networkType === 'none' ? 0 : 1);
            },
            fail: () => {
                callback(1);
            }
        });
    }

    platformVersionSupport(version: any): boolean {
        return true;
    }

    getSystemInfo(): any {
        return qg.getSystemInfoSync();
    }

    getGameVersion(): string {
        return '1.0.11';
    }

    copyString(text: string): void {
        LogUtils.info('copyString: ', text);
        qg.setClipboardData({
            data: text,
            success: () => {
                LogUtils.info('copyString success');
            },
            fail: () => {
                LogUtils.info('copyString fail');
            },
            complete: () => {
                LogUtils.info('copyString complete=========');
            }
        });
    }

    getUserInfoImpl(): any {
        return this.userInfo;
    }
}