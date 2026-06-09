import { _decorator, native } from 'cc';
import { PlatUtils } from './Utils/PlatUtils';
import { Utils } from './Utils';
import { YZ_Constant } from './YZ_Constant';
import { YZ_LocalStorage } from './YZ_LocalStorage';
import { EventAdInfo } from './Event/EventAdInfo';
import { YwLogUtils } from './Utils/YwLogUtils';

const { ccclass } = _decorator;

@ccclass
export class YouWanAnalytics {
    public static eventAdList: EventAdInfo[] = [];

    public static get MAIN_URL(): string {
        return "";
    }

    public static get LOGIN_URL(): string {
        return this.MAIN_URL + "as/login/v2";
    }

    public static get EVENT_AD_URL(): string {
        return this.MAIN_URL + "ae/ad";
    }

    public static get EVENT_URL(): string {
        return this.MAIN_URL + "ae/event";
    }

    public static get EVENT_LEVEL_URL(): string {
        return this.MAIN_URL + "ae/glevel";
    }

    public static get _yw_uid(): number {
        return parseInt(YZ_LocalStorage.getItem(YZ_Constant.ST_YOUWAN_UID, "-1"));
    }

    public static login(loginInfo: any): void {
        // Implementation
    }

    public static EventAd(eventType: string, eventData: any): void {
        if (this.checkSwitch()) {
            const eventAdInfo = new EventAdInfo(eventType, eventData);
            this.eventAdList.push(eventAdInfo);
        }
    }

    public static EventAdWithObj(eventType: string, eventData: any, obj: any): void {
        if (this.checkSwitch()) {
            const eventAdInfo = new EventAdInfo(eventType, eventData, obj);
            this.eventAdList.push(eventAdInfo);
        }
    }

    public static EventWithName(eventName: string): void {
        this.showLog("上报自定义事件:" + eventName);
        if (this.checkSwitch() && PlatUtils.IsNativeAndroid && Utils.instance.Tool_Native) {
            native.reflection.callStaticMethod(
                Utils.instance.Tool_Native.jniClassName,
                "eventWithName",
                "(Ljava/lang/String;)V",
                eventName
            );
        }
    }

    public static EventWithNameAndStringValue(eventName: string, value: string): void {
        this.showLog("上报带字符串参数自定义事件:#name=" + eventName + " #value=" + value);
        if (this.checkSwitch() && PlatUtils.IsNativeAndroid && Utils.instance.Tool_Native) {
            native.reflection.callStaticMethod(
                Utils.instance.Tool_Native.jniClassName,
                "eventWithNameAndStringValue",
                "(Ljava/lang/String;Ljava/lang/String;)V",
                eventName,
                value
            );
        }
    }

    public static EventWithNameAndIntValue(eventName: string, value: number): void {
        this.showLog("上报带数字参数自定义事件:#name=" + eventName + " #value=" + value);
        if (this.checkSwitch() && PlatUtils.IsNativeAndroid && Utils.instance.Tool_Native) {
            native.reflection.callStaticMethod(
                Utils.instance.Tool_Native.jniClassName,
                "eventWithNameAndIntValue",
                "(Ljava/lang/String;I)V",
                eventName,
                value
            );
        }
    }

    public static EventWithNameAndJsonValue(eventName: string, jsonValue: any): void {
        this.showLog("上报带JSON对象参数自定义事件:#name=" + eventName + " #value=" + JSON.stringify(jsonValue));
        if (this.checkSwitch() && PlatUtils.IsNativeAndroid && Utils.instance.Tool_Native) {
            native.reflection.callStaticMethod(
                Utils.instance.Tool_Native.jniClassName,
                "eventWithNameAndJsonValue",
                "(Ljava/lang/String;;Ljava/lang/String;)V",
                eventName,
                JSON.stringify(jsonValue)
            );
        }
    }

    public static EventLevel(levelId: string, levelStatus: string, model: string): void {
        this.showLog("上报关卡事件:#levelID=" + levelId + " #LevelStatus=" + levelStatus + " #model=" + model);
        if (this.checkSwitch()) {
            try {
                if (PlatUtils.IsNativeAndroid && Utils.instance.Tool_Native) {
                    if (model) {
                        native.reflection.callStaticMethod(
                            Utils.instance.Tool_Native.jniClassName,
                            "eventLevel",
                            "(ILjava/lang/String;Ljava/lang/String;)V",
                            parseInt(levelId),
                            levelStatus,
                            model
                        );
                    } else {
                        native.reflection.callStaticMethod(
                            Utils.instance.Tool_Native.jniClassName,
                            "eventLevel",
                            "(ILjava/lang/String;)V",
                            parseInt(levelId),
                            levelStatus
                        );
                    }
                }
            } catch (error) {
                this.showLog("上报关卡事件异常 erro=" + error);
            }
        }
    }

    private static checkSwitch(): boolean {
        if (!PlatUtils.IsNativeAndroid && !Utils.instance.config.otherconfig.yw_app_id) {
            this.showLog("yw_app_id 未配置，不进行上报！");
            return false;
        }
        return true;
    }

    private static showLog(message: string, ...args: any[]): void {
        YwLogUtils.showLog("[YwAnalytics] --- " + message, args);
    }
}