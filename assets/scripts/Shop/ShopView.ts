import { _decorator, Component, Node, Label } from 'cc';
import { ExcelVideoType } from './../GlobalEnum';
import { BasePanel } from './../BasePanel';
import { ModuleEventKey } from './../IGameRawData';
import { EventManager } from './../Event/EventManager';
import { UIManager } from './../UIManager';
import { AudioUtils } from './../Utils/AudioUtils';
import { GameLogicConfig } from './../GameLogicConfig';
import { JsonClassStorage } from './../JsonClass';
import { FlyEffectManager } from './../FlyEffectManager';
import { GameController } from './../GameController';
import { AudioManager } from './../AudioManager';
import { GameManager } from './../GameManager';
import { DnSdkManager } from './../DnSdkManager';

const { ccclass, property } = _decorator;

@ccclass('ShopView')
export class ShopView extends BasePanel {
    @property(Node)
    public goldNode: Node = null;

    @property(Label)
    public lbNum: Label = null;

    public flying: boolean = false;
    private _isShow: boolean = false;

    public onLoad(): void {
        this.addListen();
    }

    public addListen(): void {
        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShopFreeGold,
            this.onShopFreeGold,
            this
        );
    }

    public setData(isShow: boolean): void {
        this._isShow = isShow;
        this.initView();
        EventManager.emit(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView,
            false
        );
        if (isShow) {
            EventManager.emit(
                GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar,
                true
            );
        }
    }

    public initView(): void {
        GameController.instance.is_pause = true;
        AudioManager.instance.pause_loop_effect();

        const sdk = DnSdkManager.instance.sdk;
        if (sdk) {
            sdk.track("AD_PLACEMENT_SHOW", {
                ad_placement_name: 4
            });
        }

        const videoConfig = JsonClassStorage.instance.getOneJson("VideoConfig", "Id", ExcelVideoType.FREE_GOLD);
        this.lbNum.string = "x" + videoConfig.Param1;
    }

    public onShopFreeGold(): void {
        const goldAmount = JsonClassStorage.instance.getOneJson("VideoConfig", "Id", ExcelVideoType.FREE_GOLD).Param1;
        
        EventManager.emit(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddGold,
            goldAmount,
            false
        );
        
        this.flying = true;
        
        FlyEffectManager.instance.playFlyCoins(
            goldAmount,
            this.goldNode.worldPosition,
            () => {
                EventManager.emit(
                    GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GoldChange,
                    null
                );
                this.flying = false;
                EventManager.emit(
                    GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet,
                    [false]
                );
            }
        );
        
        GameManager.instance.adCnt++;
        
        const sdk = DnSdkManager.instance.sdk;
        if (sdk) {
            sdk.track("AD_VIDEO_FINISH", {
                ad_placement_name: 4
            });
        }
    }

    public onVideoClick(): void {
        AudioUtils.btn_click_sound();
        
        if (!this.flying) {
            EventManager.emit(
                GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSeeVideo,
                [ExcelVideoType.FREE_GOLD]
            );
            
            const sdk = DnSdkManager.instance.sdk;
            if (sdk) {
                sdk.track("AD_CLICK", {
                    ad_placement_name: 4
                });
            }
        }
    }

    public onCloseClick(): void {
        AudioUtils.btn_close_sound();
        
        if (!this.flying) {
            EventManager.emit(
                GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView,
                true
            );
            
            GameController.instance.is_pause = false;
            AudioManager.instance.resume_loop_effect();
            
            if (this._isShow) {
                EventManager.emit(
                    GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar,
                    false
                );
            }
            
            UIManager.deleteNode("ShopView");
        }
    }
}