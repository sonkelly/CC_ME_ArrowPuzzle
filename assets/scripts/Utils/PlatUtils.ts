import { _decorator, sys } from 'cc';
import { Utils } from './../Utils';

const { ccclass } = _decorator;

@ccclass
export class PlatUtils {
    static logPlatform(): void {}

    static get IsTest(): boolean {
        return Utils && Utils.instance.isTestModel;
    }

    static get IsAndroid(): boolean {
        return sys.os === 'Android';
    }

    static get IsIOS(): boolean {
        return sys.os === 'iOS';
    }

    static get IsNativeAndroid(): boolean {
        return sys.os === 'Android' && Boolean(jsb);
    }

    static get IsNativeIOS(): boolean {
        return sys.os === 'iOS' && Boolean(jsb);
    }

    static get ISNativeHarmony(): boolean {
        return sys.os === 'OHOS' && Boolean(jsb);
    }

    static get isBrowser(): boolean {
        return sys.isBrowser;
    }

    static get IsAlipay(): boolean {
        return window.my;
    }

    static get IsBili(): boolean {
        return window.bl;
    }

    static get IsDouyin(): boolean {
        return window.tt && !window.TTMinis;
    }

    static get IsKwai(): boolean {
        return typeof KSGameGlobal !== 'undefined' && !Utils.instance.isHaiwai;
    }

    static get IsKwaiHw(): boolean {
        return typeof KSGameGlobal !== 'undefined' && Utils.instance.isHaiwai;
    }

    static get IsHuaWei(): boolean {
        return window.hbs && !Utils.instance.isHaiwai;
    }

    static get IsHuaWeiHw(): boolean {
        return window.hbs && Utils.instance.isHaiwai;
    }

    static get IsWechat(): boolean {
        return sys.platform === 'WECHAT_GAME' && window.wx && !this.IsQQ && !this.IsDouyin && !this.IsKwai && !this.IsKwaiHw;
    }

    static get IsVIVO(): boolean {
        return sys.platform === 'VIVO_MINI_GAME';
    }

    static get IsOPPO(): boolean {
        return sys.platform === 'OPPO_MINI_GAME';
    }

    static get IsXiaoMi(): boolean {
        return sys.platform === 'XIAOMI_QUICK_GAME';
    }

    static get IsHonor(): boolean {
        return window.qg && !this.IsHuaWei && !this.IsVIVO && !this.IsOPPO && !this.IsXiaoMi && !this.IsHuaWeiHw;
    }

    static get IsTiktok(): boolean {
        return window.TTMinis && !this.IsWeiYou;
    }

    static get IsWYTiktok(): boolean {
        return window.TTMinis && this.IsWeiYou;
    }

    static get IsWYFaceBook(): boolean {
        return window.FB && this.IsWeiYou;
    }

    static get IsWeiYou(): boolean {
        return window.minigame_sdk !== undefined || window.MiniGameSDK !== undefined;
    }

    static get ISCocos(): boolean {
        return false;
    }

    static get ISUC(): boolean {
        return window.uc;
    }

    static get IsBaidu(): boolean {
        return window.swan;
    }

    static get IsQQ(): boolean {
        return window.qq;
    }

    static get IsQTT(): boolean {
        return window.qttGame;
    }

    static get Is4399(): boolean {
        return window.h5api;
    }

    static get IsWiFi(): boolean {
        return window.wuji;
    }

    static get IsHago(): boolean {
        return window.hg;
    }

    static get IsGoogleWeb(): boolean {
        return window.googleApi;
    }

    static get IsChuanYinWeb(): boolean {
        return window.h5sdk;
    }

    static get IsGameBridgeWeb(): boolean {
        return window.GameBridgeSDK;
    }

    static get androidChannel(): string {
        return Utils.instance.config && Utils.instance.config.nativeAndroidConfig ? Utils.instance.config.nativeAndroidConfig.channel : '';
    }

    static get IsAndroidChuanYin(): boolean {
        return this.androidChannel === 'chuanyin';
    }

    static get IsAndroidOppo(): boolean {
        return this.androidChannel === 'oppo';
    }

    static get IsAndroidVivo(): boolean {
        return this.androidChannel === 'vivo';
    }

    static get IsAndroidDouYin(): boolean {
        return this.androidChannel === 'douyin';
    }

    static get IsAndroidHuaWei(): boolean {
        return this.androidChannel.indexOf('huawei') > -1;
    }
}