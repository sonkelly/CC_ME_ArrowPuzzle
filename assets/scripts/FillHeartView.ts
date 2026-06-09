import { _decorator, Component, Node, Label } from 'cc';
import { BasePanel } from './BasePanel';
import { UIManager } from './UIManager';
import { AudioUtils } from './Utils/AudioUtils';
import { GameRecord } from './GameRecord';
import { GameController } from './GameController';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { GameLogicConfig } from './GameLogicConfig';
import { ExcelVideoType } from './GlobalEnum';
import { UILayerManager } from './UILayerManager';
import { FlyEffectManager } from './FlyEffectManager';
import { I18nManager } from './I18nManager';
import { DnSdkManager } from './DnSdkManager';
import { EasDataSDK } from './EasDataSDK';

const { ccclass, property } = _decorator;

@ccclass('FillHeartView')
export class FillHeartView extends BasePanel {
    @property(Node)
    private container: Node = null;

    @property(Label)
    private lbNum: Label = null;

    @property(Label)
    private lbTimer: Label = null;

    @property(Node)
    private btnGold: Node = null;

    @property(Label)
    private lbPrice: Label = null;

    @property(Node)
    private btnVideo: Node = null;

    @property(Node)
    private btnContinue: Node = null;

    @property(Node)
    private flyNode: Node = null;

    @property(Node)
    private flyHeart: Node = null;

    @property(Label)
    private flyNum: Label = null;

    private baseRecorder: any = undefined;
    private _isShow: boolean = false;

    onLoad(): void {
        this.addListen();
    }

    private addListen(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.FillHeart, this.onFillHeart, this);
    }

    setData(isShow: boolean): void {
        this._isShow = isShow;
        this.initView();
        this.updateUI();
        this.schedule(this.updateUI, 1);
        if (isShow) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, true);
        }
    }

    private initView(): void {
        this.baseRecorder = GameRecord.GetInstance().BaseRecorder;
        if (this.baseRecorder.Data.HeartData.CurrentHearts >= GameController.instance.baseCfg.MaxHeart) {
            this.btnContinue.active = true;
            this.btnGold.active = false;
            this.btnVideo.active = false;
        } else {
            this.btnContinue.active = false;
            this.btnGold.active = true;
            this.btnVideo.active = true;
            this.lbPrice.string = GameController.instance.baseCfg.FillHeartCost.toString();
            DnSdkManager.instance.sdk?.track("AD_PLACEMENT_SHOW", {
                ad_placement_name: 2
            });
        }
    }

    private updateUI(): void {
        this.lbNum.string = this.baseRecorder.Data.HeartData.CurrentHearts.toString();
        if (this.baseRecorder.isHeartFull()) {
            this.btnContinue.active = true;
            this.btnGold.active = false;
            this.btnVideo.active = false;
            this.lbTimer.string = I18nManager.t("FULL");
        } else {
            this.lbTimer.string = UILayerManager.instance.heartManager.lbTime.string;
        }
    }

    onGlodClick(): void {
        AudioUtils.btn_click_sound();
        if (this.baseRecorder.Data.Gold < GameController.instance.baseCfg.FillHeartCost) {
            UIManager.createPanel("game", "ShopView", {
                setData: false
            });
        } else {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantConsumeGold, GameController.instance.baseCfg.FillHeartCost);
            this.onFillHeart();
        }
    }

    onVideoClick(): void {
        AudioUtils.btn_click_sound();
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSeeVideo, [ExcelVideoType.FILL_HEART]);
        DnSdkManager.instance.sdk?.track("AD_CLICK", {
            ad_placement_name: 2
        });
    }

    onFillHeart(isFromAd: boolean = false): void {
        const currentHearts = this.baseRecorder.Data.HeartData.CurrentHearts;
        const heartToAdd = GameController.instance.baseCfg.MaxHeart - currentHearts;

        this.flyNum.string = "X" + heartToAdd;
        this.flyHeart.active = true;
        this.flyNode.active = true;
        this.container.active = false;

        this.baseRecorder.AddHeart(heartToAdd);

        EasDataSDK.trackEvent("item_change", {
            item_id: "energy",
            change_type: 0,
            change_num: heartToAdd,
            change_source: isFromAd ? "energy_ad" : "gold_exchange"
        });

        EasDataSDK.userSet({
            energy: this.baseRecorder.Data.HeartData.CurrentHearts
        });

        this.scheduleOnce(() => {
            this.flyNum.node.active = false;
            this.flyHeart.active = false;
            FlyEffectManager.instance.playFlyHearts(heartToAdd, this.flyHeart.worldPosition, this.flyHeart.scale, () => {
                this.updateUI();
                this.flyNode.active = false;
                this.container.active = true;
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet, [false]);
            });
        }, 1);
    }

    onContinueClick(): void {
        AudioUtils.btn_click_sound();
        if (this._isShow) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, false);
        }
        UIManager.deleteNode("FillHeartView");
    }

    onCloseClick(): void {
        AudioUtils.btn_close_sound();
        if (this._isShow) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, false);
        }
        UIManager.deleteNode("FillHeartView");
    }
}