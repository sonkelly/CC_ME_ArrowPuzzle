import { Global } from "./../Global";
import { ConfigHelper } from "./../ConfigHelper";
import { DigestUtils } from "./../Utils/DigestUtils";
import { LogUtils } from "./../Utils/LogUtils";
import { NumberUtls } from "./../NumberUtls";
import { StoreUtils, Type } from "./../Utils/StoreUtils";
import { adLogin, adRegister, adPurchase, xGameTracking, wxTracking, bilibiliTracking, relevance, conversion, signEvent, loadStartEvent, loadEndEvent, videoEvent } from "./../Event/EventApi";

export class EventHelper {
    private static _instance: EventHelper;
    static gameAppkey: string;
    static channel: string = "";
    static wxClickID: string = "";
    static clueToken: string = "";
    static adId: string = "";
    static creativeId: string = "";
    static advertiserId: string = "";
    static reqId: string = "";
    static ksCallback: string = "";
    static idfa: string = "";
    static macAddress: string = "";
    static ipAddress: string = "";
    static idfv: string = "";
    static juliang_clickid: string = "";
    static clickid: string = "";
    static openid: string = "";
    static accountid: string = "";

    private uuid: string;
    private sessionId: string = "";
    private initSuccess: boolean = false;
    private xGameActiveResult: string = "";
    private xGameAppId: string = "";

    static getInstance(): EventHelper {
        if (this._instance === undefined) {
            this._instance = new EventHelper();
        }
        return this._instance;
    }

    initEventHelper(gameAppkey: string): void {
        if (!this.initSuccess) {
            LogUtils.info("gameAppkey", gameAppkey);
            EventHelper.gameAppkey = gameAppkey;
            if (EventHelper.gameAppkey) {
                this.initSuccess = true;
                this.getUUID();
            } else {
                LogUtils.warn("缺少gameAppke, 打点初始化失败");
            }
        }
    }

    getUUID(): string {
        if (!this.uuid) {
            let storedUuid = StoreUtils.getInstance().get(StoreUtils.uuid, Type.String, "");
            if (!storedUuid) {
                storedUuid = NumberUtls.randomWord();
                StoreUtils.getInstance().set(StoreUtils.uuid, Type.String, storedUuid);
                this.uuid = storedUuid;
                this.register();
                setTimeout(() => {
                    this.grade(1);
                }, 300);
            }
            this.uuid = storedUuid;
            this.login();
        }
        return this.uuid;
    }

    adLogin(uuid: string): void {
        if (EventHelper.channel !== "") {
            adLogin({
                params: {
                    channel: EventHelper.channel
                },
                header: {
                    gameAppkey: EventHelper.gameAppkey,
                    uuid: uuid
                }
            }).then((response: any) => {
                LogUtils.info("广告用户登录=====");
            }).catch((error: any) => {
            });
        }
    }

    adRegister(uuid: string): void {
        if (EventHelper.channel !== "") {
            adRegister({
                params: {
                    channel: EventHelper.channel
                },
                header: {
                    gameAppkey: EventHelper.gameAppkey,
                    uuid: uuid
                }
            }).then((response: any) => {
            }).catch((error: any) => {
            });
        }
    }

    adPurchase(amount: number, uuid: string): void {
        if (EventHelper.channel !== "") {
            let os: string = "android";
            if (SDKInstance.isWxPlatform()) {
                const systemInfo = wx.getSystemInfoSync();
                if (systemInfo.platform === "ios" || systemInfo.platform === "mac") {
                    os = "ios";
                }
            } else {
                os = "android";
            }
            adPurchase({
                params: {
                    channel: EventHelper.channel,
                    payCount: 1,
                    payAmount: amount,
                    os: os
                },
                header: {
                    gameAppkey: EventHelper.gameAppkey,
                    uuid: uuid
                }
            }).then((response: any) => {
            }).catch((error: any) => {
            });
        }
    }

    xGameActivateTracking(): void {
        const params = {
            app_id: this.xGameAppId,
            device_os: "ios",
            idfa: EventHelper.idfa,
            idfv: EventHelper.idfv
        };
        xGameTracking("/app/activate.tracking", {
            params: params
        }).then((response: any) => {
            console.log("activate.tracking result: ", response);
            const data = JSON.parse(response);
            this.xGameActiveResult = data.data;
            this.xGamereportEvent(0);
        }).catch((error: any) => {
            console.log("activate.tracking error: ", error);
        });
    }

    xGamereportEvent(eventType: number, customType: number = 0, eventName: number = 0): void {
        if (this.xGameActiveResult !== "") {
            const activeResult = JSON.parse(this.xGameActiveResult);
            if (activeResult.active_state !== 0 && activeResult.convert_state !== 1 && activeResult.convert_type === eventType && (activeResult.convert_type !== 5 || activeResult.custom_event_type === customType)) {
                const params = {
                    app_id: this.xGameAppId,
                    device_os: "ios",
                    idfa: EventHelper.idfa,
                    idfv: EventHelper.idfv,
                    device_id: activeResult.device_id,
                    event_type: eventType,
                    event_name: eventName,
                    custom_type: customType
                };
                xGameTracking("/app/custom_event.tracking", {
                    params: params
                }).then((response: any) => {
                    console.log("custom_event.tracking result: ", response);
                }).catch((error: any) => {
                    console.log("custom_event.tracking error: ", error);
                });
            }
        }
    }

    wxTracking(actionType: string, value?: number): void {
        if (EventHelper.wxClickID !== "") {
            let params: any = {};
            if (actionType === "PURCHASE") {
                params = {
                    actions: [{
                        action_time: Math.round(new Date().getTime() / 1000),
                        user_id: {
                            wechat_app_id: ConfigHelper.getGameInfo().appId,
                            wechat_openid: Global.openId
                        },
                        action_type: actionType,
                        trace: {
                            click_id: EventHelper.wxClickID
                        },
                        action_param: {
                            value: value
                        }
                    }]
                };
            } else {
                params = {
                    actions: [{
                        action_time: Math.round(new Date().getTime() / 1000),
                        user_id: {
                            wechat_app_id: ConfigHelper.getGameInfo().appId,
                            wechat_openid: Global.openId
                        },
                        action_type: actionType,
                        trace: {
                            click_id: EventHelper.wxClickID
                        }
                    }]
                };
            }
            console.log("wxTracking: ", JSON.stringify(params));
            wxTracking({
                params: params
            }).then((response: any) => {
                console.log("wxTracking success: ", response);
            }).catch((error: any) => {
                console.log("wxTracking error: ", error);
            });
        }
    }

    wechatReportEvent(eventType: string, payAmount?: number): void {
        if (EventHelper.clueToken !== "") {
            const eventToken = ConfigHelper.getGameConfig().eventToken;
            const timestamp = Math.round(new Date().getTime() / 1000);
            const nonce = this.randomTwoNum(1, 10000);
            const sortArray = [eventToken, timestamp, nonce];
            sortArray.sort();
            let signatureStr = "";
            sortArray.forEach((item: any) => {
                signatureStr += item;
            });
            const url = "https://api.quduoduodata.top/api/util/bytePointHttp?timestamp=" + timestamp + "&nonce=" + nonce + "&signature=" + DigestUtils.instance.SHA1(signatureStr);
            let params: any = {};
            if (eventType === "2") {
                params = {
                    clue_token: EventHelper.clueToken,
                    open_id: Global.openId,
                    event_type: eventType,
                    props: {
                        pay_amount: payAmount
                    }
                };
            } else {
                params = {
                    clue_token: EventHelper.clueToken,
                    open_id: Global.openId,
                    event_type: eventType
                };
            }
            xGameTracking(url, {
                params: params
            }).then((response: any) => {
                LogUtils.info("wechatReportEvent success: ", response);
            }).catch((error: any) => {
                LogUtils.info("wechatReportEvent error: ", error);
            });
        }
    }

    ksReportEvent(eventType: string, purchaseAmount: number = 0): void {
        if (EventHelper.ksCallback !== "") {
            const eventTime = new Date().getTime();
            let params: any = {};
            if (purchaseAmount === 0) {
                params = {
                    event_type: eventType,
                    event_time: eventTime,
                    callback: EventHelper.ksCallback
                };
            } else {
                params = {
                    event_type: eventType,
                    event_time: eventTime,
                    callback: EventHelper.ksCallback,
                    purchase_amount: purchaseAmount
                };
            }
            xGameTracking("https://api.quduoduodata.top/api/util/ksPointHttp", {
                params: params
            }).then((response: any) => {
                LogUtils.info("ksReportEvent success: ", response);
            }).catch((error: any) => {
                LogUtils.info("ksReportEvent error: ", error);
            });
        }
    }

    randomTwoNum(min: number, max: number): number {
        const range = max - min + 1;
        return Math.floor(Math.random() * range + min);
    }

    bilibiliTracking(convType: string, convValue?: number): void {
        if (EventHelper.wxClickID !== "") {
            let url = "https://cm.bilibili.com/conv/api/conversion/ad/cb/v1?conv_type=" + convType + "&conv_time=" + Math.round(new Date().getTime() / 1000) + "&track_id=" + EventHelper.wxClickID;
            if (convType === "USER_COST") {
                url = url + "&conv_value=" + convValue;
            }
            bilibiliTracking(url).then((response: any) => {
                console.log("bilibiliTracking success: ", response);
            }).catch((error: any) => {
                console.log("bilibiliTracking error: ", error);
            });
        }
    }

    relevance(openid: string): void {
        LogUtils.info("relevance op: ", EventHelper.clickid);
        if (EventHelper.clickid !== "") {
            LogUtils.info("relevance: ", openid, EventHelper.clickid);
            relevance("https://api.quduoduodata.top/api/dyminigame/new/relevance", {
                params: {
                    openid: openid,
                    clickid: EventHelper.clickid,
                    accountid: EventHelper.accountid,
                    gameType: 5
                }
            }).then((response: any) => {
                LogUtils.info("relevance success: ", response);
            }).catch((error: any) => {
                LogUtils.info("relevance fail: ", error);
            });
        }
    }

    conversion(type: string, value?: number): void {
        LogUtils.info("conversion op: ", EventHelper.openid);
        if (EventHelper.openid !== "") {
            LogUtils.info("conversion: ", type);
            const url = "https://api.quduoduodata.top/api/dyminigame/new/conversion";
            if (type === "game_addiction") {
                conversion(url, {
                    params: {
                        openid: EventHelper.openid,
                        type: type,
                        ipu: value,
                        gameType: 5
                    }
                }).then((response: any) => {
                    LogUtils.info("conversion success: ", response);
                }).catch((error: any) => {
                    LogUtils.info("conversion fail: ", error);
                });
            } else if (type === "active_pay") {
                conversion(url, {
                    params: {
                        openid: EventHelper.openid,
                        type: type,
                        price: value,
                        gameType: 5
                    }
                }).then((response: any) => {
                    LogUtils.info("conversion pay success: ", response);
                }).catch((error: any) => {
                    LogUtils.info("conversion pay fail: ", error);
                });
            } else {
                conversion(url, {
                    params: {
                        openid: EventHelper.openid,
                        type: type,
                        gameType: 5
                    }
                }).then((response: any) => {
                    LogUtils.info("conversion success: ", response);
                }).catch((error: any) => {
                    LogUtils.info("conversion fail: ", error);
                });
            }
        }
    }

    customEvent(eventData: any): void {
    }

    login(): void {
    }

    register(): void {
    }

    getHeader(): any {
        return {
            gameAppkey: EventHelper.gameAppkey,
            uuid: this.uuid
        };
    }

    noviceGuidance(attribute: string): void {
        this.customEvent({
            eventName: "_新手引导",
            attribute: attribute
        });
    }

    gameTime(): void {
    }

    levelStart(level: string): void {
        this.customEvent({
            eventName: "_关卡",
            attribute: level + "_开始"
        });
    }

    levelEnd(level: string, result: string): void {
        this.customEvent({
            eventName: "_关卡",
            attribute: level + "_结束_" + result
        });
    }

    grade(level: number): void {
        this.customEvent({
            eventName: "_等级",
            attribute: "" + level
        });
    }

    signIn(day: number, type: string = "single"): void {
        if (day > 30) {
            return;
        }
        if (type === "single" || type === "double") {
            signEvent({
                header: this.getHeader(),
                params: {
                    day: day,
                    type: type
                }
            });
        } else {
            LogUtils.warn("打点签到 type 值错误");
        }
    }

    loadStart(sceneName: string, isMainScene: number = 0): void {
        setTimeout(() => {
            const sessionId = NumberUtils.generateId();
            (window as any)[sceneName + "_time"] = new Date().getTime();
            (window as any)[sceneName + "_id"] = sessionId;
            loadStartEvent({
                header: this.getHeader(),
                params: {
                    sessionId: sessionId,
                    sceneName: sceneName,
                    isMainScene: isMainScene
                }
            });
        }, 150);
    }

    loadEnd(sceneName: string): void {
        setTimeout(() => {
            const currentTime = new Date().getTime();
            const startTime = (window as any)[sceneName + "_time"];
            const sessionId = (window as any)[sceneName + "_id"];
            if (startTime !== undefined && sessionId !== undefined) {
                (window as any)[sceneName + "_time"] = undefined;
                (window as any)[sceneName + "_id"] = undefined;
                let loadTime = currentTime - startTime;
                if (loadTime > 60000) {
                    loadTime = 60000;
                }
                loadEndEvent({
                    header: this.getHeader(),
                    params: {
                        sessionId: sessionId,
                        loadTime: loadTime
                    }
                });
            }
        }, 150);
    }

    recordAdvert(attribute: string): void {
        this.customEvent({
            eventName: "_广告打点",
            attribute: attribute
        });
    }

    videoStartEvent(location: string): void {
        videoEvent({
            header: this.getHeader(),
            params: {
                results: "start",
                location: location
            }
        }).then(() => {
        }).catch(() => {
        });
    }

    videoComplete(location: string): void {
        videoEvent({
            header: this.getHeader(),
            params: {
                results: "complete",
                location: location
            }
        }).then(() => {
        }).catch(() => {
        });
    }

    videoNotFinished(location: string): void {
        videoEvent({
            header: this.getHeader(),
            params: {
                results: "notFinished",
                location: location
            }
        }).then(() => {
        }).catch(() => {
        });
    }
}