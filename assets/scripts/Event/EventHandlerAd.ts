import { Global } from "./../Global";
import { Toast } from "./../Toast";
import { GameLogicConfig } from "./../GameLogicConfig";
import { JsonClassStorage } from "./../JsonClass";
import { EventManager } from "./../Event/EventManager";
import { ModuleEventKey } from "./../IGameRawData";
import { VideoDataManager } from "./../VideoDataManager";
import { GameRecord } from "./../GameRecord";
import { ModuleEventHandler } from "./../ModuleEventHandler";
import { ExcelVideoType, GameType } from "./../GlobalEnum";
import { UIManager } from "./../UIManager";
import { DnSdkManager } from "./../DnSdkManager";
import { EasDataSDK } from "./../EasDataSDK";
import { GameManager } from "./../GameManager";
import { TimeUtils } from "./../Utils/TimeUtils";
import { GameLocalStorage } from "./../GameLocalStorage";
import { UILayerManager } from "./../UILayerManager";

export class EventHandlerAd extends ModuleEventHandler {
    private videoType: number = 0;
    private videoParam: any;

    public OnInit(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSeeVideo, this.handler_WantSeeVideo, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.VideoSeeEnd, this.handler_VideoSeeEnd, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantReceiveVideoAward, this.handler_WantReceiveVideoAward, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.VideoInterrupt, this.handler_VideoInterrupt, this);
    }

    private handler_WantSeeVideo = (eventData: any[]): void => {
        this.videoType = eventData[0];
        this.videoParam = eventData[1];

        const videoInfo = VideoDataManager.GetVideoInfo(this.videoType);
        const videoConfig = JsonClassStorage.instance.getOneJson("VideoConfig", "Id", this.videoType);

        if (videoInfo.TodayNum >= videoConfig.DailyNum) {
            Toast.instance.tip_div("This video has been watched today");
        } else {
            GameRecord.GetInstance().VideoRecorder.UpdateVideoClickNum(this.videoType);

            if (Global.isDebug()) {
                this.gameVideoAdDot(this.videoType);
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.VideoSeeEnd, [this.videoType, false]);
                return;
            }

            if (SDKInstance.isWxPlatform()) {
                SDKInstance.genIAAReposrtData(videoConfig.Scene, videoConfig.Name, videoInfo.TodayClickNum, videoInfo.TodayNum);
            }

            SDKInstance.showVideoAd({
                videOnStartCallback: () => {
                    const adInfo = this.getAdInfo(this.videoType);
                    EasDataSDK.trackEvent("ad", {
                        ad_type: "ad_click",
                        ad_state: "ad_rewards",
                        is_in_chapter: adInfo.isInLevel,
                        ad_id: adInfo.adId,
                        ad_source: adInfo.adSource
                    });
                },
                videoCallback: (success: boolean) => {
                    if (success) {
                        this.gameVideoAdDot(this.videoType);
                        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.VideoSeeEnd, [this.videoType, false]);
                    } else {
                        console.log("未观看完视频广告");
                        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.VideoInterrupt, this.videoType);
                    }
                },
                adLocation: "视频" + eventData[0]
            });
        }
    };

    private handler_VideoInterrupt = (eventData: any): void => {
        // Empty handler
    };

    private handler_VideoSeeEnd = (eventData: any[]): void => {
        this.videoType = eventData[0];

        if (this.videoType < 1) {
            console.log("没有观看视频就领取奖励");
        } else {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantReceiveVideoAward, this.videoType);
            this.videoType = 0;
        }
    };

    private handler_WantReceiveVideoAward = (eventData: number): void => {
        const videoType = eventData;

        if (videoType === ExcelVideoType.REVIVE) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameRevive);
        } else if (videoType === ExcelVideoType.TIPS) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UseTips);
        } else if (videoType === ExcelVideoType.CHALLENGE) {
            DnSdkManager.instance.sdk?.track("AD_VIDEO_FINISH", {
                ad_placement_name: 58
            });
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.DailyChallenge, this.videoParam);
            UIManager.deleteNode("DailyChallengeView");
        } else if (videoType === ExcelVideoType.FILL_HEART) {
            DnSdkManager.instance.sdk?.track("AD_VIDEO_FINISH", {
                ad_placement_name: 2
            });
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.FillHeart, true);
        } else if (videoType === ExcelVideoType.FREE_GOLD) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShopFreeGold);
        } else if (videoType === ExcelVideoType.SHOP_FREE) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.VideoBuyCompleted, this.videoParam);
        }

        GameRecord.GetInstance().VideoRecorder.ResetVideoTime(videoType);
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.VideoDataChange);

        const adInfo = this.getAdInfo(videoType);
        EasDataSDK.trackEvent("ad", {
            ad_type: "rewarded",
            ad_state: "ad_rewards",
            is_in_chapter: adInfo.isInLevel,
            ad_id: adInfo.adId,
            ad_source: adInfo.adSource
        });

        EasDataSDK.userAdd({
            total_ad_num: 1
        });

        EasDataSDK.userSet({
            last_ad_time: TimeUtils.getCurrentTimeFormatted()
        });

        if (Number(GameLocalStorage.getItem("first_ad_chapter") || 0) === 0) {
            GameLocalStorage.setItem("first_ad_chapter", 1);
            EasDataSDK.userSetOnce({
                first_ad_chapter: GameManager.instance.getLevelId()
            });
            EasDataSDK.userSetOnce({
                first_ad_type: adInfo.adId
            });
        }
    };

    private getAdInfo = (videoType: number): { isInLevel: number; adId: string; adSource: string } => {
        let isInLevel = 1;
        let adId = "";
        let adSource = "";

        if (videoType === ExcelVideoType.REVIVE) {
            isInLevel = 0;
            adId = "add_life_ad";

            if (GameManager.instance.gameType === GameType.Challenge) {
                adId = "add_life_ad_challenge";
            } else if (GameManager.instance.gameType === GameType.Tournament) {
                adId = "add_life_ad_tournament";
            } else if (GameManager.instance.gameType === GameType.Pvp) {
                adId = "add_life_ad_pvp";
            }

            adSource = GameManager.instance.getLevelId();
        } else if (videoType === ExcelVideoType.TIPS) {
            isInLevel = 0;
            adSource = GameManager.instance.getLevelId();
        } else if (videoType === ExcelVideoType.CHALLENGE) {
            adId = "challenge_ad";
            adSource = "challenge_ad_" + GameManager.instance.getLevelId1();
        } else if (videoType === ExcelVideoType.FILL_HEART) {
            adId = "energy_ad";
            adSource = "energy";
        } else if (videoType === ExcelVideoType.FREE_GOLD) {
            isInLevel = UILayerManager.instance.isInGame ? 0 : 1;
            adId = "gold_ad";
            adSource = "gold";
        } else if (videoType === ExcelVideoType.SHOP_FREE) {
            adId = "shop_ad";
            adSource = "shop";
        }

        return {
            isInLevel: isInLevel,
            adId: adId,
            adSource: adSource
        };
    };

    private gameVideoAdDot = (videoType: number): void => {
        // Empty method
    };
}