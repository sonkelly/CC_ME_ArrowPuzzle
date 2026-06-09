import { _decorator, Component, Node, Label, Vec2, settings, Sorting2D } from 'cc';
const { ccclass } = _decorator;

/**
 * 修改UI排序层级
 * @param node 目标节点
 * @param sortingLayer 排序层级值
 * @param sortingOrder 排序顺序（可选）
 */
function changeUISortingLayer(node: Node, sortingLayer: number, sortingOrder?: number): void {
    const hasSorting2D = typeof Sorting2D !== 'undefined';
    if (!hasSorting2D) return;

    let layers = settings.querySettings('engine', 'sortingLayers') as Array<{ id: number; value: number; name: string }>;
    if (!layers || layers.length === 0) {
        layers = [{ id: 0, value: 0, name: 'default' }];
    }

    const foundLayer = layers.find(layer => layer.value === sortingLayer);
    if (!foundLayer) {
        console.warn(`❌未找到对应的sortingLayer:${sortingLayer}，请检查是否已在项目设置中配置该层级。将使用默认层级代替。`);
        sortingLayer = layers[0].value;
    }

    const sortingComponent = node.getComponent(Sorting2D) || node.addComponent(Sorting2D);
    if (sortingComponent) {
        sortingComponent.sortingLayer = sortingLayer;
        if (sortingOrder !== undefined) {
            sortingComponent.sortingOrder = sortingOrder;
        }
    }
}

@ccclass('VScrollViewItem')
export class VScrollViewItem extends Component {
    public dataIndex: number = -1;
    public useItemClickEffect: boolean = true;
    public onClickCallback: ((index: number) => void) | null = null;
    public onLongPressCallback: ((index: number) => void) | null = null;
    public longPressTime: number = 0.6;

    private _touchStartNode: Node | null = null;
    private _isCanceled: boolean = false;
    private _startPos: Vec2 = new Vec2();
    private _moveThreshold: number = 40;
    private _clickThreshold: number = 10;
    private _longPressTimer: number = 0;
    private _isLongPressed: boolean = false;

    public onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
    }

    public start(): void {
        // Khởi tạo nếu cần
    }

    public onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
    }

    public onSortLayer(): void {
        let order = 1;
        const labels = this.node.getComponentsInChildren(Label);
        for (let i = 0; i < labels.length; i++) {
            changeUISortingLayer(labels[i].node, 0, order);
            order++;
        }
    }

    public offSortLayer(): void {
        const labels = this.node.getComponentsInChildren(Label);
        for (let i = 0; i < labels.length; i++) {
            changeUISortingLayer(labels[i].node, 0, 0);
        }
    }

    public setDataIndex(index: number): void {
        this.dataIndex = index;
    }

    public update(deltaTime: number): void {
        if (!this._touchStartNode || this._isCanceled || this._isLongPressed) return;
        
        this._longPressTimer += deltaTime;
        if (this._longPressTimer >= this.longPressTime) {
            this._triggerLongPress();
        }
    }

    private _triggerLongPress(): void {
        this._isLongPressed = true;
        if (this.onLongPressCallback) {
            this.onLongPressCallback(this.dataIndex);
        }
        this._restoreScale();
    }

    private _onTouchStart(event: any): void {
        this._touchStartNode = this.node;
        this._isCanceled = false;
        this._isLongPressed = false;
        this._longPressTimer = 0;
        event.getLocation(this._startPos);
        
        if (this.useItemClickEffect && this.node.children.length > 0) {
            this.node.setScale(0.95, 0.95);
        }
    }

    private _onTouchMove(event: any): void {
        if (this._isCanceled) return;

        const location = event.getLocation();
        const deltaX = location.x - this._startPos.x;
        const deltaY = location.y - this._startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > this._moveThreshold) {
            this._isCanceled = true;
            this._restoreScale();
            this._touchStartNode = null;
        }
    }

    private _onTouchEnd(event: any): void {
        if (this._isCanceled) {
            this._reset();
            return;
        }

        if (this._isLongPressed) {
            this._reset();
            return;
        }

        this._restoreScale();
        
        const location = event.getLocation();
        const deltaX = location.x - this._startPos.x;
        const deltaY = location.y - this._startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < this._clickThreshold && this._touchStartNode === this.node) {
            if (this.onClickCallback) {
                this.onClickCallback(this.dataIndex);
            }
        }

        this._reset();
    }

    private _onTouchCancel(event: any): void {
        this._restoreScale();
        this._reset();
    }

    private _restoreScale(): void {
        if (this.useItemClickEffect && this.node.children.length > 0) {
            this.node.setScale(1, 1);
        }
    }

    private _reset(): void {
        this._touchStartNode = null;
        this._isCanceled = false;
        this._longPressTimer = 0;
        this._isLongPressed = false;
    }
}