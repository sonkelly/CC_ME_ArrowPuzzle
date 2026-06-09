import { _decorator, Component, Label, NodePool, Vec3, Tween, Color, UIOpacity, tween, Prefab, instantiate } from 'cc';
import { GameAssetManager } from './GameAssetManager';

const { ccclass, property } = _decorator;

@ccclass('HitLb')
export class HitLb extends Component {
    @property(Label)
    public num_lb: Label | null = null;

    public static pool: NodePool = new NodePool();

    public static async init_pool(): Promise<void> {
        const prefab: Prefab | null = await GameAssetManager.loadAsset("game", "HitLb", Prefab);
        if (!prefab) {
            console.error("Failed to load HitLb prefab");
            return;
        }
        const poolSize: number = 30 - HitLb.pool.size();
        for (let i: number = 0; i < poolSize; i++) {
            const node: any = instantiate(prefab);
            HitLb.put_node(node);
        }
    }

    public static put_node(node: any): void {
        const hitLb: HitLb = node.getComponent(HitLb);
        if (hitLb && hitLb.num_lb) {
            hitLb.num_lb.node.setPosition(0, 0, 0);
            hitLb.num_lb.node.scale = Vec3.ONE;
            Tween.stopAllByTarget(hitLb.num_lb.node);
        }
        HitLb.pool.put(node);
    }

    public static get_node(): any {
        return HitLb.pool.get();
    }

    public blow_s(value: number, color: Color = Color.WHITE, callback?: () => void): void {
        if (this.num_lb) {
            this.num_lb.string = "+" + Math.round(value).toString();
            this.num_lb.color = color;
            this.play(callback);
        }
    }

    public play(callback?: () => void): void {
        const node: any = this.num_lb?.node;
        if (!node) return;

        const uiOpacity: UIOpacity | null = node.getComponent(UIOpacity);
        if (!uiOpacity) return;

        tween(node)
            .to(0.35, {
                position: new Vec3(0, 32, 0),
                scale: new Vec3(1, 1, 1)
            }, {
                onUpdate: (target: any, ratio: number) => {
                    uiOpacity.opacity = 255 * ratio;
                }
            })
            .to(0.25, {
                position: new Vec3(0, 56, 0)
            })
            .to(0.4, {
                position: new Vec3(0, 80, 0),
                scale: new Vec3(0.9, 0.9, 1)
            }, {
                onUpdate: (target: any, ratio: number) => {
                    uiOpacity.opacity = 255 * (1 - ratio);
                }
            })
            .call(() => {
                if (callback) {
                    callback();
                }
                HitLb.put_node(this.node);
            })
            .start();
    }
}