import { _decorator, Component, Label, Node, tween, Vec3 } from 'cc';
import { GameType } from './GlobalEnum';
import { DnSdkManager } from './DnSdkManager';
import { GameController } from './GameController';
import { ModuleEventKey } from './IGameRawData';
import { BaseDataManager } from './BaseDataManager';
import { RankDataManager } from './RankDataManager';
import { TournamentWxMgr } from './Tournament/TournamentWxMgr';
import { GameRecord } from './GameRecord';
import { EventManager } from './Event/EventManager';
import { UILayerManager } from './UILayerManager';
import { VibrateManager } from './VibrateManager';
import { TimeTaskManager } from './TimeTaskManager';
import { UIManager } from './UIManager';
import { GameManager } from './GameManager';
import { LieyouSDK } from './SDK/LieyouSDK';
import { AudioUtils } from './Utils/AudioUtils';
import { BasePanel } from './BasePanel';
import { GameLogicConfig } from './GameLogicConfig';
import { HeartSource } from './HeartManager';
import { DirectPlayUtil } from './DirectPlayUtil';

const { ccclass, property } = _decorator;

@ccclass('GameWinViewWX')
export class GameWinViewWX extends BasePanel {
    @property(Label)
    private lbScore: Label = null;

    @property(Node)
    private btnNext: Node = null;

    @property(Node)
    private btnHome: Node = null;

    @property(Node)
    private energyNode: Node = null;

    @property([Node])
    private stars: Node[] = [];

    onLoad(): void {
        this.addListen();
    }

    onDestroy(): void {}

    addListen(): void {}

    setData(data: any): void {
        const curLevel = GameManager.instance.curLevel;
        console.log("胜利lililili:", curLevel, data);

        if (SDKInstance.isWxPlatform() && data.isRealWin && GameManager.instance.gameType === GameType.MainLevel && (!GameManager.instance.isRescueLevel() || GameManager.instance.forceRescueLevel(curLevel)) && !DirectPlayUtil.isDirectPlay) {
            const baseRecorder = GameRecord.GetInstance().BaseRecorder;
            DnSdkManager.instance.sdk?.track("LEVEL_PASS", {
                ad_cnt: GameManager.instance.adCnt,
                game_mode: "主线",
                level_id: curLevel,
                coin_amount: baseRecorder.Data.Gold,
                stamina_value: baseRecorder.Data.HeartData.CurrentHearts
            });
        }

        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            const delay = 0.15 * i;
            tween(star)
                .delay(delay)
                .to(0.6, { scale: Vec3.ONE }, { easing: "backOut" })
                .to(1.4, { scale: Vec3.ONE }, { easing: "sineOut" })
                .start();
        }
    }

    start(): void {
        this.init_view();
        AudioUtils.game_win();
        GameController.instance.is_pause = true;
        this.btnNext.active = GameManager.instance.gameType === GameType.MainLevel;
        this.btnHome.active = GameManager.instance.gameType !== GameType.MainLevel;
        this.energyNode.active = GameManager.instance.gameType === GameType.MainLevel;

        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        this.lbScore.string = GameManager.instance.currentScore.toString();
        VibrateManager.instance.vibrateShort();

        switch (GameManager.instance.gameType) {
            case GameType.MainLevel:
                if (!baseRecorder.isHeartInInfinite()) {
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddHeart, 1, true, HeartSource.LevelPass);
                }
                if (!GameManager.instance.isRescueLevel() || GameManager.instance.forceRescueLevel(baseRecorder.Data.CurLevel - 1)) {
                    const level = baseRecorder.Data.CurLevel;
                    const scoreLevel = level === GameManager.instance.maxLevel ? level : level - 1;
                    const tier = baseRecorder.Data.TierData ? baseRecorder.Data.TierData.tier : 0;
                    if (!DirectPlayUtil.isDirectPlay) {
                        RankDataManager.instance.commitRankingScore([scoreLevel], {
                            nickname: BaseDataManager.nickName,
                            avatar: BaseDataManager.userAvatar,
                            title: tier
                        }).then(() => {
                            console.log("成绩提交成功");
                        }).catch((error: any) => {
                            console.warn("成绩提交失败:", error.code, error.message);
                        });
                    }
                }
                break;
            case GameType.Challenge:
                break;
            case GameType.Tournament:
                TournamentWxMgr.instance.submitScore(GameManager.instance.currentScore);
                break;
            case GameType.Pvp:
                break;
        }

        if (GameManager.instance.curLevel >= 10 && GameManager.instance.curLevel % 5 === 0) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet, [false]);
        }
    }

    init_view(): void {
        GameManager.instance.firstInGame = true;
    }

    onNextClick(): void {
        AudioUtils.btn_click_sound();
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        let level = baseRecorder.Data.CurLevel;
        if (baseRecorder.Data.pendingRescue) {
            level = baseRecorder.Data.rescueLevel ?? 1;
        }

        DirectPlayUtil.isDirectPlay = false;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, level, GameType.MainLevel);

        if (SDKInstance.isWxPlatform()) {
            LieyouSDK.gameBeginLevel(level, GameManager.instance.getLevelMode());
            if (!GameManager.instance.isRescueLevel() || GameManager.instance.forceRescueLevel(level)) {
                DnSdkManager.instance.sdk?.track("LEVEL_ENTER", {
                    game_mode: "主线",
                    level_id: level,
                    coin_amount: baseRecorder.Data.Gold,
                    stamina_value: baseRecorder.Data.HeartData.CurrentHearts
                });
            }
        }

        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGameUI);
        UIManager.deleteNode("GameWinViewWX");
    }

    onShareClick(): void {
        AudioUtils.btn_click_sound();
        SDKInstance.shareAppMessage({
            adLocation: "game_win",
            templateId: "1"
        });
    }

    onCloseClick(): void {
        UILayerManager.instance.showMainMenu();
        TimeTaskManager.addTimeTask(() => {
            GameManager.instance.curStage.gameCamera.resetCameraLocation();
            GameManager.instance.curStage.clear(true);
        }, 0.1);

        console.log("onCloseClick:", GameManager.instance.gameType);
        if (GameManager.instance.gameType === GameType.Tournament) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateTournament);
        }

        DirectPlayUtil.isDirectPlay = false;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGameUI);
        UIManager.deleteNode("GameWinViewWX");
    }
}