import { cclegacy, Button } from "cc";
import { PlatformEnum } from "./PlatformEnum";
import { AbstractPlatformSDK } from "./SDK/AbstractPlatformSDK";
import { LogUtils } from "./Utils/LogUtils";
import { LocalConfig } from "./LocalConfig";
import { PlatformUtils } from "./Utils/PlatformUtils";
import { OPPOSDK } from "./SDK/OppoSDK";
import { DefaultNativeTemplate } from "./DefaultNativeTemplate";
import { HuaWeiSDK } from "./SDK/HuaWeiSDK";
import { VivoSDK } from "./SDK/VivoSDK";
import { DevSDK } from "./SDK/DevSDK";
import { DebugSDK } from "./SDK/DebugSDK";
import { ConfigHelper } from "./ConfigHelper";
import { NativeSDK } from "./SDK/NativeSDK";
import { QqSDK } from "./SDK/QqSDK";
import TouTiaoSDK from "./SDK/TouTiaoSDK";
import { WeChatSDK } from "./SDK/WeChatSDK";
import { AdControlUtils } from "./Utils/AdControlUtils";
import { QuickFileUtils } from "./Utils/QuickFileUtils";
import { NumberUtls } from "./NumberUtls";
import { NativeCocosSDK } from "./SDK/NativeCocosSDK";
import { EngineUtils } from "./Utils/EngineUtils";
import { EventHelper } from "./Event/EventHelper";
import { FourThreeNineNine } from "./SDK/FourThreeNineNine";
import { exchangeCode } from "./ExchangeApi";
import { FourThreeNineNineGameBox } from "./SDK/FourThreeNineNineGameBox";
import { KuaiShouSDK } from "./SDK/KuaiShouSDK";
import { QGameSDK } from "./SDK/QGameSDK";
import { HonorSDK } from "./SDK/HonorSDK";
import { FacebookSDK } from "./SDK/FacebookSDK";

export class QddSDKHelper extends AbstractPlatformSDK {
    private static _instance: QddSDKHelper;
    private static _platformSDKImpl: AbstractPlatformSDK;
    public static packingPlatform: string;
    public static ossConfig: any;
    public static backupConfig: string = "";
    public static configVersion: string;
    public static assetsVersion: string;
    public static gameVersion: string;

    public QddSDKVersion: string = "12.0.5";

    public static get instance(): QddSDKHelper {
        return this.getInstance();
    }

    public static getInstance(): QddSDKHelper {
        if (this._instance === undefined) {
            this._instance = new QddSDKHelper();
        }
        return this._instance;
    }

    public init(): void {
        this.showSDKVersion();
        this.getPackingPlatform();
        const envValue = ConfigHelper.getEnvValue();
        QddSDKHelper.configVersion = envValue.configVersion;
        QddSDKHelper.assetsVersion = envValue.assetsVersion;
        QddSDKHelper.gameVersion = window.gameVersion;

        LogUtils.info("配置版本号: ", QddSDKHelper.configVersion);
        LogUtils.info("资源版本号: ", QddSDKHelper.assetsVersion);
        LogUtils.info("游戏版本号: ", QddSDKHelper.gameVersion);

        if (PlatformUtils.isAndroid() || PlatformUtils.isIOS()) {
            QddSDKHelper._platformSDKImpl = EngineUtils.isCocos() ? NativeCocosSDK.getInstance() : NativeSDK.getInstance();
        } else {
            switch (QddSDKHelper.packingPlatform) {
                case PlatformEnum.Debug:
                    QddSDKHelper._platformSDKImpl = DebugSDK.getInstance();
                    break;
                case PlatformEnum.Dev:
                    QddSDKHelper._platformSDKImpl = DevSDK.getInstance();
                    break;
                case PlatformEnum.Oppo:
                    QddSDKHelper._platformSDKImpl = OPPOSDK.getInstance();
                    break;
                case PlatformEnum.Vivo:
                    QddSDKHelper._platformSDKImpl = VivoSDK.getInstance();
                    break;
                case PlatformEnum.Huawei:
                    QddSDKHelper._platformSDKImpl = HuaWeiSDK.getInstance();
                    break;
                case PlatformEnum.FourThreeNineNine:
                    QddSDKHelper._platformSDKImpl = FourThreeNineNine.getInstance();
                    break;
                case PlatformEnum.FourThreeNineNineGameBox:
                    QddSDKHelper._platformSDKImpl = FourThreeNineNineGameBox.getInstance();
                    break;
                case PlatformEnum.Tt:
                    QddSDKHelper._platformSDKImpl = TouTiaoSDK.getInstance();
                    break;
                case PlatformEnum.Ks:
                    QddSDKHelper._platformSDKImpl = KuaiShouSDK.getInstance();
                    break;
                case PlatformEnum.Qq:
                    QddSDKHelper._platformSDKImpl = QqSDK.getInstance();
                    break;
                case PlatformEnum.Wx:
                    QddSDKHelper._platformSDKImpl = WeChatSDK.getInstance();
                    break;
                case PlatformEnum.QQGameH5:
                    QddSDKHelper._platformSDKImpl = QGameSDK.getInstance();
                    break;
                case PlatformEnum.Honor:
                    QddSDKHelper._platformSDKImpl = HonorSDK.getInstance();
                    break;
                case PlatformEnum.FacebookMiniGame:
                    QddSDKHelper._platformSDKImpl = FacebookSDK.getInstance();
                    break;
                default:
                    QddSDKHelper._platformSDKImpl = DebugSDK.getInstance();
            }
        }

        const configList = envValue.configList;
        const backupList = envValue.backupList;
        let channelName = QddSDKHelper.packingPlatform;

        if ("wx" === QddSDKHelper.packingPlatform) {
            channelName = "wx_" + (window.gameTypeName || "main");
        }

        for (const configItem of configList) {
            if (configItem.channel === channelName) {
                QddSDKHelper.ossConfig = configItem;
            }
        }

        for (const backupItem of backupList) {
            if (backupItem.channel === QddSDKHelper.packingPlatform) {
                QddSDKHelper.backupConfig = backupItem.backupConfig;
                ConfigHelper.analyticParameters(JSON.stringify(QddSDKHelper.backupConfig));
            }
        }

        EventHelper.getInstance().initEventHelper(QddSDKHelper.ossConfig.gameAppkey);
    }

    public initAdService(): void {
        // Empty implementation
    }

    public initQddSDKHelper(callback?: Function): void {
        this.init();
        PlatformUtils.isHuaWeiPlatform();
        LogUtils.info("----------------------------开始初始化----------------------------------");
        LogUtils.info("初始化平台: " + QddSDKHelper.packingPlatform, "初始化包名: " + QddSDKHelper.ossConfig.packageName);

        ConfigHelper.getOnLineConfig(QddSDKHelper.ossConfig.ossUrl, () => {
            //try {
                if (!PlatformUtils.isFourThreeNineNinePlatform() && !PlatformUtils.isIOS()) {
                    DefaultNativeTemplate.loaderImgData();
                }
                AdControlUtils.init();
                QddSDKHelper._platformSDKImpl.initAdService();
                LogUtils.info("----------------------------初始化成功----------------------------------");
                if (callback) {
                    callback();
                }
                this.reportMonitor();
                if (!PlatformUtils.isAndroid() || 
                    PlatformUtils.isOppoNative() || 
                    PlatformUtils.isVivoNative() || 
                    PlatformUtils.isXiaoMiNative() || 
                    PlatformUtils.isHuaWeiNative() || 
                    PlatformUtils.isJuLiangYinQingNative() || 
                    PlatformUtils.isBaiduApp() || 
                    PlatformUtils.isJuliangXingwan()) {
                    // Do nothing
                } else {
                    this.showAuthenticationView();
                }
            //} catch (error) {
            //    LogUtils.error("----------------------------初始化失败----------------------------------");
            //    LogUtils.error("error: ", error);
            //}
        });
    }

    public getOssConfig(): any {
        return QddSDKHelper.ossConfig;
    }

    public showSDKVersion(): void {
        LogUtils.info("=============================================================================================");
        LogUtils.info("sdk版本号: ", this.QddSDKVersion);
        LogUtils.info("=============================================================================================");
    }

    public getPackingPlatform(): string {
        if (!QddSDKHelper.packingPlatform) {
            QddSDKHelper.packingPlatform = LocalConfig.PACKING_PLATFORM === PlatformEnum.Auto ? 
                PlatformUtils.getPlatform() : 
                LocalConfig.PACKING_PLATFORM;
        }
        return QddSDKHelper.packingPlatform;
    }

    public queryExchangeCode(exchangeCodeValue: string, uuid: string): Promise<any> {
        return exchangeCode({
            header: {
                uuid: uuid,
                gameAppkey: QddSDKHelper.ossConfig.gameAppkey
            },
            params: {
                exchangeCode: exchangeCodeValue
            }
        });
    }

    public showMoreGames(params: { buttonNode: any; adLocation: string; marginTop?: number; image?: string }): void {
        LogUtils.info("showMoreGames ====");
        if (params.buttonNode) {
            const buttonNode = params.buttonNode;
            const adLocation = params.adLocation;
            const marginTop = params.marginTop !== undefined ? params.marginTop : buttonNode.height;
            const image = params.image !== undefined ? params.image : "https://www.quduoduodata.top/ossfile/qddSDKRes/btnMore.png";

            buttonNode.active = ConfigHelper.getGameConfig().pushGameSwitch;
            buttonNode.visible = ConfigHelper.getGameConfig().pushGameSwitch;

            if (PlatformUtils.isVivoPlatform()) {
                buttonNode.active = false;
                buttonNode.visible = false;
                this.showGameBoxPortalAd({
                    adLocation: adLocation,
                    marginTop: marginTop,
                    image: image
                });
                return;
            }

            if (EngineUtils.isCocos()) {
                if (!buttonNode.getComponent(Button)) {
                    buttonNode.addComponent(Button);
                }
                buttonNode.on("click", () => {
                    if (PlatformUtils.isQQPlatform()) {
                        this.showAppBox({ adLocation: adLocation });
                    }
                    if (PlatformUtils.isWxPlatform()) {
                        this.showRecommendList({ adLocation: adLocation });
                    }
                    if (PlatformUtils.isOppoPlatform()) {
                        this.showGameBoxPortalAd({ adLocation: adLocation });
                    }
                    if (PlatformUtils.isOppoNative()) {
                        this.jumpLeisureSubject({ adLocation: adLocation });
                    }
                    if (PlatformUtils.isDebug()) {
                        this.showRecommendList({ adLocation: adLocation });
                    }
                });
            }
        }
    }

    public showVideoAd(params: any = {}): void {
        if (ConfigHelper.getGameConfig().rewardedVideoSwitch) {
            QddSDKHelper._platformSDKImpl.showVideoAd(params);
        }
    }

    public showBannerAd(params: any = {}): void {
        if (AdControlUtils.isShowBanner() && ConfigHelper.getGameConfig().systemBannerSwitch) {
            QddSDKHelper._platformSDKImpl.showBannerAd(params);
        }
    }

    public hideBannerAd(): void {
        QddSDKHelper._platformSDKImpl.hideBannerAd();
    }

    public vibrateShort(): void {
        QddSDKHelper._platformSDKImpl.vibrateShort();
    }

    public vibrateLong(): void {
        QddSDKHelper._platformSDKImpl.vibrateLong();
    }

    public showToast(message: string): void {
        QddSDKHelper._platformSDKImpl.showToast(message);
    }

    public showNativeImageAd(params: any): void {
        DefaultNativeTemplate.setNodeDefaultActiveClose(params);
        if (ConfigHelper.getGameConfig().nativeImageSwitch) {
            QddSDKHelper._platformSDKImpl.showNativeImageAd(params);
        }
    }

    public hideNativeImage(): void {
        QddSDKHelper._platformSDKImpl.hideNativeImage();
    }

    public showNativeIconAd(params: any): void {
        DefaultNativeTemplate.setNodeDefaultActiveClose(params);
        if (ConfigHelper.getGameConfig().nativeIconSwitch) {
            QddSDKHelper._platformSDKImpl.showNativeIconAd(params);
        }
    }

    public hideNativeIconAd(): void {
        QddSDKHelper._platformSDKImpl.hideNativeIconAd();
    }

    public addDesktopIcon2(params: { buttonNode: any; callbackFunction?: Function }): void {
        LogUtils.info("addDesktopIcon2 ====");
        const buttonNode = params.buttonNode;
        if (buttonNode) {
            buttonNode.active = false;
            buttonNode.visible = false;

            if (ConfigHelper.getGameConfig().addDesktopIconSwith) {
                this.hasDesktopIcon({
                    callbackFunction: (hasIcon: boolean) => {
                        if (!hasIcon) {
                            buttonNode.active = true;
                            buttonNode.visible = true;
                        }
                    }
                });
            }

            if (EngineUtils.isCocos()) {
                if (!buttonNode.getComponent(Button)) {
                    buttonNode.addComponent(Button);
                }
                buttonNode.on("click", () => {
                    this.addDesktopIcon({
                        callbackFunction: params.callbackFunction
                    });
                });
            }
        }
    }

    public addDesktopIcon(params: any = {}): void {
        QddSDKHelper._platformSDKImpl.addDesktopIcon(params);
    }

    public hasDesktopIcon(params: any = {}): void {
        QddSDKHelper._platformSDKImpl.hasDesktopIcon(params);
    }

    public getNativeAdImageData(): any {
        return QddSDKHelper._platformSDKImpl.getNativeAdImageData();
    }

    public getNativeAdIconData(): any {
        return QddSDKHelper._platformSDKImpl.getNativeAdIconData();
    }

    public reportNativeAdImageShow(params: any): void {
        QddSDKHelper._platformSDKImpl.reportNativeAdImageShow(params);
    }

    public reportNativeAdImageClick(params: any): void {
        QddSDKHelper._platformSDKImpl.reportNativeAdImageClick(params);
    }

    public reportNativeAdIconShow(params: any): void {
        QddSDKHelper._platformSDKImpl.reportNativeAdIconShow(params);
    }

    public reportNativeAdIconClick(params: any): void {
        QddSDKHelper._platformSDKImpl.reportNativeAdIconClick(params);
    }

    public showBannerOrNativeImageAd(params: any): void {
        DefaultNativeTemplate.setNodeDefaultActiveClose(params);

        if (PlatformUtils.isOppoPlatform() || 
            (PlatformUtils.isVivoPlatform() && ConfigHelper.getGameConfig().nativeImageId) || 
            PlatformUtils.isOppoNative() || 
            PlatformUtils.isDebug()) {
            if (params) {
                const originalCallback = params.resultCallback;
                params.resultCallback = (result: any) => {
                    if (originalCallback) {
                        originalCallback(result, true);
                    }
                };
            }
            this.showNativeImageAd(params);
        } else if (params) {
            if (params.resultCallback) {
                const originalCallback = params.resultCallback;
                params.resultCallback = (result: any) => {
                    if (originalCallback) {
                        originalCallback(result, false);
                    }
                };
            }
            this.showBannerAd({
                resultCallback: params.resultCallback,
                closeCallback: params.closeCallback,
                adLocation: params.adLocation
            });
        } else {
            this.showBannerAd();
        }
    }

    public hideBannerOrNativeImageAd(): void {
        this.hideBannerAd();
        this.hideNativeImage();
    }

    public showIntertAd(params: any = {}): void {
        let probability = 100 * ConfigHelper.getGameConfig().systemInsertProbability;
        if (params.probability) {
            probability = params.probability;
        }

        if (ConfigHelper.getGameConfig().systemInsertSwitch && NumberUtls.luckDraw(probability)) {
            QddSDKHelper._platformSDKImpl.showIntertAd(params);
        } else if (params.resultCallback) {
            params.resultCallback(false);
        }
    }

    public reportMonitor(): void {
        QddSDKHelper._platformSDKImpl.reportMonitor();
    }

    public isShowGameBoxBannerAd(): boolean {
        if (PlatformUtils.isOppoPlatform() && qg.getSystemInfoSync().platformVersionCode <= 1076) {
            LogUtils.info("快应用平台版本号低于1076，暂不支持互推盒子相关 API");
            return false;
        }
        return ConfigHelper.getGameConfig().pushGameSwitch;
    }

    public showGameBoxBannerAd(params: any = {}): void {
        if (ConfigHelper.getGameConfig().pushGameSwitch) {
            QddSDKHelper._platformSDKImpl.showGameBoxBannerAd(params);
        }
    }

    public hideGameBoxBannerAd(): void {
        QddSDKHelper._platformSDKImpl.hideGameBoxBannerAd();
    }

    public isShowGameBoxPortalAd(): boolean {
        if (PlatformUtils.isOppoPlatform() && qg.getSystemInfoSync().platformVersionCode <= 1076) {
            LogUtils.info("快应用平台版本号低于1076，暂不支持互推盒子相关 API");
            return false;
        }
        return ConfigHelper.getGameConfig().pushGameSwitch;
    }

    public showGameBoxPortalAd(params: any = {}): void {
        if (ConfigHelper.getGameConfig().pushGameSwitch) {
            QddSDKHelper._platformSDKImpl.showGameBoxPortalAd(params);
        }
    }

    public hideGameBoxPortalAd(): void {
        QddSDKHelper._platformSDKImpl.hideGameBoxPortalAd();
    }

    public showGameDrawerAd(params: any = {}): void {
        if (ConfigHelper.getGameConfig().pushGameSwitch) {
            QddSDKHelper._platformSDKImpl.showGameDrawerAd(params);
        }
    }

    public hideGameDrawerAd(): void {
        QddSDKHelper._platformSDKImpl.hideGameDrawerAd();
    }

    public showPrivacyAgreement(successCallback?: Function, failCallback?: Function): void {
        if (PlatformUtils.isNative()) {
            if (successCallback) {
                successCallback(true);
            }
        } else if (ConfigHelper.getGameConfig().privacyPolicySwitch) {
            LogUtils.info("showPrivacyAgreement ==========");
            DefaultNativeTemplate.createPrivacyAgreement(successCallback, failCallback);
        } else if (successCallback) {
            successCallback(true);
        }
    }

    public showPrivacyPolicyDetails(params: any): void {
        if (PlatformUtils.isNative()) {
            QddSDKHelper._platformSDKImpl.showAppPolicy();
        } else {
            DefaultNativeTemplate.showPrivacyPolicyDetails(params);
        }
    }

    public showUserPolicyDetails(params: any): void {
        DefaultNativeTemplate.showUserPolicyDetails(params);
    }

    public showAppBox(params: any = {}): void {
        if (ConfigHelper.getGameConfig().appboxSwitch) {
            QddSDKHelper._platformSDKImpl.showAppBox(params);
        }
    }

    public showBlockAd(params: any): void {
        if (ConfigHelper.getGameConfig().blockSwitch) {
            QddSDKHelper._platformSDKImpl.showBlockAd(params);
        }
    }

    public hideBlockAd(): void {
        QddSDKHelper._platformSDKImpl.hideBlockAd();
    }

    public showCustomAd(params: any): void {
        if (ConfigHelper.getGameConfig().nativeTemplateSwitch) {
            QddSDKHelper._platformSDKImpl.showCustomAd(params);
        }
    }

    public hideCustomAd(): void {
        QddSDKHelper._platformSDKImpl.hideCustomAd();
    }

    public shareAppMessage(params: any = {}): void {
        QddSDKHelper._platformSDKImpl.shareAppMessage(params);
    }

    public shareImage(params: any = {}): void {
        QddSDKHelper._platformSDKImpl.shareImage(params);
    }

    public toMiniGame(params: any): void {
        QddSDKHelper._platformSDKImpl.toMiniGame(params);
    }

    public showRecommendList(params: any = {}): void {
        let probability = 100 * ConfigHelper.getGameConfig().recommendListProbability;
        if (params.probability) {
            probability = params.probability;
        }
        probability = 100;

        if (NumberUtls.luckDraw(probability)) {
            QddSDKHelper._platformSDKImpl.showRecommendList(params);
        } else if (params.resultCallback) {
            params.resultCallback(false);
        }
    }

    public showRecommendIcon(params: any = { top: 0, left: 0, refreshTime: 5 }): void {
        QddSDKHelper._platformSDKImpl.showRecommendIcon(params);
    }

    public shareGameRecorder(params: any = {}): void {
        QddSDKHelper._platformSDKImpl.shareGameRecorder(params);
    }

    public gameRecorderStart(params: any): void {
        QddSDKHelper._platformSDKImpl.gameRecorderStart(params);
    }

    public gameRecorderPause(): void {
        QddSDKHelper._platformSDKImpl.gameRecorderPause();
    }

    public gameRecorderResume(): void {
        QddSDKHelper._platformSDKImpl.gameRecorderResume();
    }

    public gameRecorderStop(params: any): void {
        QddSDKHelper._platformSDKImpl.gameRecorderStop(params);
    }

    public getAppName(): string {
        return QddSDKHelper._platformSDKImpl.getAppName();
    }

    public showInsertVideoAd(params: any = {}): void {
        if (ConfigHelper.getGameConfig().insertVideoSwitch) {
            QddSDKHelper._platformSDKImpl.showInsertVideoAd(params);
        }
    }

    public jumpLeisureSubject(params: any = {}): void {
        QddSDKHelper._platformSDKImpl.jumpLeisureSubject(params);
    }

    public showGameDoingSplash(): void {
        if (ConfigHelper.getGameConfig().gameSplashSwitch) {
            QddSDKHelper._platformSDKImpl.showGameDoingSplash();
        }
    }

    public login(params: any = {}): void {
        QddSDKHelper._platformSDKImpl.login(params);
    }

    public loginQQ(params: any = {}): void {
        if (this.isAndroid() || this.isIOS()) {
            QddSDKHelper._platformSDKImpl.loginQQ(params);
        }
    }

    public isWxAppInstalled(): boolean {
        if (!this.isIOS()) {
            return true;
        }
        return QddSDKHelper._platformSDKImpl.isWxAppInstalled();
    }

    public loginWX(params: any = {}): void {
        if (this.isAndroid() || this.isIOS()) {
            QddSDKHelper._platformSDKImpl.loginWX(params);
        }
    }

    public loginApple(params: any = {}): void {
        if (this.isIOS()) {
            QddSDKHelper._platformSDKImpl.loginApple(params);
        }
    }

    public loginTapTap(params: any = {}): void {
        if (this.isTapTapNative()) {
            QddSDKHelper._platformSDKImpl.loginTapTap(params);
        }
    }

    public logout(): void {
        QddSDKHelper._platformSDKImpl.logout();
    }

    public setGameRoleInfo(roleInfo: any, callback: Function): void {
        QddSDKHelper._platformSDKImpl.setGameRoleInfo(roleInfo, callback);
    }

    public setHYGameRoleInfo(roleInfo: any, callback: Function): void {
        QddSDKHelper._platformSDKImpl.setHYGameRoleInfo(roleInfo, callback);
    }

    public setExtData(key: string, value: string, callback: Function, extraData: any): void {
        QddSDKHelper._platformSDKImpl.setExtData(key, value, callback, extraData);
    }

    public exitApp(): void {
        QddSDKHelper._platformSDKImpl.exitApp();
    }

    public copyString(text: string, callback: Function): void {
        QddSDKHelper._platformSDKImpl.copyString(text, callback);
    }

    public registerEvent(): void {
        QddSDKHelper._platformSDKImpl.registerEvent();
    }

    public purchaseEvent(eventName: string, amount: number, currency: string, itemName: string, itemCount: number, callback: Function, extraData: any): void {
        QddSDKHelper._platformSDKImpl.purchaseEvent(eventName, amount, currency, itemName, itemCount, callback, extraData);
    }

    public loginWithAccount(accountInfo: any): void {
        QddSDKHelper._platformSDKImpl.loginWithAccount(accountInfo);
    }

    public startPayEvent(orderId: string, amount: number, callback: Function): void {
        QddSDKHelper._platformSDKImpl.startPayEvent(orderId, amount, callback);
    }

    public onCharge(orderId: string, amount: number, currency: string, callback: Function): void {
        if (PlatformUtils.isTapTapNative()) {
            QddSDKHelper._platformSDKImpl.onCharge(orderId, amount, currency, callback);
        }
    }

    public setUserID(userId: string): void {
        if (PlatformUtils.isTapTapNative()) {
            QddSDKHelper._platformSDKImpl.setUserID(userId);
        }
    }

    public openUrl(url: string): void {
        QddSDKHelper._platformSDKImpl.openUrl(url);
    }

    public initMySDK(): void {
        QddSDKHelper._platformSDKImpl.initMySDK();
    }

    public openAppStoreReview(): boolean {
        return QddSDKHelper._platformSDKImpl.openAppStoreReview();
    }

    public removeAccount(): void {
        QddSDKHelper._platformSDKImpl.removeAccount();
    }

    public getNetworkType(callback: Function): void {
        QddSDKHelper._platformSDKImpl.getNetworkType(callback);
    }

    public getGameVersion(): string {
        if (this.isDebug()) {
            return "1.0.0";
        }
        return QddSDKHelper._platformSDKImpl.getGameVersion();
    }

    public textCheck(text: string, callback: Function): void {
        if (this.isDebug()) {
            callback(false);
        } else {
            QddSDKHelper._platformSDKImpl.textCheck(text, callback);
        }
    }

    public isXiaoMiPlatform(): boolean {
        return PlatformUtils.isXiaoMiPlatform();
    }

    public isHuaWeiPlatform(): boolean {
        return PlatformUtils.isHuaWeiPlatform();
    }

    public isHonorPlatform(): boolean {
        return PlatformUtils.isHonorPlatform();
    }

    public isOppoPlatform(): boolean {
        return PlatformUtils.isOppoPlatform();
    }

    public isVivoPlatform(): boolean {
        return PlatformUtils.isVivoPlatform();
    }

    public isQQPlatform(): boolean {
        return PlatformUtils.isQQPlatform();
    }

    public isFourThreeNineNineGameBoxPlatform(): boolean {
        return PlatformUtils.isFourThreeNineNineGameBoxPlatform();
    }

    public isFourThreeNineNinePlatform(): boolean {
        return PlatformUtils.isFourThreeNineNinePlatform();
    }

    public isWxPlatform(): boolean {
        return PlatformUtils.isWxPlatform();
    }

    public isMarWxPlatform(): boolean {
        return PlatformUtils.isMarWxPlatform();
    }

    public isMeituanPlatform(): boolean {
        return PlatformUtils.isMeituanPlatform();
    }

    public isTtPlatform(): boolean {
        return PlatformUtils.isTtPlatform();
    }

    public isKsPlatform(): boolean {
        return PlatformUtils.isKsPlatform();
    }

    public isQuickGame(): boolean {
        return PlatformUtils.isQuickGame();
    }

    public isNative(): boolean {
        return PlatformUtils.isNative();
    }

    public isAndroid(): boolean {
        return PlatformUtils.isAndroid();
    }

    public isIOS(): boolean {
        return PlatformUtils.isIOS();
    }

    public isDebug(): boolean {
        return PlatformUtils.isDebug();
    }

    public isOppoNative(): boolean {
        return PlatformUtils.isOppoNative();
    }

    public isHuaWeiNative(): boolean {
        return PlatformUtils.isHuaWeiNative();
    }

    public isVivoNative(): boolean {
        return PlatformUtils.isVivoNative();
    }

    public isXiaoMiNative(): boolean {
        return PlatformUtils.isXiaoMiNative();
    }

    public isGooglePlayNative(): boolean {
        return PlatformUtils.isGooglePlayNative();
    }

    public isHuaWeiAbroadNative(): boolean {
        return PlatformUtils.isHuaWeiAbroadNative();
    }

    public isFourThreeNineNineNative(): boolean {
        return PlatformUtils.isFourThreeNineNineNative();
    }

    public isTapTapNative(): boolean {
        return PlatformUtils.isTapTapNative();
    }

    public isTwoThreeThreeNative(): boolean {
        return PlatformUtils.isTwoThreeThreeNative();
    }

    public isHaoYouKuaiBaoNative(): boolean {
        return PlatformUtils.isHaoYouKuaiBaoNative();
    }

    public isPKNOWNative(): boolean {
        return PlatformUtils.isPKNOWNative();
    }

    public isMoMoYuNative(): boolean {
        return PlatformUtils.isMoMoYuNative();
    }

    public isJuLiangYinQingNative(): boolean {
        return PlatformUtils.isJuLiangYinQingNative();
    }

    public isYingYongBaoNative(): boolean {
        return PlatformUtils.isYingYongBaoNative();
    }

    public isDouYinNative(): boolean {
        return PlatformUtils.isDouYinNative();
    }

    public isNineGameNative(): boolean {
        return PlatformUtils.isNineGameNative();
    }

    public isOhayooNative(): boolean {
        return PlatformUtils.isOhayooNative();
    }

    public isQuickApp(): boolean {
        return PlatformUtils.isQuickApp();
    }

    public isBaiduApp(): boolean {
        return PlatformUtils.isBaiduApp();
    }

    public isM233mlApp(): boolean {
        return PlatformUtils.isM233mlApp();
    }

    public isJuliangXingwan(): boolean {
        return PlatformUtils.isJuliangXingwan();
    }

    public isHuiyaoApp(): boolean {
        return PlatformUtils.isHuiyaoApp();
    }

    public isJileApp(): boolean {
        return PlatformUtils.isJileApp();
    }

    public isQQGameH5(): boolean {
        return PlatformUtils.isQQGameH5();
    }

    public isFacebookMiniGame(): boolean {
        return PlatformUtils.isFacebookMiniGame();
    }

    public autoClickNativeAdImage(params: any): void {
        QddSDKHelper._platformSDKImpl.autoClickNativeAdImage(params);
    }

    public autoClickNativeAdIcon(params: any): void {
        QddSDKHelper._platformSDKImpl.autoClickNativeAdIcon(params);
    }

    public autoClickVideo(params: any): void {
        QddSDKHelper._platformSDKImpl.autoClickVideo(params);
    }

    public getPlatformVersionCode(): number {
        return QddSDKHelper._platformSDKImpl.getPlatformVersionCode();
    }

    public platformVersionSupport(versionCode: number): boolean {
        return QddSDKHelper._platformSDKImpl.platformVersionSupport(versionCode);
    }

    public getSystemInfo(): any {
        return QddSDKHelper._platformSDKImpl.getSystemInfo();
    }

    public loadSubpackage(subpackageName: string, callback: Function): Promise<any> {
        return PlatformUtils.loadSubpackage(subpackageName, callback);
    }

    public loadSubpackages(subpackageNames: string[], callback: Function, maxConcurrency: number = 10): void {
        PlatformUtils.loadSubpackages(subpackageNames, callback, maxConcurrency);
    }

    public getResources(path: string, type: any, isAsync: boolean = false): void {
        QuickFileUtils.getResources(path, type, isAsync);
    }

    public getResourcesList(path: string, type: any, isAsync: boolean = false): void {
        QuickFileUtils.getResourcesList(path, type, isAsync);
    }

    public getFileOssPath(fileName: string): string {
        return QuickFileUtils.getFileOssPath(fileName);
    }

    public getFileOssPathList(fileNames: string[]): string[] {
        return QuickFileUtils.getFileOssPathList(fileNames);
    }

    public getGameInfo(): any {
        return ConfigHelper.getGameInfo();
    }

    public getGameConfig(): any {
        return ConfigHelper.getGameConfig();
    }

    public luckDraw(probability: number): boolean {
        return NumberUtls.luckDraw(probability);
    }

    public showAuthenticationView(): void {
        if (ConfigHelper.getGameConfig().authenticationSwitch) {
            QddSDKHelper._platformSDKImpl.showAuthenticationView();
        }
    }

    public navigateToScene(): void {
        QddSDKHelper._platformSDKImpl.navigateToScene();
    }

    public getUserInfoImpl(): any {
        return QddSDKHelper._platformSDKImpl.getUserInfoImpl();
    }

    public isSceneCodeEqual(sceneCode: string): boolean {
        return QddSDKHelper._platformSDKImpl.isSceneCodeEqual(sceneCode);
    }

    public getQuery(): any {
        return QddSDKHelper._platformSDKImpl.getQuery();
    }

    public getUserInfo(params: any = {}): void {
        QddSDKHelper._platformSDKImpl.getUserInfo(params);
    }

    public genIAAReposrtData(eventName: string, value: number, currency: string, extraData: any): void {
        QddSDKHelper._platformSDKImpl.genIAAReposrtData(eventName, value, currency, extraData);
    }

    public invite(): void {
        QddSDKHelper._platformSDKImpl.invite();
    }

    public officialPage(): void {
        QddSDKHelper._platformSDKImpl.officialPage();
    }

    public createShortcut(): void {
        QddSDKHelper._platformSDKImpl.createShortcut();
    }

    public subscribeBot(): void {
        QddSDKHelper._platformSDKImpl.subscribeBot();
    }

    public getPlatform(): string {
        return QddSDKHelper._platformSDKImpl.getPlatform();
    }

    public onShow(callback: Function): void {
        if (PlatformUtils.isOppoPlatform()) {
            qg.onShow(() => { callback(); });
        }
        if (PlatformUtils.isVivoPlatform()) {
            qg.onShow(() => { callback(); });
        }
        if (PlatformUtils.isQQPlatform()) {
            qq.onShow(() => { callback(); });
        }
        if (PlatformUtils.isWxPlatform()) {
            wx.onShow(() => { callback(); });
        }
        if (PlatformUtils.isTtPlatform()) {
            tt.onShow(() => { callback(); });
        }
        if (PlatformUtils.isFourThreeNineNineGameBoxPlatform()) {
            gamebox.onShow(() => { callback(); });
        }
    }

    public onHide(callback: Function): void {
        if (PlatformUtils.isOppoPlatform()) {
            qg.onHide(() => { callback(); });
        }
        if (PlatformUtils.isVivoPlatform()) {
            qg.onHide(() => { callback(); });
        }
        if (PlatformUtils.isQQPlatform()) {
            qq.onHide(() => { callback(); });
        }
        if (PlatformUtils.isWxPlatform()) {
            wx.onHide(() => { callback(); });
        }
        if (PlatformUtils.isTtPlatform()) {
            tt.onHide(() => { callback(); });
        }
        if (PlatformUtils.isFourThreeNineNineGameBoxPlatform()) {
            gamebox.onHide(() => { callback(); });
        }
    }
}

// Initialize static properties
QddSDKHelper._instance = undefined;
QddSDKHelper._platformSDKImpl = undefined;
QddSDKHelper.packingPlatform = undefined;
QddSDKHelper.ossConfig = undefined;
QddSDKHelper.backupConfig = "";
QddSDKHelper.configVersion = undefined;
QddSDKHelper.assetsVersion = undefined;
QddSDKHelper.gameVersion = undefined;

// Set global instances
window.SDKInstance = QddSDKHelper.getInstance();
window.EventInstance = EventHelper.getInstance();