import { _decorator, game, Game, Prefab } from "cc";
import { DirectPlayUtil } from "./DirectPlayUtil";
import { LieyouSDK } from "./SDK/LieyouSDK";
import { GameType } from "./GlobalEnum";
import { BundleManager } from "./BundleManager";
import { EventManager } from "./Event/EventManager";
import { ModuleEventKey } from "./IGameRawData";
import { TournamentDataManager } from "./Tournament/TournamentDataManager";
import { TournamentWxMgr } from "./Tournament/TournamentWxMgr";
import { GameRecord } from "./GameRecord";
import { GameAssetManager } from "./GameAssetManager";
import { GameLogicConfig } from "./GameLogicConfig";
import { effect_component } from "./effect_component";
import { AudioUtils } from "./Utils/AudioUtils";
import { BaseScene } from "./BaseScene";
import { ZanFlyEffect } from "./ZanFlyEffect";

const { ccclass, property } = _decorator;

@ccclass("GameScene")
export class GameScene extends BaseScene {
    public async init(): Promise<void> {
        await super.init();
        this.init_scene();
    }

    private async init_scene(): Promise<void> {
        this.init_view();
        AudioUtils.play_scene_bgm();

        game.on(Game.EVENT_SHOW, () => {
            console.log("EVENT_SHOW=========");
            /*if (SDKInstance.isFacebookMiniGame()) {
                TournamentDataManager.instance.CheckTournamentSettlement();
            } else {
                TournamentWxMgr.instance.CheckTournamentSettlement();
            }*/
        });

        game.on(Game.EVENT_HIDE, () => {
            console.log("EVENT_HIDE=========");
        });

        if (DirectPlayUtil.isDirectPlay) {
            const feedPlan = LieyouSDK.getFeedPlan();
            console.log("feedPlan:", feedPlan);

            const baseRecorder = GameRecord.GetInstance().BaseRecorder;
            let curLevel = baseRecorder.Data.CurLevel;
            const pendingRescue = baseRecorder.Data.pendingRescue;

            DirectPlayUtil.isNewUser = curLevel <= 1;

            if (pendingRescue) {
                curLevel = baseRecorder.Data.rescueLevel ?? 1;
            }

            if (DirectPlayUtil.isNewUser) {
                let level = 10;
                if (feedPlan && feedPlan.id != null) {
                    level = feedPlan.id;
                }
                console.log("新玩家直玩 level:", level);
                if (level < 0 || level > 10) {
                    level = 10;
                }

                await GameAssetManager.loadAssetByPath("game", "prefab/$effect/zan", Prefab, (err, prefab) => {});
                ZanFlyEffect.init_pool();

                if (level <= 5) {
                    await BundleManager.instance.loadBundle("level_rescue");
                    GameAssetManager.loadAssetByPath("game", "prefab/$effect/effect_component", Prefab, (err, prefab) => {
                        effect_component.init_pool();
                        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, level, GameType.MainLevel);
                    });
                } else {
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, level, GameType.MainLevel);
                }
            } else {
                console.log("老玩家直玩");
                this.oldUserDirectPlay();
            }
        }
    }

    private async oldUserDirectPlay(): Promise<void> {
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        let curLevel = baseRecorder.Data.CurLevel;

        if (baseRecorder.Data.pendingRescue) {
            curLevel = baseRecorder.Data.rescueLevel ?? 1;
        }

        await BundleManager.instance.loadBundle("level_rescue");
        GameAssetManager.loadAssetByPath("game", "prefab/$effect/effect_component", Prefab, (err, prefab) => {
            effect_component.init_pool();
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, curLevel, GameType.MainLevel);
        });

        await GameAssetManager.loadAssetByPath("game", "prefab/$effect/zan", Prefab, (err, prefab) => {});
        ZanFlyEffect.init_pool();

        if (SDKInstance.isWxPlatform()) {
            LieyouSDK.gameBeginLevel(curLevel, "Feed");
        }
    }

    private init_view(): void {
        // Empty implementation
    }
}