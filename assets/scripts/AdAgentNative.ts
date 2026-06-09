import { _decorator, director, native, view } from 'cc';
import { AdAgent } from './AdAgent';
import { BannerLocation, YZ_Constant } from './YZ_Constant';
import { PlatUtils }  from './Utils/PlatUtils';
import { Utils } from './Utils';
import { YwLogUtils } from './Utils/YwLogUtils';

const { ccclass } = _decorator;
const JNIMessage = "JNIMessage";
const VideoCallback = "VideoCallback";

@ccclass
export class AdAgentNative extends AdAgent {
    private _videoCallback: ((success: boolean, msg?: string) => void) | null = null;
    private _showBannerTimerId: number = 0;
    private _showNativeIconTimerId: number = 0;

    public Init(): void {
        if (PlatUtils.IsNativeAndroid) {
            director.on(JNIMessage, (event: { type: string, ret: number, msg?: string }) => {
                if (event.type === VideoCallback && this._videoCallback) {
                    if (event.ret === 1) {
                        this._videoCallback && this._videoCallback(true);
                    } else {
                        this._videoCallback && this._videoCallback(false, event.msg);
                    }
                    this._videoCallback = null;
                }
            });
        }
    }

    public ShowBanner(location: BannerLocation = BannerLocation.Home, args: any = null, isTimeRefresh: boolean = false): void {
        if (PlatUtils.IsNativeAndroid) {
            YwLogUtils.showLog("AdAgentNative ShowBanner");
            const refreshTime = Utils.instance.getConfigFloatValue("banner_refresh_time", 60);
            const bannerData: any = {};
            bannerData.location = location;
            bannerData.isTimeRefresh = !!isTimeRefresh;

            try {
                YwLogUtils.showLog("调用banner Json >>>" + JSON.stringify(bannerData));
                native.reflection.callStaticMethod(this._className, "showBanner", "(Ljava/lang/String;)V", JSON.stringify(bannerData));
            } catch (error) {
                YwLogUtils.showLog(error);
            }

            clearInterval(this._showBannerTimerId);
            this._showBannerTimerId = setInterval(() => {
                YwLogUtils.showLog("定时刷新显示Banner广告！location:" + location + "; args:" + JSON.stringify(args) + "; 间隔时间:" + refreshTime);
                this.ShowBanner(location, args, true);
            }, 1000 * refreshTime);
        }
    }

    public HideBanner(location: BannerLocation = BannerLocation.Home): void {
        YwLogUtils.showLog("AdAgentNative HideBanner");
        clearInterval(this._showBannerTimerId);
        native.reflection.callStaticMethod(this._className, "hideBanner", "(Ljava/lang/String;)V", location);
    }

    public ShowInterstitial(): void {
        if (PlatUtils.IsNativeAndroid) {
            try {
                const delayTime = Utils.instance.getConfigFloatValue("interstitial_delay_show_time", 0.5);
                YwLogUtils.showLog("AdAgentNative ShowInterstitial 延迟", delayTime, "秒调用！");
                Utils.instance.delayCall(() => {
                    native.reflection.callStaticMethod(this._className, "showInterstitial", "()V");
                }, delayTime);
            } catch (error) {
                YwLogUtils.showLog(error);
            }
        }
    }

    public showNativeTryGameWidget(config: any = null): void {
        if (PlatUtils.IsNativeAndroid) {
            YwLogUtils.showLog("AdAgentNative showNativeTryGameWidget");
            try {
                let refreshTime = Utils.instance.getConfigFloatValue("native_icon_refresh_time", 15);
                if (refreshTime < 3) {
                    refreshTime = 15;
                }

                const iconData: any = {};
                if ("left" in config) iconData.left = config.left;
                if ("right" in config) iconData.right = config.right;
                if ("top" in config) iconData.top = config.top;
                if ("bottom" in config) iconData.bottom = config.bottom;
                if ("location" in config) iconData.location = config.location;
                iconData.winSizeWidth = view.getVisibleSize().width;
                iconData.winSizeHeight = view.getVisibleSize().height;

                native.reflection.callStaticMethod(Utils.instance.Tool_Native.jniClassName, "showNativeIcon", "(Ljava/lang/String;)V", JSON.stringify(iconData));

                clearInterval(this._showNativeIconTimerId);
                this._showNativeIconTimerId = setInterval(() => {
                    YwLogUtils.showLog("定时刷新显示原生悬浮ICON广告！ args:" + config + "; 间隔时间:" + refreshTime);
                    this.showNativeTryGameWidget(config);
                }, 1000 * refreshTime);
            } catch (error) {
                YwLogUtils.showLog(error);
            }
        }
    }

    public ShowVideo(callback: (success: boolean, msg?: string) => void): void {
        if (PlatUtils.IsNativeAndroid) {
            YwLogUtils.showLog("AdAgentNative ShowVideo");
            this._videoCallback = callback;
            try {
                native.reflection.callStaticMethod(this._className, "showVideo", "()V");
            } catch (error) {
                YwLogUtils.showLog(error);
                if (callback) {
                    callback(false);
                }
            }
        }
    }

    public showFullScreenVideo(callback: (success: boolean, msg?: string) => void): void {
        if (PlatUtils.IsNativeAndroid) {
            YwLogUtils.showLog("AdAgentNative showFullScreenVideo");
            this._videoCallback = callback;
            try {
                native.reflection.callStaticMethod(this._className, "showFullScreenVideo", "()V");
            } catch (error) {
                YwLogUtils.showLog(error);
                if (callback) {
                    callback(false);
                }
            }
        }
    }

    public hideNativeTryGameWidget(): void {
        if (PlatUtils.IsNativeAndroid) {
            clearInterval(this._showNativeIconTimerId);
            native.reflection.callStaticMethod(this._className, "hideFloatIcon", "()V");
        }
    }

    public get _className(): string {
        return Utils.instance.Tool_Native.jniClassName;
    }

    public get ServerConfig(): any {
        return Utils.instance.Tool_Native.ServerConfig;
    }
}

export class NativeCallBack {
    public static videoCallBack(result: number, msg: string): void {
        console.log("视频广告回调函数 ------>result=", result, " msg=", msg);
        if (result === 1) {
            director.emit(JNIMessage, {
                type: VideoCallback,
                ret: true
            });
        } else {
            director.emit(JNIMessage, {
                type: VideoCallback,
                ret: false,
                msg: msg || "暂无视频！"
            });
        }
    }

    public static sendEvent(event: string): void {
        // Empty implementation
    }

    public static sendEventNew(event: string, param1: string, param2: string): void {
        // Empty implementation
    }

    public static reportInsertClick(): void {
        // Empty implementation
    }

    public static realNameAuth(idCard: string, realName: string): void {
        YwLogUtils.showLog("realNameAuth>>>> #idCard=" + idCard + " #realName=" + realName);
        Utils.instance.Tool_Native.realNameAuth(idCard, realName, (success: boolean, result: string) => {
            YwLogUtils.showLog("realNameAuth>>>>  #res=" + success + " #result=" + result);
            if (success) {
                if (result) {
                    const responseData = JSON.parse(result);
                    switch (responseData.code) {
                        case 1:
                            Utils.instance.showMsg(responseData.msg);
                            Utils.instance.Tool_Native.realNameAuthResult(result);
                            break;
                        case 0:
                            if (responseData.nonage === "0") {
                                Utils.instance.setRealNameAuthLocalData("2");
                            } else {
                                Utils.instance.setRealNameAuthLocalData("1");
                            }
                            Utils.instance._isRealNameAuth = true;
                            if (responseData.msg) {
                                Utils.instance.showMsg(responseData.msg);
                            }
                            Utils.instance.Tool_Native.realNameAuthResult(result);
                            Utils.instance.scheduleOnce(() => {
                                Utils.instance.emitRealNameAuthCloseEvent();
                            }, 0.5);
                            break;
                        case 2:
                            Utils.instance.setRealNameAuthLocalData("2");
                            Utils.instance.Tool_Native.realNameAuthResult(result);
                            break;
                    }
                } else {
                    const errorData = {
                        code: "-1",
                        msg: "请求失败，请重新提交验证！"
                    };
                    Utils.instance.Tool_Native.realNameAuthResult(JSON.stringify(errorData));
                    Utils.instance.showMsg("请求失败，请重新提交验证！");
                }
            } else {
                Utils.instance.showMsg("请求失败，请重新提交验证！");
                const errorData = {
                    code: "-1",
                    msg: "请求失败，请重新提交验证！"
                };
                Utils.instance.Tool_Native.realNameAuthResult(JSON.stringify(errorData));
            }
        });
    }

    public static purchaseCallBack(result: number, msg: string): void {
        console.log("支付回调函数 ------>result=", result, " msg=", msg);
        if (result === 1) {
            director.emit(YZ_Constant.YZ_PAY_MESSAGE, {
                type: YZ_Constant.YZ_PAY_SUCCESS,
                msg: msg || "Pay successful！"
            });
        } else {
            director.emit(YZ_Constant.YZ_PAY_MESSAGE, {
                type: YZ_Constant.YZ_PAY_FAIL,
                msg: msg || "Pay failed！"
            });
        }
    }

    public static queryProductCallBack(result: string): void {
        console.log("查询商品回调函数 ------>result=", result);
        try {
            const responseData = JSON.parse(result);
            const message = responseData.msg;
            if (responseData.code === 1) {
                director.emit(YZ_Constant.YZ_PAY_ALL_QUERY_PRODUCT, {
                    code: YZ_Constant.YZ_QUERY_SUCCESS,
                    msg: message || "Query Product successful！",
                    data: responseData.data
                });
            } else {
                director.emit(YZ_Constant.YZ_PAY_ALL_QUERY_PRODUCT, {
                    code: YZ_Constant.YZ_QUERY_FAIL,
                    msg: message || "Query Product Fail！"
                });
            }
        } catch (error) {
            // Empty catch block
        }
    }
}

window.NativeCallBack = NativeCallBack;