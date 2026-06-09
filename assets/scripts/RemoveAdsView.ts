import { _decorator, Component, Node, Label } from 'cc';
import { PayConfigID } from './GlobalEnum';
import { BasePanel } from './BasePanel';
import { ModuleEventKey } from './IGameRawData';
import { ShopDataManager } from './Shop/ShopDataManager';
import { GameRecord } from './GameRecord';
import { EventManager } from './Event/EventManager';
import { UIManager } from './UIManager';
import { AudioUtils } from './Utils/AudioUtils';
import { GameLogicConfig } from './GameLogicConfig';

const { ccclass, property } = _decorator;

@ccclass('RemoveAdsView')
export class RemoveAdsView extends BasePanel {
    @property(Node)
    public purchased: Node = null;

    @property(Label)
    public lbPrice: Label = null;

    @property(Label)
    public lbDesc: Label = null;

    public addLisitener: any = undefined;

    public onShow(): void {
        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.PayCompleted,
            this.handler_PayCompleted,
            this
        );

        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        this.purchased.active = baseRecorder.Data.PurchasedNoAds;

        const purchaseInfo = ShopDataManager.instance.getPurchaseInfo(PayConfigID.NoAds.toString());
        if (purchaseInfo) {
            if (purchaseInfo.price) {
                this.lbPrice.string = purchaseInfo.price;
            }
            if (purchaseInfo.description) {
                this.lbDesc.string = purchaseInfo.description;
            }
        }
    }

    public onHide(): void {
        // Empty implementation
    }

    public onBuyClick(): void {
        AudioUtils.btn_click_sound();
        ShopDataManager.instance.buy(PayConfigID.NoAds.toString(), this.node);
    }

    public handler_PayCompleted(): void {
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        this.purchased.active = baseRecorder.Data.PurchasedNoAds;
    }

    public onCloseClick(): void {
        AudioUtils.btn_close_sound();
        UIManager.deleteNode("RemoveAdsView");
    }
}