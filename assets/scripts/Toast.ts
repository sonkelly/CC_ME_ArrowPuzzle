import { _decorator, Component, Node, Prefab, NodePool, instantiate } from 'cc';
import { ToastTip } from './ToastTip';
import { TextUtils } from './Utils/TextUtils';

const { ccclass, property } = _decorator;

@ccclass('Toast')
export class Toast extends Component {
    public static instance: Toast = null;

    @property(Node)
    public container: Node = null;

    @property(Prefab)
    public toast_tip_prefab: Prefab = null;

    public pool: NodePool = new NodePool();
    public nextToastTime: number = 0;
    public arrWaitToast: Array<Function> = [];
    public readonly TOAST_STRIDE: number = 0.5;

    public static conf = {
        move: 0.8,
        move_value: 160,
        delay: 0.2
    };

    public onLoad(): void {
        Toast.instance = this;
    }

    public update(deltaTime: number): void {
        this.nextToastTime -= deltaTime;
        if (this.arrWaitToast.length < 1 || this.nextToastTime > 0) {
            return;
        }
        this.nextToastTime = this.TOAST_STRIDE;
        this.arrWaitToast[0]();
        this.arrWaitToast.shift();
    }

    public async tip(textKey: string, ...args: any[]): Promise<void> {
        const text = await TextUtils.getText(textKey);
        if (!text) {
            return;
        }
        const formattedText = TextUtils.replaceStrArr(text, args);
        const toastTip = this.get_tip_node().getComponent(ToastTip);
        toastTip.owner = this;
        toastTip.node.active = false;
        this.arrWaitToast.push(() => {
            toastTip.node.active = true;
            toastTip.tip(formattedText);
        });
    }

    public async tip_div(text: string, x: number = 0, y: number = 0, extra: string = ""): Promise<void> {
        const toastTip = this.get_tip_node().getComponent(ToastTip);
        toastTip.owner = this;
        toastTip.node.active = false;
        this.arrWaitToast.push(() => {
            toastTip.node.active = true;
            toastTip.tip(text, x, y, extra);
        });
    }

    public async tip_div_color(text: string, colorIndex: number = 0): Promise<void> {
        const toastTip = this.get_tip_node().getComponent(ToastTip);
        toastTip.owner = this;
        toastTip.node.active = false;
        this.arrWaitToast.push(() => {
            toastTip.node.active = true;
            toastTip.colorTip(text, colorIndex);
        });
    }

    public async tip_drop(text: string, dropIndex: number = 0): Promise<void> {
        const toastTip = this.get_tip_node().getComponent(ToastTip);
        toastTip.owner = this;
        toastTip.node.active = false;
        this.arrWaitToast.push(() => {
            toastTip.node.active = true;
            toastTip.tip(text, dropIndex);
        });
    }

    private get_tip_node(): Node {
        let node = this.pool.get();
        if (!node) {
            node = instantiate(this.toast_tip_prefab);
        }
        node.parent = this.container;
        return node;
    }
}