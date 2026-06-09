import { _decorator, Component, Node, Label, instantiate, Vec3 } from 'cc';
import { BasePanel } from './BasePanel';
import { AudioUtils } from './Utils/AudioUtils';
import { CCExtends } from './CCExtends';
import { Goods } from './Goods';
import { ItemID } from './GlobalEnum';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { UILayerManager } from './UILayerManager';
import { GameLogicConfig } from './GameLogicConfig';
import { FlyEffectManager } from './FlyEffectManager';
import { Utilsqdd } from './Utils/Utilsqdd';
import { UIManager } from './UIManager';
import { HeartSource } from './HeartManager';

const { ccclass, property } = _decorator;

interface RewardData {
    CfgId: number;
    Num: number;
}

interface CommonRewardData {
    rewards: RewardData[];
    title?: string;
    cb?: () => void;
}

@ccclass('CommonRewardView')
export class CommonRewardView extends BasePanel {
    @property(Node)
    private bg: Node = null;

    @property(Node)
    private container: Node = null;

    @property(Node)
    private goodsLayout: Node = null;

    @property(Node)
    private goodsItem: Node = null;

    @property(Label)
    private lbTitle: Label = null;

    private _animationCount: number = 0;
    private rewards: RewardData[] = undefined;
    private callback: () => void = undefined;

    public setData(data: CommonRewardData): void {
        CCExtends.DestroyNodeAllChildren(this.goodsLayout);
        this.rewards = Utilsqdd.mergeSameCfgIdRewards(data.rewards);

        if (data.title) {
            this.lbTitle.string = data.title;
        }

        this.callback = data.cb;

        this.rewards.forEach((reward: RewardData) => {
            const goodsNode = instantiate(this.goodsItem);
            const goodsComponent = goodsNode.getComponent(Goods);
            goodsComponent.setData(reward.CfgId, reward.Num);
            goodsNode.parent = this.goodsLayout;
            goodsNode.active = true;
        });

        this._animationCount = this.rewards.length;
    }

    public onShow(): void {
        // Empty implementation
    }

    public onHide(): void {
        // Empty implementation
    }

    public onClaimClick(): void {
        AudioUtils.btn_click_sound();
        this.bg.active = false;
        this.container.active = false;

        this.goodsLayout.children.forEach((childNode: Node) => {
            const goodsComponent = childNode.getComponent(Goods);
            const goodsId = goodsComponent.goodsId;
            const goodsNum = goodsComponent.goodsNum;

            if (goodsId === ItemID.GOLD) {
                FlyEffectManager.instance.playFlyCoins(goodsNum, goodsComponent.icon.node.worldPosition, () => {
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddGold, goodsNum, false);
                    this._animationCount--;
                    this.animComplete();
                });
            } else if (goodsId === ItemID.HEART) {
                FlyEffectManager.instance.playFlyHearts(goodsNum, goodsComponent.icon.node.worldPosition, goodsComponent.icon.node.scale, () => {
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddHeart, goodsNum, true, HeartSource.Other);
                    this._animationCount--;
                    this.animComplete();
                });
            } else {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddItem, [goodsId, goodsNum], false);
                FlyEffectManager.instance.playFlyGoods(goodsId, goodsNum, goodsComponent.icon.node.worldPosition, {
                    flyNode: goodsComponent.icon.node,
                    targetNode: UILayerManager.instance.mainUnSelectTab,
                    callback: () => {
                        this._animationCount--;
                        this.animComplete();
                    }
                });
            }
        });
    }

    private animComplete(): void {
        if (this._animationCount <= 0) {
            if (this.callback) {
                this.callback();
            }
            UIManager.deleteNode("CommonRewardView");
        }
    }
}