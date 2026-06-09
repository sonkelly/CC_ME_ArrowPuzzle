import { EasDataSDK } from "./../EasDataSDK";
import { ItemType, ItemID } from "./../GlobalEnum";
import { GameManager } from "./../GameManager";
import { GameLogicConfig } from "./../GameLogicConfig";
import { JsonClassStorage } from "./../JsonClass";
import { EventManager } from "./../Event/EventManager";
import { ModuleEventKey } from "./../IGameRawData";
import { BagDataManager } from "./../BagDataManager";
import { GameRecord } from "./../GameRecord";
import { ModuleEventHandler } from "./../ModuleEventHandler";

export class EventHandlerBag extends ModuleEventHandler {
    public OnInit(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddItem, this.handler_WantAddItem, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddItems, this.handler_WantAddItems, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantRemoveItem, this.handler_WantRemoveItem, this);
    }

    private handler_WantAddItem(itemId: number, showEffect: boolean = true): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddItems, itemId, showEffect);
    }

    private handler_WantAddItems(items: number[], showEffect: boolean = true): void {
        const itemCount = items.length / 2;
        for (let i = 0; i < itemCount; i++) {
            const itemId = items[2 * i];
            const quantity = items[2 * i + 1];
            const itemData = JsonClassStorage.instance.getOneJson("ItemData", "ItemId", itemId);

            if (itemData.ItemType === ItemType.CURRENCY) {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddGold, quantity, showEffect);
            } else if (itemData.ItemType === ItemType.PROP) {
                GameRecord.GetInstance().BagRecorder.AddBagItem(itemId, quantity);
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.BagDataChange);

                if (itemId === ItemID.Hint) {
                    EasDataSDK.trackEvent("item_change", {
                        item_id: "tips",
                        change_type: 0,
                        change_num: quantity,
                        change_source: GameManager.instance.getLevelId()
                    });
                    const currentTips = BagDataManager.getItemNumByItemCfgId(ItemID.Hint);
                    EasDataSDK.userSet({
                        tips: currentTips
                    });
                }
            } else if (itemData.ItemType === ItemType.HEART) {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddHeart, quantity, true);
            }
        }
    }

    private handler_WantRemoveItem(items: number[]): void {
        const itemId = items[0];
        const quantity = items[1];

        GameRecord.GetInstance().BagRecorder.ConsumeBagItem(itemId, quantity);
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.BagDataChange);

        if (itemId === ItemID.Hint) {
            EasDataSDK.trackEvent("item_change", {
                item_id: "tips",
                change_type: 1,
                change_num: -1,
                change_source: GameManager.instance.getLevelId()
            });
            const currentTips = BagDataManager.getItemNumByItemCfgId(ItemID.Hint);
            EasDataSDK.userSet({
                tips: currentTips
            });
        }
    }
}