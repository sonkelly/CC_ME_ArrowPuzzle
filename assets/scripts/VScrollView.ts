import { _decorator, Component, Node, Prefab, Vec2, Vec3, input, Input, math, Widget, tween, UITransform, Mask, instantiate, Enum } from 'cc';
import { VScrollViewItem } from './VScrollViewItem';

const { ccclass, property, menu } = _decorator;

// ====================== NodePool ======================
class NodePool {
    private pools: Map<number, Node[]> = new Map();
    private prefabs: Prefab[] = [];
    private nodes: Node[] = [];
    private useNodeMode: boolean = false;

    constructor(prefabs: Prefab[], nodes?: Node[]) {
        this.prefabs = prefabs;
        this.nodes = nodes || [];
        this.useNodeMode = nodes && nodes.length > 0;
        const count = this.useNodeMode ? nodes!.length : prefabs.length;
        for (let i = 0; i < count; i++) {
            this.pools.set(i, []);
        }
    }

    get(typeIndex: number): Node | null {
        const pool = this.pools.get(typeIndex);
        if (!pool) {
            console.error(`[VScrollView NodePool] 类型 ${typeIndex} 不存在`);
            return null;
        }
        if (pool.length > 0) {
            const node = pool.pop()!;
            node.active = true;
            return node;
        }
        let newNode: Node;
        if (this.useNodeMode) {
            const template = this.nodes[typeIndex];
            if (!template) {
                console.error(`[VScrollView NodePool] Node 类型 ${typeIndex} 模板不存在`);
                return null;
            }
            newNode = instantiate(template);
        } else {
            const prefab = this.prefabs[typeIndex];
            if (!prefab) {
                console.error(`[VScrollView NodePool] Prefab 类型 ${typeIndex} 模板不存在`);
                return null;
            }
            newNode = instantiate(prefab);
        }
        return newNode;
    }

    put(node: Node, typeIndex: number): void {
        if (node) {
            const pool = this.pools.get(typeIndex);
            if (!pool) {
                console.error(`[VScrollView NodePool] 类型 ${typeIndex} 不存在`);
                node.destroy();
                return;
            }
            node.active = false;
            node.removeFromParent();
            pool.push(node);
        }
    }

    clear(): void {
        this.pools.forEach((pool) => {
            pool.forEach((node) => node.destroy());
            pool.length = 0;
        });
        this.pools.clear();
    }

    getStats(): Record<string, number> {
        const stats: Record<string, number> = {};
        this.pools.forEach((pool, key) => {
            stats[`type${key}`] = pool.length;
        });
        return stats;
    }
}

// ====================== Enums ======================
enum ScrollDirection {
    VERTICAL = 0,
    HORIZONTAL = 1
}

enum ItemCreationMode {
    NODE = 0,
    PREFAB = 1
}

enum RefreshState {
    IDLE = 0,
    PULLING = 1,
    READY = 2,
    REFRESHING = 3,
    COMPLETE = 4
}

enum LoadMoreState {
    IDLE = 0,
    PULLING = 1,
    READY = 2,
    LOADING = 3,
    COMPLETE = 4,
    NO_MORE = 5
}

// ====================== VirtualScrollView ======================
@ccclass('VirtualScrollView')
@menu('2D/VirtualScrollView(虚拟滚动列表)')
export class VirtualScrollView extends Component {
    // ==================== 属性定义 ====================
    @property({
        type: Node,
        displayName: '容器节点',
        tooltip: 'content 容器节点（在 Viewport 下）'
    })
    content: Node | null = null;

    @property({
        displayName: '启用虚拟列表',
        tooltip: '是否启用虚拟列表模式（关闭则仅提供滚动功能）'
    })
    useVirtualList: boolean = true;

    @property({
        type: Enum(ScrollDirection),
        displayName: '滚动方向',
        tooltip: '滚动方向：纵向（向上）或横向（向左）'
    })
    direction: ScrollDirection = ScrollDirection.VERTICAL;

    @property({
        type: Enum(ItemCreationMode),
        displayName: '创建模式',
        tooltip: '使用 Node 或 Prefab 创建子项（默认 Prefab）',
        visible(this: VirtualScrollView) { return this.useVirtualList; }
    })
    itemCreationMode: ItemCreationMode = ItemCreationMode.PREFAB;

    @property({
        type: Node,
        displayName: '子项节点',
        tooltip: '可选：从 Node 创建 item（等大小模式）',
        visible(this: VirtualScrollView) {
            return this.useVirtualList && !this.useDynamicSize && this.itemCreationMode === ItemCreationMode.NODE;
        }
    })
    itemNode: Node | null = null;

    @property({
        type: Prefab,
        displayName: '子项预制体',
        tooltip: '可选：从 Prefab 创建 item（等大小模式）',
        visible(this: VirtualScrollView) {
            return this.useVirtualList && !this.useDynamicSize && this.itemCreationMode === ItemCreationMode.PREFAB;
        }
    })
    itemPrefab: Prefab | null = null;

    @property({
        displayName: '不等大小模式',
        tooltip: '启用不等大小模式',
        visible(this: VirtualScrollView) { return this.useVirtualList; }
    })
    useDynamicSize: boolean = false;

    @property({
        displayName: '自动居中布局',
        tooltip: '当子项数量少于行/列数时，自动居中显示（适用于等大小模式）',
        visible(this: VirtualScrollView) {
            return this.useVirtualList && !this.useDynamicSize;
        }
    })
    autoCenter: boolean = false;

    @property({
        displayName: '启用分页吸附',
        tooltip: '滚动结束后自动吸附到最近的 item 位置'
    })
    enablePageSnap: boolean = false;

    @property({
        displayName: '===吸附动画时长',
        tooltip: '吸附动画的持续时间（秒）',
        range: [0.1, 1, 0.05],
        visible(this: VirtualScrollView) { return this.enablePageSnap; }
    })
    pageSnapDuration: number = 0.15;

    @property({
        displayName: '===切页距离比例',
        tooltip: '滑动距离超过页面尺寸的此比例时翻页（0.1-0.5）',
        range: [0.1, 0.5, 0.05],
        visible(this: VirtualScrollView) { return this.enablePageSnap; }
    })
    pageSnapDistanceRatio: number = 0.15;

    @property({
        displayName: '===吸附触发速度',
        tooltip: '惯性速度低于此值时触发吸附（越大越早吸附）',
        range: [50, 3000, 10],
        visible(this: VirtualScrollView) { return this.enablePageSnap; }
    })
    pageSnapTriggerVelocity: number = 600;

    // 废弃属性 - 保持兼容
    @property({
        displayName: '不等高模式（已废弃,仅保持兼容）',
        tooltip: '启用不等高模式（已废弃,仅保持兼容,请使用 useDynamicSize ）'
    })
    useDynamicHeight: boolean = false;

    @property({
        displayName: '列数（已废弃,仅保持兼容）',
        tooltip: '列数（已废弃,请使用 gridCount 替代，仅保持兼容）'
    })
    columns: number = 1;

    @property({
        displayName: '列间距（已废弃,仅保持兼容）',
        tooltip: '列间距（已废弃,请使用 gridSpacing 替代，仅保持兼容）'
    })
    columnSpacing: number = 0;

    @property({
        type: [Node],
        displayName: '子项节点数组',
        tooltip: '不等大小模式：预先提供的子项节点数组（可在编辑器拖入）',
        visible(this: VirtualScrollView) {
            return this.useVirtualList && this.useDynamicSize && this.itemCreationMode === ItemCreationMode.NODE;
        }
    })
    itemNodes: Node[] = [];

    @property({
        type: [Prefab],
        displayName: '子项预制体数组',
        tooltip: '不等大小模式：预先提供的子项预制体数组（可在编辑器拖入）',
        visible(this: VirtualScrollView) {
            return this.useVirtualList && this.useDynamicSize && this.itemCreationMode === ItemCreationMode.PREFAB;
        }
    })
    itemPrefabs: Prefab[] = [];

    @property({
        displayName: '行/列数',
        tooltip: '纵向模式为列数，横向模式为行数',
        range: [1, 10, 1],
        visible(this: VirtualScrollView) {
            return this.useVirtualList && !this.useDynamicSize;
        }
    })
    gridCount: number = 1;

    @property({
        displayName: '副方向间距',
        tooltip: '主方向垂直方向的间距（像素）',
        range: [0, 1000, 1],
        visible(this: VirtualScrollView) {
            return this.useVirtualList && !this.useDynamicSize;
        }
    })
    gridSpacing: number = 0;

    @property({
        displayName: '主方向间距',
        tooltip: '主方向的间距（像素）',
        range: [0, 1000, 1],
        visible(this: VirtualScrollView) { return this.useVirtualList; }
    })
    spacing: number = 0;

    @property({
        displayName: '头部间距',
        tooltip: '列表头部的额外间距（纵向为顶部，横向为左侧）',
        range: [0, 1000, 1],
        visible(this: VirtualScrollView) { return this.useVirtualList; }
    })
    headerSpacing: number = 0;

    @property({
        displayName: '尾部间距',
        tooltip: '列表尾部的额外间距（纵向为底部，横向为右侧）',
        range: [0, 1000, 1],
        visible(this: VirtualScrollView) { return this.useVirtualList; }
    })
    footerSpacing: number = 0;

    @property({
        displayName: '总条数',
        tooltip: '总条数（可在运行时 setTotalCount 动态修改）',
        range: [0, 10000, 1],
        visible(this: VirtualScrollView) { return this.useVirtualList; }
    })
    totalCount: number = 50;

    @property({
        displayName: '额外缓冲',
        tooltip: '额外缓冲（可视区外多渲染几条，避免边缘复用闪烁）',
        range: [0, 10, 1],
        visible(this: VirtualScrollView) { return this.useVirtualList; }
    })
    buffer: number = 1;

    @property({
        displayName: '启用下拉刷新',
        tooltip: '是否启用下拉刷新功能'
    })
    enablePullRefresh: boolean = false;

    @property({
        displayName: '===下拉触发距离',
        tooltip: '下拉多少距离触发刷新（像素）',
        range: [50, 500, 10],
        visible(this: VirtualScrollView) { return this.enablePullRefresh; }
    })
    pullRefreshThreshold: number = 100;

    @property({
        displayName: '===下拉最大距离',
        tooltip: '下拉的最大阻尼距离（像素）',
        range: [100, 1000, 10],
        visible(this: VirtualScrollView) { return this.enablePullRefresh; }
    })
    pullRefreshMaxOffset: number = 150;

    @property({
        displayName: '启用上拉加载',
        tooltip: '是否启用上拉加载更多功能'
    })
    enableLoadMore: boolean = false;

    @property({
        displayName: '===上拉触发距离',
        tooltip: '距离底部多少距离触发加载（像素）',
        range: [50, 500, 10],
        visible(this: VirtualScrollView) { return this.enableLoadMore; }
    })
    loadMoreThreshold: number = 100;

    @property({
        displayName: '===上拉最大距离',
        tooltip: '上拉的最大阻尼距离（像素）',
        range: [100, 1000, 10],
        visible(this: VirtualScrollView) { return this.enableLoadMore; }
    })
    loadMoreMaxOffset: number = 150;

    @property({
        displayName: '拉动阻尼系数',
        tooltip: '拉动时的阻尼系数（0-1），越小越难拉',
        range: [0.1, 1, 0.05],
        visible(this: VirtualScrollView) {
            return this.enablePullRefresh || this.enableLoadMore;
        }
    })
    pullDampingRate: number = 0.5;

    @property({
        displayName: '像素对齐',
        tooltip: '是否启用像素对齐'
    })
    pixelAlign: boolean = true;

    @property({
        displayName: '禁用越界滚动',
        tooltip: '是否禁用越界滚动（开启后将无法滚动到边界之外）'
    })
    disableBounce: boolean = false;

    @property({
        displayName: '惯性阻尼系数',
        tooltip: '指数衰减系数，越大减速越快',
        range: [0, 10, 0.5]
    })
    inertiaDampK: number = 1;

    @property({
        displayName: '弹簧刚度',
        tooltip: '越界弹簧刚度 K（建议 120–240）'
    })
    springK: number = 150;

    @property({
        displayName: '弹簧阻尼',
        tooltip: '越界阻尼 C（建议 22–32）'
    })
    springC: number = 26;

    @property({
        displayName: '速度阈值',
        tooltip: '速度阈值（像素/秒），低于即停止'
    })
    velocitySnap: number = 5;

    @property({
        displayName: '速度窗口',
        tooltip: '速度估计窗口（秒）'
    })
    velocityWindow: number = 0.08;

    @property({
        displayName: '最大惯性速度',
        tooltip: '最大惯性速度（像素/秒）'
    })
    maxVelocity: number = 6000;

    @property({
        displayName: 'iOS减速曲线',
        tooltip: '是否使用 iOS 风格的减速曲线'
    })
    useIOSDecelerationCurve: boolean = true;

    // ==================== 内部状态 ====================
    itemMainSize: number = 100;
    itemCrossSize: number = 100;

    // 回调函数
    renderItemFn: ((node: Node, index: number) => void) | null = null;
    provideNodeFn: ((index: number) => Node | Promise<Node>) | null = null;
    onItemClickFn: ((node: Node, index: number) => void) | null = null;
    onItemLongPressFn: ((node: Node, index: number) => void) | null = null;
    playItemAppearAnimationFn: ((node: Node, index: number) => void) | null = null;
    getItemHeightFn: ((index: number) => number) | null = null;
    getItemTypeIndexFn: ((index: number) => number) | null = null;
    onRefreshStateChangeFn: ((state: RefreshState, offset: number) => void) | null = null;
    onLoadMoreStateChangeFn: ((state: LoadMoreState, offset: number) => void) | null = null;
    onPageChangeFn: ((pageIndex: number) => void) | null = null;

    private _viewportSize: number = 0;
    private _contentSize: number = 0;
    private _boundsMin: number = 0;
    private _boundsMax: number = 0;
    private _velocity: number = 0;
    private _isTouching: boolean = false;
    private _velSamples: { t: number; delta: number }[] = [];
    private _slotNodes: (Node | null)[] = [];
    private _slots: number = 0;
    private _slotFirstIndex: number = 0;
    private _itemSizes: number[] = [];
    private _prefixPositions: number[] = [];
    private _prefabSizeCache: Map<number, number> = new Map();
    private _nodePool: NodePool | null = null;
    private _slotPrefabIndices: number[] = [];
    private _needAnimateIndices: Set<number> = new Set();
    private _initSortLayerFlag: boolean = true;
    private _scrollTween: any = null;
    private _tmpMoveVec2: Vec2 = new Vec2();
    private _refreshState: RefreshState = RefreshState.IDLE;
    private _loadMoreState: LoadMoreState = LoadMoreState.IDLE;
    private _pullOffset: number = 0;
    private _loadOffset: number = 0;
    private _isRefreshing: boolean = false;
    private _isLoadingMore: boolean = false;
    private _hasMore: boolean = true;
    private _currentPageIndex: number = 0;
    private _pageStartPos: number = 0;
    private _touchStartPos: Vec2 = new Vec2();
    private _hasDeterminedScrollDirection: boolean = false;
    private _shouldBlockParent: boolean = false;
    private _scrollDirectionThreshold: number = 15;
    private _scrollAngleThreshold: number = 30;
    private _templateNode: Node | null = null;

    // ==================== 属性存取器 ====================
    private get _contentTf(): UITransform {
        this.content = this._getContentNode();
        return this.content!.getComponent(UITransform)!;
    }

    private get _viewportTf(): UITransform {
        return this.node.getComponent(UITransform)!;
    }

    // ==================== 基础方法 ====================
    private _getContentNode(): Node {
        if (!this.content) {
            console.warn(`[VirtualScrollView] :${this.node.name} 请在属性面板绑定 content 容器节点`);
            this.content = this.node.getChildByName('content');
        }
        return this.content!;
    }

    private _isVertical(): boolean {
        return this.direction === ScrollDirection.VERTICAL;
    }

    private _getViewportMainSize(): number {
        return this._isVertical() ? this._viewportTf.height : this._viewportTf.width;
    }

    private _getContentMainPos(): number {
        return this._isVertical() ? this.content!.position.y : this.content!.position.x;
    }

    private _setContentMainPos(pos: number): void {
        if (!Number.isFinite(pos)) return;
        if (this.pixelAlign) pos = Math.round(pos);
        const currentPos = this.content!.position;
        if (this._isVertical()) {
            if (pos === currentPos.y) return;
            this.content!.setPosition(currentPos.x, pos, currentPos.z);
        } else {
            if (pos === currentPos.x) return;
            this.content!.setPosition(pos, currentPos.y, currentPos.z);
        }
    }

    // ==================== 生命周期 ====================
    async start(): Promise<void> {
        this.content = this._getContentNode();
        if (!this.content) return;

        // 检测是否有 Mask 组件
        if (!this.node.getComponent(Mask)) {
            console.warn('[VirtualScrollView] 建议在视窗节点挂一个 Mask 组件用于裁剪');
        }

        this.gridCount = Math.max(1, Math.round(this.gridCount));

        if (!this.useVirtualList) {
            // 简单滚动模式
            this._viewportSize = this._getViewportMainSize();
            this._contentSize = this._isVertical() ? this._contentTf.height : this._contentTf.width;
            if (this._isVertical()) {
                this._boundsMin = 0;
                this._boundsMax = Math.max(0, this._contentSize - this._viewportSize);
            } else {
                this._boundsMin = -Math.max(0, this._contentSize - this._viewportSize);
                this._boundsMax = 0;
            }
            this._bindTouch();
            this._bindGlobalTouch();
            return;
        }

        // 虚拟列表模式
        if (!this.useDynamicSize && !this.itemPrefab && this.content.children.length > 0) {
            this._templateNode = this.content.children[0];
            this._templateNode.removeFromParent();
        }
        this.content.removeAllChildren();

        this._viewportSize = this._getViewportMainSize();

        // 兼容旧属性
        if (this.useDynamicHeight) {
            this.useDynamicSize = true;
        }
        if (this.columns && this.direction === ScrollDirection.VERTICAL) {
            this.gridCount = this.columns;
        }
        if (this.columnSpacing && this.direction === ScrollDirection.VERTICAL) {
            this.gridSpacing = this.columnSpacing;
        }

        if (this.useDynamicSize) {
            await this._initDynamicSizeMode();
        } else {
            await this._initFixedSizeMode();
        }

        this._bindTouch();
        this._bindGlobalTouch();
    }

    onDestroy(): void {
        // 取消全局触摸监听
        input.off(Input.EventType.TOUCH_END, this._onGlobalTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this._onGlobalTouchEnd, this);

        // 取消节点监听
        this.node.off(Node.EventType.TOUCH_START, this._onDown, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this._onMove, this);
        this.node.off(Node.EventType.TOUCH_END, this._onUp, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this._onUp, this);

        // 清理资源
        if (this._nodePool) {
            this._nodePool.clear();
            this._nodePool = null;
        }
        if (this._templateNode) {
            this._templateNode.destroy();
            this._templateNode = null;
        }
        if (this.itemNode) {
            this.itemNode.destroy();
            this.itemNode = null;
        }
        if (this.itemNodes) {
            for (let i = this.itemNodes.length - 1; i >= 0; i--) {
                this.itemNodes[i].destroy();
                this.itemNodes[i] = null as any;
            }
        }
    }

    // ==================== 触摸事件绑定 ====================
    private _bindTouch(): void {
        this.node.on(Node.EventType.TOUCH_START, this._onDown, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._onMove, this);
        this.node.on(Node.EventType.TOUCH_END, this._onUp, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this._onUp, this);
    }

    private _bindGlobalTouch(): void {
        input.on(Input.EventType.TOUCH_END, this._onGlobalTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this._onGlobalTouchEnd, this);
    }

    private _onGlobalTouchEnd(event: any): void {
        if (this._isTouching) {
            console.log('[VScrollView] Global touch end detected');
            this._onUp(event);
        }
    }

    // ==================== 初始化固定大小模式 ====================
    private async _initFixedSizeMode(): Promise<void> {
        // 如果没有提供provideNodeFn，创建默认的
        if (!this.provideNodeFn) {
            this.provideNodeFn = (index: number): Node => {
                if (this.itemCreationMode === ItemCreationMode.NODE) {
                    if (this.itemNode) return instantiate(this.itemNode);
                    if (this._templateNode) return instantiate(this._templateNode);
                }
                if (this.itemCreationMode === ItemCreationMode.PREFAB && this.itemPrefab) {
                    return instantiate(this.itemPrefab);
                }
                if (this.itemPrefab) return instantiate(this.itemPrefab);
                if (this._templateNode) return instantiate(this._templateNode);

                console.warn('[VirtualScrollView] 没有提供 itemNode/itemPrefab 或模板节点');
                const newNode = new Node('item-auto-create');
                const size = this._isVertical() ? this._viewportTf.width : this._viewportTf.height;
                newNode.addComponent(UITransform).setContentSize(
                    this._isVertical() ? size : this.itemMainSize,
                    this._isVertical() ? this.itemMainSize : size
                );
                return newNode;
            };
        }

        const firstNode = this.provideNodeFn(0);
        const resolvedNode = firstNode instanceof Promise ? await firstNode : firstNode;
        const firstTransform = resolvedNode.getComponent(UITransform)!;
        if (this._isVertical()) {
            this.itemMainSize = firstTransform.height;
            this.itemCrossSize = firstTransform.width;
        } else {
            this.itemMainSize = firstTransform.width;
            this.itemCrossSize = firstTransform.height;
        }

        this._recomputeContentSize();

        const step = this.itemMainSize + this.spacing;
        const visibleCount = Math.ceil(this._viewportSize / step);
        this._slots = Math.max(1, (visibleCount + this.buffer + 2) * this.gridCount);

        // 创建插槽节点
        for (let i = 0; i < this._slots; i++) {
            const slotNode = instantiate(resolvedNode);
            slotNode.parent = this.content;
            const uiTransform = slotNode.getComponent(UITransform);
            if (uiTransform) {
                if (this._isVertical()) {
                    uiTransform.width = this.itemCrossSize;
                    uiTransform.height = this.itemMainSize;
                } else {
                    uiTransform.width = this.itemMainSize;
                    uiTransform.height = this.itemCrossSize;
                }
            }
            this._slotNodes.push(slotNode);
        }

        this._slotFirstIndex = 0;
        this._layoutSlots(this._slotFirstIndex, true);
    }

    // ==================== 初始化动态大小模式 ====================
    private async _initDynamicSizeMode(): Promise<void> {
        if (this.getItemHeightFn) {
            // 使用外部提供的高度函数
            console.log('[VirtualScrollView] 使用外部提供的 getItemHeightFn');
            this._itemSizes = [];
            for (let i = 0; i < this.totalCount; i++) {
                this._itemSizes.push(this.getItemHeightFn(i));
            }
            this._buildPrefixSum();

            // 初始化节点池
            if (this.itemCreationMode === ItemCreationMode.NODE && this.itemNodes.length > 0) {
                console.log('[VirtualScrollView] 初始化节点池（Node 模式）');
                this._nodePool = new NodePool([], this.itemNodes);
            } else if (this.itemCreationMode === ItemCreationMode.PREFAB && this.itemPrefabs.length > 0) {
                console.log('[VirtualScrollView] 初始化节点池（Prefab 模式）');
                this._nodePool = new NodePool(this.itemPrefabs);
            } else {
                if (this.itemPrefabs.length > 0) {
                    console.log('[VirtualScrollView] 初始化节点池（兼容模式）');
                    this._nodePool = new NodePool(this.itemPrefabs);
                } else {
                    console.error('[VirtualScrollView] 需要至少一个 itemNode 或 itemPrefab');
                    return;
                }
            }
            this._initDynamicSlots();
        } else {
            // 使用采样模式（基于itemNodes/itemPrefabs + getItemTypeIndexFn）
            const isNodeMode = this.itemCreationMode === ItemCreationMode.NODE;
            const hasNodes = this.itemNodes.length > 0;
            const hasPrefabs = this.itemPrefabs.length > 0;

            if ((!isNodeMode || hasNodes || hasPrefabs) && (isNodeMode || hasPrefabs) && this.getItemTypeIndexFn) {
                const templates = (isNodeMode && hasNodes) ? this.itemNodes : this.itemPrefabs;
                const modeName = (isNodeMode && hasNodes) ? 'Node' : 'Prefab';

                console.log(`[VirtualScrollView] 使用采样模式（从 ${modeName} 采样尺寸）`);

                this._nodePool = (isNodeMode && hasNodes) ? new NodePool([], this.itemNodes) : new NodePool(this.itemPrefabs);
                this._prefabSizeCache.clear();

                // 采样每个模板的尺寸
                for (let i = 0; i < templates.length; i++) {
                    const template = templates[i];
                    const tempNode = instantiate(template);
                    const transform = tempNode.getComponent(UITransform);
                    const size = this._isVertical()
                        ? (transform?.height ?? 100)
                        : (transform?.width ?? 100);
                    this._prefabSizeCache.set(i, size);
                    tempNode.destroy();
                    console.log(`[VirtualScrollView] ${modeName}[${i}] 采样尺寸: ${size}`);
                }

                // 构建所有item的尺寸数组
                this._itemSizes = [];
                for (let i = 0; i < this.totalCount; i++) {
                    const typeIndex = this.getItemTypeIndexFn(i);
                    const size = this._prefabSizeCache.get(typeIndex);
                    if (size !== undefined) {
                        this._itemSizes.push(size);
                    } else {
                        console.warn(`[VirtualScrollView] 索引 ${i} 的类型索引 ${typeIndex} 无效，使用默认尺寸`);
                        this._itemSizes.push(this._prefabSizeCache.get(0) ?? 100);
                    }
                }

                this._buildPrefixSum();
                this._initDynamicSlots();
            } else {
                console.error('[VirtualScrollView] 不等大小模式必须提供以下之一：\n1. getItemHeightFn 回调函数\n2. itemNodes/itemPrefabs 数组 + getItemTypeIndexFn 回调函数');
            }
        }
    }

    private _initDynamicSlots(): void {
        const avgSize = this._contentSize / this.totalCount || 100;
        let slots = Math.ceil(this._viewportSize / avgSize) + 2 * this.buffer + 4;
        const minSlots = Math.ceil(this._viewportSize / 80) + 2 * this.buffer;
        slots = Math.max(slots, minSlots);
        const maxSlots = Math.ceil(this._viewportSize / 50) + 4 * this.buffer;
        slots = Math.min(slots, maxSlots);

        this._slots = Math.min(slots, Math.max(this.totalCount, minSlots));
        this._slotNodes = new Array(this._slots).fill(null);
        this._slotPrefabIndices = new Array(this._slots).fill(-1);
        this._slotFirstIndex = 0;
        this._layoutSlots(this._slotFirstIndex, true);

        console.log(`[VScrollView] 初始化槽位: ${this._slots} (总数据: ${this.totalCount}, 视口尺寸: ${this._viewportSize})`);
    }

    private _buildPrefixSum(): void {
        const len = this._itemSizes.length;
        this._prefixPositions = new Array(len);
        let sum = this.headerSpacing;
        for (let i = 0; i < len; i++) {
            this._prefixPositions[i] = sum;
            sum += this._itemSizes[i] + this.spacing;
        }
        this._contentSize = sum - this.spacing + this.footerSpacing;
        if (this._contentSize < 0) this._contentSize = 0;

        if (this._isVertical()) {
            this._contentTf.height = Math.max(this._contentSize, this._viewportSize);
            this._boundsMin = 0;
            this._boundsMax = Math.max(0, this._contentSize - this._viewportSize);
        } else {
            this._contentTf.width = Math.max(this._contentSize, this._viewportSize);
            this._boundsMin = -Math.max(0, this._contentSize - this._viewportSize);
            this._boundsMax = 0;
        }
    }

    private _posToFirstIndex(pos: number): number {
        if (pos <= this.headerSpacing) return 0;
        let left = 0;
        let right = this._prefixPositions.length - 1;
        let result = this._prefixPositions.length;
        while (left <= right) {
            const mid = (left + right) >> 1;
            if (this._prefixPositions[mid] > pos) {
                result = mid;
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        return Math.max(0, result - 1);
    }

    private _calcVisibleRange(scrollPos: number): { start: number; end: number } {
        const len = this._prefixPositions.length;
        if (len === 0) return { start: 0, end: 0 };
        const startIndex = this._posToFirstIndex(scrollPos);
        let endIndex = startIndex;
        const viewEnd = scrollPos + this._viewportSize;
        while (endIndex < len && this._prefixPositions[endIndex] < viewEnd) {
            endIndex++;
        }
        return {
            start: Math.max(0, startIndex - this.buffer),
            end: Math.min(len, endIndex + this.buffer)
        };
    }

    // ==================== 更新循环 ====================
    update(dt: number): void {
        if (!this.content || this._isTouching || this._scrollTween) return;

        const currentPos = this._getContentMainPos();
        let force = 0;
        const minBound = Math.min(this._boundsMin, this._boundsMax);
        const maxBound = Math.max(this._boundsMin, this._boundsMax);

        if (this._isRefreshing && this._refreshState === RefreshState.REFRESHING) {
            const target = this._isVertical() ? -this.pullRefreshThreshold : this.pullRefreshThreshold;
            force = -this.springK * (currentPos - target) - this.springC * this._velocity;
        } else if (this._isLoadingMore && this._loadMoreState === LoadMoreState.LOADING) {
            const target = this._isVertical()
                ? this._boundsMax + this.loadMoreThreshold
                : this._boundsMin - this.loadMoreThreshold;
            force = -this.springK * (currentPos - target) - this.springC * this._velocity;
        } else if (currentPos < minBound) {
            if (this.disableBounce) {
                this._setContentMainPos(minBound);
                this._velocity = 0;
                return;
            }
            force = -this.springK * (currentPos - minBound) - this.springC * this._velocity;
        } else if (currentPos > maxBound) {
            if (this.disableBounce) {
                this._setContentMainPos(maxBound);
                this._velocity = 0;
                return;
            }
            force = -this.springK * (currentPos - maxBound) - this.springC * this._velocity;
        } else if (this.useIOSDecelerationCurve) {
            const absV = Math.abs(this._velocity);
            if (absV > 2000) {
                this._velocity *= Math.exp(0.7 * -this.inertiaDampK * dt);
            } else if (absV > 500) {
                this._velocity *= Math.exp(-this.inertiaDampK * dt);
            } else {
                this._velocity *= Math.exp(1.3 * -this.inertiaDampK * dt);
            }
        } else {
            this._velocity *= Math.exp(-this.inertiaDampK * dt);
        }

        this._velocity += force * dt;

        // 分页吸附检查
        if (this.enablePageSnap && Math.abs(this._velocity) < this.pageSnapTriggerVelocity && force === 0) {
            this._velocity = 0;
            this._performPageSnap();
            return;
        }

        // 速度阈值
        if (Math.abs(this._velocity) < this.velocitySnap && force === 0) {
            this._velocity = 0;
        }

        if (this._velocity !== 0) {
            let newPos = currentPos + this._velocity * dt;
            if (this.disableBounce) {
                newPos = math.clamp(newPos, minBound, maxBound);
            }
            if (this.pixelAlign) newPos = Math.round(newPos);
            this._setContentMainPos(newPos);
            if (this.useVirtualList) {
                this._updateVisible(false);
            }
        }
    }

    // ==================== 更新 item 高度 ====================
    updateItemHeight(index: number, newSize?: number): void {
        if (!this.useDynamicSize) {
            console.warn('[VScrollView] 只有不等大小模式支持 updateItemHeight');
            return;
        }
        if (index < 0 || index >= this.totalCount) {
            console.warn(`[VScrollView] 索引 ${index} 超出范围`);
            return;
        }
        let size = newSize;
        if (size === undefined) {
            if (!this.getItemHeightFn) {
                console.error('[VScrollView] 没有提供 newSize 参数，且未设置 getItemHeightFn');
                return;
            }
            size = this.getItemHeightFn(index);
        }
        if (this._itemSizes[index] !== size) {
            this._itemSizes[index] = size;
            this._rebuildPrefixSumFrom(index);
            this._updateVisible(true);
        }
    }

    private _rebuildPrefixSumFrom(fromIndex: number): void {
        if (fromIndex === 0) {
            this._buildPrefixSum();
            return;
        }
        let sum = this._prefixPositions[fromIndex - 1] + this._itemSizes[fromIndex - 1] + this.spacing;
        for (let i = fromIndex; i < this._itemSizes.length; i++) {
            this._prefixPositions[i] = sum;
            sum += this._itemSizes[i] + this.spacing;
        }
        this._contentSize = sum - this.spacing + this.footerSpacing;
        if (this._contentSize < 0) this._contentSize = 0;

        if (this._isVertical()) {
            this._contentTf.height = Math.max(this._contentSize, this._viewportSize);
            this._boundsMin = 0;
            this._boundsMax = Math.max(0, this._contentSize - this._viewportSize);
        } else {
            this._contentTf.width = Math.max(this._contentSize, this._viewportSize);
            this._boundsMin = -Math.max(0, this._contentSize - this._viewportSize);
            this._boundsMax = 0;
        }
    }

    updateItemHeights(updates: { index: number; height: number }[]): void {
        if (!this.useDynamicSize) {
            console.warn('[VScrollView] 只有不等大小模式支持 updateItemHeights');
            return;
        }
        if (updates.length === 0) return;
        let minChangedIndex = this.totalCount;
        let changed = false;
        for (const update of updates) {
            const { index, height } = update;
            if (index < 0 || index >= this.totalCount) continue;
            if (this._itemSizes[index] !== height) {
                this._itemSizes[index] = height;
                minChangedIndex = Math.min(minChangedIndex, index);
                changed = true;
            }
        }
        if (changed) {
            this._rebuildPrefixSumFrom(minChangedIndex);
            this._updateVisible(true);
        }
    }

    // ==================== 列表刷新 ====================
    refreshList(data: any[] | number): void {
        if (this.useVirtualList) {
            if (typeof data === 'number') {
                this.setTotalCount(data);
            } else {
                this.setTotalCount(data.length);
            }
        } else {
            console.warn('[VirtualScrollView] 简单滚动模式不支持 refreshList');
        }
    }

    setTotalCount(count: number): void {
        this._getContentNode();
        if (!this.useVirtualList) {
            console.warn('[VScrollView] 非虚拟列表模式，不支持 setTotalCount');
            return;
        }

        this._upWidgetAlignment();
        const oldCount = this.totalCount;
        this.totalCount = Math.max(0, count | 0);

        if (this.totalCount > oldCount) {
            for (let i = oldCount; i < this.totalCount; i++) {
                this._needAnimateIndices.add(i);
            }
        }

        if (this.useDynamicSize) {
            const currentSize = this._itemSizes.length;
            if (this.totalCount > currentSize) {
                for (let i = currentSize; i < this.totalCount; i++) {
                    let size = 100;
                    if (this.getItemHeightFn) {
                        size = this.getItemHeightFn(i);
                    } else if (this.getItemTypeIndexFn && this._prefabSizeCache.size > 0) {
                        const typeIndex = this.getItemTypeIndexFn(i);
                        size = this._prefabSizeCache.get(typeIndex) ?? 100;
                    }
                    this._itemSizes.push(size);
                }
            } else if (this.totalCount < currentSize) {
                this._itemSizes.length = this.totalCount;
            }
            this._buildPrefixSum();
            if (this.totalCount > oldCount) {
                this._expandSlotsIfNeeded();
            }
        } else {
            this._recomputeContentSize();
        }

        this._slotFirstIndex = math.clamp(this._slotFirstIndex, 0, Math.max(0, this.totalCount - 1));
        if (!this.useDynamicSize) {
            this._layoutSlots(this._slotFirstIndex, true);
        }
        this._updateVisible(true);
    }

    private _upWidgetAlignment(): void {
        (this.content as any)?.getComponent?.(Widget)?.updateAlignment?.();
        (this.node as any)?.getComponent?.(Widget)?.updateAlignment?.();
    }

    private _expandSlotsIfNeeded(): void {
        let slotsNeeded = 0;
        let accumulated = 0;
        const viewSize = this._viewportSize;
        for (let i = 0; i < this.totalCount && accumulated < viewSize; i++) {
            slotsNeeded++;
            accumulated += this._itemSizes[i] + this.spacing;
        }
        slotsNeeded += 2 * this.buffer + 4;
        const minSlots = Math.ceil(this._viewportSize / 80) + 2 * this.buffer;
        slotsNeeded = Math.max(slotsNeeded, minSlots);
        const maxSlots = Math.ceil(this._viewportSize / 50) + 4 * this.buffer;
        slotsNeeded = Math.min(slotsNeeded, maxSlots);

        if (slotsNeeded > this._slots) {
            const oldSlots = this._slots;
            this._slots = slotsNeeded;
            for (let i = oldSlots; i < this._slots; i++) {
                this._slotNodes.push(null);
                this._slotPrefabIndices.push(-1);
            }
            console.log(`[VScrollView] 槽位扩展: ${oldSlots} -> ${this._slots} (总数据: ${this.totalCount})`);
        }
    }

    // ==================== 滚动定位 ====================
    private _scrollToPosition(targetPos: number, animated: boolean = false, duration?: number): void {
        targetPos = math.clamp(targetPos, this._boundsMin, this._boundsMax);

        if (this._scrollTween) {
            this._scrollTween.stop();
            this._scrollTween = null;
        }
        this._velocity = 0;
        this._isTouching = false;
        this._velSamples.length = 0;

        if (animated) {
            const currentPos = this._getContentMainPos();
            const distance = Math.abs(targetPos - currentPos);
            const autoDuration = duration ?? Math.max(0.2, distance / 3000);
            const targetVec = this._isVertical()
                ? new Vec3(0, targetPos, 0)
                : new Vec3(targetPos, 0, 0);

            this._scrollTween = tween(this.content)
                .to(autoDuration, { position: targetVec }, {
                    easing: 'smooth',
                    onUpdate: () => {
                        this._updateVisible(false);
                    }
                })
                .call(() => {
                    this._updateVisible(true);
                    this._scrollTween = null;
                    this._velocity = 0;
                })
                .start();
        } else {
            this._setContentMainPos(this.pixelAlign ? Math.round(targetPos) : targetPos);
            this._updateVisible(true);
        }
    }

    scrollToTop(animated: boolean = false, duration?: number): void {
        const target = this._isVertical() ? this._boundsMin : this._boundsMax;
        this._scrollToPosition(target, animated, duration);
    }

    scrollToBottom(animated: boolean = false, duration?: number): void {
        const target = this._isVertical() ? this._boundsMax : this._boundsMin;
        this._scrollToPosition(target, animated, duration);
    }

    scrollToIndex(index: number, animated: boolean = false, duration?: number): void {
        index = math.clamp(index | 0, 0, Math.max(0, this.totalCount - 1));
        let pos: number;
        if (this.useDynamicSize) {
            pos = this._prefixPositions[index] ?? 0;
        } else {
            const row = Math.floor(index / this.gridCount);
            pos = this.headerSpacing + row * (this.itemMainSize + this.spacing);
        }
        if (!this._isVertical()) pos = -pos;
        this._scrollToPosition(pos, animated, duration);
    }

    // ==================== 排序层控制 ====================
    onOffSortLayer(enable: boolean): void {
        this._initSortLayerFlag = enable;
        this._onOffSortLayerOperation();
    }

    private _onOffSortLayerOperation(): void {
        for (const node of this._slotNodes) {
            const item = node?.getComponent(VScrollViewItem);
            if (item) {
                if (this._initSortLayerFlag) {
                    item.onSortLayer();
                } else {
                    item.offSortLayer();
                }
            }
        }
    }

    // ==================== 快速跳转（无动画） ====================
    private _flashToPosition(pos: number): void {
        pos = math.clamp(pos, this._boundsMin, this._boundsMax);
        if (this._scrollTween) {
            this._scrollTween.stop();
            this._scrollTween = null;
        }
        this._velocity = 0;
        this._isTouching = false;
        this._velSamples.length = 0;
        this._setContentMainPos(this.pixelAlign ? Math.round(pos) : pos);
        this._updateVisible(true);
    }

    flashToTop(): void {
        const target = this._isVertical() ? this._boundsMin : this._boundsMax;
        this._flashToPosition(target);
    }

    flashToBottom(): void {
        const target = this._isVertical() ? this._boundsMax : this._boundsMin;
        this._flashToPosition(target);
    }

    flashToIndex(index: number): void {
        if (!this.useVirtualList) {
            console.warn('[VirtualScrollView] 简单滚动模式不支持 flashToIndex');
            return;
        }
        index = math.clamp(index | 0, 0, Math.max(0, this.totalCount - 1));
        let pos: number;
        if (this.useDynamicSize) {
            pos = this._prefixPositions[index] ?? 0;
        } else {
            const row = Math.floor(index / this.gridCount);
            pos = this.headerSpacing + row * (this.itemMainSize + this.spacing);
        }
        if (!this._isVertical()) pos = -pos;
        this._flashToPosition(pos);
    }

    // ==================== 刷新单个索引 ====================
    refreshIndex(index: number): void {
        if (!this.useVirtualList) {
            console.warn('[VirtualScrollView] 简单滚动模式不支持 refreshIndex');
            return;
        }
        const firstIndex = this._slotFirstIndex;
        const lastIndex = firstIndex + this._slots - 1;
        if (index < firstIndex || index > lastIndex) return;
        const slotIndex = index - firstIndex;
        const node = this._slotNodes[slotIndex];
        if (node && this.renderItemFn) {
            this.renderItemFn(node, index);
        }
    }

    // ==================== 触摸事件处理 ====================
    private _stopTouchEvent(event: any): void {
        if (event && this._shouldBlockParent) {
            event.propagationStopped = true;
        }
    }

    private _onDown(event: any): void {
        const location = event.getUILocation();
        this._touchStartPos.set(location);
        this._hasDeterminedScrollDirection = false;
        this._shouldBlockParent = false;
        if (this.enablePageSnap) {
            this._pageStartPos = this._getContentMainPos();
        }
        this._stopTouchEvent(event);
        this._isTouching = true;
        this._velocity = 0;
        this._velSamples.length = 0;
        if (this._scrollTween) {
            this._scrollTween.stop();
            this._scrollTween = null;
        }
    }

    private _onMove(event: any): void {
        if (!this._isTouching) return;

        const delta = event.getUIDelta();
        const location = event.getUILocation();

        // 判断滚动方向
        if (!this._hasDeterminedScrollDirection) {
            const dx = location.x - this._touchStartPos.x;
            const dy = location.y - this._touchStartPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > this._scrollDirectionThreshold) {
                this._hasDeterminedScrollDirection = true;
                const angleDeg = Math.abs(180 * Math.atan2(dy, dx) / Math.PI);
                const isVerticalSwipe = angleDeg > (90 - this._scrollAngleThreshold) && angleDeg < (90 + this._scrollAngleThreshold);
                const isHorizontalSwipe = angleDeg < this._scrollAngleThreshold || angleDeg > (180 - this._scrollAngleThreshold);
                const isVert = this._isVertical();
                if ((isVert && isVerticalSwipe) || (!isVert && isHorizontalSwipe)) {
                    const currentPos = this._getContentMainPos();
                    const minB = Math.min(this._boundsMin, this._boundsMax);
                    const maxB = Math.max(this._boundsMin, this._boundsMax);
                    const mainDelta = this._isVertical() ? delta.y : delta.x;
                    const isPositive = this._isVertical() ? mainDelta > 0 : mainDelta < 0;
                    const isNegative = this._isVertical() ? mainDelta < 0 : mainDelta > 0;
                    const atMin = this._isVertical() ? currentPos <= minB : currentPos >= maxB;
                    const atMax = this._isVertical() ? currentPos >= maxB : currentPos <= minB;
                    if (!(atMin && atMax) && !(atMin && isPositive) && !(atMax && isNegative)) {
                        this._shouldBlockParent = true;
                    }
                }
            }
        }

        this._stopTouchEvent(event);

        let mainDelta = this._isVertical() ? delta.y : delta.x;
        let contentPos = this._getContentMainPos();
        const minBound = Math.min(this._boundsMin, this._boundsMax);
        const maxBound = Math.max(this._boundsMin, this._boundsMax);
        let adjustedDelta = mainDelta;

        // 下拉刷新处理
        if (this.enablePullRefresh && !this._isRefreshing) {
            const isAtTop = this._isVertical() ? contentPos <= minBound : contentPos >= maxBound;
            const isPullingDown = this._isVertical() ? mainDelta < 0 : mainDelta > 0;
            if (isAtTop && isPullingDown) {
                const overshoot = this._isVertical() ? (minBound - contentPos) : (contentPos - maxBound);
                adjustedDelta = mainDelta * (1 - Math.min(overshoot / this.pullRefreshMaxOffset, 1) * (1 - this.pullDampingRate));
                this._pullOffset = Math.min(overshoot + Math.abs(adjustedDelta), this.pullRefreshMaxOffset);
                if (this._pullOffset >= this.pullRefreshThreshold) {
                    this._updateRefreshState(RefreshState.READY, this._pullOffset);
                } else {
                    this._updateRefreshState(RefreshState.PULLING, this._pullOffset);
                }
            }
        }

        // 上拉加载处理
        if (this.enableLoadMore && !this._isLoadingMore && this._hasMore) {
            const isAtBottom = this._isVertical() ? contentPos >= maxBound : contentPos <= minBound;
            const isPullingUp = this._isVertical() ? mainDelta > 0 : mainDelta < 0;
            if (isAtBottom && isPullingUp) {
                const overshoot = this._isVertical() ? (contentPos - maxBound) : (minBound - contentPos);
                adjustedDelta = mainDelta * (1 - Math.min(overshoot / this.loadMoreMaxOffset, 1) * (1 - this.pullDampingRate));
                this._loadOffset = Math.min(overshoot + Math.abs(adjustedDelta), this.loadMoreMaxOffset);
                if (this._loadOffset >= this.loadMoreThreshold) {
                    this._updateLoadMoreState(LoadMoreState.READY, this._loadOffset);
                } else {
                    this._updateLoadMoreState(LoadMoreState.PULLING, this._loadOffset);
                }
            }
        }

        // 禁止越界
        if (this.disableBounce) {
            const newPos = contentPos + adjustedDelta;
            if (newPos < minBound) {
                adjustedDelta = minBound - contentPos;
            } else if (newPos > maxBound) {
                adjustedDelta = maxBound - contentPos;
            }
        }

        contentPos += adjustedDelta;
        if (this.pixelAlign) contentPos = Math.round(contentPos);
        this._setContentMainPos(contentPos);

        // 记录速度样本
        const now = performance.now() / 1000;
        this._velSamples.push({ t: now, delta: adjustedDelta });
        const windowStart = now - this.velocityWindow;
        while (this._velSamples.length > 0 && this._velSamples[0].t < windowStart) {
            this._velSamples.shift();
        }

        if (this.useVirtualList) {
            this._updateVisible(false);
        }
    }

    private _onUp(event: any): void {
        this._hasDeterminedScrollDirection = false;
        this._shouldBlockParent = false;
        this._stopTouchEvent(event);

        if (!this._isTouching) return;
        this._isTouching = false;

        // 处理刷新/加载触发
        if (this._refreshState === RefreshState.READY && !this._isRefreshing) {
            this._triggerRefresh();
            this._velSamples.length = 0;
            return;
        }
        if (this._loadMoreState === LoadMoreState.READY && !this._isLoadingMore) {
            this._triggerLoadMore();
            this._velSamples.length = 0;
            return;
        }

        // 重置状态
        if (this._refreshState !== RefreshState.REFRESHING) {
            this._pullOffset = 0;
            this._updateRefreshState(RefreshState.IDLE, 0);
        }
        if (this._loadMoreState !== LoadMoreState.LOADING) {
            this._loadOffset = 0;
            this._updateLoadMoreState(LoadMoreState.IDLE, 0);
        }

        // 计算最终速度
        if (this._velSamples.length >= 2) {
            let totalDelta = 0;
            let totalTime = 0;
            const sampleCount = Math.min(this._velSamples.length, 5);
            const startIndex = this._velSamples.length - sampleCount + 1;
            for (let i = startIndex; i < this._velSamples.length; i++) {
                totalDelta += this._velSamples[i].delta;
                totalTime += this._velSamples[i].t - this._velSamples[i - 1].t;
            }
            if (totalTime > 0.001) {
                this._velocity = totalDelta / totalTime;
                this._velocity = math.clamp(this._velocity, -this.maxVelocity, this.maxVelocity);
            } else {
                this._velocity = this._velSamples.length > 0
                    ? math.clamp(60 * this._velSamples[this._velSamples.length - 1].delta, -this.maxVelocity, this.maxVelocity)
                    : 0;
            }
        } else if (this._velSamples.length === 1) {
            this._velocity = math.clamp(60 * this._velSamples[0].delta, -this.maxVelocity, this.maxVelocity);
        } else {
            this._velocity = 0;
        }
        this._velSamples.length = 0;

        if (this.enablePageSnap) {
            this._performPageSnapByDistance();
        }
    }

    // ==================== 刷新/加载状态管理 ====================
    private _updateRefreshState(newState: RefreshState, offset: number): void {
        if (this._refreshState !== newState) {
            this._refreshState = newState;
            this.onRefreshStateChangeFn?.(newState, offset);
        }
    }

    private _updateLoadMoreState(newState: LoadMoreState, offset: number): void {
        if (this._loadMoreState !== newState) {
            this._loadMoreState = newState;
            this.onLoadMoreStateChangeFn?.(newState, offset);
        }
    }

    private _triggerRefresh(): void {
        this._isRefreshing = true;
        this._velocity = 0;
        this._updateRefreshState(RefreshState.REFRESHING, this.pullRefreshThreshold);
    }

    private _triggerLoadMore(): void {
        this._isLoadingMore = true;
        this._velocity = 0;
        this._updateLoadMoreState(LoadMoreState.LOADING, this.loadMoreThreshold);
    }

    finishRefresh(success: boolean = true): void {
        if (this._isRefreshing) {
            this._isRefreshing = false;
            this._pullOffset = 0;
            this._updateRefreshState(success ? RefreshState.COMPLETE : RefreshState.IDLE, 0);
            this.scheduleOnce(() => {
                if (this._refreshState === RefreshState.COMPLETE) {
                    this._updateRefreshState(RefreshState.IDLE, 0);
                }
            }, 0.3);
        }
    }

    finishLoadMore(hasMore: boolean = true): void {
        if (this._isLoadingMore) {
            this._isLoadingMore = false;
            this._loadOffset = 0;
            this._hasMore = hasMore;
            if (hasMore) {
                this._updateLoadMoreState(LoadMoreState.COMPLETE, 0);
                this.scheduleOnce(() => {
                    if (this._loadMoreState === LoadMoreState.COMPLETE) {
                        this._updateLoadMoreState(LoadMoreState.IDLE, 0);
                    }
                }, 0.3);
            } else {
                this._updateLoadMoreState(LoadMoreState.NO_MORE, 0);
            }
        }
    }

    resetLoadMoreState(): void {
        this._hasMore = true;
        this._isLoadingMore = false;
        this._loadOffset = 0;
        this._updateLoadMoreState(LoadMoreState.IDLE, 0);
    }

    // ==================== 可见性更新 ====================
    private _updateVisible(forceLayout: boolean): void {
        if (!this.useVirtualList) return;

        const contentPos = this._getContentMainPos();
        const scrollPos = this._isVertical()
            ? math.clamp(contentPos, 0, this._contentSize)
            : math.clamp(-contentPos, 0, this._contentSize);

        let firstVisibleIndex: number;
        if (this.useDynamicSize) {
            firstVisibleIndex = this._calcVisibleRange(scrollPos).start;
        } else {
            const step = this.itemMainSize + this.spacing;
            const offset = Math.max(0, scrollPos - this.headerSpacing);
            const row = Math.floor(offset / step);
            firstVisibleIndex = math.clamp(row * this.gridCount, 0, Math.max(0, this.totalCount - 1));
        }

        // 如果所有数据都可显示，从0开始
        if (this.totalCount < this._slots) {
            firstVisibleIndex = 0;
        }

        if (forceLayout) {
            this._slotFirstIndex = firstVisibleIndex;
            this._layoutSlots(this._slotFirstIndex, true);
            return;
        }

        const diff = firstVisibleIndex - this._slotFirstIndex;
        if (diff === 0) return;

        // 如果超出范围，直接重新布局
        if (Math.abs(diff) >= this._slots) {
            this._slotFirstIndex = firstVisibleIndex;
            this._layoutSlots(this._slotFirstIndex, true);
            return;
        }

        const moveCount = Math.abs(diff);
        if (diff > 0) {
            // 向前滚动，移除前部的插槽，追加到尾部
            const removed = this._slotNodes.splice(0, moveCount);
            this._slotNodes.push(...removed);
            if (this.useDynamicSize && this._slotPrefabIndices.length > 0) {
                const removedIndices = this._slotPrefabIndices.splice(0, moveCount);
                this._slotPrefabIndices.push(...removedIndices);
            }
            this._slotFirstIndex = firstVisibleIndex;
            for (let i = 0; i < moveCount; i++) {
                const slotIndex = this._slots - moveCount + i;
                const dataIndex = this._slotFirstIndex + slotIndex;
                if (dataIndex >= this.totalCount) {
                    const node = this._slotNodes[slotIndex];
                    if (node) node.active = false;
                } else {
                    this._layoutSingleSlot(this._slotNodes[slotIndex], dataIndex, slotIndex);
                }
            }
        } else {
            // 向后滚动，移除尾部的插槽，添加到头部
            const removed = this._slotNodes.splice(this._slots + diff, moveCount);
            this._slotNodes.unshift(...removed);
            if (this.useDynamicSize && this._slotPrefabIndices.length > 0) {
                const removedIndices = this._slotPrefabIndices.splice(this._slotPrefabIndices.length + diff, moveCount);
                this._slotPrefabIndices.unshift(...removedIndices);
            }
            this._slotFirstIndex = firstVisibleIndex;
            for (let i = 0; i < moveCount; i++) {
                const dataIndex = this._slotFirstIndex + i;
                if (dataIndex >= this.totalCount) {
                    const node = this._slotNodes[i];
                    if (node) node.active = false;
                } else {
                    this._layoutSingleSlot(this._slotNodes[i], dataIndex, i);
                }
            }
        }
    }

    // ==================== 布局单个插槽 ====================
    private async _layoutSingleSlot(node: Node | null, dataIndex: number, slotIndex: number): Promise<void> {
        if (!this.useVirtualList) return;

        if (this.useDynamicSize) {
            // 动态大小模式
            const typeIndex = this.getItemTypeIndexFn!(dataIndex);
            const currentType = this._slotPrefabIndices[slotIndex];
            let slotNode: Node | null = null;

            if (currentType === typeIndex && this._slotNodes[slotIndex]) {
                slotNode = this._slotNodes[slotIndex];
            } else {
                // 归还旧节点
                if (this._slotNodes[slotIndex] && this._nodePool && currentType >= 0) {
                    this._nodePool.put(this._slotNodes[slotIndex]!, currentType);
                }
                // 获取新节点
                if (this._nodePool) {
                    slotNode = this._nodePool.get(typeIndex);
                    if (!slotNode) {
                        console.error(`[VScrollView] 无法获取类型 ${typeIndex} 的节点`);
                        return;
                    }
                    slotNode.parent = this.content;
                    this._slotNodes[slotIndex] = slotNode;
                    this._slotPrefabIndices[slotIndex] = typeIndex;
                }
            }

            if (!slotNode) {
                console.error(`[VScrollView] 槽位 ${slotIndex} 节点为空，索引 ${dataIndex}`);
                return;
            }

            slotNode.active = true;
            this._updateItemClickHandler(slotNode, dataIndex);
            this.renderItemFn?.(slotNode, dataIndex);

            // 检查高度是否变化
            if (this.getItemHeightFn) {
                const height = this.getItemHeightFn(dataIndex);
                if (this._itemSizes[dataIndex] !== height) {
                    this.updateItemHeight(dataIndex, height);
                    return; // updateItemHeight 会重新触发布局
                }
            } else {
                const uiTransform = slotNode.getComponent(UITransform);
                const actualSize = this._isVertical()
                    ? (uiTransform?.height ?? 100)
                    : (uiTransform?.width ?? 100);
                if (Math.abs(this._itemSizes[dataIndex] - actualSize) > 1) {
                    this.updateItemHeight(dataIndex, actualSize);
                    return;
                }
            }

            // 定位
            const uiTransform2 = slotNode.getComponent(UITransform);
            const itemSize = this._itemSizes[dataIndex];
            const itemPos = this._prefixPositions[dataIndex];
            if (this._isVertical()) {
                const anchorY = uiTransform2?.anchorY ?? 0.5;
                const y = -(itemPos + itemSize * (1 - anchorY));
                slotNode.setPosition(0, this.pixelAlign ? Math.round(y) : y);
            } else {
                const anchorX = uiTransform2?.anchorX ?? 0.5;
                const x = itemPos + itemSize * anchorX;
                slotNode.setPosition(this.pixelAlign ? Math.round(x) : x, 0);
            }

            // 播放出现动画
            if (this._needAnimateIndices.has(dataIndex)) {
                if (this.playItemAppearAnimationFn) {
                    this.playItemAppearAnimationFn(slotNode, dataIndex);
                } else {
                    this._playDefaultItemAppearAnimation(slotNode, dataIndex);
                }
                this._needAnimateIndices.delete(dataIndex);
            }
        } else {
            // 固定大小模式
            if (!node) return;
            node.active = true;

            const step = this.itemMainSize + this.spacing;
            const row = Math.floor(dataIndex / this.gridCount);
            const col = dataIndex % this.gridCount;
            const uiTransform = node.getComponent(UITransform);
            const yOffset = this.headerSpacing + row * step;
            let centerOffset = 0;
            let centerEnabled = false;

            if (this.autoCenter) {
                const totalRows = Math.ceil(this.totalCount / this.gridCount);
                const totalSize = this.headerSpacing + totalRows * step - this.spacing + this.footerSpacing;
                if (totalSize < this._viewportSize) {
                    centerEnabled = true;
                    centerOffset = (this._viewportSize - totalSize) / 2;
                }
            }

            if (this._isVertical()) {
                const anchorY = uiTransform?.anchorY ?? 0.5;
                const y = -(yOffset + this.itemMainSize * (1 - anchorY) + centerOffset);
                let currentGridCount = this.gridCount;
                if (centerEnabled) {
                    const startRow = row * this.gridCount;
                    currentGridCount = Math.min(startRow + this.gridCount, this.totalCount) - startRow;
                }
                const totalCross = currentGridCount * this.itemCrossSize + (currentGridCount - 1) * this.gridSpacing;
                const x = col * (this.itemCrossSize + this.gridSpacing) - totalCross / 2 + this.itemCrossSize / 2;
                node.setPosition(
                    this.pixelAlign ? Math.round(x) : x,
                    this.pixelAlign ? Math.round(y) : y
                );
                if (uiTransform) {
                    uiTransform.width = this.itemCrossSize;
                    uiTransform.height = this.itemMainSize;
                }
            } else {
                const anchorX = uiTransform?.anchorX ?? 0.5;
                const x = yOffset + this.itemMainSize * anchorX + centerOffset;
                let currentGridCount = this.gridCount;
                if (centerEnabled) {
                    const startRow = row * this.gridCount;
                    currentGridCount = Math.min(startRow + this.gridCount, this.totalCount) - startRow;
                }
                const totalCross = currentGridCount * this.itemCrossSize + (currentGridCount - 1) * this.gridSpacing;
                const y = - (col * (this.itemCrossSize + this.gridSpacing) - totalCross / 2 + this.itemCrossSize / 2);
                node.setPosition(
                    this.pixelAlign ? Math.round(x) : x,
                    this.pixelAlign ? Math.round(y) : y
                );
                if (uiTransform) {
                    uiTransform.width = this.itemMainSize;
                    uiTransform.height = this.itemCrossSize;
                }
            }

            this._updateItemClickHandler(node, dataIndex);
            this.renderItemFn?.(node, dataIndex);

            if (this._needAnimateIndices.has(dataIndex)) {
                if (this.playItemAppearAnimationFn) {
                    this.playItemAppearAnimationFn(node, dataIndex);
                } else {
                    this._playDefaultItemAppearAnimation(node, dataIndex);
                }
                this._needAnimateIndices.delete(dataIndex);
            }
        }
    }

    private _playDefaultItemAppearAnimation(node: Node, index: number): void {
        // 默认无动画
    }

    // ==================== Item 点击处理 ====================
    private _updateItemClickHandler(node: Node, dataIndex: number): void {
        if (!this.useVirtualList) return;

        let itemComp = node.getComponent(VScrollViewItem);
        if (!itemComp) {
            itemComp = node.addComponent(VScrollViewItem);
        }

        if (this._initSortLayerFlag) {
            itemComp.onSortLayer();
        } else {
            itemComp.offSortLayer();
        }

        itemComp.useItemClickEffect = !!this.onItemClickFn;

        if (!itemComp.onClickCallback) {
            itemComp.onClickCallback = (event: any) => {
                this.onItemClickFn?.(node, dataIndex);
            };
        }
        if (!itemComp.onLongPressCallback) {
            itemComp.onLongPressCallback = (event: any) => {
                this.onItemLongPressFn?.(node, dataIndex);
            };
        }
        itemComp.setDataIndex(dataIndex);
    }

    // ==================== 布局所有插槽 ====================
    private _layoutSlots(startIndex: number, force: boolean): void {
        if (!this.useVirtualList) return;
        for (let i = 0; i < this._slots; i++) {
            const dataIndex = startIndex + i;
            const node = this._slotNodes[i];
            if (dataIndex >= this.totalCount) {
                if (node) node.active = false;
            } else {
                this._layoutSingleSlot(node, dataIndex, i);
            }
        }
    }

    // ==================== 内容尺寸计算 ====================
    private _recomputeContentSize(): void {
        if (!this.useVirtualList) {
            this._contentSize = this._isVertical() ? this._contentTf.height : this._contentTf.width;
            if (this._isVertical()) {
                this._boundsMin = 0;
                this._boundsMax = Math.max(0, this._contentSize - this._viewportSize);
            } else {
                this._boundsMin = -Math.max(0, this._contentSize - this._viewportSize);
                this._boundsMax = 0;
            }
            return;
        }

        if (!this.useDynamicSize) {
            const step = this.itemMainSize + this.spacing;
            const totalRows = Math.ceil(this.totalCount / this.gridCount);
            this._contentSize = totalRows > 0
                ? this.headerSpacing + totalRows * step - this.spacing + this.footerSpacing
                : 0;
            if (this._isVertical()) {
                this._contentTf.height = Math.max(this._contentSize, this._viewportSize);
                this._boundsMin = 0;
                this._boundsMax = Math.max(0, this._contentSize - this._viewportSize);
            } else {
                this._contentTf.width = Math.max(this._contentSize, this._viewportSize);
                this._boundsMin = -Math.max(0, this._contentSize - this._viewportSize);
                this._boundsMax = 0;
            }
        }
    }

    // ==================== 分页相关 ====================
    getCurrentPageIndex(): number {
        return this._currentPageIndex;
    }

    scrollToPage(pageIndex: number, animated: boolean = true): void {
        if (!this.enablePageSnap) {
            console.warn('[VScrollView] 未启用分页吸附模式');
            return;
        }
        const maxPage = this._getMaxPageIndex();
        pageIndex = math.clamp(pageIndex, 0, maxPage);
        const targetPos = this._getPagePosition(pageIndex);
        this._scrollToPosition(targetPos, animated, this.pageSnapDuration);
        this._updateCurrentPage(pageIndex);
    }

    private _getMaxPageIndex(): number {
        if (this.useDynamicSize) {
            return Math.max(0, this.totalCount - 1);
        }
        const totalRows = Math.ceil(this.totalCount / this.gridCount);
        return Math.max(0, totalRows - 1);
    }

    private _getNearestPageIndex(): number {
        const contentPos = this._getContentMainPos();
        const scrollPos = this._isVertical() ? contentPos : -contentPos;

        if (this.useDynamicSize) {
            let nearest = 0;
            let minDist = Infinity;
            for (let i = 0; i < this.totalCount; i++) {
                const itemPos = this._prefixPositions[i];
                const dist = Math.abs(scrollPos - itemPos);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = i;
                }
            }
            return nearest;
        }

        const step = this.itemMainSize + this.spacing;
        const offset = Math.max(0, scrollPos - this.headerSpacing);
        const row = Math.round(offset / step);
        return math.clamp(row, 0, this._getMaxPageIndex());
    }

    private _getPagePosition(pageIndex: number): number {
        let pos: number;
        if (this.useDynamicSize) {
            pos = this._prefixPositions[pageIndex] ?? 0;
        } else {
            pos = this.headerSpacing + pageIndex * (this.itemMainSize + this.spacing);
        }
        if (!this._isVertical()) pos = -pos;
        return math.clamp(pos, this._boundsMin, this._boundsMax);
    }

    private _updateCurrentPage(pageIndex: number): void {
        if (this._currentPageIndex !== pageIndex) {
            this._currentPageIndex = pageIndex;
            this.onPageChangeFn?.(pageIndex);
        }
    }

    private _performPageSnap(): void {
        if (!this.enablePageSnap || this._scrollTween) return;

        const nearest = this._getNearestPageIndex();
        const clamped = math.clamp(nearest, 0, this._getMaxPageIndex());
        const targetPos = this._getPagePosition(clamped);
        const currentPos = this._getContentMainPos();

        if (Math.abs(targetPos - currentPos) < 1) {
            return;
        }
        this._velocity = 0;
        this._scrollToPosition(targetPos, true, this.pageSnapDuration);
        this._updateCurrentPage(clamped);
    }

    private _performPageSnapByDistance(): void {
        if (!this.enablePageSnap || this._scrollTween) return;

        const currentPos = this._getContentMainPos();
        const delta = currentPos - this._pageStartPos;
        const pageSize = this._getCurrentPageSize() * this.pageSnapDistanceRatio;
        let targetPage = this._currentPageIndex;
        const maxPage = this._getMaxPageIndex();

        if (this._isVertical()) {
            if (delta > pageSize) {
                targetPage = this._currentPageIndex + 1;
            } else if (delta < -pageSize) {
                targetPage = this._currentPageIndex - 1;
            }
        } else {
            if (delta < -pageSize) {
                targetPage = this._currentPageIndex + 1;
            } else if (delta > pageSize) {
                targetPage = this._currentPageIndex - 1;
            }
        }

        targetPage = math.clamp(targetPage, 0, maxPage);
        const targetPos = this._getPagePosition(targetPage);

        if (Math.abs(targetPos - currentPos) < 1) {
            this._updateCurrentPage(targetPage);
            this._velocity = 0;
            return;
        }

        this._velocity = 0;
        this._scrollToPosition(targetPos, true, this.pageSnapDuration);
        this._updateCurrentPage(targetPage);
    }

    private _getCurrentPageSize(): number {
        if (this.useDynamicSize) {
            const idx = math.clamp(this._currentPageIndex, 0, this.totalCount - 1);
            return this._itemSizes[idx] || 100;
        }
        return this.itemMainSize + this.spacing;
    }

    private _getPageIndexByPosition(pos: number): number {
        const scrollPos = this._isVertical() ? pos : -pos;
        if (this.useDynamicSize) {
            return this._posToFirstIndex(scrollPos);
        }
        const step = this.itemMainSize + this.spacing;
        const offset = Math.max(0, scrollPos - this.headerSpacing);
        const row = Math.floor(offset / step);
        return math.clamp(row, 0, this._getMaxPageIndex());
    }
}