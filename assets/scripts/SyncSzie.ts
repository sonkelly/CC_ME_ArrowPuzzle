import { _decorator, Component, Node, Vec2, UITransform } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('SyncSize')
@executeInEditMode
export class SyncSize extends Component {
    @property
    private _syncWidth: boolean = true;

    @property
    private _syncHeight: boolean = true;

    @property({ type: [Node] })
    private _targets: Node[] = [];

    @property({ type: [Vec2] })
    private _offsets: Vec2[] = [];

    get syncWidth(): boolean {
        return this._syncWidth;
    }
    set syncWidth(value: boolean) {
        this._syncWidth = value;
        this.onSizeChanged();
    }

    get syncHeight(): boolean {
        return this._syncHeight;
    }
    set syncHeight(value: boolean) {
        this._syncHeight = value;
        this.onSizeChanged();
    }

    get targets(): Node[] {
        return this._targets;
    }
    set targets(value: Node[]) {
        this._targets = value;
        this.onSizeChanged();
    }

    get offsets(): Vec2[] {
        return this._offsets;
    }
    set offsets(value: Vec2[]) {
        this._offsets = value;
        this.onSizeChanged();
    }

    onEnable(): void {
        this.node.on(Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
        this.onSizeChanged();
    }

    onDisable(): void {
        this.node.off(Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    onSizeChanged(): void {
        const contentSize = this.node.getComponent(UITransform).contentSize;
        for (let i = 0; i < this._targets.length; i++) {
            if (this._targets[i]) {
                const targetTransform = this._targets[i].getComponent(UITransform);
                if (this.syncHeight) {
                    targetTransform.height = contentSize.height + (this._offsets[i]?.y || 0);
                }
                if (this.syncWidth) {
                    targetTransform.width = contentSize.width + (this._offsets[i]?.x || 0);
                }
            }
        }
    }
}