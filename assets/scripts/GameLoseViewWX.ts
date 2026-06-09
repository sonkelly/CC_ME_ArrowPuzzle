import { _decorator, Component, Node, Prefab, Label, instantiate } from 'cc';
import { FailType, GameType, ExcelVideoType } from './GlobalEnum';
import { UILayerManager } from './UILayerManager';
import { UIManager } from './UIManager';
import { GameManager } from './GameManager';
import { BasePanel } from './BasePanel';
import { AudioUtils } from './Utils/AudioUtils';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { GameLogicConfig } from './GameLogicConfig';
import { GameRecord } from './GameRecord';
import { GameController } from './GameController';
import { AudioManager } from './AudioManager';
import { LieyouSDK } from './SDK/LieyouSDK';
import { DnSdkManager } from './DnSdkManager';
import { Utilsqdd } from './Utils/Utilsqdd';

const { ccclass, property } = _decorator;

@ccclass('GameLoseViewWX')
export class GameLoseViewWX extends BasePanel {
    @property(Node)
    private hpPanel: Node = null;

    @property(Node)
    private hpNode: Node = null;

    @property(Prefab)
    private hpItem: Prefab = null;

    @property(Label)
    private lbHp: Label = null;

    @property(Node)
    private timePanel: Node = null;

    @property(Label)
    private lbTime: Label = null;

    @property(Label)
    private lbTitle: Label = null;

    private hp: number = 3;
    private failType: FailType = FailType.Hp;

    onLoad(): void {
        this.initView();
        this.addListen();
    }

    private addListen(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameRevive, this.onGameRevive, this);
    }

    setData(data: { hp: number; type: FailType }): void {
        AudioManager.instance.stop_loop_effect();
        this.hp = data.hp;
        this.failType = data.type;

        if (data.type === FailType.Hp) {
            this.hpPanel.active = true;
            this.timePanel.active = false;
            this.lbHp.string = "生命+" + this.hp;
            this.lbTitle.string = "没有血量了";

            for (let i = 0; i < this.hp; i++) {
                const item = instantiate(this.hpItem);
                item.parent = this.hpNode;
            }

            DnSdkManager.instance.sdk?.track("AD_PLACEMENT_SHOW", {
                ad_placement_name: 1
            });
        } else {
            this.hpPanel.active = false;
            this.timePanel.active = true;
            this.lbTime.string = "时间+" + GameController.instance.baseCfg.ReviveTime + "秒";
            this.lbTitle.string = "没有时间了";

            DnSdkManager.instance.sdk?.track("AD_PLACEMENT_SHOW", {
                ad_placement_name: 5
            });
        }

        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, false);

        let levelId = GameManager.instance.curLevel;
        console.log("失败baibaiabiabai:", levelId);

        if (SDKInstance.isWxPlatform()) {
            if (GameManager.instance.gameType === GameType.Challenge) {
                const now = new Date();
                now.getFullYear();
                levelId = 100 * (now.getMonth() + 1) + GameManager.instance.curLevel;
            }

            const progress = Utilsqdd.calculateProgress(
                GameManager.instance.curStage.curArrowProgress,
                GameManager.instance.curStage.arrowTarget
            );
            LieyouSDK.gameFailLevel(levelId, GameManager.instance.getLevelMode(), progress);
        }

        if (GameManager.instance.gameType === GameType.MainLevel && !GameManager.instance.isRescueLevel()) {
            const recorder = GameRecord.GetInstance().BaseRecorder;
            DnSdkManager.instance.sdk?.track("LEVEL_LOSE", {
                ad_cnt: GameManager.instance.adCnt,
                game_mode: "主线",
                level_id: levelId,
                coin_amount: recorder.Data.Gold,
                stamina_value: recorder.Data.HeartData.CurrentHearts
            });
        }
    }

    private initView(): void {
        AudioUtils.game_fail();
    }

    onRestartClick(): void {
        AudioUtils.btn_click_sound();

        if (GameManager.instance.gameType === GameType.Challenge ||
            GameManager.instance.gameType === GameType.Tournament ||
            GameManager.instance.gameType === GameType.Pvp) {
            GameManager.instance.curStage.onGameRestart();
            UIManager.deleteNode("GameLoseViewWX");
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, true);
            return;
        }

        const recorder = GameRecord.GetInstance().BaseRecorder;
        if (recorder.Data.HeartData.CurrentHearts <= 0 && !recorder.isHeartInInfinite()) {
            UIManager.createPanel("game", "FillHeartView", {
                showAnimation: true,
                setData: true
            });
        } else {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantUseHeart, 1);
            GameManager.instance.curStage.onGameRestart();
            UIManager.deleteNode("GameLoseViewWX");
        }
    }

    onReviveClick(): void {
        AudioUtils.btn_click_sound();
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSeeVideo, [ExcelVideoType.REVIVE]);

        if (this.failType === FailType.Hp) {
            DnSdkManager.instance.sdk?.track("AD_CLICK", {
                ad_placement_name: 1
            });
        } else {
            DnSdkManager.instance.sdk?.track("AD_CLICK", {
                ad_placement_name: 5
            });
        }
    }

    private onGameRevive(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, true);
        GameManager.instance.curStage.onGameRevive(this.failType, this.hp);

        if (SDKInstance.isWxPlatform()) {
            let levelId = GameManager.instance.curLevel;

            if (GameManager.instance.gameType === GameType.Challenge) {
                const now = new Date();
                now.getFullYear();
                levelId = 100 * (now.getMonth() + 1) + GameManager.instance.curLevel;
            }

            const progress = Utilsqdd.calculateProgress(
                GameManager.instance.curStage.curArrowProgress,
                GameManager.instance.curStage.arrowTarget
            );
            LieyouSDK.gameReviveLevel(levelId, GameManager.instance.getLevelMode(), progress);
            GameManager.instance.adCnt++;
        }

        if (this.failType === FailType.Hp) {
            DnSdkManager.instance.sdk?.track("AD_VIDEO_FINISH", {
                ad_placement_name: 1
            });
        } else {
            DnSdkManager.instance.sdk?.track("AD_VIDEO_FINISH", {
                ad_placement_name: 5
            });
        }

        UIManager.deleteNode("GameLoseViewWX");
    }

    oHomeClick(): void {
        AudioUtils.btn_click_sound();

        if (GameManager.instance.gameType === GameType.Tournament || GameManager.instance.gameType === GameType.Pvp) {
            GameManager.instance.curStage.onGameWin(false);
        } else {
            GameManager.instance.curStage.onBackHome();
            UILayerManager.instance.showMainMenu();
        }

        UIManager.deleteNode("GameLoseViewWX");
    }

    onCloseClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "LoseHeartViewWX", {
            showAnimation: true,
            setData: {
                type: this.failType
            }
        });
        UIManager.deleteNode("GameLoseViewWX");
    }
}