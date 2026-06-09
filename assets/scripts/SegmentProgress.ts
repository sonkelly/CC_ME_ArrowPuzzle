import { _decorator, Component, Sprite, Tween, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SegmentProgress')
export class SegmentProgress extends Component {
    @property
    private _progress: number = 0;

    @property
    get progress(): number {
        return this._progress;
    }

    set progress(value: number) {
        this._progress = value;
        this.updateProgress();
    }

    private updateProgress(): void {
        const childCount = this.node.children.length;
        for (let i = 0; i < childCount; i++) {
            const child = this.node.children[i];
            child.active = i < this._progress;
            if (child.active) {
                child.getComponent(Sprite).fillRange = 1;
            }
        }
    }

    public playProgressAnimation(from: number, to: number): void {
        const childCount = this.node.children.length;
        for (let i = 0; i < childCount; i++) {
            const sprite = this.node.children[i].getComponent(Sprite);
            Tween.stopAllByTarget(sprite);
            
            if (i < from) {
                sprite.fillRange = 1;
            } else if (i < to) {
                sprite.fillRange = 0;
                tween(sprite)
                    .delay(0.5 * (i - from))
                    .to(0.5, { fillRange: 1 })
                    .start();
            }
        }
    }
}