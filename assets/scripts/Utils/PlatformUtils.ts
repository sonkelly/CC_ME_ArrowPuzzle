import { sys } from 'cc';
import { PlatformEnum } from './../PlatformEnum';
import { EngineUtils } from './EngineUtils';
import { LogUtils } from './LogUtils';

export class PlatformUtils {
    public static platform: string | undefined;
    public static appPlatform: string | undefined;
    public static apiName: any;

    public static getPlatform(): string {
        let platform: string;

        LogUtils.info("测试平台");
        this.isXiaoMiPlatform() && LogUtils.info("isXiaoMiPlatform true");
        this.isHuaWeiPlatform() && LogUtils.info("isHuaWeiPlatform true");
        this.isHonorPlatform() && LogUtils.info("isHonorPlatform true");
        this.isOppoPlatform() && LogUtils.info("isOppoPlatform true");
        this.isVivoPlatform() && LogUtils.info("isVivoPlatform true");
        this.isFourThreeNineNinePlatform() && LogUtils.info("isFourThreeNineNinePlatform true");
        this.isFourThreeNineNineGameBoxPlatform() && LogUtils.info("isFourThreeNineNineGameBoxPlatform true");
        this.isQQPlatform() && LogUtils.info("isQQPlatform true");
        this.isTtPlatform() && LogUtils.info("isTtPlatform true");
        this.isKsPlatform() && LogUtils.info("isKsPlatform true");
        this.isWxPlatform() && LogUtils.info("isWxPlatform true");
        this.isMarWxPlatform() && LogUtils.info("isMarWxPlatform true");
        this.isMeituanPlatform() && LogUtils.info("isMeituanPlatform true");
        this.isNative() && LogUtils.info("isNative true");
        this.isAndroid() && LogUtils.info("isAndroid true");
        this.isIOS() && LogUtils.info("isIOS true");
        this.isDebug() && LogUtils.info("isDebug true");
        this.isOppoNative() && LogUtils.info("isOppoNative true");
        this.isVivoNative() && LogUtils.info("isVivoNative true");
        this.isHuaWeiNative() && LogUtils.info("isHuaWeiNative true");
        this.isXiaoMiNative() && LogUtils.info("isXiaoMiNative true");
        this.isTapTapNative() && LogUtils.info("isTapTapNative true");
        this.isTwoThreeThreeNative() && LogUtils.info("isTwoThreeThreeNative true");
        this.isFourThreeNineNineNative() && LogUtils.info("isFourThreeNineNineNative true");
        this.isHaoYouKuaiBaoNative() && LogUtils.info("isHaoYouKuaiBaoNative true");
        this.isPKNOWNative() && LogUtils.info("isPKNOWNative true");
        this.isOhayooNative() && LogUtils.info("isOhayooNative true");
        this.isMoMoYuNative() && LogUtils.info("isMoMoYuNative true");
        this.isJuLiangYinQingNative() && LogUtils.info("isJuLiangYinQingNative true");
        this.isYingYongBaoNative() && LogUtils.info("isYingYongBaoNative true");
        this.isDouYinNative() && LogUtils.info("isDouYinNative true");
        this.isNineGameNative() && LogUtils.info("isNineGameNative true");
        this.isQuickApp() && LogUtils.info("isQuickApp true");
        this.isBaiduApp() && LogUtils.info("isBaiduApp true");
        this.isM233mlApp() && LogUtils.info("isM233mlApp true");
        this.isJuliangXingwan() && LogUtils.info("isJuliangXingwan true");
        this.isHuiyaoApp() && LogUtils.info("isHuiyaoApp true");
        this.isQQGameH5() && LogUtils.info("isQQGameH5 true");
        this.isJileApp() && LogUtils.info("isJileApp true");
        this.isHonorNative() && LogUtils.info("isHonorNative true");
        this.isGooglePlayNative() && LogUtils.info("isGooglePlayNative true");
        this.isHuaWeiAbroadNative() && LogUtils.info("isHuaWeiAbroadNative true");

        switch (true) {
            case this.isOppoPlatform():
                platform = PlatformEnum.Oppo;
                break;
            case this.isVivoPlatform():
                platform = PlatformEnum.Vivo;
                break;
            case this.isHuaWeiPlatform():
                platform = PlatformEnum.Huawei;
                break;
            case this.isHonorPlatform():
                platform = PlatformEnum.Honor;
                break;
            case this.isTtPlatform():
                platform = PlatformEnum.Tt;
                break;
            case this.isKsPlatform():
                platform = PlatformEnum.Ks;
                break;
            case this.isFourThreeNineNinePlatform():
                platform = PlatformEnum.FourThreeNineNine;
                break;
            case this.isFourThreeNineNineGameBoxPlatform():
                platform = PlatformEnum.FourThreeNineNineGameBox;
                break;
            case this.isQQPlatform():
                platform = PlatformEnum.Qq;
                break;
            case this.isFacebookMiniGame():
                platform = PlatformEnum.FacebookMiniGame;
                break;
            case this.isWxPlatform():
                platform = PlatformEnum.Wx;
                break;
            case this.isMarWxPlatform():
                platform = PlatformEnum.MarWx;
                break;
            case this.isOppoNative():
                platform = PlatformEnum.OppoApp;
                break;
            case this.isVivoNative():
                platform = PlatformEnum.VivoApp;
                break;
            case this.isHuaWeiNative():
                platform = PlatformEnum.HuaWeiApp;
                break;
            case this.isXiaoMiNative():
                platform = PlatformEnum.XiaoMiApp;
                break;
            case this.isTapTapNative():
                platform = PlatformEnum.TapTapApp;
                break;
            case this.isTwoThreeThreeNative():
                platform = PlatformEnum.TwoThreeThreeApp;
                break;
            case this.isFourThreeNineNineNative():
                platform = PlatformEnum.FourThreeNineNineApp;
                break;
            case this.isHaoYouKuaiBaoNative():
                platform = PlatformEnum.HaoYouKuaiBaoApp;
                break;
            case this.isPKNOWNative():
                platform = PlatformEnum.PKNOWApp;
                break;
            case this.isMoMoYuNative():
                platform = PlatformEnum.MoMoYuApp;
                break;
            case this.isJuLiangYinQingNative():
                platform = PlatformEnum.JuLiangYinQingApp;
                break;
            case this.isYingYongBaoNative():
                platform = PlatformEnum.YingYongBaoApp;
                break;
            case this.isDouYinNative():
                platform = PlatformEnum.DouYinApp;
                break;
            case this.isNineGameNative():
                platform = PlatformEnum.NineGameApp;
                break;
            case this.isOhayooNative():
                platform = PlatformEnum.OhayooApp;
                break;
            case this.isIOS():
                platform = PlatformEnum.IosApp;
                break;
            case this.isGooglePlayNative():
                platform = PlatformEnum.GooglePlayApp;
                break;
            case this.isHuaWeiAbroadNative():
                platform = PlatformEnum.HuaWeiAbroadApp;
                break;
            case this.isQuickApp():
                platform = PlatformEnum.QuickApp;
                break;
            case this.isBaiduApp():
                platform = PlatformEnum.BaiduApp;
                break;
            case this.isM233mlApp():
                platform = PlatformEnum.M233mlApp;
                break;
            case this.isJuliangXingwan():
                platform = PlatformEnum.JuliangXingwan;
                break;
            case this.isHuiyaoApp():
                platform = PlatformEnum.HuiyaoApp;
                break;
            case this.isQQGameH5():
                platform = PlatformEnum.QQGameH5;
                break;
            case this.isJileApp():
                platform = PlatformEnum.JileApp;
                break;
            case this.isMeituanPlatform():
                platform = PlatformEnum.Meituan;
                break;
            case this.isHonorNative():
                platform = PlatformEnum.HonorApp;
                break;
            default:
                platform = PlatformEnum.Debug;
        }

        this.platform = platform;
        LogUtils.info("The platform is: " + this.platform);
        return platform;
    }

    public static isXiaoMiPlatform(): boolean {
        return !EngineUtils.isCocos() || sys.platform === sys.Platform.XIAOMI_QUICK_GAME;
    }

    public static isHuaWeiPlatform(): boolean {
        return !EngineUtils.isCocos() || sys.platform === sys.Platform.HUAWEI_QUICK_GAME;
    }

    public static isHonorPlatform(): boolean {
        return !EngineUtils.isCocos() || sys.platform === sys.Platform.HONOR_MINI_GAME;
    }

    public static isOppoPlatform(): boolean {
        return !EngineUtils.isCocos() || sys.platform === sys.Platform.OPPO_MINI_GAME;
    }

    public static isVivoPlatform(): boolean {
        return !EngineUtils.isCocos() || sys.platform === sys.Platform.VIVO_MINI_GAME;
    }

    public static isQQPlatform(): boolean {
        return !EngineUtils.isCocos() || window.qq !== undefined;
    }

    public static isFourThreeNineNineGameBoxPlatform(): boolean {
        return !!window.hasOwnProperty("gamebox");
    }

    public static isFourThreeNineNinePlatform(): boolean {
        return !(!window.h5api && !window.H5API);
    }

    public static isWxPlatform(): boolean {
        return !(window.hasOwnProperty("gamebox") || window.qq || window.tt || window.ks) && (window.wx !== undefined && !this.isMarWxPlatform() && !this.isMeituanPlatform());
    }

    public static isMarWxPlatform(): boolean {
        if (window.hasOwnProperty("gamebox") || window.qq || window.tt || window.ks) {
            return false;
        }
        let isMar = false;
        if (window.mar != null && window.mar == 1) {
            isMar = true;
        }
        return window.wx !== undefined && isMar;
    }

    public static isTtPlatform(): boolean {
        return window.tt !== undefined;
    }

    public static isKsPlatform(): boolean {
        return window.ks !== undefined;
    }

    public static isFacebookMiniGame(): boolean {
        //return window.FB !== undefined || window.FBInstant != null;
        return true;
    }

    public static isAndroid(): boolean {
        if (EngineUtils.isCocos()) {
            return sys.platform === sys.Platform.ANDROID;
        }
        return !!window.conchConfig && window.conchConfig.getOS() === "Conch-android";
    }

    public static isQQGameH5(): boolean {
        return !!window.QGame;
    }

    public static isMeituanPlatform(): boolean {
        let isMeituan = false;
        if (window.meituan && window.meituan != null && window.meituan == 1) {
            isMeituan = true;
        }
        return isMeituan;
    }

    public static isIOS(): boolean {
        if (EngineUtils.isCocos()) {
            return sys.platform === sys.Platform.IOS || sys.platform === sys.Platform.MACOS;
        }
        return !!window.conchConfig && window.conchConfig.getOS() === "Conch-ios";
    }

    public static isNative(): boolean {
        return this.isAndroid() || this.isIOS();
    }

    public static isCocosNative(): boolean {
        return EngineUtils.isCocos() && this.isNative();
    }

    public static isLayaNative(): boolean {
        return !EngineUtils.isCocos() && this.isNative();
    }

    public static isQuickGame(): boolean {
        return !!(this.isXiaoMiPlatform() || this.isHuaWeiPlatform() || this.isHonorPlatform() || this.isOppoPlatform() || this.isVivoPlatform() || this.isQQPlatform() || this.isWxPlatform() || this.isFourThreeNineNinePlatform() || this.isFourThreeNineNineGameBoxPlatform() || this.isTtPlatform() || this.isKsPlatform() || this.isQQGameH5() || this.isMarWxPlatform() || this.isMeituanPlatform() || this.isFacebookMiniGame());
    }

    public static isDebug(): boolean {
        //return !this.isQuickGame() && !this.isNative();
        return true;
    }

    public static setAppPlatform(platform: string): void {
        this.appPlatform = platform;
    }

    public static isQuickApp(): boolean {
        return this.getAppPlatform() === "quickApp";
    }

    public static isBaiduApp(): boolean {
        return this.getAppPlatform() === "baiduApp";
    }

    public static isM233mlApp(): boolean {
        return this.getAppPlatform() === "m233mlApp";
    }

    public static isJuliangXingwan(): boolean {
        return this.getAppPlatform() === "juliangXingwan";
    }

    public static isHuiyaoApp(): boolean {
        return this.getAppPlatform() === "huiyaoApp";
    }

    public static isJileApp(): boolean {
        return this.getAppPlatform() === "jileApp";
    }

    public static isOppoNative(): boolean {
        return this.getAppPlatform() === "oppoApp";
    }

    public static isVivoNative(): boolean {
        return this.getAppPlatform() === "vivoApp";
    }

    public static isHuaWeiNative(): boolean {
        return this.getAppPlatform() === "huaWeiApp";
    }

    public static isXiaoMiNative(): boolean {
        return this.getAppPlatform() === "xiaoMiApp";
    }

    public static isFourThreeNineNineNative(): boolean {
        return this.getAppPlatform() === "fourThreeNineNineApp";
    }

    public static isTapTapNative(): boolean {
        return this.getAppPlatform() === "tapTapApp";
    }

    public static isTwoThreeThreeNative(): boolean {
        return this.getAppPlatform() === "twoThreeThreeApp";
    }

    public static isHaoYouKuaiBaoNative(): boolean {
        return this.getAppPlatform() === "haoYouKuaiBaoApp";
    }

    public static isPKNOWNative(): boolean {
        return this.getAppPlatform() === "PKNOWApp";
    }

    public static isMoMoYuNative(): boolean {
        return this.getAppPlatform() === "moMoYuApp";
    }

    public static isJuLiangYinQingNative(): boolean {
        return this.getAppPlatform() === "juLiangYinQingApp";
    }

    public static isYingYongBaoNative(): boolean {
        return this.getAppPlatform() === "yingYongBaoApp";
    }

    public static isDouYinNative(): boolean {
        return this.getAppPlatform() === "douYinApp";
    }

    public static isOhayooNative(): boolean {
        return this.getAppPlatform() === "ohayooApp";
    }

    public static isNineGameNative(): boolean {
        return this.getAppPlatform() === "nineGameApp";
    }

    public static isHonorNative(): boolean {
        return this.getAppPlatform() === "honorApp";
    }

    public static isGooglePlayNative(): boolean {
        return this.getAppPlatform() === "googlePlayApp";
    }

    public static isHuaWeiAbroadNative(): boolean {
        return this.getAppPlatform() === "huaWeiAbroadApp";
    }

    public static loadSubpackage(subpackageName: string, callback?: (success: boolean) => void): any {
        if (this.isQuickGame() && !this.isFourThreeNineNinePlatform()) {
            if (!PlatformUtils.isHuaWeiPlatform()) {
                const api = this.getApiName().loadSubpackage({
                    name: subpackageName,
                    success: () => {
                        LogUtils.info("分包" + subpackageName + "加载成功");
                        callback && callback(true);
                    },
                    fail: () => {
                        LogUtils.warn("分包" + subpackageName + "加载失败");
                        callback && callback(false);
                    }
                });
                if (api && api.onProgressUpdate) {
                    api.onProgressUpdate((progressInfo: any) => {
                        console.log("subpackage name:", subpackageName);
                        console.log("下载进度", progressInfo.progress);
                        console.log("已经下载的数据长度", progressInfo.totalBytesWritten);
                        console.log("预期需要下载的数据总长度", progressInfo.totalBytesExpectedToWrite);
                    });
                }
                return api;
            } else {
                (window as any).qg.loadSubpackage({
                    subpackage: subpackageName,
                    success: () => {
                        LogUtils.info("分包" + subpackageName + "加载成功");
                    },
                    fail: () => {
                        LogUtils.warn("分包" + subpackageName + "加载失败");
                    },
                    complete: () => {
                        callback && callback(true);
                    }
                });
            }
        } else {
            callback && callback(false);
        }
    }

    public static loadSubpackages(subpackageNames: string[], callback?: (success: boolean) => void, timeoutSeconds: number = 10): void {
        if (this.isQuickGame() && !this.isFourThreeNineNinePlatform()) {
            let isTimeout = false;
            setTimeout(() => {
                if (!isTimeout) {
                    LogUtils.info("加载分包超时了", timeoutSeconds + "秒");
                    isTimeout = true;
                    callback && callback(false);
                }
            }, 1000 * timeoutSeconds);

            if (PlatformUtils.isHuaWeiPlatform()) {
                let loadedCount = 0;
                const loadNext = (remainingNames: string[]) => {
                    if (remainingNames.length <= 0) {
                        LogUtils.info("所有分包全部加载完成", loadedCount);
                        if (!isTimeout) {
                            isTimeout = true;
                            callback && callback(true);
                        }
                        return;
                    }
                    const name = remainingNames.shift();
                    if (name) {
                        loadedCount++;
                        this.loadSubpackage(name, (success: boolean) => {
                            setTimeout(() => {
                                loadNext(remainingNames);
                            }, 200);
                        });
                    }
                };
                loadNext([...subpackageNames]);
            } else {
                let loadedCount = 0;
                for (const name of subpackageNames) {
                    this.loadSubpackage(name, (success: boolean) => {
                        loadedCount++;
                        if (loadedCount === subpackageNames.length) {
                            LogUtils.info("所有分包全部加载完成", loadedCount);
                            if (!isTimeout) {
                                isTimeout = true;
                                callback && callback(true);
                            }
                        }
                    });
                }
            }
        } else {
            callback && callback(false);
        }
    }

    public static getApiName(): any {
        if (!this.apiName) {
            let api: any;
            if (this.isVivoPlatform() || this.isOppoPlatform() || this.isHuaWeiPlatform() || this.isXiaoMiPlatform() || this.isHonorPlatform()) {
                api = window.qg;
            } else if (this.isTtPlatform()) {
                api = window.tt;
            } else if (this.isWxPlatform() || this.isMarWxPlatform()) {
                api = window.wx;
            } else if (this.isQQPlatform()) {
                api = window.qq;
            } else {
                if (!this.isFourThreeNineNineGameBoxPlatform()) {
                    throw new Error("未知平台");
                }
                api = window.gamebox;
            }
            this.apiName = api;
        }
        return this.apiName;
    }

    public static getAppPlatform(): string {
        if (!this.appPlatform && this.isAndroid()) {
            if (EngineUtils.isCocos()) {
                this.appPlatform = "googlePlayApp";
            } else {
                const platformClass = (window as any).PlatformClass.createClass("demo.JSBridge");
                this.appPlatform = platformClass.call("initPlatform");
            }
        }
        return this.appPlatform;
    }
}