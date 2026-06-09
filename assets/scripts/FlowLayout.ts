import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('FlowLayout')
@executeInEditMode
export class FlowLayout extends Component {
    public static EventType = {
        ON_LAYOUT_UPDATE: "onLayoutUpdate"
    };

    @property({
        tooltip: "水平间距"
    })
    private _spaceX: number = 10;

    @property({
        tooltip: "垂直间距（行间距）"
    })
    private _spaceY: number = 10;

    @property({
        tooltip: "固定行高，如果为0则自动计算行高"
    })
    private _rowHeight: number = 0;

    @property
    public fitSpaceX: boolean = false;

    private _childrenUITransforms: UITransform[] = [];
    private _positions: Vec3[] = [];
    private _lockSize: boolean = false;
    private _row: number = 0;

    public get spaceX(): number {
        return this._spaceX;
    }

    public set spaceX(value: number) {
        this._spaceX = value;
        this.updateLayout();
    }

    public get spaceY(): number {
        return this._spaceY;
    }

    public set spaceY(value: number) {
        this._spaceY = value;
        this.updateLayout();
    }

    public get rowHeight(): number {
        return this._rowHeight;
    }

    public set rowHeight(value: number) {
        this._rowHeight = value;
        this.updateLayout();
    }

    public start(): void {
        this.updateLayout();
    }

    public onEnable(): void {
        this.node.on(Node.EventType.CHILD_ADDED, this.onChildChanged, this);
        this.node.on(Node.EventType.CHILD_REMOVED, this.onChildChanged, this);
        this.node.on(Node.EventType.ANCHOR_CHANGED, this.onAnchorChanged, this);
        this.node.on(Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    public onDisable(): void {
        this.node.off(Node.EventType.CHILD_ADDED, this.onChildChanged, this);
        this.node.off(Node.EventType.CHILD_REMOVED, this.onChildChanged, this);
        this.node.off(Node.EventType.ANCHOR_CHANGED, this.onAnchorChanged, this);
        this.node.off(Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    private onChildChanged(): void {
        this.scheduleOnce(() => {
            this.updateLayout();
        }, 0);
    }

    private onAnchorChanged(): void {
        const uiTransform = this.getComponent(UITransform);
        if (uiTransform) {
            const anchorX = uiTransform.anchorX;
            const anchorY = uiTransform.anchorY;
            console.log("FlowLayout: 检测到锚点变化事件，当前锚点: (" + anchorX.toFixed(2) + ", " + anchorY.toFixed(2) + ")");
            this.scheduleOnce(() => {
                this.updateLayout();
            }, 0);
        }
    }

    private onSizeChanged(): void {
        if (!this._lockSize) {
            console.log("FlowLayout: 检测到尺寸变化事件");
            this.scheduleOnce(() => {
                this.updateLayout();
            }, 0);
        }
    }

    public updateLayout(): void {
        const uiTransform = this.getComponent(UITransform);
        if (uiTransform) {
            const width = uiTransform.width;
            const activeChildren = this.node.children.filter((child: Node) => {
                return child.active;
            });

            if (activeChildren.length !== 0) {
                this._childrenUITransforms = activeChildren.map((child: Node) => {
                    return child.getComponent(UITransform);
                }).filter((transform: UITransform | null) => {
                    return transform !== null;
                });

                this.calculateLayout(width);
                this.applyLayout();
                this.node.emit(FlowLayout.EventType.ON_LAYOUT_UPDATE, this);
            } else {
                uiTransform.height = 0;
            }
        } else {
            console.warn("FlowLayout: 组件所在节点缺少 UITransform 组件");
        }
    }

    private calculateLayout(containerWidth: number): void {
        const uiTransform = this.getComponent(UITransform);
        if (uiTransform) {
            const rows: { transforms: UITransform[]; width: number; itemWidth: number }[] = [];
            let currentRow: UITransform[] = [];
            let currentWidth = 0;
            let currentItemWidth = 0;

            for (let i = 0; i < this._childrenUITransforms.length; i++) {
                const childTransform = this._childrenUITransforms[i];
                const childWidth = childTransform.width;
                const newWidth = currentWidth + (currentRow.length > 0 ? this.spaceX : 0) + childWidth;

                if (currentRow.length > 0 && newWidth > containerWidth) {
                    rows.push({
                        transforms: [...currentRow],
                        width: currentWidth,
                        itemWidth: currentItemWidth
                    });
                    currentRow = [childTransform];
                    currentWidth = childWidth;
                    currentItemWidth = childWidth;
                } else {
                    currentRow.push(childTransform);
                    currentWidth = newWidth;
                    currentItemWidth += childWidth;
                }
            }

            if (currentRow.length > 0) {
                rows.push({
                    transforms: currentRow,
                    width: currentWidth,
                    itemWidth: currentItemWidth
                });
            }

            let totalHeight = 0;
            for (let i = 0; i < rows.length; i++) {
                totalHeight += this.getRowHeight(rows[i].transforms);
            }

            if (rows.length > 0) {
                totalHeight += (rows.length - 1) * this.spaceY;
            }

            const anchorX = uiTransform.anchorX;
            const anchorY = uiTransform.anchorY;
            const startX = -uiTransform.width * anchorX;
            const startY = -totalHeight * anchorY;
            let currentY = 0;
            const positions = new Array(this._childrenUITransforms.length);

            for (let rowIndex = rows.length - 1; rowIndex >= 0; rowIndex--) {
                const row = rows[rowIndex];
                const rowHeight = this.getRowHeight(row.transforms);
                const spacingX = this.fitSpaceX ? (containerWidth - row.itemWidth) / (row.transforms.length + 1) : this.spaceX;
                const offsetX = this.fitSpaceX ? spacingX : (containerWidth - row.width) / 2;

                for (let childIndex = 0; childIndex < row.transforms.length; childIndex++) {
                    const childTransform = row.transforms[childIndex];
                    const posX = startX + (offsetX + childTransform.width / 2);
                    const posY = startY + (currentY + rowHeight / 2);
                    positions[this.getChildIndexInRow(rows, rowIndex, childIndex)] = new Vec3(posX, posY, 0);
                    offsetX += childTransform.width + spacingX;
                }

                currentY += rowHeight + (rowIndex > 0 ? this.spaceY : 0);
            }

            this._positions = positions;
            this._lockSize = true;
            uiTransform.height = currentY;
            this._lockSize = false;
            this._row = rows.length;
        }
    }

    private getRowHeight(transforms: UITransform[]): number {
        if (this.rowHeight > 0) {
            return this.rowHeight;
        }

        let maxHeight = 0;
        for (const transform of transforms) {
            maxHeight = Math.max(maxHeight, transform.height);
        }
        return maxHeight;
    }

    private getChildIndexInRow(rows: { transforms: UITransform[]; width: number; itemWidth: number }[], rowIndex: number, childIndex: number): number {
        let index = 0;
        for (let i = 0; i < rowIndex; i++) {
            index += rows[i].transforms.length;
        }
        return index + childIndex;
    }

    private applyLayout(): void {
        for (let i = 0; i < this._childrenUITransforms.length && i < this._positions.length; i++) {
            const childTransform = this._childrenUITransforms[i];
            const position = this._positions[i];
            childTransform.node.setPosition(position);
        }
    }

    public getRow(): number {
        return this._row;
    }
}