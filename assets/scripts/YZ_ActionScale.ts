import { _decorator, Component, tween } from 'cc';
import { AAA_CompatibleTool } from './AAA_CompatibleTool';

const { ccclass, property } = _decorator;

@ccclass('YZ_ActionScale')
export class YZ_ActionScale extends Component {
    @property({
        displayName: "动画速度",
        tooltip: "完成一次缩放循环所需时间(秒)"
    })
    private speed: number = 2;

    @property({
        displayName: "最小缩放值",
        tooltip: "对象的最小缩放比例"
    })
    private minScale: number = 0;

    @property({
        displayName: "最大缩放值",
        tooltip: "对象的最大缩放比例"
    })
    private maxScale: number = 1;

    private isRunAction: boolean = true;

    onLoad() {
        if (this.isRunAction) {
            const halfDuration = this.speed / 2;
            tween(this.node)
                .to(halfDuration, { scale: AAA_CompatibleTool.scale(this.maxScale) })
                .to(halfDuration, { scale: AAA_CompatibleTool.scale(this.minScale) })
                .union()
                .repeatForever()
                .start();
        }
    }
}