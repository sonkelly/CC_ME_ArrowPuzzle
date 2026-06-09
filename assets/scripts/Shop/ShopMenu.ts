import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { EventManager } from './../Event/EventManager';
import { MainNavMenu } from './../MainNavMenu';
import { JsonClassStorage } from './../JsonClass';
import { ShopItem } from './../Shop/ShopItem';
import { CCExtends } from './../CCExtends';
import { GameLogicConfig } from './../GameLogicConfig';
import { ModuleEventKey } from './../IGameRawData';
import { DnSdkManager } from './../DnSdkManager';

const { ccclass, property } = _decorator;

@ccclass('ShopMenu')
export class ShopMenu extends MainNavMenu {
    @property(Node)
    private content: Node = null;

    @property(Prefab)
    private itemSmall: Prefab = null;

    @property(Prefab)
    private itemBig: Prefab = null;

    @property(Node)
    private contentWx: Node = null;

    public onDestroy(): void {
        super.onDestroy();
        EventManager.offAll(this);
    }

    public onLoad(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.PayCompleted, this.handler_PayCompleted, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.VideoBuyUpdate, this.handler_VideoBuyUpdate, this);
    }

    public OnShow(): void {
        this.showShopMenu();
    }

    private async showShopMenu(): Promise<void> {
        let payConfig: any[];
        let parentNode: Node;

        // Track ad placement show
        DnSdkManager.instance.sdk?.track("AD_PLACEMENT_SHOW", {
            ad_placement_name: 68
        });

        if (SDKInstance.isFacebookMiniGame() || SDKInstance.isGooglePlayNative()) {
            payConfig = JsonClassStorage.instance.getTableJson("PayConfig").json;
            CCExtends.DestroyNodeAllChildren(this.content);
            this.content.parent.parent.active = true;
            this.contentWx.active = false;
            parentNode = this.content;
        } else {
            payConfig = JsonClassStorage.instance.getTableJson("PayConfigWx").json;
            CCExtends.DestroyNodeAllChildren(this.contentWx);
            this.content.parent.parent.active = false;
            this.contentWx.active = true;
            parentNode = this.contentWx;
        }

        for (let i = 0; i < payConfig.length; i++) {
            const configItem = payConfig[i];
            let shopItemNode: Node;

            if (configItem.Type === 3) {
                shopItemNode = instantiate(this.itemBig);
            } else {
                shopItemNode = instantiate(this.itemSmall);
            }

            shopItemNode.parent = parentNode;
            shopItemNode.getComponent(ShopItem).init(configItem);
        }
    }

    private handler_PayCompleted(): void {
        this.content.children.forEach((child: Node) => {
            child.getComponent(ShopItem).updateNoAdsUI();
        });
    }

    private handler_VideoBuyUpdate(data: any): void {
        this.contentWx.children.forEach((child: Node) => {
            child.getComponent(ShopItem).updateVideoUI(data);
        });
    }

    public OnEvent(eventData: any): void {
        // Empty implementation
    }

    public OnHide(): void {
        // Empty implementation
    }
}