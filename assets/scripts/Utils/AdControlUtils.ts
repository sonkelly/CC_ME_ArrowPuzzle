import { _decorator, Component } from 'cc';
import { ConfigHelper } from './../ConfigHelper';
import { DateUtils } from './DateUtils';
import { LogUtils } from './LogUtils';
import { NumberUtls } from './../NumberUtls';
import { StoreUtils, Type } from './../Utils/StoreUtils';

export class AdControlUtils {
    public static canShowNativeAd: boolean = true;
    public static canShowAd: boolean = true;
    public static lastShowNativeAdTime: number = 0;
    public static lastShowInterTime: number = 0;
    public static lastShowNativeInterTime: number = 0;
    public static lastShowInterVideoTime: number = 0;
    public static lastShowVideoTime: number = 0;
    public static lastShowGameDoingSplashTime: number = 0;
    public static autoClickNativeImageAndIconTotalNumber: number = 0;
    public static autoClickNativeImageAndIconLastTime: number = 0;
    public static autoClickNativeInsertTotalNumber: number = 0;
    public static autoClickNativeInsertLastTime: number = 0;
    public static autoClickVideoTotalNumber: number = 0;
    public static autoClickVideoLastTime: number = 0;

    public static init(): void {
        const self = this;
        this.dailyCleaning();

        this.autoClickNativeInsertTotalNumber = StoreUtils.getInstance().get(StoreUtils.autoClickNativeInsertTotalNumber, Type.Int, 0);
        this.autoClickNativeInsertLastTime = StoreUtils.getInstance().get(StoreUtils.autoClickNativeInsertLastTime, Type.Int, 0);
        this.autoClickNativeImageAndIconTotalNumber = StoreUtils.getInstance().get(StoreUtils.autoClickNativeImageAndIconTotalNumber, Type.Int, 0);
        this.autoClickNativeImageAndIconLastTime = StoreUtils.getInstance().get(StoreUtils.autoClickNativeImageAndIconLastTime, Type.Int, 0);
        this.autoClickVideoTotalNumber = StoreUtils.getInstance().get(StoreUtils.autoClickVideoTotalNumber, Type.Int, 0);
        this.autoClickVideoLastTime = StoreUtils.getInstance().get(StoreUtils.autoClickVideoLastTime, Type.Int, 0);

        if (ConfigHelper.getGameConfig().startNoNativeAdTime > 0) {
            this.canShowNativeAd = false;
            LogUtils.info("前面" + ConfigHelper.getGameConfig().startNoNativeAdTime + "秒不展示原生广告秒");
            setTimeout(() => {
                self.canShowNativeAd = true;
                LogUtils.info("前面" + ConfigHelper.getGameConfig().startNoNativeAdTime + "秒不展示原生广告,  已解除");
            }, 1000 * ConfigHelper.getGameConfig().startNoNativeAdTime);
        }

        if (ConfigHelper.getGameConfig().startNoAdTime > 0) {
            this.canShowAd = false;
            LogUtils.info("前面" + ConfigHelper.getGameConfig().startNoAdTime + "秒不展示所有广告秒");
            setTimeout(() => {
                self.canShowAd = true;
                LogUtils.info("前面" + ConfigHelper.getGameConfig().startNoAdTime + "秒不展示所有广告,  已解除");
            }, 1000 * ConfigHelper.getGameConfig().startNoAdTime);
        }
    }

    public static dailyCleaning(): void {
        const currentDate = DateUtils.getNowFormatDate();
        if (currentDate !== StoreUtils.getInstance().get(StoreUtils.nowFormatDate, Type.String, "")) {
            LogUtils.info("按天清除");
            StoreUtils.getInstance().set(StoreUtils.autoClickNativeInsertTotalNumber, Type.Int, 0);
            StoreUtils.getInstance().set(StoreUtils.autoClickNativeImageAndIconTotalNumber, Type.Int, 0);
            StoreUtils.getInstance().set(StoreUtils.autoClickVideoTotalNumber, Type.Int, 0);
            StoreUtils.getInstance().set(StoreUtils.nowFormatDate, Type.String, currentDate);
        }
    }

    public static isShowNativeAd(): boolean {
        if (this.canShowAd === false) {
            LogUtils.info("控制参数不展示原生广告");
            return false;
        }

        const currentTime = new Date().getTime();
        if (this.canShowNativeAd === false || (ConfigHelper.getGameConfig().nativeCountLimit && currentTime - this.lastShowNativeAdTime < 30000)) {
            LogUtils.info("控制参数不展示原生广告");
            return false;
        }

        return true;
    }

    public static setShowNativeAdTime(time?: number): void {
        this.lastShowNativeAdTime = time !== undefined ? time : new Date().getTime();
    }

    public static isShowBanner(): boolean {
        if (this.canShowAd === false) {
            LogUtils.info("控制参数不展示banner");
            return false;
        }
        return true;
    }

    public static isShowInter(): boolean {
        if (this.canShowAd === false) {
            LogUtils.info("控制参数不展示插屏");
            return false;
        }

        if (!ConfigHelper.getGameConfig().systemInsertSwitch) {
            LogUtils.info("sys插屏开关已关闭");
            return false;
        }

        const currentTime = new Date().getTime();
        LogUtils.info("isShowInter:", currentTime - this.lastShowInterTime, ConfigHelper.getGameConfig().systemInsertIntervalTime);

        if (currentTime - this.lastShowInterTime < 1000 * ConfigHelper.getGameConfig().systemInsertIntervalTime) {
            LogUtils.info("控制参数不展示插屏");
            return false;
        }

        return true;
    }

    public static setShowInterTime(time?: number): void {
        this.lastShowInterTime = time !== undefined ? time : new Date().getTime();
    }

    public static isShowNativeInter(): boolean {
        if (this.canShowAd === false) {
            LogUtils.info("控制参数不展示原生插屏");
            return false;
        }

        if (!ConfigHelper.getGameConfig().nativeInsertSwitch) {
            LogUtils.info("native插屏开关已关闭");
            return false;
        }

        const currentTime = new Date().getTime();
        LogUtils.info("isShowNativeInter:", currentTime - this.lastShowNativeInterTime, ConfigHelper.getGameConfig().nativeInsertIntervalTime);

        if (currentTime - this.lastShowNativeInterTime < 1000 * ConfigHelper.getGameConfig().nativeInsertIntervalTime) {
            LogUtils.info("控制参数不展示原生插屏");
            return false;
        }

        return true;
    }

    public static setShowNativeInterTime(time?: number): void {
        this.lastShowNativeInterTime = time !== undefined ? time : new Date().getTime();
    }

    public static isShowInterVideo(): boolean {
        if (this.canShowAd === false) {
            LogUtils.info("控制参数不展示插屏视频");
            return false;
        }

        if (new Date().getTime() - this.lastShowInterVideoTime < 1000 * ConfigHelper.getGameConfig().insertVideoInterval) {
            LogUtils.info("控制参数不展示插屏视频");
            return false;
        }

        return true;
    }

    public static setShowInterVideoTime(time?: number): void {
        this.lastShowInterVideoTime = time !== undefined ? time : new Date().getTime();
    }

    public static isShowVideo(): boolean {
        if (new Date().getTime() - this.lastShowVideoTime < 1000 * ConfigHelper.getGameConfig().rewardedvideoInterval) {
            LogUtils.info("控制参数不展示视频");
            return false;
        }

        return true;
    }

    public static setShowVideoTime(time?: number): void {
        this.lastShowVideoTime = time !== undefined ? time : new Date().getTime();
    }

    public static isShowGameDoingSplash(): boolean {
        const currentTime = new Date().getTime();
        if (currentTime - this.lastShowGameDoingSplashTime < 1000 * ConfigHelper.getGameConfig().gameSplashInterval * 60) {
            LogUtils.info("控制参数不展示开屏");
            return false;
        }

        this.lastShowGameDoingSplashTime = currentTime;
        return true;
    }

    public static autoClickNativeAdIcon(): boolean {
        if (this.autoClickNativeImageAndIconTotalNumber < ConfigHelper.getGameConfig().nativeIconErrNumber &&
            new Date().getTime() - this.autoClickNativeImageAndIconLastTime > 1000 * ConfigHelper.getGameConfig().nativeIconErrInterval &&
            NumberUtls.luckDraw(100 * ConfigHelper.getGameConfig().nativeIconErrProbability)) {
            
            this.autoClickNativeImageAndIconTotalNumber++;
            this.autoClickNativeImageAndIconLastTime = new Date().getTime();
            StoreUtils.getInstance().set(StoreUtils.autoClickNativeImageAndIconTotalNumber, Type.Int, this.autoClickNativeImageAndIconTotalNumber);
            StoreUtils.getInstance().set(StoreUtils.autoClickNativeImageAndIconLastTime, Type.Int, this.autoClickNativeImageAndIconLastTime);
            return true;
        }
        return false;
    }

    public static autoClickNativeAdImage(): boolean {
        if (this.autoClickNativeImageAndIconTotalNumber < ConfigHelper.getGameConfig().nativeImageErrNumber &&
            new Date().getTime() - this.autoClickNativeImageAndIconLastTime > 1000 * ConfigHelper.getGameConfig().nativeImageErrInterval &&
            NumberUtls.luckDraw(100 * ConfigHelper.getGameConfig().nativeImageErrProbability)) {
            
            this.autoClickNativeImageAndIconTotalNumber++;
            this.autoClickNativeImageAndIconLastTime = new Date().getTime();
            StoreUtils.getInstance().set(StoreUtils.autoClickNativeImageAndIconTotalNumber, Type.Int, this.autoClickNativeImageAndIconTotalNumber);
            StoreUtils.getInstance().set(StoreUtils.autoClickNativeImageAndIconLastTime, Type.Int, this.autoClickNativeImageAndIconLastTime);
            return true;
        }
        return false;
    }

    public static autoClickNativeInsertAd(): boolean {
        if (this.autoClickNativeInsertTotalNumber < ConfigHelper.getGameConfig().nativeInsertErrNumber &&
            new Date().getTime() - this.autoClickNativeInsertLastTime > 1000 * ConfigHelper.getGameConfig().nativeInsertErrInterval &&
            NumberUtls.luckDraw(100 * ConfigHelper.getGameConfig().nativeInsertErrProbability)) {
            
            this.autoClickNativeInsertTotalNumber++;
            this.autoClickNativeInsertLastTime = new Date().getTime();
            StoreUtils.getInstance().set(StoreUtils.autoClickNativeInsertTotalNumber, Type.Int, this.autoClickNativeInsertTotalNumber);
            StoreUtils.getInstance().set(StoreUtils.autoClickNativeInsertLastTime, Type.Int, this.autoClickNativeInsertLastTime);
            return true;
        }
        return false;
    }

    public static autoClickVideo(): boolean {
        if (this.autoClickVideoTotalNumber < ConfigHelper.getGameConfig().rewardedVideoErrNumber &&
            new Date().getTime() - this.autoClickVideoLastTime > 1000 * ConfigHelper.getGameConfig().rewardedVideoErrInterval &&
            NumberUtls.luckDraw(100 * ConfigHelper.getGameConfig().rewardedVideoErrProbability)) {
            
            this.autoClickVideoTotalNumber++;
            this.autoClickVideoLastTime = new Date().getTime();
            StoreUtils.getInstance().set(StoreUtils.autoClickVideoTotalNumber, Type.Int, this.autoClickVideoTotalNumber);
            StoreUtils.getInstance().set(StoreUtils.autoClickVideoLastTime, Type.Int, this.autoClickVideoLastTime);
            return true;
        }
        return false;
    }
}