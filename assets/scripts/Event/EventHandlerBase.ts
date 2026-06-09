import { _decorator, Component } from "cc";
import { EasDataSDK } from "./../EasDataSDK";
import { GameManager } from "./../GameManager";
import { GameLogicConfig } from "./../GameLogicConfig";
import { EventManager } from "./../Event/EventManager";
import { ModuleEventKey } from "./../IGameRawData";
import { GameRecord } from "./../GameRecord";
import { ModuleEventHandler } from "./../ModuleEventHandler";

const { ccclass, property } = _decorator;

@ccclass("EventHandlerBase")
export class EventHandlerBase extends ModuleEventHandler {
    public OnInit(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.BagDataChange, this.onBagDataChange, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameFail, this.handler_GameFail, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddGold, this.handler_WantAddGold, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantConsumeGold, this.handler_WantConsumeGold, this);
    }

    public onBagDataChange(): void {
        // Empty handler
    }

    public handler_GameFail(): void {
        // Empty handler
    }

    public handler_WantAddGold(goldAmount: number, shouldEmitEvent: boolean): void {
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        const oldGold = baseRecorder.Data.Gold;

        baseRecorder.AddGold(goldAmount);

        if (shouldEmitEvent) {
            const newGold = oldGold + goldAmount;
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GoldChange, [oldGold, newGold]);
        }

        EasDataSDK.trackEvent("item_change", {
            item_id: "gold",
            change_type: 0,
            change_num: goldAmount,
            change_source: "gold_ad"
        });

        EasDataSDK.userSet({
            gold: baseRecorder.Data.Gold
        });
    }

    public handler_WantConsumeGold(goldAmount: number): void {
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        const oldGold = baseRecorder.Data.Gold;

        baseRecorder.ConsumeGold(goldAmount);

        let newGold = oldGold - goldAmount;
        if (newGold < 0) {
            newGold = 0;
        }

        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GoldChange, [oldGold, newGold]);

        EasDataSDK.trackEvent("item_change", {
            item_id: "gold",
            change_type: 1,
            change_num: -goldAmount,
            change_source: GameManager.instance.getLevelId()
        });

        EasDataSDK.userSet({
            gold: baseRecorder.Data.Gold
        });
    }
}