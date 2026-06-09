import { _decorator, Node } from 'cc';
import { BasePanel } from './BasePanel';
import { UIManager } from './UIManager';
import { AudioUtils } from './Utils/AudioUtils';
import { EPlatformSceneCode } from './SDK/AbstractPlatformSDK';
import { FlyEffectManager } from './FlyEffectManager';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { GameLogicConfig } from './GameLogicConfig';
import { GameRecord } from './GameRecord';
import { DnSdkManager } from './DnSdkManager';

const { ccclass, property } = _decorator;

@ccclass('WechatCollectReward')
export class WechatCollectReward extends BasePanel {
    @property(Node)
    private btnClaim: Node = null;

    @property(Node)
    private gold: Node = null;

    private flying: boolean = false;

    onLoad(): void {
        this.addListen();
    }

    onShow(): void {
        this.initView();
    }

    addListen(): void {
        // No listeners to add
    }

    initView(): void {
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        this.btnClaim.active = SDKInstance.isSceneCodeEqual(EPlatformSceneCode.MYGAME) && !baseRecorder.Data.ClaimedCollectReward;
        
        if (this.btnClaim.active) {
            DnSdkManager.instance.sdk?.track("ADD_TO_WISHLIST", {
                type: "my"
            });
        }
    }

    onCliamClick(): void {
        AudioUtils.btn_close_sound();
        
        if (this.flying) {
            return;
        }
        
        this.flying = true;
        FlyEffectManager.instance.playFlyCoins(400, this.gold.worldPosition, () => {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddGold, 400, false);
            this.flying = false;
            GameRecord.GetInstance().BaseRecorder.ClaimCollectReward();
            UIManager.deleteNode("WechatCollectReward");
        });
    }

    onCloseClick(): void {
        AudioUtils.btn_close_sound();
        
        if (!this.flying) {
            UIManager.deleteNode("WechatCollectReward");
        }
    }
}