import { _decorator, Prefab } from 'cc';
import { BannerLocation } from './YZ_Constant';
import { PlatUtils } from './Utils/PlatUtils';
import { Utils } from './Utils';
import { YwLogUtils } from './Utils/YwLogUtils';

const { ccclass, property } = _decorator;

class NativeAndroidConfig {
    public appID: string = "";
    public channel: string = "";
    public version: string = "";
}

class OtherConfig {
    public yw_app_id: string = "";
}

@ccclass('CommonConfig')
export class CommonConfig {
    public nativeAndroidConfig: NativeAndroidConfig = new NativeAndroidConfig();

    @property({
        type: OtherConfig,
        tooltip: "其他配置",
        displayName: "其他配置"
    })
    public otherconfig: OtherConfig = new OtherConfig();

    @property({
        type: Prefab,
        tooltip: "侧边更多游戏面板挂件，将Common/Prefabs/MoreGamesWidget拖到此处"
    })
    public moreGamesWidget: Prefab | null = null;

    public init(configData: string): boolean | void {
        this._initOther(configData);
        if (PlatUtils.IsNativeAndroid) {
            return this._initNativeAndroid();
        }
    }

    private _initOther(configData: string): boolean {
        if (!configData) {
            return false;
        }
        const parsedData = JSON.parse(configData);
        if (parsedData && parsedData.other) {
            if (parsedData.other.yw_app_id) {
                this.otherconfig.yw_app_id = parsedData.other.yw_app_id;
            } else {
                YwLogUtils.showLog("warn:本地配置数据不包含‘yw_app_id’字段！");
            }
        }
        return true;
    }

    private _bannerLocationStringToEnum(location: string): BannerLocation {
        switch (location) {
            case "home":
                return BannerLocation.Home;
            case "game":
                return BannerLocation.Game;
            case "level":
                return BannerLocation.Level;
            case "skin":
                return BannerLocation.Skin;
            case "pause":
                return BannerLocation.Pause;
            case "over":
                return BannerLocation.Over;
            default:
                return BannerLocation.None;
        }
    }

    private _initNativeAndroid(): boolean {
        if (!Utils.instance.Tool_Native) {
            return false;
        }
        const nativeData = Utils.instance.Tool_Native.getNativeData();
        YwLogUtils.showLog("原生安卓平台本地配置数据:", nativeData);
        if (!nativeData) {
            YwLogUtils.showLog("error : 安卓本地配置数据配置错误！");
            return false;
        }
        const parsedData = JSON.parse(nativeData);
        if (!parsedData) {
            YwLogUtils.showLog("error本地配置数据不是合法的json数据!");
            return false;
        }
        if (!parsedData.app_id) {
            YwLogUtils.showLog("error本地配置数据不包含‘app_id’字段！");
            return false;
        }
        this.nativeAndroidConfig.appID = parsedData.app_id;
        if (!parsedData.version) {
            Utils.instance.showMsg("error本地配置数据不包含‘version’字段！");
            return false;
        }
        this.nativeAndroidConfig.version = parsedData.version;
        if (!parsedData.channel) {
            YwLogUtils.showLog("error本地配置数据不包含‘app_id’字段！");
            return false;
        }
        this.nativeAndroidConfig.channel = parsedData.channel;
        YwLogUtils.showLog("原生平台渠道号 channel=" + parsedData.channel);
        return true;
    }
}