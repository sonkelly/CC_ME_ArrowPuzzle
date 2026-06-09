import { _decorator, Component, NodePool, instantiate, v3, sp } from 'cc';
import { GameAssetManager } from './GameAssetManager';

const { ccclass, property } = _decorator;

interface EffectOption {
    scale: number;
    timeScale?: number;
    offset_pos?: { x: number; y: number; z: number };
    duration_time?: number;
    time: number;
    ani: string;
    next_ani?: { ani: string; time: number };
    angle?: number;
}

@ccclass('effect_component')
export class effect_component extends Component {
    public static pool: NodePool = new NodePool();

    @property(sp.Skeleton)
    public sp_body: sp.Skeleton | null = null;

    public target_node: any = null;
    public target_pos: any = null;
    public option: EffectOption | null = null;
    public callBack: (() => void) | null = null;

    public static get_effect_node(): any {
        let node = this.pool.get();
        if (!node) {
            const prefab = GameAssetManager.getAssetByPath("game", "prefab/$effect/effect_component");
            node = instantiate(prefab);
        }
        return node;
    }

    public static recycle(node: any): void {
        this.pool.put(node);
    }

    public static init_pool = async (): Promise<void> => {
        const poolSize = 10 - this.pool.size();
        for (let i = 0; i < poolSize; i++) {
            const prefab = await GameAssetManager.getAssetByPath("game", "prefab/$effect/effect_component");
            if (prefab) {
                const node = instantiate(prefab);
                this.pool.put(node);
            }
        }
    };

    public play_by_node(spinePath: string, targetNode: any, option: EffectOption, callback: (() => void) | null = null): void {
        this.node.layer = this.node.parent!.layer;
        this.sp_body!.node.layer = this.node.parent!.layer;
        this.sp_body!.node.active = false;
        this.target_node = targetNode;
        this.option = option;
        this.callBack = callback;
        this._applyAngle();

        GameAssetManager.loadSpine("game", spinePath, this.sp_body!).then((success: boolean) => {
            if (success) {
                this.play(option);
            } else {
                this.end();
            }
        });
    }

    public play_by_pos(spinePath: string, targetPos: any, option: EffectOption, callback: (() => void) | null = null): void {
        this.target_pos = targetPos;
        this.option = option;
        this.callBack = callback;
        this.sp_body!.node.active = false;
        this._applyAngle();

        GameAssetManager.loadSpine("game", spinePath, this.sp_body!).then((success: boolean) => {
            if (success) {
                this.play(option);
            } else {
                this.end();
            }
        });
    }

    public play(option: EffectOption): void {
        if (this.sp_body) {
            this.sp_body.node.scale = option.scale;
            this.sp_body.timeScale = option.timeScale ?? 1;

            const offsetPos = this.option!.offset_pos || v3(0, 0, 0);
            this.node.setPosition(this.node.position.x + offsetPos.x, this.node.position.y + offsetPos.y);

            this.unscheduleAllCallbacks();
            if (this.option!.duration_time) {
                this.scheduleOnce(this.end, this.option!.duration_time);
            }

            if (option.time !== 0) {
                this.sp_body.setCompleteListener(() => {
                    this.onLoopComplete();
                });
            }

            this.sp_body.setAnimation(0, option.ani, option.time === 0);
            this.sp_body.node.active = true;
        }
    }

    public onLoopComplete(): void {
        if (this.option!.next_ani) {
            this.sp_body!.setAnimation(0, this.option!.next_ani.ani, this.option!.next_ani.time === 0);
        } else if (!this.option!.duration_time) {
            this.end();
        }
    }

    private _applyAngle(): void {
        let angle = 0;
        if (typeof this.option!.angle === "number") {
            angle = this.option!.angle === -1 ? 360 * Math.random() : this.option!.angle;
        }
        this.node.setRotationFromEuler(0, 0, angle);
    }

    public end(): void {
        if (this.callBack) {
            this.callBack();
        }
        this.unscheduleAllCallbacks();
        if (this.sp_body) {
            this.sp_body.setCompleteListener(null);
        }
        effect_component.recycle(this.node);
        this.target_node = null;
        this.target_pos = null;
    }
}