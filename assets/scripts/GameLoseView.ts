import { _decorator, Node, Prefab, instantiate } from 'cc';
import { GameType, ExcelVideoType, FailType } from './GlobalEnum';
import { UILayerManager } from './UILayerManager';
import { UIManager } from './UIManager';
import { GameManager } from './GameManager';
import { BasePanel } from './BasePanel';
import { AudioUtils } from './Utils/AudioUtils';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { GameLogicConfig } from './GameLogicConfig';
import { GameRecord } from './GameRecord';
import { EasOperateSDK } from './EasOperateSDK';
import { EasDataSDK } from './EasDataSDK';
import { Utils } from './Utils';

const { ccclass, property } = _decorator;

@ccclass('GameLoseView')
export class GameLoseView extends BasePanel {
    @property(Node)
    private hpNode: Node = null;

    @property(Prefab)
    private hpItem: Prefab = null;

    @property(Node)
    private btnFree: Node = null;

    @property(Node)
    private fingerNode: Node = null;

    onLoad(): void {
        this.initView();
        this.addListen();
    }

    private addListen(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameRevive, this.onGameRevive, this);
    }

    setData(data: { hp: number }): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, false);

        for (let i = 0; i < data.hp; i++) {
            instantiate(this.hpItem).parent = this.hpNode;
        }

        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        const currentLevel = baseRecorder.Data.CurLevel - 1;

        /*if (SDKInstance.isFacebookMiniGame()) {
            const freeReviveNum = baseRecorder.Data.FreeReviveNum ?? 0;
            if (freeReviveNum < EasOperateSDK.free_revive_num) {
                this.btnFree.active = true;
                this.fingerNode.active = true;
            }
        }*/

        if (SDKInstance.isGooglePlayNative()) {
            let level = GameManager.instance.curLevel;
            console.log("失败baibaiabiabai:", level);

            if (GameManager.instance.gameType === GameType.Challenge) {
                const date = new Date();
                date.getFullYear();
                level = 100 * (date.getMonth() + 1) + GameManager.instance.curLevel;
            }

            Utils.instance.GameFail(level.toString(), GameManager.instance.getLevelMode(), !baseRecorder.Data.PurchasedNoAds);
        }

        if (currentLevel >= EasOperateSDK.intersAdLevel && !baseRecorder.Data.PurchasedNoAds) {
            SDKInstance.showIntertAd({
                resultCallback: (success: boolean) => {
                    if (success) {
                        let adId = "level_main";
                        let adSource = currentLevel.toString();

                        if (GameManager.instance.gameType === GameType.Challenge) {
                            adId = "level_challenge";
                            adSource = (100 * ((new Date()).getMonth() + 1) + GameManager.instance.curLevel).toString();
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
                    }
                }
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
            UIManager.deleteNode("GameLoseView");
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, true);
            return;
        }

        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        if (baseRecorder.Data.HeartData.CurrentHearts <= 0 && !baseRecorder.isHeartInInfinite()) {
            UIManager.createPanel("game", "FillHeartView", {
                showAnimation: true,
                setData: true
            });
        } else {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantUseHeart, 1);
            GameManager.instance.curStage.onGameRestart();
            UIManager.deleteNode("GameLoseView");
        }
    }

    onReviveClick(): void {
        AudioUtils.btn_click_sound();
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSeeVideo, [ExcelVideoType.REVIVE]);
    }

    private onGameRevive(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, true);
        GameManager.instance.curStage.onGameRevive(FailType.Hp);
        UIManager.deleteNode("GameLoseView");
    }

    onFreeRevive(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, true);
        GameManager.instance.curStage.onGameRevive(FailType.Hp);
        GameRecord.GetInstance().BaseRecorder.OnFreeRevive();
        UIManager.deleteNode("GameLoseView");
    }

    oHomeClick(): void {
        AudioUtils.btn_click_sound();

        if (GameManager.instance.gameType === GameType.Tournament || GameManager.instance.gameType === GameType.Pvp) {
            GameManager.instance.curStage.onGameWin(false);
        } else {
            GameManager.instance.curStage.onBackHome();
            UILayerManager.instance.showMainMenu();
        }

        UIManager.deleteNode("GameLoseView");
    }
}