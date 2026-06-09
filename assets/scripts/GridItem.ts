import { _decorator, Component, Vec3, Tween, Enum } from 'cc';
import { GameManager } from './GameManager';
import { DirectPlayUtil } from './DirectPlayUtil';

const { ccclass, property } = _decorator;

export enum GridType {
    None = 0,
    Up = 13,
    Down = 14,
    Left = 15,
    Right = 16
}

export enum ItemColor {
    Normal = "#111433",
    Error1 = "#D8E4FE",
    White = "#D8E4FE",
    Single = "#a29fab",
    Error2 = "#ca3454"
}

@ccclass('GridItem')
export class GridItem extends Component {
    @property({ type: Enum(GridType) })
    public gridType: GridType = GridType.None;

    public arrowComp: any = undefined;
    public worldPos: Vec3 = new Vec3();

    public init(): void {
        // Empty init method
    }

    public onTap(event: any): void {
        if (this.arrowComp && (this.arrowComp.isRemoved || this.arrowComp.isMoving || this.arrowComp.isMovingReturn)) {
            return;
        }

        this.arrowComp.moveArrow(this, event);

        if (DirectPlayUtil.isDirectPlay) {
            const currentStep = GameManager.instance.curStage.curdirectGuideStep;
            if (currentStep === 1) {
                GameManager.instance.curStage.curdirectGuideStep = 2;
                GameManager.instance.curStage.directPlayGuide();
            } else if (currentStep === 2) {
                GameManager.instance.curStage.curdirectGuideStep = 3;
                GameManager.instance.curStage.directPlayGuide();
            } else if (currentStep === 3) {
                GameManager.instance.curStage.directPlayGuide(true);
            }
        } else {
            const currentStep = GameManager.instance.curStage.curGuideStep;
            if (currentStep === 1) {
                GameManager.instance.curStage.curGuideStep = 2;
                GameManager.instance.curStage.checkGuide();
            } else if (currentStep === 2) {
                GameManager.instance.curStage.curGuideStep = 3;
                GameManager.instance.curStage.checkGuide();
            } else if (currentStep === 3) {
                GameManager.instance.curStage.curGuideStep = 4;
                GameManager.instance.curStage.checkGuide();
            } else if (currentStep === 4) {
                GameManager.instance.curStage.curGuideStep = 5;
                GameManager.instance.curStage.checkGuide();
            } else if (currentStep === 5) {
                GameManager.instance.curStage.curGuideStep = 6;
                GameManager.instance.curStage.checkGuide();
            }
        }
    }

    public clear(): void {
        Tween.stopAllByTarget(this.node);
    }
}