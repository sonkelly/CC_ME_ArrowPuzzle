import { game, sys } from "cc";
import { GameLogicConfig } from "./../GameLogicConfig";
import { AbstractPlatformSDK } from "./AbstractPlatformSDK";
import { AdControlUtils } from "./../Utils/AdControlUtils";
import { LogUtils } from "./../Utils/LogUtils";
import { PayUtils } from "./../Utils/PayUtils";
import { AjaxHelper } from "./../AjaxHelper";
import { EngineUtils } from "./../Utils/EngineUtils";
import { ConfigHelper } from "./../ConfigHelper";

export class QGameSDK extends AbstractPlatformSDK {
    private static _instance: QGameSDK;
    
    public isSupportAd: boolean = true;
    public userInfo: {
        openId: string;
        nickName: string;
        avatarUrl: string;
        gender: number;
        age: number;
        city: string;
        province: string;
        country: string;
    } = {
        openId: "",
        nickName: "",
        avatarUrl: "",
        gender: 0,
        age: 0,
        city: "",
        province: "",
        country: ""
    };
    public videoCallback: ((success: boolean) => void) | null = null;
    public gameOpenId: string = "";
    public gameOpenkey: string = "";
    public hostUrl: string = "https://qddzf.quduoduodata.top";

    public static getInstance(): QGameSDK {
        if (this._instance === undefined) {
            this._instance = new QGameSDK();
        }
        return this._instance;
    }

    public initAdService(): void {
        const self = this;
        
        window.QGame.setCallbackMap("onADSupport", (result: number) => {
            LogUtils.info("onADSupport: ", result);
            if (result === 0) {
                self.isSupportAd = true;
            } else {
                self.isSupportAd = false;
                LogUtils.info("大厅版本过低");
            }
        });
        
        window.QGame.getSupportAD();
        
        window.QGame.setCallbackMap("onReward", () => {
            LogUtils.info("onReward====== ");
            if (EngineUtils.isCocos()) {
                game.resume();
            }
            if (self.videoCallback) {
                self.videoCallback(true);
            }
        });
        
        window.QGame.setCallbackMap("onADLoad", () => {
            LogUtils.info("onADLoad====== ");
        });
        
        window.QGame.setCallbackMap("onADCached", () => {
            LogUtils.info("onADCached====== ");
            if (EngineUtils.isCocos()) {
                game.pause();
            }
            window.QGame.showAD();
        });
        
        window.QGame.setCallbackMap("onADClose", () => {
            LogUtils.info("onADClose====== ");
            if (EngineUtils.isCocos()) {
                game.resume();
            }
        });
        
        window.QGame.setCallbackMap("onADError", (error: any) => {
            LogUtils.info("onADError:", error);
        });
        
        LogUtils.info("openid: ", this.getQueryString("gameopenid"));
        LogUtils.info("openkey: ", this.getQueryString("gameopenkey"));
        
        this.gameOpenId = this.getQueryString("gameopenid");
        this.gameOpenkey = this.getQueryString("gameopenkey");
        
        PayUtils.openId = this.gameOpenId;
        PayUtils.sessionKey = this.gameOpenkey;
    }

    public getQueryString(name: string): string | null {
        LogUtils.info("href: ", document.location.href);
        const regExp = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        const matchResult = window.location.search.slice(1).match(regExp);
        if (matchResult !== null) {
            return decodeURI(matchResult[2]);
        }
        return null;
    }

    public login(params: any = {}): void {
        const self = this;
        LogUtils.info("login===========");
        
        AjaxHelper.ajaxGet({
            url: this.hostUrl + "/app/qqGameHall/checkLogin?openid=" + this.gameOpenId + "&openkey=" + this.gameOpenkey
        }).then((response: string) => {
            if (response) {
                const responseData = JSON.parse(response);
                if (responseData.ret === 0) {
                    LogUtils.info("checkLogin success=== ");
                    
                    AjaxHelper.ajaxGet({
                        url: self.hostUrl + "/app/qqGameHall/getLoginInfo?openid=" + self.gameOpenId + "&openkey=" + self.gameOpenkey
                    }).then((userResponse: string) => {
                        if (userResponse) {
                            const userData = JSON.parse(userResponse);
                            if (userData.ret === 0) {
                                LogUtils.info("获取用户信息成功: ", userData.ret);
                                self.userInfo.nickName = userData.nickname;
                                self.userInfo.avatarUrl = userData.figureurl;
                                PayUtils.openId = self.gameOpenId;
                                self.userInfo.openId = self.gameOpenId;
                                if (params.resultCallback) {
                                    params.resultCallback(true, self.userInfo);
                                }
                            } else {
                                LogUtils.info("获取用户信息失败: ", userData.ret);
                            }
                        } else {
                            LogUtils.info("获取用户信息为空");
                            if (params.resultCallback) {
                                params.resultCallback(false);
                            }
                        }
                    }).catch((error: any) => {
                        LogUtils.info("获取用户信息失败");
                        if (params.resultCallback) {
                            params.resultCallback(false);
                        }
                    });
                    
                    self.getBalance().then((balanceResponse: string) => {
                        if (balanceResponse) {
                            const balanceData = JSON.parse(balanceResponse);
                            LogUtils.info("查询余额结果: ", balanceData);
                            if (balanceData.ret === 0) {
                                LogUtils.info("游戏币数量: ", balanceData.balance);
                                LogUtils.info("累计充值金额的游戏币数量: ", balanceData.save_amt);
                                PayUtils.saveAmt = balanceData.save_amt;
                            } else {
                                LogUtils.info("查询余额失败: ", balanceData.ret);
                            }
                        }
                    }).catch((error: any) => {
                        LogUtils.info("查询余额失败: ", error);
                    });
                } else {
                    LogUtils.info("checkLogin fail:  ", responseData.ret, responseData.msg);
                    if (params.resultCallback) {
                        params.resultCallback(false);
                    }
                }
            } else {
                if (params.resultCallback) {
                    params.resultCallback(false);
                }
            }
        }).catch((error: any) => {
            LogUtils.info("checkLogin err: ", error);
            if (params.resultCallback) {
                params.resultCallback(false);
            }
        });
    }

    public getBalance(): Promise<string> {
        return AjaxHelper.ajaxGet({
            url: this.hostUrl + "/app/qqGameHall/getBalance?openid=" + this.gameOpenId + "&openkey=" + this.gameOpenkey + "&ts=" + Math.round(new Date().getTime() / 1000)
        });
    }

    public pay(orderSn: string): Promise<string> {
        return AjaxHelper.ajaxGet({
            url: this.hostUrl + "/app/qqGameHall/pay?openid=" + this.gameOpenId + "&openkey=" + this.gameOpenkey + "&orderSn=" + orderSn + "&ts=" + Math.round(new Date().getTime() / 1000)
        });
    }

    public present(presentTimes: string): Promise<string> | undefined {
        if (ConfigHelper.getGameConfig().appKey === "sjkcbK1OaPmv9lk2") {
            return AjaxHelper.ajaxGet({
                url: "https://531056wi67.oicp.vip/app/qqGameHall/present?openid=" + this.gameOpenId + "&openkey=" + this.gameOpenkey + "&presenttimes=" + presentTimes + "&ts=" + Math.round(new Date().getTime() / 1000)
            }).then((response: string) => {
                LogUtils.info("赠送成功: ", response);
            });
        }
        return undefined;
    }

    public createVideoAd(): void {
        LogUtils.info("createVideoAd ===");
    }

    public showVideoAd(params: any = {}): void {
        LogUtils.info("showVideoAd ===");
        
        if (AdControlUtils.isShowVideo() === false) {
            this.showToast("当前暂无可播放广告");
            if (params.videoCallback) {
                params.videoCallback(false);
            }
            return;
        }
        
        if (this.isSupportAd) {
            this.videoCallback = params.videoCallback;
            window.QGame.loadAD();
        }
    }

    public createBannerAd(): void {
        LogUtils.info("createBannerAd ===");
    }

    public showBannerAd(params: any): void {
        LogUtils.info("showBannerAd===");
    }

    public hideBannerAd(): void {
        LogUtils.info("hideBannerAd===");
    }

    public createIntertAd(): void {
        LogUtils.info("createIntertAd ===");
    }

    public showIntertAd(params: any = {}): void {
        LogUtils.info("showIntertAd ===");
        if (AdControlUtils.isShowInter() === false) {
            if (params.resultCallback) {
                params.resultCallback(false);
            }
        }
    }

    public vibrateShort(): void {
        // Empty implementation
    }

    public vibrateLong(): void {
        // Empty implementation
    }

    public showToast(message: string): void {
        // Empty implementation
    }

    public addDesktopIcon(params: any): void {
        LogUtils.info("addDesktopIcon===");
    }

    public getPlatformVersionCode(): string {
        return this.getSystemInfo().SDKVersion;
    }

    public getNetworkType(callback: (networkType: string) => void): void {
        callback(sys.getNetworkType());
    }

    public getGameVersion(): string {
        return GameLogicConfig.miniGameVersion;
    }

    public platformVersionSupport(version: string): boolean {
        return false;
    }
}