import { _decorator, game } from 'cc';
import { DnSdkManager } from './../DnSdkManager';
import { AudioManager } from './../AudioManager';
import { GameLogicConfig } from './../GameLogicConfig';
import { GameChannel } from './../GameChannel';

export class LieyouSDK {
    static async init(){
        const sdkConfig = GameChannel.isCloneXJJ ? {
            oppoGetOnlineDataId: "", //qgame_61c01f42e0f9bb492ba06949
            gameVersion: GameLogicConfig.game_version,
            wxAppId: "", //wx5ce62ccefb797a8d
            wxVersion: 2,
            wxVideoId: [""], //adunit-b8a4ee1d3c057554
            wxBannerId: [""], //adunit-e2f36ed186c479a0
            wxSpotId: [""], //adunit-eafe7e234e461e70
            GEAccessToken: "" //oIqJnnecyUtvz3Lbkirm5pdlukoaZgCH
        } : {
            oppoGetOnlineDataId: "", //qgame_604ef3e3b8c8d45c139ba3c5
            gameVersion: GameLogicConfig.game_version,
            wxAppId: "", //wxb555c860a0799da9
            wxVersion: 4,
            wxVideoId: [""], //adunit-f9358a6fab76c364
            wxBannerId: [""], //adunit-4dbda9e57407733e
            wxSpotId: [""], //adunit-fd75abcbf655c7ca
            GEAccessToken: "" //7CRxWib2mhycpdgdevkTylYzrreXasiL
        };

        return new Promise<string>((resolve, reject) => {
            lieyou.api.init({
                initDataComplete: () => {
                    console.log("SDK init complete:", sdkConfig);
                    const openId = lieyou._core.user.openId;
                    const uuid = lieyou._core.user.uuid;
                    let userId = openId;
                    if (!userId || userId === "") {
                        userId = uuid;
                    }
                    resolve(userId);
                },
                sdkConfig: sdkConfig
            });
        });
    };

    static getHaveVideo(): boolean {
        return lieyou.api.getHaveVideo();
    }

    static showRewardedVideoAd(params: { videoCallback?: (success: boolean) => void } = {}): void {
        AudioManager.instance.stop_bgm();
        game.pause();
        lieyou.api.showRewardedVideoAd({
            success: () => {
                console.log("video ad success");
                if (params.videoCallback) {
                    params.videoCallback(true);
                }
            },
            fail: (error: any) => {
                console.log("video ad fail:", error);
                if (error.code === 1005) {
                    LieyouSDK.showToast("未观看完整视频，无法获得奖励");
                }
                if (params.videoCallback) {
                    params.videoCallback(false);
                }
            },
            complete: (result: any) => {
                game.resume();
                AudioManager.instance.resume_bgm();
                console.log("video ad complete:", result);
            }
        });
    }

    static getShareEnabled(): boolean {
        return lieyou.api.getShareEnabled();
    }

    static shareTo(location: string, shareType: string): void {
        lieyou.api.shareTo({
            location: location,
            shareType: shareType,
            success: () => {
                console.log("share ad success");
                const sdk = DnSdkManager.instance.sdk;
                if (sdk) {
                    sdk.track("SHARE", {
                        target: "APP_MESSAGE"
                    });
                }
            },
            fail: (error: any) => {
                console.log("share ad fail:", error);
            }
        });
    }

    static gameBeginLevel(level: any, data: any): void {
        console.log("gameBeginLevel: ", data, level);
        lieyou.api.gameBeginLevel(level, data);
    }

    static gameFailLevel(level: any, data: any, error: any): void {
        console.log("gameFailLevel: ", data, level, error);
        lieyou.api.gameFailLevel(level, data, error);
    }

    static gameFinishLevel(level: any, data: any): void {
        console.log("gameFinishLevel: ", data, level);
        lieyou.api.gameFinishLevel(level, data);
    }

    static gameReviveLevel(level: any, data: any, reviveData: any): void {
        console.log("gameReviveLevel: ", data, level, reviveData);
        lieyou.api.gameReviveLevel(level, data, reviveData);
    }

    static showToast(message: string): void {
        wx.showToast({
            title: message,
            icon: "none"
        });
    }

    static getFeedPlan(): { id: number; type: number; url: string } | null {
        if (!window.wx) {
            return null;
        }
        const launchOptions = window.wx.getLaunchOptionsSync();
        if (launchOptions.query.wx_aid) {
            const wxAid = launchOptions.query.wx_aid;
            const feedConf = lieyou.api.getGameCustomParams().feedConf || {};
            console.log("feedConf:", feedConf);
            if (wxAid in feedConf) {
                const feedValue = feedConf[wxAid];
                const parsedParams = this.parseQueryString(feedValue);
                console.log("feed params:", parsedParams);
                return {
                    id: Number(parsedParams.id),
                    type: Number(parsedParams.type),
                    url: parsedParams.url
                };
            }
        }
        return null;
    }

    static parseQueryString(queryString: string): Record<string, string> {
        const result: Record<string, string> = {};
        let processedQuery = queryString;
        if (processedQuery.startsWith("?")) {
            processedQuery = processedQuery.substring(1);
        }
        const pairs = processedQuery.split("&");
        for (const pair of pairs) {
            const parts = pair.split("=");
            const key = parts[0];
            const value = parts[1];
            if (key) {
                result[decodeURIComponent(key)] = decodeURIComponent(value || "");
            }
        }
        return result;
    }
}