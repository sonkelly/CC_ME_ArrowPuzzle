import { cclegacy, sys, game } from "cc";
import { AbstractPlatformSDK } from "./AbstractPlatformSDK";
import { AdControlUtils } from "./../Utils/AdControlUtils";
import { EngineUtils } from "./../Utils/EngineUtils";
import { LogUtils } from "./../Utils/LogUtils";
import { DigestUtils } from "./../Utils/DigestUtils";
import { PayUtils } from "./../Utils/PayUtils";

export class FourThreeNineNine extends AbstractPlatformSDK {
    private static _instance: FourThreeNineNine;
    
    public gameId: string = "";
    public userId: string = "";
    public userName: string = "";
    public loginTime: string = "";
    public loginSign: string = "";
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

    public static getInstance(): FourThreeNineNine {
        if (this._instance === undefined) {
            this._instance = new FourThreeNineNine();
        }
        return this._instance;
    }

    public initAdService(): void {
        LogUtils.info("gameId: ", this.getQueryString("gameId"));
        LogUtils.info("userId: ", this.getQueryString("userId"));
        LogUtils.info("userName: ", decodeURI(this.getQueryString("userName")));
        LogUtils.info("time: ", this.getQueryString("time"));
        LogUtils.info("sign: ", this.getQueryString("sign"));
        
        this.gameId = this.getQueryString("gameId");
        this.userId = this.getQueryString("userId");
        this.userName = this.getQueryString("userName");
        this.loginTime = this.getQueryString("time");
        this.loginSign = this.getQueryString("sign");
    }

    public getQueryString(name: string): string | null {
        LogUtils.info("href: ", document.location.href);
        const regExp = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        const matchResult = window.location.search.slice(1).match(regExp);
        return matchResult !== null ? matchResult[2] : null;
    }

    public login(params: any = {}): void {
        const currentTime = Math.round(new Date().getTime() / 1000);
        
        LogUtils.info("timetime: ", currentTime - Number(this.loginTime));
        
        if (currentTime - Number(this.loginTime) > 120) {
            this.showToast("登录超时，请刷新页面重新登录");
            setTimeout(() => {
                this.logout();
            }, 1000);
            return;
        }

        const signData = {
            gameId: this.gameId,
            userId: this.userId,
            userName: this.userName,
            time: this.loginTime
        };
        
        const secretKey = "12c616cb50d1d7a1103b4e12bf01d214";
        let h5api: any = null;
        
        if (window.h5api) {
            h5api = window.h5api;
        }
        if (window.H5API) {
            h5api = window.H5API;
        }

        LogUtils.info("isreload", sessionStorage.getItem("isReload"));

        this.getLoginStatus().then((status: string) => {
            if (status === "false") {
                if (sessionStorage.getItem("isReload") === "23333") {
                    window.m4399loginError(true);
                } else {
                    window.m4399loginError(false);
                }
            } else {
                if (this.generateSign(signData, secretKey) === this.loginSign) {
                    LogUtils.info("签名验证成功");
                    this.userInfo.nickName = decodeURIComponent(this.userName);
                    this.userInfo.avatarUrl = h5api.getUserAvatar(this.userId);
                    PayUtils.openId = this.userId;
                    this.userInfo.openId = this.userId;
                    
                    if (params.resultCallback) {
                        params.resultCallback(true, this.userInfo);
                    }
                    sessionStorage.setItem("isReload", "23333");
                } else {
                    LogUtils.info("签名验证失败");
                    this.showToast("登录失败，请刷新页面或重新登录");
                    this.logout();
                }
            }
        }).catch(() => {
            if (this.generateSign(signData, secretKey) === this.loginSign) {
                LogUtils.info("签名验证成功");
                this.userInfo.nickName = decodeURIComponent(this.userName);
                this.userInfo.avatarUrl = h5api.getUserAvatar(this.userId);
                PayUtils.openId = this.userId;
                this.userInfo.openId = this.userId;
                
                if (params.resultCallback) {
                    params.resultCallback(true, this.userInfo);
                }
            } else {
                LogUtils.info("签名验证失败");
                this.showToast("登录失败，请刷新页面或重新登录");
                this.logout();
            }
        });
    }

    public generateSign(data: any, secretKey: string): string {
        const sortedData = this.ksort(data);
        let signString = "";
        
        for (const key in sortedData) {
            signString += key + "=" + decodeURIComponent(sortedData[key]);
        }
        
        return DigestUtils.instance.hex_md5(signString + secretKey);
    }

    public ksort(data: any): any {
        const sortedResult: any = {};
        const keys = Object.keys(data);
        
        keys.sort();
        keys.forEach((key) => {
            sortedResult[key] = data[key];
        });
        
        return sortedResult;
    }

    public getLoginStatus(): Promise<any> {
        return new Promise((resolve, reject) => {
            SDKInstance.getPackingPlatform();
            this.userId;
            SDKInstance.getGameVersion();
        });
    }

    public showVideoAd(params: any = {}): void {
        LogUtils.info("showVideoAd===");
        
        if (AdControlUtils.isShowVideo() === false) {
            if (params.videoCallback) {
                params.videoCallback(false);
            }
            this.showToast("当前暂无可播放广告");
            return;
        }

        let h5api: any = null;
        if (window.h5api) {
            h5api = window.h5api;
        }
        if (window.H5API) {
            h5api = window.H5API;
        }

        h5api.canPlayAd((result: any) => {
            LogUtils.info("是否可播放广告", result.canPlayAd, "剩余次数", result.remain);
            
            if (result.canPlayAd && result.remain) {
                h5api.playAd((adResult: any) => {
                    LogUtils.log("代码:" + adResult.code + ",消息:" + adResult.message);
                    
                    if (adResult.code === 10000) {
                        if (params.videOnStartCallback) {
                            params.videOnStartCallback();
                        }
                        params.videOnStartCallback = undefined;
                        
                        if (EngineUtils.isCocos()) {
                            game.pause();
                        }
                    } else if (adResult.code === 10001) {
                        if (EngineUtils.isCocos()) {
                            game.resume();
                        }
                        game.canvas.focus();
                        AdControlUtils.setShowVideoTime();
                        
                        if (params.videoCallback) {
                            params.videoCallback(true);
                        }
                        params.videoCallback = undefined;
                    } else {
                        if (EngineUtils.isCocos()) {
                            game.resume();
                        }
                        game.canvas.focus();
                        
                        if (params.videoCallback) {
                            params.videoCallback(false);
                        }
                        params.videoCallback = undefined;
                    }
                });
            }
        });
    }

    public autoClickVideo(callback: Function): void {
        if (AdControlUtils.autoClickVideo()) {
            callback(true);
        } else {
            callback(false);
        }
    }

    public showBannerAd(): void {
        // Empty implementation
    }

    public hideBannerAd(): void {
        // Empty implementation
    }

    public logout(): void {
        window.H5API.logout();
    }

    public showToast(message: string): void {
        // Empty implementation
    }

    public showIntertAd(params: any): void {
        // Empty implementation
    }

    public getNetworkType(callback: Function): void {
        callback(sys.getNetworkType());
    }

    public vibrateShort(): void {
        // Empty implementation
    }

    public vibrateLong(): void {
        // Empty implementation
    }

    public getPlatformVersionCode(): void {
        // Empty implementation
    }

    public platformVersionSupport(version: string): boolean {
        return true;
    }

    public getGameVersion(): string {
        return "1.0.0";
    }
}