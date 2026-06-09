import { _decorator, Component, tween, v3, Tween } from 'cc';
import { AAA_CompatibleTool } from './AAA_CompatibleTool';

const { ccclass, property } = _decorator;

@ccclass('HandAction')
export class HandAction extends Component {
    @property
    private runTime: number = 0.3;

    onLoad(): void {
        if (AAA_CompatibleTool.viewSize.height < AAA_CompatibleTool.viewSize.width) {
            const scale = AAA_CompatibleTool.viewSize.height / 1080 * 0.5;
            AAA_CompatibleTool.setNodeScale(this.node, scale);
        } else {
            const scale = AAA_CompatibleTool.designSize.width / 1080 * 0.5;
            AAA_CompatibleTool.setNodeScale(this.node, scale);
        }
    }

    onEnable(): void {
        tween(this.node)
            .by(this.runTime, { position: v3(-50, 50) })
            .by(this.runTime, { position: v3(50, -50) })
            .union()
            .repeatForever()
            .start();
    }

    onDisable(): void {
        Tween.stopAllByTarget(this.node);
    }
}