import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { BasePanel } from './../BasePanel';
import { AudioUtils } from './../Utils/AudioUtils';
import { DailyRewardsItem } from './../Daily/DailyRewardsItem';
import { JsonClassStorage } from './../JsonClass';
import { UIManager } from './../UIManager';
import { GameRecord } from './../GameRecord';
import { TimeUtils } from './../Utils/TimeUtils';
import { Toast } from './../Toast';
import { ItemID } from './../GlobalEnum';
import { EventManager } from './../Event/EventManager';
import { ModuleEventKey } from './../IGameRawData';
import { UILayerManager } from './../UILayerManager';
import { GameLogicConfig } from './../GameLogicConfig';
import { Goods } from './../Goods';
import { FlyEffectManager } from './../FlyEffectManager';
import { DnSdkManager } from './../DnSdkManager';
import { HeartSource } from './../HeartManager';

const { ccclass, property } = _decorator;

@ccclass('DailyRewardsView')
export class DailyRewardsView extends BasePanel {
    @property(Node)
    public itemLayout: Node = null;

    @property(Prefab)
    public dayItem: Prefab = null;

    @property(DailyRewardsItem)
    public bigReward: DailyRewardsItem = null;

    private config: any[] = [];
    private allItems: DailyRewardsItem[] = [];
    private flying: boolean = false;

    public onShow(): void {
        SDKInstance.officialPage();
        this.config = JsonClassStorage.instance.getTableJson("DailyRewards").json;

        for (let i = 0; i < this.config.length; i++) {
            if (i === this.config.length - 1) {
                this.bigReward.init(this.config[i]);
                this.allItems.push(this.bigReward);
            } else {
                const itemNode = instantiate(this.dayItem);
                itemNode.parent = this.itemLayout;
                const itemComponent = itemNode.getComponent(DailyRewardsItem);
                itemComponent.init(this.config[i]);
                this.allItems.push(itemComponent);
            }
        }
    }

    public onHide(): void {
        // No implementation needed
    }

    public onCliamClick(): void {
        AudioUtils.btn_click_sound();

        if (this.flying) {
            return;
        }

        const recorder = GameRecord.GetInstance().DailyRewardsRecorder;
        const times = recorder.Data.getTimes;
        const currentDate = TimeUtils.getYMD();

        if (times >= 7) {
            Toast.instance.tip_div("All rewards claimed!");
            return;
        }

        if (recorder.Data.lastGetYMD === currentDate) {
            Toast.instance.tip_div("Come back tomorrow!");
            return;
        }

        recorder.getReward();

        const targetItem = this.allItems.find(item => item._cfg.id === times + 1);
        if (!targetItem) {
            return;
        }

        this.flying = true;
        DnSdkManager.instance.sdk?.track("CHECK_IN", {});

        targetItem.goodsLayout.children.forEach((childNode: Node) => {
            const goodsComponent = childNode.getComponent(Goods);
            const goodsId = goodsComponent.goodsId;
            const goodsNum = goodsComponent.goodsNum;

            if (goodsId === ItemID.GOLD) {
                FlyEffectManager.instance.playFlyCoins(
                    goodsNum,
                    goodsComponent.icon.node.worldPosition,
                    () => {
                        EventManager.emit(
                            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddGold,
                            goodsNum,
                            false
                        );
                        this.animComplete();
                    }
                );
            } else if (goodsId === ItemID.HEART || goodsId === ItemID.InfiniteHeart) {
                FlyEffectManager.instance.playFlyHearts(
                    goodsNum,
                    goodsComponent.icon.node.worldPosition,
                    goodsComponent.icon.node.scale,
                    () => {
                        if (goodsId === ItemID.InfiniteHeart) {
                            EventManager.emit(
                                GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.SetHeartInfinite,
                                goodsNum
                            );
                        } else {
                            EventManager.emit(
                                GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddHeart,
                                goodsNum,
                                true,
                                HeartSource.Other
                            );
                        }
                        this.animComplete();
                    }
                );
            } else {
                EventManager.emit(
                    GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddItem,
                    [goodsId, goodsNum],
                    false
                );
                FlyEffectManager.instance.playFlyGoods(
                    goodsId,
                    goodsNum,
                    goodsComponent.icon.node.worldPosition,
                    {
                        flyNode: goodsComponent.icon.node,
                        targetNode: UILayerManager.instance.mainUnSelectTab,
                        callback: () => {
                            this.animComplete();
                        }
                    }
                );
            }
        });
    }

    private animComplete(): void {
        this.flying = false;
        EventManager.emit(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet,
            [false]
        );
        this.allItems.forEach(item => {
            item.updateState();
        });
    }

    public onCloseClick(): void {
        AudioUtils.btn_close_sound();
        if (!this.flying) {
            UIManager.deleteNode("DailyRewardsView");
        }
    }
}