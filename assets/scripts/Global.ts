import { _decorator, Component, Node } from 'cc';
import { DirectPlayUtil } from './DirectPlayUtil';
import { GameLogicConfig } from './GameLogicConfig';
import { ConfigHelper } from './ConfigHelper';

export class Global {
    public static ge: any = null;
    public static openId: string | undefined = undefined;
    public static NEZPRankMyData: any = null;
    public static NEZPRankGlobal: any = null;
    public static NEZPRankFriend: any = null;
    public static NEZPAllTour: any = null;
    public static NEZPMyTour: any = null;
    public static NEZPPVP: any = null;
    public static isFirstEnter: boolean = false;

    public static isDebug(): boolean {
        if (SDKInstance.isDebug()) {
            return true;
        }
        if (SDKInstance.isIOS()) {
            return false;
        }
        const closeSkipVideoVersions = ConfigHelper.getGameConfig().closeSkipVideoVersions;
        if (closeSkipVideoVersions !== "" && closeSkipVideoVersions.split(",").includes(GameLogicConfig.miniGameVersion)) {
            return true;
        }
        return false;
    }

    public static isShowGM(): boolean {
        if (SDKInstance.isDebug()) {
            return true;
        }
        const closeIosPayVersions = ConfigHelper.getGameConfig().closeIosPayVersions;
        if (closeIosPayVersions !== "" && closeIosPayVersions.split(",").includes(GameLogicConfig.miniGameVersion)) {
            return true;
        }
        return false;
    }

    public static closeWechatIosPay(): boolean {
        if (SDKInstance.isMeituanPlatform()) {
            return true;
        }
        if (!SDKInstance.isWxPlatform() && !SDKInstance.isQQPlatform()) {
            return false;
        }
        const closeIosPayVersions = ConfigHelper.getGameConfig().closeIosPayVersions;
        if (closeIosPayVersions === "") {
            return false;
        }
        const systemInfo = wx.getSystemInfoSync();
        if ((systemInfo.platform === "ios" || systemInfo.platform === "mac") && 
            closeIosPayVersions.split("").includes(GameLogicConfig.miniIosGameVersion)) {
            return true;
        }
        return false;
    }

    public static isUseLocalLevel(): boolean {
        const hasDirectPlay = !!(SDKInstance.isFacebookMiniGame() || SDKInstance.isGooglePlayNative() || SDKInstance.isDebug() || DirectPlayUtil.isDirectPlay);
        console.log(ConfigHelper.getGameConfig())
        const gameConfigCDNPath = ConfigHelper.getGameConfig().gameConfigCDNPath;
        const hasCDNPath = gameConfigCDNPath !== "" && !!gameConfigCDNPath.split(";").includes(GameLogicConfig.miniIosGameVersion);
        return hasDirectPlay || hasCDNPath;
    }

    public static isForeignGame(): boolean {
        return SDKInstance.isFacebookMiniGame() || SDKInstance.isGooglePlayNative();
    }
}