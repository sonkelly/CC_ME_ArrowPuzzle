import { _decorator, Node } from 'cc';
import { FailType, GameType } from './GlobalEnum';
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

const { ccclass, property } = _decorator;

@ccclass('LoseHeartViewWX')
export class LoseHeartViewWX extends BasePanel {
    @property(Node)
    public energyPanel: Node = null;

    @property(Node)
    public scorePanel: Node = null;

    public static hp: number = 3;
    public static failType: FailType = FailType.Hp;

    public onLoad(): void {
        this.initView();
        this.addListen();
    }

    public addListen(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.GameRevive, this.onGameRevive, this);
    }

    public setData(data: { hp: number; type: FailType }): void {
        this.hp = data.hp;
        this.failType = data.type;
        this.energyPanel.active = GameManager.instance.gameType === GameType.MainLevel;
        this.scorePanel.active = GameManager.instance.gameType !== GameType.MainLevel;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowOrHideOverlayView, false);
    }

    public initView(): void {
        // Initialization logic if needed
    }

    public onRestartClick(): void {
        AudioUtils.btn_click_sound();

        if (
            GameManager.instance.gameType === GameType.Challenge ||
            GameManager.instance.gameType === GameType.Tournament ||
            GameManager.instance.gameType === GameType.Pvp
        ) {
            GameManager.instance.curStage.onGameRestart();
            UIManager.deleteNode('LoseHeartViewWX');
            EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowOrHideOverlayView, true);
            return;
        }

        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        if (baseRecorder.Data.HeartData.CurrentHearts <= 0 && !baseRecorder.isHeartInInfinite()) {
            UIManager.createPanel('game', 'FillHeartView', {
                showAnimation: true,
                setData: true
            });
        } else {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.WantUseHeart, 1);
            GameManager.instance.curStage.onGameRestart();
            UIManager.deleteNode('LoseHeartViewWX');
        }
    }

    public onReviveClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel('game', 'GameLoseViewWX', {
            showAnimation: true,
            setData: {
                hp: GameController.instance.baseCfg.ReviveHp,
                type: this.failType
            }
        });
        UIManager.deleteNode('LoseHeartViewWX');
    }

    public onGameRevive(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowOrHideOverlayView, true);
        GameManager.instance.curStage.onGameRevive(this.failType, this.hp);
        UIManager.deleteNode('LoseHeartViewWX');
    }

    public oHomeClick(): void {
        AudioUtils.btn_click_sound();

        if (GameManager.instance.gameType === GameType.Tournament || GameManager.instance.gameType === GameType.Pvp) {
            GameManager.instance.curStage.onGameWin(false);
        } else {
            GameManager.instance.curStage.onBackHome();
            UILayerManager.instance.showMainMenu();
        }

        UIManager.deleteNode('LoseHeartViewWX');
    }
}