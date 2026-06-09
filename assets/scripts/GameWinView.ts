import { _decorator, Component, Node, sp, Label, tween, Vec3 } from 'cc';
import { UILayerManager } from './UILayerManager';
import { UIManager } from './UIManager';
import { GameManager } from './GameManager';
import { BasePanel } from './BasePanel';
import { Utilsqdd } from './Utils/Utilsqdd';
import { TimeTaskManager } from './TimeTaskManager';
import { GameController } from './GameController';
import { AudioUtils } from './Utils/AudioUtils';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { GameLogicConfig } from './GameLogicConfig';
import { GameRecord } from './GameRecord';
import { BaseDataManager } from './BaseDataManager';
import { RankDataManager } from './RankDataManager';
import { GameType } from './GlobalEnum';
import { TournamentDataManager } from './Tournament/TournamentDataManager';
import { VibrateManager } from './VibrateManager';
import { FB1vs1DataManager } from './FB1vs1DataManager';
import { HeartSource } from './HeartManager';
import { EasDataSDK } from './EasDataSDK';
import { EasOperateSDK } from './EasOperateSDK';
import { Utils } from './Utils';
import { TournamentWxMgr } from './Tournament/TournamentWxMgr';
import { TrackManager } from './TrackManager';
declare const SDKInstance : any;

const { ccclass, property } = _decorator;

@ccclass('GameWinView')
export class GameWinView extends BasePanel {
    @property(Node)
    bg: Node = null;

    @property(sp.Skeleton)
    fireSpine: sp.Skeleton = null;

    @property(Node)
    winNode: Node = null;

    @property(Node)
    tournamentNode: Node = null;

    @property(Label)
    lbScore: Label = null;

    @property(Node)
    btnNext: Node = null;

    @property(Label)
    lbWin: Label = null;

    onLoad(): void {
        this.addListen();
    }

    onDestroy(): void {
        // Cleanup if needed
    }

    addListen(): void {
        // Add event listeners if needed
    }

    setData(data: any): void {
        const self = this;
        const currentLevel = GameManager.instance.curLevel;
        console.log("胜利lililili:", currentLevel, data);
        this.initView();
        AudioUtils.game_win();

        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        const randomIndex = Utilsqdd.randomTwoNum(0, this.winNode.children.length - 1);

        this.winNode.children.forEach((child, index) => {
            child.active = index === randomIndex;
        });

        this.btnNext.active = false;
        this.tournamentNode.active = true;
        this.lbWin.node.active = false;

        tween(this.winNode)
            .to(1, { scale: Vec3.ONE }, { easing: "backOut" })
            .call(() => {})
            .start();

        this.fireSpine.setCompleteListener(async () => {
            self.scheduleOnce(async () => {
                if (SDKInstance.isGooglePlayNative()) {
                    let levelType = "MainLevel";
                    if (data.isRescue) {
                        levelType = "RescueLevel";
                    } else if (GameManager.instance.gameType === GameType.Challenge) {
                        levelType = "Challenge";
                    } else if (GameManager.instance.gameType === GameType.Tournament) {
                        levelType = "Tournament";
                    }
                    Utils.instance.GameWin(currentLevel.toString(), levelType, !baseRecorder.Data.PurchasedNoAds);
                }
                if (GameManager.instance.gameType === GameType.MainLevel && baseRecorder.Data.CurLevel <= 4) {
                    if (currentLevel >= EasOperateSDK.intersAdLevel && !baseRecorder.Data.PurchasedNoAds) {
                        SDKInstance.showIntertAd({
                            resultCallback: async (result: boolean) => {
                                if (result) {
                                    let adId = "level_main";
                                    let adSource = currentLevel.toString();
                                    if (GameManager.instance.gameType === GameType.Challenge) {
                                        adId = "level_challenge";
                                        adSource = (100 * (new Date().getMonth() + 1) + currentLevel).toString();
                                    } else if (GameManager.instance.gameType === GameType.Tournament) {
                                        adId = "level_tournament";
                                    } else if (GameManager.instance.gameType === GameType.Pvp) {
                                        adId = "level_pvp";
                                    }
                                    EasDataSDK.trackEvent("ad", {
                                        ad_type: "Interstitial",
                                        ad_state: "ad_show",
                                        is_in_chapter: 0,
                                        ad_id: adId,
                                        ad_source: adSource
                                    });
                                } else {
                                    if (SDKInstance.isGooglePlayNative()) {
                                        Utils.instance.StartGame(baseRecorder.Data.CurLevel.toString(), "MainLevel");
                                    }
                                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, baseRecorder.Data.CurLevel, GameType.MainLevel);
                                    UIManager.deleteNode("GameWinView");
                                }
                            },
                            closeCallback: async () => {
                                if (SDKInstance.isGooglePlayNative()) {
                                    Utils.instance.StartGame(baseRecorder.Data.CurLevel.toString(), "MainLevel");
                                }
                                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, baseRecorder.Data.CurLevel, GameType.MainLevel);
                                UIManager.deleteNode("GameWinView");
                            }
                        });
                    } else {
                        if (SDKInstance.isGooglePlayNative()) {
                            Utils.instance.StartGame(baseRecorder.Data.CurLevel.toString(), "MainLevel");
                        }
                        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, baseRecorder.Data.CurLevel, GameType.MainLevel);
                        UIManager.deleteNode("GameWinView");
                    }
                } else {
                    if (currentLevel >= EasOperateSDK.intersAdLevel && !baseRecorder.Data.PurchasedNoAds) {
                        SDKInstance.showIntertAd({
                            resultCallback: async (result: boolean) => {
                                if (result) {
                                    let adId = "level_main";
                                    let adSource = currentLevel.toString();
                                    if (GameManager.instance.gameType === GameType.Challenge) {
                                        adId = "level_challenge";
                                        adSource = (100 * (new Date().getMonth() + 1) + currentLevel).toString();
                                    } else if (GameManager.instance.gameType === GameType.Tournament) {
                                        adId = "level_tournament";
                                    } else if (GameManager.instance.gameType === GameType.Pvp) {
                                        adId = "level_pvp";
                                    }
                                    EasDataSDK.trackEvent("ad", {
                                        ad_type: "Interstitial",
                                        ad_state: "ad_show",
                                        is_in_chapter: 0,
                                        ad_id: adId,
                                        ad_source: adSource
                                    });
                                } else {
                                    self.onCloseClick();
                                    if (GameManager.instance.gameType === GameType.MainLevel && baseRecorder.Data.CurLevel > 5 && (!data.isRescue || GameManager.instance.forceRescueLevel(currentLevel))) {
                                        await TournamentDataManager.instance.createTournament(baseRecorder.Data.CurLevel - 1, GameManager.instance.currentScore);
                                    }
                                    if (GameManager.instance.gameType === GameType.Tournament) {
                                        TournamentDataManager.instance.share(GameManager.instance.curLevel, GameManager.instance.currentScore);
                                    }
                                }
                            },
                            closeCallback: async () => {
                                self.onCloseClick();
                                if (GameManager.instance.gameType === GameType.MainLevel && baseRecorder.Data.CurLevel > 5 && (!data.isRescue || GameManager.instance.forceRescueLevel(currentLevel))) {
                                    await TournamentDataManager.instance.createTournament(baseRecorder.Data.CurLevel - 1, GameManager.instance.currentScore);
                                }
                                if (GameManager.instance.gameType === GameType.Tournament) {
                                    TournamentDataManager.instance.share(GameManager.instance.curLevel, GameManager.instance.currentScore);
                                }
                            }
                        });
                    } else {
                        self.onCloseClick();
                        if (GameManager.instance.gameType === GameType.MainLevel && baseRecorder.Data.CurLevel > 5 && (!data.isRescue || GameManager.instance.forceRescueLevel(currentLevel))) {
                            await TournamentDataManager.instance.createTournament(baseRecorder.Data.CurLevel - 1, GameManager.instance.currentScore);
                        }
                        if (GameManager.instance.gameType === GameType.Tournament) {
                            TournamentDataManager.instance.share(GameManager.instance.curLevel, GameManager.instance.currentScore);
                        }
                    }
                }
            });
        });

        this.lbScore.string = "Score: " + GameManager.instance.currentScore;
        VibrateManager.instance.vibrateShort();

        switch (GameManager.instance.gameType) {
            case GameType.MainLevel:
                if (!baseRecorder.isHeartInInfinite()) {
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddHeart, 1, true, HeartSource.LevelPass);
                }

                if (!data.isRescue || GameManager.instance.forceRescueLevel(currentLevel)) {
                    const chapterId = currentLevel;
                    EasDataSDK.userSet({ chapter_id: currentLevel.toString() });

                    const tier = baseRecorder.Data.TierData ? baseRecorder.Data.TierData.tier : 0;
                    RankDataManager.instance.commitRankingScore([chapterId], {
                        nickname: BaseDataManager.nickName,
                        avatar: BaseDataManager.userAvatar,
                        title: tier
                    }).then(() => {
                        console.log("成绩提交成功");
                    }).catch((error: any) => {
                        console.warn("成绩提交失败:", error.code, error.message);
                    });

                    if (BaseDataManager.isNewUser && SDKInstance.isFacebookMiniGame()) {
                        if (currentLevel === 4) {
                            SDKInstance.createShortcut();
                        } else if (currentLevel === 6) {
                            SDKInstance.subscribeBot();
                        }
                    }

                    if (SDKInstance.isFacebookMiniGame()) {
                        RankDataManager.instance.updateUserInfo(chapterId, tier).then(() => {
                            console.log("上报用户信息成功");
                        }).catch((error: any) => {
                            console.warn("上报用户信息失败:", error);
                        });
                    }

                    TrackManager.instance.onLevelComplete();
                } else {
                    EasDataSDK.userSet({ chapter_id_save: currentLevel.toString() });
                }
                break;

            case GameType.Challenge:
                EasDataSDK.userSet({ chapter_id_daily: GameManager.instance.getLevelId() });
                break;

            case GameType.Tournament:
                if (SDKInstance.isGooglePlayNative()) {
                    TournamentWxMgr.instance.submitScore(GameManager.instance.currentScore);
                } else {
                    TournamentDataManager.instance.submitScore(GameManager.instance.currentScore);
                }
                EasDataSDK.userSet({ chapter_id_match: GameManager.instance.getLevelId() });
                break;

            case GameType.Pvp:
                FB1vs1DataManager.instance.updateAsync(GameManager.instance.curLevel, GameManager.instance.currentScore, false);
                this.lbWin.node.active = false;

                const pvpData = FB1vs1DataManager.instance.get1vs1Data();
                if (pvpData && pvpData.score && pvpData.score > 0 && pvpData.score > GameManager.instance.currentScore) {
                    this.lbWin.string = pvpData.name + " Wins!";
                } else {
                    this.lbWin.string = BaseDataManager.nickName + " Wins!";
                }
                break;
        }

        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet, [false]);
    }

    start(): void {
        // Start logic if needed
    }

    initView(): void {
        GameManager.instance.firstInGame = true;
    }

    onCloseClick(): void {
        UILayerManager.instance.showMainMenu();
        GameController.instance.is_pause = true;
        TimeTaskManager.addTimeTask(() => {
            GameManager.instance.curStage.gameCamera.resetCameraLocation();
            GameManager.instance.curStage.clear(true);
        }, 0.1);

        console.log("onCloseClick:", GameManager.instance.gameType);

        if (GameManager.instance.gameType === GameType.Tournament) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateTournament);
        } else if (GameManager.instance.gameType === GameType.Pvp) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.HidePvpUI);
        }

        UIManager.deleteNode("GameWinView");
    }
}