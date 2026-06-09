import { _decorator } from "cc";
import { ShopState, ExcelVideoType, ItemID } from "./../GlobalEnum";
import { Toast } from "./../Toast";
import { GameLogicConfig } from "./../GameLogicConfig";
import { FlyEffectManager } from "./../FlyEffectManager";
import { PayUtils } from "./../Utils/PayUtils";
import { JsonClassStorage } from "./../JsonClass";
import { EventManager } from "./../Event/EventManager";
import { UILayerManager } from "./../UILayerManager";
import { ModuleEventKey } from "./../IGameRawData";
import { GameRecord } from "./../GameRecord";
import { DnSdkManager } from "./../DnSdkManager";
import { HeartSource } from "./../HeartManager";
import { Utils } from "./../Utils";

export class ShopDataManager {
    private static _instance: ShopDataManager = null;

    public state: ShopState = undefined;
    private _shopInfos: { [key: string]: any } = undefined;
    public flying: boolean = false;
    public videoBuyItem: any = null;

    public static get instance(): ShopDataManager {
        if (!ShopDataManager._instance) {
            ShopDataManager._instance = new ShopDataManager();
        }
        return ShopDataManager._instance;
    }

    public init(): void {
        this.addListen();
        this._shopInfos = {};
        this.state = ShopState.DISABLE;

        if (!SDKInstance.isGooglePlayNative() && SDKInstance.isFacebookMiniGame()) {
            PayUtils.purchasesReady(() => {
                console.log("purchase ready");
                PayUtils.getCatalog((catalog: any[]) => {
                    for (let i = 0; i < catalog.length; i++) {
                        this._shopInfos[catalog[i].productID] = catalog[i];
                    }
                    console.log("shopInfos", this._shopInfos);
                    this.state = ShopState.ENABLE;
                });
            });
        }
    }

    private addListen(): void {
        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.VideoBuyCompleted,
            this.onVideoBuyCompleted,
            this
        );
    }

    public getPurchaseInfo(productId: string): any {
        return this._shopInfos[productId];
    }

    public buy(productId: string, targetNode: any): void {
        if (SDKInstance.isDebug()) {
            this.modifyOrder(productId, targetNode);
            return;
        }

        if (SDKInstance.isGooglePlayNative()) {
            const payConfig = JsonClassStorage.instance.getOneJson("PayConfig", "ID", +productId);
            let payId = +productId;
            
            if (payId === 10002) {
                payId = 100021;
            }
            if (payId === 10004) {
                payId = 100041;
            }

            console.log("GooglePlay buy=======>");
            console.log("pay pid:", payId);
            console.log("pay config id:", payConfig.ID);

            if (utils) {
                Utils.instance.sendPay(
                    {
                        pid: payId,
                        name: payConfig.Name,
                        name_en: payConfig.Name,
                        price: "$" + payConfig.Price,
                        type: payConfig.PriceType.toString(),
                        reward: payConfig.DropNums[0]
                    },
                    (result: any) => {
                        console.log("GooglePlay buy succ:", result);
                        this.modifyOrder(productId, targetNode);
                    },
                    (error: any) => {
                        console.log("GooglePlay buy fail:", error);
                    }
                );
            }
            return;
        }

        if (this.isSupportPurchases()) {
            if (!this.flying) {
                PayUtils.purchases(productId, (result: any) => {
                    console.log("purchase succ: ", result);
                    this.modifyOrder(productId, targetNode);
                });
            }
        } else {
            Toast.instance.tip_div("The device does not support purchase!");
        }
    }

    public buyByCoin(config: any, targetNode: any): void {
        if (this.flying) return;

        if (GameRecord.GetInstance().BaseRecorder.Data.Gold < config.Price) {
            Toast.instance.tip_div("Not enough coins!");
        } else {
            this.modifyOrder(config.ID.toString(), targetNode);
            EventManager.emit(
                GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantConsumeGold,
                config.Price
            );
        }
    }

    public buyByVideo(config: any, targetNode: any): void {
        if (this.flying) return;

        this.videoBuyItem = targetNode;
        EventManager.emit(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSeeVideo,
            [ExcelVideoType.SHOP_FREE, config]
        );

        const sdk = DnSdkManager.instance.sdk;
        if (sdk) {
            sdk.track("AD_CLICK", {
                ad_placement_name: config.ID === 10005 ? 13 : 4
            });
        }
    }

    private onVideoBuyCompleted(config: any): void {
        console.log("onVideoBuyCompleted:", config);

        if (SDKInstance.isFacebookMiniGame() || SDKInstance.isGooglePlayNative()) {
            this.modifyOrder(config.ID.toString(), this.videoBuyItem);
        } else {
            if (GameRecord.GetInstance().ShopDataRecorder.ShopVideoSee(config.ID, 1)) {
                this.modifyOrder(config.ID.toString(), this.videoBuyItem);
                GameRecord.GetInstance().ShopDataRecorder.ShopVideoReset(config.ID);

                const sdk = DnSdkManager.instance.sdk;
                if (sdk) {
                    sdk.track("AD_VIDEO_FINISH", {
                        ad_placement_name: config.ID === 10005 ? 13 : 4
                    });
                }
            }
            EventManager.emit(
                GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.VideoBuyUpdate,
                config.ID
            );
        }
    }

    private modifyOrder(productId: string, targetNode: any): void {
        const payConfig = SDKInstance.isFacebookMiniGame() || SDKInstance.isGooglePlayNative()
            ? JsonClassStorage.instance.getOneJson("PayConfig", "ID", +productId)
            : JsonClassStorage.instance.getOneJson("PayConfigWx", "ID", +productId);

        if (!payConfig) return;

        this.flying = true;
        const dropIds = payConfig.DropIds;
        
        dropIds.forEach((dropId: number, index: number) => {
            const dropNum = payConfig.DropNums[index] ?? 1;
            let flyTarget = null;

            if (targetNode) {
                flyTarget = targetNode.children[index];
            }
            if (!flyTarget) {
                flyTarget = UILayerManager.instance.UILayer;
            }

            if (dropId === ItemID.GOLD) {
                FlyEffectManager.instance.playFlyCoins(dropNum, flyTarget.worldPosition, () => {
                    EventManager.emit(
                        GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddGold,
                        dropNum,
                        false
                    );
                    this.animComplete();
                });
            } else if (dropId === ItemID.HEART || dropId === ItemID.InfiniteHeart) {
                FlyEffectManager.instance.playFlyHearts(dropNum, flyTarget.worldPosition, flyTarget.scale, () => {
                    if (dropId === ItemID.InfiniteHeart) {
                        EventManager.emit(
                            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.SetHeartInfinite,
                            dropNum
                        );
                    } else {
                        EventManager.emit(
                            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddHeart,
                            dropNum,
                            true,
                            HeartSource.GoldExc
                        );
                    }
                    this.animComplete();
                });
            } else if (dropId === ItemID.NoAds) {
                GameRecord.GetInstance().BaseRecorder.BuyTheNosAds();
                EventManager.emit(
                    GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet,
                    [false]
                );
                Toast.instance.tip_div("Forever Remove interstitial ads!");
                this.animComplete();
            } else {
                if (flyTarget.children[0]) {
                    EventManager.emit(
                        GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddItem,
                        [dropId, dropNum],
                        false
                    );
                    FlyEffectManager.instance.playFlyGoods(dropId, dropNum, flyTarget.worldPosition, {
                        flyNode: flyTarget.children[0],
                        targetNode: UILayerManager.instance.mainUnSelectTab,
                        callback: () => {
                            this.animComplete();
                        }
                    });
                } else {
                    EventManager.emit(
                        GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddItem,
                        [dropId, dropNum],
                        true
                    );
                    this.animComplete();
                }
            }
        });

        EventManager.emit(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.PayCompleted
        );
    }

    private animComplete(): void {
        this.flying = false;
    }

    public isSupportPurchases(): boolean {
        return this.state === ShopState.ENABLE && Object.keys(this._shopInfos).length > 0;
    }

    public onEnterGame(): void {
        PayUtils.purchasesFailOrder();
    }

    public buyFaildOrder(failedOrders: any[]): void {
        for (let i = 0; i < failedOrders.length; i++) {
            const order = failedOrders[i];
            this.modifyOrder(order, null);
        }
    }
}