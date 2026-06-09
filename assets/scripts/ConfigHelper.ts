import { EnvDev } from './EnvDev';
import { EnvProd } from './EnvProd';
import { LocalConfig } from './LocalConfig';
import { getOssAdConfigure } from './AdApi';
import { LogUtils } from './Utils/LogUtils';
import { PlatformUtils } from './Utils/PlatformUtils';
import { StoreUtils, Type } from './Utils/StoreUtils';

interface GameConfig {
    appBoxId: string;
    appboxSwitch: boolean;
    appKey: string;
    appSecret: string;
    authenticationSwitch: boolean;
    closeAdButtonDelayTime: number;
    blockId: string;
    blockSwitch: boolean;
    cpId: string;
    doubleRewardSwitch: boolean;
    floatIcon: string;
    gameBannerId: string;
    gameDrawerId: string;
    gameDrawerSwitch: boolean;
    gamePortalId: string;
    gameSplashInterval: number;
    gameSplashSwitch: boolean;
    insertVideoId: string;
    insertVideoInterval: number;
    insertVideoSwitch: boolean;
    logSwitch: boolean;
    nativeClickBtnSwitch: boolean;
    nativeCountLimit: boolean;
    nativeIconDelayTime: number;
    nativeIconErrInterval: number;
    nativeIconErrNumber: number;
    nativeIconErrProbability: number;
    nativeIconId: string;
    nativeIconRefreshTime: number;
    nativeIconSwitch: boolean;
    nativeImageDelayTime: number;
    nativeImageErrInterval: number;
    nativeImageErrNumber: number;
    nativeImageErrProbability: number;
    nativeImageId: string;
    nativeImageRefreshTime: number;
    nativeImageSwitch: boolean;
    nativeInsertCloseBtnDelayTime: number;
    nativeInsertDelayTime: number;
    nativeInsertErrInterval: number;
    nativeInsertErrNumber: number;
    nativeInsertErrProbability: number;
    nativeInsertId: string;
    nativeInsertIntervalTime: number;
    nativeInsertProbability: number;
    nativeInsertStyle: string;
    nativeInsertSwitch: boolean;
    nativeTemplateId: string;
    nativeTemplateSwitch: boolean;
    privacyPolicyCompany: string;
    privacyPolicySwitch: boolean;
    pushGameSwitch: boolean;
    recommendListProbability: number;
    rewardedVideoErrInterval: number;
    rewardedVideoErrNumber: number;
    rewardedVideoErrProbability: number;
    rewardedVideoId: string;
    rewardedvideoInterval: number;
    rewardedVideoSwitch: boolean;
    showVideoSwitch: boolean;
    splashAdSourceId: string;
    splashAppId: string;
    splashDesc: string;
    splashId: string;
    splashName: string;
    splashSlotId: string;
    startNoNativeAdTime: number;
    systemBannerBottomDistance: number;
    systemBannerDelayTime: number;
    systemBannerId: string;
    systemBannerRefreshTime: number;
    systemBannerSwitch: boolean;
    systemInsertDelayTime: number;
    systemInsertId: string;
    systemInsertIntervalTime: number;
    systemInsertProbability: number;
    systemInsertSwitch: boolean;
    systemInsertToNativeInsertNumber: number;
    umAppKey: string;
    videoPlayConfirmProbability: boolean;
    mysticallyErrNumber: number;
    mysticallyErrInterval: number;
    mysticallyErrProbability: number;
    mysticallyCloseDelayTime: number;
    addDesktopIconSwith: boolean;
    startNoAdTime: number;
    payDebug: boolean;
    isCheckedPolicy: boolean;
    uploadDataInterval: number;
    contactUs: string;
    chatCD: number;
    chatSwitch: boolean;
    customerServiceSwitch: boolean;
    chatServerIP: string;
    chatRoomMsgNum: number;
    closeIosPayVersions: string;
    testWxIosJsApiPaySwitch: boolean;
    qqqun: string;
    qrCodeUrl: string;
    versions: string;
    closeSkipVideoVersions: string;
    closeGuestVersions: string;
    encodeLocalCache: boolean;
    userAgreement: string;
    gameConfigCDNPath: string;
    configSource: string;
    eventUrl: string;
    eventToken: string;
    ipu: number;
    ecpm: number;
    loginActivity: string;
    regularActivity: string;
    gravityAccessToken: string;
    gameClubLink: string;
}

interface GameInfo {
    appId: string;
    channel: string;
    configUpdatedAt: number;
    configVersion: number;
    gameAppkey: string;
    id: number;
    name: string;
    packName: string;
}

interface ShareConfig {
    title: string;
    imageUrl: string;
}

interface RecommendGame {
    appId: string;
    gameIcon: string;
    gameName: string;
    path: string;
}

interface ApiResponse {
    code: number;
    data: {
        gameConfig: any;
        gameInfo: any;
        share: any;
        recommendGameList: any[];
    };
}

export class ConfigHelper {
    static gameInfo: GameInfo | undefined;
    static gameConfig: GameConfig | undefined;
    static shareConfig: ShareConfig | undefined;
    static recommendGameList: RecommendGame[] = [];

    static getGameInfo(): GameInfo | undefined {
        return this.gameInfo;
    }

    static getGameConfig(): GameConfig | undefined {
        return this.gameConfig;
    }

    static getShareConfig(): ShareConfig | undefined {
        return this.shareConfig;
    }

    static getRecommendGameList(): RecommendGame[] {
        return this.recommendGameList;
    }

    static getEnvValue(): any {
        return LocalConfig.NODE_ENV === "dev" ? EnvDev : EnvProd;
    }

    static getOnLineConfig(url: string, callback: () => void): void {
        /*if (PlatformUtils.isIOS() || PlatformUtils.isFacebookMiniGame() || PlatformUtils.isGooglePlayNative()) {
            this.defaultParameters();
            callback();
            return;
        }

        url = url + "?time=" + new Date().getTime();

        const handleResponse = (response: string | null): void => {
            if (response) {
                this.analyticParameters(response);
            }
            callback();
        };

        getOssAdConfigure(url).then((response: string) => {
            StoreUtils.getInstance().set(StoreUtils.keyAdConfigCache, Type.String, response);
            if (response) {
                LogUtils.info("服务器参数拉去成功，参数: ", JSON.parse(response));
            }
            handleResponse(response);
        }).catch(() => {
            const cachedConfig = StoreUtils.getInstance().get(StoreUtils.keyAdConfigCache, Type.String, "");
            if (cachedConfig) {
                LogUtils.info("服务器参数拉去失败， 本地存储的参数: ", JSON.parse(cachedConfig));
            }
            handleResponse(cachedConfig);
        });
        */

        this.defaultParameters();
        callback();
        return;
    }

    static analyticParameters(response: string): void {
        const parsedResponse: ApiResponse = JSON.parse(response);

        if (parsedResponse.code !== 200) {
            throw new Error("参数解析错误");
        }

        const data = parsedResponse.data;
        const rawGameConfig = data.gameConfig;

        this.gameConfig = {
            appBoxId: String(rawGameConfig.appBoxId !== undefined && rawGameConfig.appBoxId !== null ? rawGameConfig.appBoxId : "").trim(),
            appboxSwitch: Boolean(rawGameConfig.appboxSwitch !== undefined && rawGameConfig.appboxSwitch !== null && rawGameConfig.appboxSwitch),
            appKey: String(rawGameConfig.appKey !== undefined && rawGameConfig.appKey !== null ? rawGameConfig.appKey : "").trim(),
            appSecret: String(rawGameConfig.appSecret !== undefined && rawGameConfig.appSecret !== null ? rawGameConfig.appSecret : "").trim(),
            authenticationSwitch: Boolean(rawGameConfig.authenticationSwitch !== undefined && rawGameConfig.authenticationSwitch !== null && rawGameConfig.authenticationSwitch),
            closeAdButtonDelayTime: Number(rawGameConfig.closeAdButtonDelayTime !== undefined && rawGameConfig.closeAdButtonDelayTime !== null ? rawGameConfig.closeAdButtonDelayTime : 0),
            blockId: String(rawGameConfig.blockId !== undefined && rawGameConfig.blockId !== null ? rawGameConfig.blockId : "").trim(),
            blockSwitch: Boolean(rawGameConfig.blockSwitch !== undefined && rawGameConfig.blockSwitch !== null && rawGameConfig.blockSwitch),
            cpId: String(rawGameConfig.cpId !== undefined && rawGameConfig.cpId !== null ? rawGameConfig.cpId : "").trim(),
            doubleRewardSwitch: Boolean(rawGameConfig.doubleRewardSwitch !== undefined && rawGameConfig.doubleRewardSwitch !== null && rawGameConfig.doubleRewardSwitch),
            floatIcon: String(rawGameConfig.floatIcon !== undefined && rawGameConfig.floatIcon !== null ? rawGameConfig.floatIcon : "").trim(),
            gameBannerId: String(rawGameConfig.gameBannerId !== undefined && rawGameConfig.gameBannerId !== null ? rawGameConfig.gameBannerId : "").trim(),
            gameDrawerId: String(rawGameConfig.gameDrawerId !== undefined && rawGameConfig.gameDrawerId !== null ? rawGameConfig.gameDrawerId : "").trim(),
            gameDrawerSwitch: Boolean(rawGameConfig.gameDrawerSwitch !== undefined && rawGameConfig.gameDrawerSwitch !== null && rawGameConfig.gameDrawerSwitch),
            gamePortalId: String(rawGameConfig.gamePortalId !== undefined && rawGameConfig.gamePortalId !== null ? rawGameConfig.gamePortalId : "").trim(),
            gameSplashInterval: Number(rawGameConfig.gameSplashInterval !== undefined && rawGameConfig.gameSplashInterval !== null ? rawGameConfig.gameSplashInterval : 0),
            gameSplashSwitch: Boolean(rawGameConfig.gameSplashSwitch !== undefined && rawGameConfig.gameSplashSwitch !== null && rawGameConfig.gameSplashSwitch),
            insertVideoId: String(rawGameConfig.insertVideoId !== undefined && rawGameConfig.insertVideoId !== null ? rawGameConfig.insertVideoId : "").trim(),
            insertVideoInterval: Number(rawGameConfig.insertVideoInterval !== undefined && rawGameConfig.insertVideoInterval !== null ? rawGameConfig.insertVideoInterval : 120),
            insertVideoSwitch: Boolean(rawGameConfig.insertVideoSwitch !== undefined && rawGameConfig.insertVideoSwitch !== null && rawGameConfig.insertVideoSwitch),
            logSwitch: Boolean(rawGameConfig.logSwitch !== undefined && rawGameConfig.logSwitch !== null && rawGameConfig.logSwitch),
            nativeClickBtnSwitch: Boolean(rawGameConfig.nativeClickBtnSwitch !== undefined && rawGameConfig.nativeClickBtnSwitch !== null && rawGameConfig.nativeClickBtnSwitch),
            nativeCountLimit: Boolean(rawGameConfig.nativeCountLimit === undefined || rawGameConfig.nativeCountLimit === null || rawGameConfig.nativeCountLimit),
            nativeIconDelayTime: Number(rawGameConfig.nativeIconDelayTime !== undefined && rawGameConfig.nativeIconDelayTime !== null ? rawGameConfig.nativeIconDelayTime : 0),
            nativeIconErrInterval: Number(rawGameConfig.nativeIconErrInterval !== undefined && rawGameConfig.nativeIconErrInterval !== null ? rawGameConfig.nativeIconErrInterval : 0),
            nativeIconErrNumber: Number(rawGameConfig.nativeIconErrNumber !== undefined && rawGameConfig.nativeIconErrNumber !== null ? rawGameConfig.nativeIconErrNumber : 0),
            nativeIconErrProbability: Number(rawGameConfig.nativeIconErrProbability !== undefined && rawGameConfig.nativeIconErrProbability !== null ? rawGameConfig.nativeIconErrProbability : 0),
            nativeIconId: String(rawGameConfig.nativeIconId !== undefined && rawGameConfig.nativeIconId !== null ? rawGameConfig.nativeIconId : "").trim(),
            nativeIconRefreshTime: Number(rawGameConfig.nativeIconRefreshTime !== undefined && rawGameConfig.nativeIconRefreshTime !== null ? rawGameConfig.nativeIconRefreshTime : 0),
            nativeIconSwitch: Boolean(rawGameConfig.nativeIconSwitch !== undefined && rawGameConfig.nativeIconSwitch !== null && rawGameConfig.nativeIconSwitch),
            nativeImageDelayTime: Number(rawGameConfig.nativeImageDelayTime !== undefined && rawGameConfig.nativeImageDelayTime !== null ? rawGameConfig.nativeImageDelayTime : 0),
            nativeImageErrInterval: Number(rawGameConfig.nativeImageErrInterval !== undefined && rawGameConfig.nativeImageErrInterval !== null ? rawGameConfig.nativeImageErrInterval : 0),
            nativeImageErrNumber: Number(rawGameConfig.nativeImageErrNumber !== undefined && rawGameConfig.nativeImageErrNumber !== null ? rawGameConfig.nativeImageErrNumber : 0),
            nativeImageErrProbability: Number(rawGameConfig.nativeImageErrProbability !== undefined && rawGameConfig.nativeImageErrProbability !== null ? rawGameConfig.nativeImageErrProbability : 0),
            nativeImageId: String(rawGameConfig.nativeImageId !== undefined && rawGameConfig.nativeImageId !== null ? rawGameConfig.nativeImageId : "").trim(),
            nativeImageRefreshTime: Number(rawGameConfig.nativeImageRefreshTime !== undefined && rawGameConfig.nativeImageRefreshTime !== null ? rawGameConfig.nativeImageRefreshTime : 0),
            nativeImageSwitch: Boolean(rawGameConfig.nativeImageSwitch !== undefined && rawGameConfig.nativeImageSwitch !== null && rawGameConfig.nativeImageSwitch),
            nativeInsertCloseBtnDelayTime: Number(rawGameConfig.nativeInsertCloseBtnDelayTime !== undefined && rawGameConfig.nativeInsertCloseBtnDelayTime !== null ? rawGameConfig.nativeInsertCloseBtnDelayTime : 0),
            nativeInsertDelayTime: Number(rawGameConfig.nativeInsertDelayTime !== undefined && rawGameConfig.nativeInsertDelayTime !== null ? rawGameConfig.nativeInsertDelayTime : 0),
            nativeInsertErrInterval: Number(rawGameConfig.nativeInsertErrInterval !== undefined && rawGameConfig.nativeInsertErrInterval !== null ? rawGameConfig.nativeInsertErrInterval : 0),
            nativeInsertErrNumber: Number(rawGameConfig.nativeInsertErrNumber !== undefined && rawGameConfig.nativeInsertErrNumber !== null ? rawGameConfig.nativeInsertErrNumber : 0),
            nativeInsertErrProbability: Number(rawGameConfig.nativeInsertErrProbability !== undefined && rawGameConfig.nativeInsertErrProbability !== null ? rawGameConfig.nativeInsertErrProbability : 0),
            nativeInsertId: String(rawGameConfig.nativeInsertId !== undefined && rawGameConfig.nativeInsertId !== null ? rawGameConfig.nativeInsertId : "").trim(),
            nativeInsertIntervalTime: Number(rawGameConfig.nativeInsertIntervalTime !== undefined && rawGameConfig.nativeInsertIntervalTime !== null ? rawGameConfig.nativeInsertIntervalTime : 0),
            nativeInsertProbability: Number(rawGameConfig.nativeInsertProbability !== undefined && rawGameConfig.nativeInsertProbability !== null ? rawGameConfig.nativeInsertProbability : 0),
            nativeInsertStyle: String(rawGameConfig.nativeInsertStyle !== undefined && rawGameConfig.nativeInsertStyle !== null ? rawGameConfig.nativeInsertStyle : "").trim(),
            nativeInsertSwitch: Boolean(rawGameConfig.nativeInsertSwitch !== undefined && rawGameConfig.nativeInsertSwitch !== null && rawGameConfig.nativeInsertSwitch),
            nativeTemplateId: String(rawGameConfig.nativeTemplateId !== undefined && rawGameConfig.nativeTemplateId !== null ? rawGameConfig.nativeTemplateId : "").trim(),
            nativeTemplateSwitch: Boolean(rawGameConfig.nativeTemplateSwitch !== undefined && rawGameConfig.nativeTemplateSwitch !== null && rawGameConfig.nativeTemplateSwitch),
            privacyPolicyCompany: String(rawGameConfig.privacyPolicyCompany !== undefined && rawGameConfig.privacyPolicyCompany !== null ? rawGameConfig.privacyPolicyCompany : "").trim(),
            privacyPolicySwitch: Boolean(rawGameConfig.privacyPolicySwitch !== undefined && rawGameConfig.privacyPolicySwitch !== null && rawGameConfig.privacyPolicySwitch),
            pushGameSwitch: Boolean(rawGameConfig.pushGameSwitch !== undefined && rawGameConfig.pushGameSwitch !== null && rawGameConfig.pushGameSwitch),
            recommendListProbability: Number(rawGameConfig.recommendListProbability !== undefined && rawGameConfig.recommendListProbability !== null ? rawGameConfig.recommendListProbability : 0),
            rewardedVideoErrInterval: Number(rawGameConfig.rewardedVideoErrInterval !== undefined && rawGameConfig.rewardedVideoErrInterval !== null ? rawGameConfig.rewardedVideoErrInterval : 0),
            rewardedVideoErrNumber: Number(rawGameConfig.rewardedVideoErrNumber !== undefined && rawGameConfig.rewardedVideoErrNumber !== null ? rawGameConfig.rewardedVideoErrNumber : 0),
            rewardedVideoErrProbability: Number(rawGameConfig.rewardedVideoErrProbability !== undefined && rawGameConfig.rewardedVideoErrProbability !== null ? rawGameConfig.rewardedVideoErrProbability : 0),
            rewardedVideoId: String(rawGameConfig.rewardedVideoId !== undefined && rawGameConfig.rewardedVideoId !== null ? rawGameConfig.rewardedVideoId : "").trim(),
            rewardedvideoInterval: Number(rawGameConfig.rewardedvideoInterval !== undefined && rawGameConfig.rewardedvideoInterval !== null ? rawGameConfig.rewardedvideoInterval : 0),
            rewardedVideoSwitch: Boolean(rawGameConfig.rewardedVideoSwitch !== undefined && rawGameConfig.rewardedVideoSwitch !== null && rawGameConfig.rewardedVideoSwitch),
            showVideoSwitch: Boolean(rawGameConfig.showVideoSwitch !== undefined && rawGameConfig.showVideoSwitch !== null && rawGameConfig.showVideoSwitch),
            splashAdSourceId: String(rawGameConfig.splashAdSourceId !== undefined && rawGameConfig.splashAdSourceId !== null ? rawGameConfig.splashAdSourceId : "").trim(),
            splashAppId: String(rawGameConfig.splashAppId !== undefined && rawGameConfig.splashAppId !== null ? rawGameConfig.splashAppId : "").trim(),
            splashDesc: String(rawGameConfig.splashDesc !== undefined && rawGameConfig.splashDesc !== null ? rawGameConfig.splashDesc : "").trim(),
            splashId: String(rawGameConfig.splashId !== undefined && rawGameConfig.splashId !== null ? rawGameConfig.splashId : "").trim(),
            splashName: String(rawGameConfig.splashName !== undefined && rawGameConfig.splashName !== null ? rawGameConfig.splashName : "").trim(),
            splashSlotId: String(rawGameConfig.splashSlotId !== undefined && rawGameConfig.splashSlotId !== null ? rawGameConfig.splashSlotId : "").trim(),
            startNoNativeAdTime: Number(rawGameConfig.startNoNativeAdTime !== undefined && rawGameConfig.startNoNativeAdTime !== null ? rawGameConfig.startNoNativeAdTime : 0),
            systemBannerBottomDistance: Number(rawGameConfig.systemBannerBottomDistance !== undefined && rawGameConfig.systemBannerBottomDistance !== null ? rawGameConfig.systemBannerBottomDistance : 0),
            systemBannerDelayTime: Number(rawGameConfig.systemBannerDelayTime !== undefined && rawGameConfig.systemBannerDelayTime !== null ? rawGameConfig.systemBannerDelayTime : 0),
            systemBannerId: String(rawGameConfig.systemBannerId !== undefined && rawGameConfig.systemBannerId !== null ? rawGameConfig.systemBannerId : "").trim(),
            systemBannerRefreshTime: Number(rawGameConfig.systemBannerRefreshTime !== undefined && rawGameConfig.systemBannerRefreshTime !== null ? rawGameConfig.systemBannerRefreshTime : 0),
            systemBannerSwitch: Boolean(rawGameConfig.systemBannerSwitch !== undefined && rawGameConfig.systemBannerSwitch !== null && rawGameConfig.systemBannerSwitch),
            systemInsertDelayTime: Number(rawGameConfig.systemInsertDelayTime !== undefined && rawGameConfig.systemInsertDelayTime !== null ? rawGameConfig.systemInsertDelayTime : 0),
            systemInsertId: String(rawGameConfig.systemInsertId !== undefined && rawGameConfig.systemInsertId !== null ? rawGameConfig.systemInsertId : "").trim(),
            systemInsertIntervalTime: Number(rawGameConfig.systemInsertIntervalTime !== undefined && rawGameConfig.systemInsertIntervalTime !== null ? rawGameConfig.systemInsertIntervalTime : 0),
            systemInsertProbability: Number(rawGameConfig.systemInsertProbability !== undefined && rawGameConfig.systemInsertProbability !== null ? rawGameConfig.systemInsertProbability : 0),
            systemInsertSwitch: Boolean(rawGameConfig.systemInsertSwitch !== undefined && rawGameConfig.systemInsertSwitch !== null && rawGameConfig.systemInsertSwitch),
            systemInsertToNativeInsertNumber: Number(rawGameConfig.systemInsertToNativeInsertNumber !== undefined && rawGameConfig.systemInsertToNativeInsertNumber !== null ? rawGameConfig.systemInsertToNativeInsertNumber : 0),
            umAppKey: String(rawGameConfig.umAppKey !== undefined && rawGameConfig.umAppKey !== null ? rawGameConfig.umAppKey : "").trim(),
            videoPlayConfirmProbability: Boolean(rawGameConfig.videoPlayConfirmProbability === undefined || rawGameConfig.videoPlayConfirmProbability === null || rawGameConfig.videoPlayConfirmProbability),
            mysticallyErrNumber: Number(rawGameConfig.mysticallyErrNumber !== undefined && rawGameConfig.mysticallyErrNumber !== null ? rawGameConfig.mysticallyErrNumber : 0),
            mysticallyErrInterval: Number(rawGameConfig.mysticallyErrInterval !== undefined && rawGameConfig.mysticallyErrInterval !== null ? rawGameConfig.mysticallyErrInterval : 0),
            mysticallyErrProbability: Number(rawGameConfig.mysticallyErrProbability !== undefined && rawGameConfig.mysticallyErrProbability !== null ? rawGameConfig.mysticallyErrProbability : 0),
            mysticallyCloseDelayTime: Number(rawGameConfig.mysticallyCloseDelayTime !== undefined && rawGameConfig.mysticallyCloseDelayTime !== null ? rawGameConfig.mysticallyCloseDelayTime : 0),
            addDesktopIconSwith: Boolean(rawGameConfig.addDesktopIconSwith !== undefined && rawGameConfig.addDesktopIconSwith !== null && rawGameConfig.addDesktopIconSwith),
            startNoAdTime: Number(rawGameConfig.startNoAdTime !== undefined && rawGameConfig.startNoAdTime !== null ? rawGameConfig.startNoAdTime : 0),
            payDebug: Boolean(rawGameConfig.payDebug !== undefined && rawGameConfig.payDebug !== null && rawGameConfig.payDebug),
            isCheckedPolicy: Boolean(rawGameConfig.isCheckedPolicy !== undefined && rawGameConfig.isCheckedPolicy !== null && rawGameConfig.isCheckedPolicy),
            uploadDataInterval: Number(rawGameConfig.uploadDataInterval !== undefined && rawGameConfig.uploadDataInterval !== null ? rawGameConfig.uploadDataInterval : 180),
            contactUs: String(rawGameConfig.contactUs !== undefined && rawGameConfig.contactUs !== null ? rawGameConfig.contactUs : "").trim(),
            chatCD: Number(rawGameConfig.chatCD !== undefined && rawGameConfig.chatCD !== null ? rawGameConfig.chatCD : 0),
            chatSwitch: Boolean(rawGameConfig.chatSwitch === undefined || rawGameConfig.chatSwitch === null || rawGameConfig.chatSwitch),
            customerServiceSwitch: Boolean(rawGameConfig.customerServiceSwitch === undefined || rawGameConfig.customerServiceSwitch === null || rawGameConfig.customerServiceSwitch),
            chatServerIP: String(rawGameConfig.chatServerIP !== undefined && rawGameConfig.chatServerIP !== null ? rawGameConfig.chatServerIP : "im.quduoduodata.top/ws").trim(),
            chatRoomMsgNum: Number(rawGameConfig.chatRoomMsgNum !== undefined && rawGameConfig.chatRoomMsgNum !== null ? rawGameConfig.chatRoomMsgNum : 99),
            closeIosPayVersions: String(rawGameConfig.closeIosPayVersions !== undefined && rawGameConfig.closeIosPayVersions !== null ? rawGameConfig.closeIosPayVersions : ""),
            testWxIosJsApiPaySwitch: Boolean(rawGameConfig.testWxIosJsApiPaySwitch === undefined || rawGameConfig.testWxIosJsApiPaySwitch === null || rawGameConfig.testWxIosJsApiPaySwitch),
            qqqun: String(rawGameConfig.qqqun !== undefined && rawGameConfig.qqqun !== null ? rawGameConfig.qqqun : "").trim(),
            qrCodeUrl: String(rawGameConfig.qrCodeUrl !== undefined && rawGameConfig.qrCodeUrl !== null ? rawGameConfig.qrCodeUrl : "").trim(),
            versions: String(rawGameConfig.versions !== undefined && rawGameConfig.versions !== null ? rawGameConfig.versions : "").trim(),
            closeSkipVideoVersions: String(rawGameConfig.closeSkipVideoVersions !== undefined && rawGameConfig.closeSkipVideoVersions !== null ? rawGameConfig.closeSkipVideoVersions : "").trim(),
            closeGuestVersions: String(rawGameConfig.closeGuestVersions !== undefined && rawGameConfig.closeGuestVersions !== null ? rawGameConfig.closeGuestVersions : "").trim(),
            encodeLocalCache: Boolean(rawGameConfig.encodeLocalCache !== undefined && rawGameConfig.encodeLocalCache !== null && rawGameConfig.encodeLocalCache),
            userAgreement: String(rawGameConfig.userAgreement !== undefined && rawGameConfig.userAgreement !== null ? rawGameConfig.userAgreement : "").trim(),
            gameConfigCDNPath: String(rawGameConfig.gameConfigCDNPath !== undefined && rawGameConfig.gameConfigCDNPath !== null ? rawGameConfig.gameConfigCDNPath : "").trim(),
            configSource: String(rawGameConfig.configSource !== undefined && rawGameConfig.configSource !== null ? rawGameConfig.configSource : "").trim(),
            eventUrl: String(rawGameConfig.eventUrl !== undefined && rawGameConfig.eventUrl !== null ? rawGameConfig.eventUrl : "").trim(),
            eventToken: String(rawGameConfig.eventToken !== undefined && rawGameConfig.eventToken !== null ? rawGameConfig.eventToken : "").trim(),
            ipu: Number(rawGameConfig.ipu !== undefined && rawGameConfig.ipu !== null ? rawGameConfig.ipu : 0),
            ecpm: Number(rawGameConfig.ecpm !== undefined && rawGameConfig.ecpm !== null ? rawGameConfig.ecpm : 0),
            loginActivity: String(rawGameConfig.loginActivity !== undefined && rawGameConfig.loginActivity !== null ? rawGameConfig.loginActivity : "").trim(),
            regularActivity: String(rawGameConfig.regularActivity !== undefined && rawGameConfig.regularActivity !== null ? rawGameConfig.regularActivity : "").trim(),
            gravityAccessToken: String(rawGameConfig.gravityAccessToken !== undefined && rawGameConfig.gravityAccessToken !== null ? rawGameConfig.gravityAccessToken : "").trim(),
            gameClubLink: String(rawGameConfig.gameClubLink !== undefined && rawGameConfig.gameClubLink !== null ? rawGameConfig.gameClubLink : "").trim()
        };

        const rawGameInfo = data.gameInfo;
        this.gameInfo = {
            appId: String(rawGameInfo.appId !== undefined && rawGameInfo.appId !== null ? rawGameInfo.appId : "").trim(),
            channel: String(rawGameInfo.channel !== undefined && rawGameInfo.channel !== null ? rawGameInfo.channel : "").trim(),
            configUpdatedAt: Number(rawGameInfo.configUpdatedAt !== undefined && rawGameInfo.configUpdatedAt !== null ? rawGameInfo.configUpdatedAt : 0),
            configVersion: Number(rawGameInfo.configVersion !== undefined && rawGameInfo.configVersion !== null ? rawGameInfo.configVersion : 0),
            gameAppkey: String(rawGameInfo.gameAppkey !== undefined && rawGameInfo.gameAppkey !== null ? rawGameInfo.gameAppkey : "").trim(),
            id: Number(rawGameInfo.id !== undefined && rawGameInfo.id !== null ? rawGameInfo.id : 0),
            name: String(rawGameInfo.name !== undefined && rawGameInfo.name !== null ? rawGameInfo.name : "").trim(),
            packName: String(rawGameInfo.packName !== undefined && rawGameInfo.packName !== null ? rawGameInfo.packName : "").trim()
        };

        const rawShare = data.share;
        this.shareConfig = {
            title: String(rawShare.title !== undefined && rawShare.title !== null ? rawShare.title : "").trim(),
            imageUrl: String(rawShare.imageUrl !== undefined && rawShare.imageUrl !== null ? rawShare.imageUrl : "").trim()
        };

        const rawRecommendGameList = data.recommendGameList;
        this.recommendGameList = [];
        for (const item of rawRecommendGameList) {
            const recommendGame: RecommendGame = {
                appId: String(item.appId !== undefined && item.appId !== null ? item.appId : "").trim(),
                gameIcon: String(item.gameIcon !== undefined && item.gameIcon !== null ? item.gameIcon : "").trim(),
                gameName: String(item.gameName !== undefined && item.gameName !== null ? item.gameName : "").trim(),
                path: String(item.path !== undefined && item.path !== null ? item.path : "").trim()
            };
            this.recommendGameList.push(recommendGame);
        }

        if (this.gameConfig.nativeIconRefreshTime <= 0) {
            this.gameConfig.nativeIconRefreshTime = 5;
        }
        if (this.gameConfig.nativeImageRefreshTime <= 0) {
            this.gameConfig.nativeImageRefreshTime = 5;
        }
        if (this.gameConfig.systemBannerRefreshTime <= 30) {
            this.gameConfig.systemBannerRefreshTime = 30;
        }
        if (this.gameConfig.insertVideoInterval < 120) {
            this.gameConfig.insertVideoInterval = 120;
        }
    }

    static defaultParameters(): void {
        this.gameConfig = {
            appBoxId: "",
            appboxSwitch: false,
            appKey: "",
            appSecret: "",
            authenticationSwitch: true,
            closeAdButtonDelayTime: 0,
            blockId: "",
            blockSwitch: false,
            cpId: "",
            doubleRewardSwitch: false,
            floatIcon: "",
            gameBannerId: "",
            gameDrawerId: "",
            gameDrawerSwitch: false,
            gamePortalId: "",
            gameSplashInterval: 0,
            gameSplashSwitch: false,
            insertVideoId: "",
            insertVideoInterval: 120,
            insertVideoSwitch: false,
            logSwitch: false,
            nativeClickBtnSwitch: false,
            nativeCountLimit: true,
            nativeIconDelayTime: 0,
            nativeIconErrInterval: 0,
            nativeIconErrNumber: 0,
            nativeIconErrProbability: 0,
            nativeIconId: "",
            nativeIconRefreshTime: 0,
            nativeIconSwitch: false,
            nativeImageDelayTime: 0,
            nativeImageErrInterval: 0,
            nativeImageErrNumber: 0,
            nativeImageErrProbability: 0,
            nativeImageId: "",
            nativeImageRefreshTime: 0,
            nativeImageSwitch: false,
            nativeInsertCloseBtnDelayTime: 0,
            nativeInsertDelayTime: 0,
            nativeInsertErrInterval: 0,
            nativeInsertErrNumber: 0,
            nativeInsertErrProbability: 0,
            nativeInsertId: "",
            nativeInsertIntervalTime: 0,
            nativeInsertProbability: 0,
            nativeInsertStyle: "",
            nativeInsertSwitch: false,
            nativeTemplateId: "",
            nativeTemplateSwitch: false,
            privacyPolicyCompany: "", //https://szdywlkj.com/policy/dyPolicy.html
            privacyPolicySwitch: false,
            pushGameSwitch: false,
            recommendListProbability: 0,
            rewardedVideoErrInterval: 0,
            rewardedVideoErrNumber: 0,
            rewardedVideoErrProbability: 0,
            rewardedVideoId: "",
            rewardedvideoInterval: 0,
            rewardedVideoSwitch: true,
            showVideoSwitch: true,
            splashAdSourceId: "",
            splashAppId: "",
            splashDesc: "",
            splashId: "",
            splashName: "",
            splashSlotId: "",
            startNoNativeAdTime: 0,
            systemBannerBottomDistance: 0,
            systemBannerDelayTime: 0,
            systemBannerId: "",
            systemBannerRefreshTime: 0,
            systemBannerSwitch: false,
            systemInsertDelayTime: 0,
            systemInsertId: "",
            systemInsertIntervalTime: 60,
            systemInsertProbability: 1,
            systemInsertSwitch: true,
            systemInsertToNativeInsertNumber: 0,
            umAppKey: "",
            videoPlayConfirmProbability: true,
            mysticallyErrNumber: 0,
            mysticallyErrInterval: 0,
            mysticallyErrProbability: 0,
            mysticallyCloseDelayTime: 0,
            addDesktopIconSwith: false,
            startNoAdTime: 0,
            payDebug: false,
            isCheckedPolicy: false,
            uploadDataInterval: 120,
            contactUs: "",
            chatCD: 0,
            chatSwitch: true,
            customerServiceSwitch: true,
            chatServerIP: "im.szdywlkj.com/ws",
            chatRoomMsgNum: 99,
            closeIosPayVersions: "",
            testWxIosJsApiPaySwitch: false,
            qqqun: "",
            closeSkipVideoVersions: "",
            closeGuestVersions: "",
            encodeLocalCache: false,
            userAgreement: "",
            gameConfigCDNPath: "",
            configSource: "",
            eventToken: "",
            eventUrl: "",
            ipu: 0,
            ecpm: 0,
            loginActivity: "",
            regularActivity: "",
            gravityAccessToken: "",
            gameClubLink: "",
            qrCodeUrl: "",
            versions: ""
        };

        this.gameInfo = {
            appId: "",
            channel: "googlePlayApp",
            configUpdatedAt: 0,
            configVersion: 0,
            gameAppkey: "", //4ae7eb0e4ea5b814e0e55375661b29e8
            id: 0,
            name: "Arrows",
            packName: "" //com.qdd.arrowstrike.gp
        };

        this.shareConfig = {
            title: "",
            imageUrl: ""
        };

        if (this.gameConfig.nativeIconRefreshTime <= 0) {
            this.gameConfig.nativeIconRefreshTime = 5;
        }
        if (this.gameConfig.nativeImageRefreshTime <= 0) {
            this.gameConfig.nativeImageRefreshTime = 5;
        }
        if (this.gameConfig.systemBannerRefreshTime <= 30) {
            this.gameConfig.systemBannerRefreshTime = 30;
        }
        if (this.gameConfig.insertVideoInterval < 120) {
            this.gameConfig.insertVideoInterval = 120;
        }
    }
}