import { _decorator, Component, Label, Node, Sprite, UITransform, tween, v3, UIOpacity } from 'cc';
import { Toast } from './Toast';
import { UIUtils } from './Utils/UIUtils';
import { JsonClassStorage } from './JsonClass';
import { I18nManager } from './I18nManager';

const { ccclass, property } = _decorator;

@ccclass('ToastTip')
export class ToastTip extends Component {
    @property(Label)
    public lb_tip: Label = null;

    @property(Node)
    public bgNode: Node = null;

    @property(Sprite)
    public spItem: Sprite = null;

    public owner: any = null;

    public tip(text: string, itemId: number = 0, offsetY: number = 0, params: string = ""): void {
        this.lb_tip.node.active = true;
        this.lb_tip.string = I18nManager.t(text, params);
        this.lb_tip.updateRenderData(true);
        this.bgNode.getComponent(UITransform).height = this.lb_tip.node.getComponent(UITransform).height + 40;

        if (itemId > 0) {
            const itemData = JsonClassStorage.instance.getOneJson("ItemData", "ItemId", itemId);
            UIUtils.setItemIcon(this.spItem, itemData.Icon);
            this.spItem.node.active = true;
        } else {
            this.spItem.node.active = false;
        }

        tween(this.node)
            .set({ position: v3(0, offsetY, 0) })
            .to(Toast.conf.move, { position: v3(0, offsetY + Toast.conf.move_value, 0) })
            .delay(Toast.conf.delay)
            .call(() => {
                this.owner.pool.put(this.node);
            })
            .start();
    }

    public colorTip(text: string, offsetY: number = 0): void {
        this.lb_tip.node.active = false;
        this.bgNode.getComponent(UITransform).height = this.lb_tip.node.getComponent(UITransform).height + 40;

        tween(this.node)
            .set({ position: v3(0, offsetY, 0) })
            .to(Toast.conf.move, { position: v3(0, offsetY + Toast.conf.move_value, 0) })
            .delay(Toast.conf.delay)
            .call(() => {
                this.owner.pool.put(this.node);
            })
            .start();
    }

    public tip_rich(text: string, offsetY: number = 0): void {
        this.lb_tip.string = text;

        tween(this.node)
            .set({ position: v3(0, offsetY, 0) })
            .to(Toast.conf.move, { position: v3(0, offsetY + Toast.conf.move_value, 0) })
            .delay(Toast.conf.delay)
            .call(() => {
                this.owner.pool.put(this.node);
            })
            .start();
    }

    public tip_daily_task(text: string): void {
        this.lb_tip.string = text;

        const opacityComponent = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        opacityComponent.opacity = 0;
        tween(opacityComponent)
            .to(0.3, { opacity: 255 }, { easing: "sineOut" })
            .start();

        tween(this.node)
            .by(0.3, { y: 150 }, { easing: "circOut" })
            .start();

        const opacityComponent2 = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        tween(opacityComponent2)
            .delay(0.5)
            .to(0.5, { opacity: 0 })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }
}