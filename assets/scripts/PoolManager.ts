import { NodePool, instantiate, isValid, Node } from 'cc';

export class PoolManager {
    private _pools: Map<string, NodePool> = new Map();
    private _cachedArrowBodies: Map<string, Node[]> = new Map();
    private _recycleQueue: Node[] = [];
    private maxRecyclePerFrame: number = 1;

    private static _instance: PoolManager;

    public static get instance(): PoolManager {
        if (!this._instance) {
            this._instance = new PoolManager();
        }
        return this._instance;
    }

    public get(prefab: Node, parent?: Node): Node {
        const poolName: string = prefab.name;
        let pool: NodePool = this._pools.get(poolName);
        if (!pool) {
            pool = new NodePool();
            this._pools.set(poolName, pool);
        }

        let node: Node;
        if (pool.size() > 0) {
            node = pool.get();
        } else {
            node = instantiate(prefab);
        }

        node.active = true;
        if (parent) {
            node.setParent(parent);
        }
        return node;
    }

    public put(node: Node): void {
        if (!isValid(node)) {
            return;
        }

        const poolName: string = node.name;
        let pool: NodePool = this._pools.get(poolName);
        if (!pool) {
            pool = new NodePool();
            this._pools.set(poolName, pool);
        }
        pool.put(node);
    }

    public clear(poolName: string): void {
        const pool: NodePool = this._pools.get(poolName);
        if (pool) {
            pool.clear();
            this._pools.delete(poolName);
        }
    }

    public clearAll(): void {
        this._pools.forEach((pool: NodePool) => {
            pool.clear();
        });
        this._pools.clear();
    }

    public putInCached(cacheKey: string, node: Node): void {
        node.setScale(0, 0, 0);
        let cachedList: Node[] = this._cachedArrowBodies.get(cacheKey);
        if (!cachedList) {
            cachedList = [];
            this._cachedArrowBodies.set(cacheKey, cachedList);
        }
        cachedList.push(node);
    }

    public getBodyNodeFromCacheOrPool(prefab: Node): Node {
        const poolName: string = prefab.name;
        const cachedList: Node[] = this._cachedArrowBodies.get(poolName);
        if (cachedList && cachedList.length > 0) {
            return cachedList.pop();
        }
        return PoolManager.instance.get(prefab);
    }

    public recycle(node: Node): void {
        if (isValid(node)) {
            node.active = false;
            this._recycleQueue.push(node);
        }
    }

    public update(): void {
        if (this._recycleQueue.length === 0) {
            return;
        }

        const recycleCount: number = Math.min(this._recycleQueue.length, this.maxRecyclePerFrame);
        for (let i: number = 0; i < recycleCount; i++) {
            const node: Node = this._recycleQueue.pop();
            if (!node) {
                break;
            }
            this.put(node);
        }
    }
}