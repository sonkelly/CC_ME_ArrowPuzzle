import { _decorator, Component, Node } from 'cc';
import { ArrowItem } from './ArrowItem';

export class HintManager {
    private stage: any;
    private usedSet: Set<ArrowItem> = new Set();

    constructor(stage: any) {
        this.stage = stage;
    }

    public getHintArrow(): ArrowItem | null {
        const self = this;
        const arrows = this.stage.arrows.map((arrow: Node) => {
            return arrow.getComponent(ArrowItem);
        }).filter((arrow: ArrowItem | null) => {
            return !!arrow;
        }).filter((arrow: ArrowItem) => {
            return arrow.canMoveOut();
        });

        if (arrows.length === 0) {
            return null;
        }

        let unusedArrows = arrows.filter((arrow: ArrowItem) => {
            return !self.usedSet.has(arrow);
        });

        if (unusedArrows.length === 0) {
            this.usedSet.clear();
            unusedArrows = arrows;
        }

        const randomIndex = Math.floor(Math.random() * unusedArrows.length);
        const selectedArrow = unusedArrows[randomIndex];
        this.usedSet.add(selectedArrow);
        return selectedArrow;
    }

    public playHint(arrow: ArrowItem | null): void {
        if (arrow) {
            arrow.playHintAnim();
        }
    }

    public onArrowRemoved(arrow: ArrowItem): void {
        this.usedSet.delete(arrow);
    }

    public reset(): void {
        this.usedSet.clear();
    }
}