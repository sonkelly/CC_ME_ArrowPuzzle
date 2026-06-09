import { _decorator, Component, Node, Widget, view, Label, Sprite, instantiate, Canvas, ResolutionPolicy, UITransform, find } from 'cc';
import { EventManager } from './Event/EventManager';
import { Utilsqdd } from './Utils/Utilsqdd';
import { UIUtils } from './Utils/UIUtils';
import { GameLogicConfig } from './GameLogicConfig';
import { UIManager } from './UIManager';

const { ccclass, property } = _decorator;

@ccclass('BasePanel')
export class BasePanel extends Component {
    @property({
        tooltip: "是否缓存资源"
    })
    public cache: boolean = true;

    @property
    public adapt_enable: boolean = false;

    @property({
        type: Node,
        tooltip: "适配节点: <主动挂载 | 节点名为(adaptNode) 择一即可>",
        visible: function (this: BasePanel) {
            return this.adapt_enable;
        }
    })
    public adaptNode: Node | null = null;

    @property({
        tooltip: "初始化视图时同步红点路径,详细查看<RedDotConf>,举例填root,则是刷新整个红点树"
    })
    public red_dot_path: string = "";

    public autoRes: any[] = [];
    public isDirty: boolean = false;
    public panelName: string = "";

    public adapted(): void {
        if (this.adapt_enable) {
            if (!this.adaptNode) {
                this.adaptNode = this.node.getChildByName("adaptNode");
            }
            if (this.adaptNode) {
                const widget = this.adaptNode.getComponent(Widget);
                if (widget) {
                    const ratio = view.getViewportRect().height / view.getViewportRect().width;
                    const safeInsets = {
                        top: ratio > 2 ? GameLogicConfig.safe_size_conf.top : 0,
                        bottom: ratio > 2 ? GameLogicConfig.safe_size_conf.bottom : 0
                    };
                    widget.top = safeInsets.top;
                    widget.bottom = safeInsets.bottom;
                }
            }
            UIUtils.updateWidgets(this.adaptNode);
        }
    }

    public setData(data: Record<string, any>): void {
        const keys = Object.keys(data);
        const promises = keys.map((key) => {
            return new Promise<void>((resolve, reject) => {
                const value = data[key];
                const currentValue = (this as any)[key];

                if (currentValue === 0 || 
                    Utilsqdd.getDateType(currentValue) === "Number" || 
                    Utilsqdd.getDateType(currentValue) === "String" || 
                    Utilsqdd.getDateType(currentValue) === "Array" || 
                    Utilsqdd.getDateType(currentValue) === "Object") {
                    (this as any)[key] = value;
                    resolve();
                } else if (currentValue instanceof Label) {
                    currentValue.string = value;
                    resolve();
                } else if (currentValue instanceof Sprite) {
                    currentValue.spriteFrame = value;
                    resolve();
                } else if (currentValue instanceof Node) {
                    const newNode = instantiate(value);
                    newNode.position = currentValue.position;
                    newNode.parent = currentValue.parent;
                    (this as any)[key] = newNode;
                    resolve();
                } else {
                    console.warn(key + " 值的类型不确定 " + Utilsqdd.getDateType(currentValue));
                }
            });
        });

        Promise.all(promises);
    }

    public onDestroy(): void {
        this.releaseAutoRes();
        EventManager.offAll(this);
    }

    public onShow(): void {
        this.isDirty = false;
    }

    public onHide(): void {
        // Empty implementation
    }

    public resize(): void {
        const designSize = view.getDesignResolutionSize();
        const frameSize = view.getFrameSize();
        let width = frameSize.width;
        let height = frameSize.height;
        let newWidth = width;
        let newHeight = height;
        const canvas = find("Canvas").getComponent(Canvas);

        if (width / height > designSize.width / designSize.height) {
            newHeight = designSize.height;
            newWidth = newHeight * width / height;
        } else {
            newWidth = designSize.width;
            newHeight = height / width * newWidth;
        }

        view.setDesignResolutionSize(newWidth, newHeight, ResolutionPolicy.UNKNOWN);
        canvas.node.getComponent(UITransform).width = newWidth;
        canvas.node.getComponent(UITransform).height = newHeight;
    }

    public releaseAutoRes(): void {
        if (!this.cache) {
            for (let i = 0; i < this.autoRes.length; i++) {
                this.autoRes[i].decRef();
            }
            this.autoRes.length = 0;
        }
    }

    public autoReleaseRes(res: any): void {
        res.addRef();
        this.autoRes.push(res);
    }

    public findGuideNode(nodeName: string): Node | null {
        return null;
    }

    public isGuideTargetView(nodeName: string): boolean {
        return true;
    }

    public hide(): void {
        UIManager.deleteNode(this.panelName);
    }
}