import { _decorator, Component, Node, Prefab, v3, instantiate, math, tween, UIOpacity } from 'cc';
import { UILayerManager } from './UILayerManager';
import { AudioUtils } from './Utils/AudioUtils';
import { JsonClassStorage } from './JsonClass';
import { ItemType } from './GlobalEnum';

const { ccclass, property } = _decorator;

@ccclass('FlyEffectManager')
export class FlyEffectManager extends Component {
    public static instance: FlyEffectManager = null;

    @property(Node)
    public flyLayer: Node = null;

    @property(Prefab)
    public heartPrefab: Prefab = null;

    @property(Prefab)
    public coinPrefab: Prefab = null;

    @property(Node)
    public nPlayBtn: Node = null;

    private _originalScale = v3(1, 1, 1);

    public onLoad(): void {
        FlyEffectManager.instance = this;
    }

    public playFlyHearts(count: number, startPos: Vec3, scale: Vec3, callback?: () => void, targetNode?: Node): void {
        this._originalScale = scale;
        const heartManager = UILayerManager.instance.heartManager;
        const target = targetNode !== null ? targetNode : heartManager.node;
        const targetPos = targetNode ? targetNode.worldPosition : heartManager.heart.worldPosition;
        
        this._playFlyItems(count, startPos, targetPos, target, this.heartPrefab, (index: number) => {
            heartManager.addHearts(1, false);
            if (index + 1 === count && callback) {
                callback();
            }
        });
    }

    public playFlyCoins(count: number, startPos: Vec3, callback?: () => void, targetNode?: Node): void {
        const goldNode = UILayerManager.instance.glodNode;
        const coinAddArray = this._calcCoinAddArray(count);
        const target = targetNode !== null ? targetNode : goldNode.node;
        const targetPos = targetNode ? targetNode.worldPosition : goldNode.gold.worldPosition;
        
        this._playFlyItems(coinAddArray.length, startPos, targetPos, target, this.coinPrefab, (index: number) => {
            goldNode.addGolds(coinAddArray[index]);
            if (index === coinAddArray.length - 1 && callback) {
                callback();
            }
        });
    }

    public playFlyProp(count: number, startPos: Vec3, prefab: Prefab, targetNode?: Node, callback?: () => void): void {
        const coinAddArray = this._calcCoinAddArray(count);
        const target = targetNode !== null ? targetNode : this.nPlayBtn;
        const targetPos = targetNode ? targetNode.worldPosition : this.nPlayBtn.worldPosition;
        
        this._playFlyItems(coinAddArray.length, startPos, targetPos, target, prefab, (index: number) => {
            if (index === coinAddArray.length - 1 && callback) {
                callback();
            }
        });
    }

    public playFlyGoods(itemId: number, count: number, startPos: Vec3, options?: { callback?: () => void; flyNode?: Node; targetNode?: Node }): void {
        const itemData = JsonClassStorage.instance.getConfig("ItemData", itemId);
        if (itemData) {
            switch (itemData.ItemType) {
                case ItemType.CURRENCY:
                    this.playFlyCoins(count, startPos, options?.callback);
                    break;
                case ItemType.PROP:
                    this.playFlyProp(count, startPos, options?.flyNode, options?.targetNode, options?.callback);
                    break;
            }
        }
    }

    private _playFlyItems(count: number, startPos: Vec3, targetPos: Vec3, targetNode: Node, prefab: Prefab, onArrive: (index: number) => void): void {
        const items: Node[] = [];
        
        for (let i = 0; i < count; i++) {
            const item = instantiate(prefab);
            item.scale = v3(this._originalScale);
            item.active = true;
            this.flyLayer.addChild(item);
            item.setWorldPosition(startPos);
            items.push(item);
        }

        items.forEach((item: Node, index: number) => {
            const angle = math.toRadian(360 / count * index);
            const radius = 60 + 40 * Math.random();
            const explodePos = v3(
                startPos.x + Math.cos(angle) * radius,
                startPos.y + Math.sin(angle) * radius,
                0
            );
            
            tween(item)
                .to(0.25, { worldPosition: explodePos }, { easing: "quadOut" })
                .start();
            
            (item as any)._explodePos = explodePos;
        });

        items.forEach((item: Node, index: number) => {
            const explodePos = (item as any)._explodePos;
            const delay = 0.1 + 0.1 * index;
            const controlPoint = this._bezierTo(explodePos, targetPos);
            
            tween(item)
                .delay(delay)
                .parallel(
                    tween()
                        .to(0.55, {}, {
                            onUpdate: (target: any, ratio: number) => {
                                const x = (1 - ratio) * (1 - ratio) * explodePos.x + 
                                         2 * (1 - ratio) * ratio * controlPoint.x + 
                                         ratio * ratio * targetPos.x;
                                const y = (1 - ratio) * (1 - ratio) * explodePos.y + 
                                         2 * (1 - ratio) * ratio * controlPoint.y + 
                                         ratio * ratio * targetPos.y;
                                item.setWorldPosition(v3(x, y));
                            }
                        }),
                    tween()
                        .to(0.5, { scale: v3(1, 1, 1) })
                )
                .call(() => {
                    this._arrive(item, index, targetNode, onArrive);
                })
                .start();
        });
    }

    private _arrive(item: Node, index: number, targetNode: Node, onArrive: (index: number) => void): void {
        AudioUtils.drop_ani_sound();
        
        tween(targetNode)
            .to(0.05, { scale: v3(1.1, 1.1, 1.1) })
            .to(0.05, { scale: v3(1, 1, 1) })
            .start();
        
        tween(item)
            .to(0.2, { scale: v3(1.2, 1.2, 1) })
            .call(() => {
                item.destroy();
                if (onArrive) {
                    onArrive(index);
                }
            })
            .start();
        
        const opacityComponent = item.getComponent(UIOpacity) || item.addComponent(UIOpacity);
        tween(opacityComponent)
            .to(0.2, { opacity: 80 })
            .start();
    }

    private _bezierTo(startPos: Vec3, endPos: Vec3): Vec3 {
        return v3(
            (startPos.x + endPos.x) / 2 + (150 * Math.random() - 75),
            (startPos.y + endPos.y) / 2 + 180 * Math.random(),
            0
        );
    }

    private _calcCoinAddArray(count: number): number[] {
        if (count <= 6) {
            return Array(count).fill(1);
        }
        
        const baseValue = Math.floor(count / 6);
        const remainder = count % 6;
        const result = new Array(6).fill(baseValue);
        
        for (let i = 0; i < remainder; i++) {
            result[i] += 1;
        }
        
        return result;
    }
}