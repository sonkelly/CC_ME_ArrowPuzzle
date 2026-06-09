import { _decorator, Label } from 'cc';
import { BasePanel } from './BasePanel';
import { UILayerManager } from './UILayerManager';
import { UIManager } from './UIManager';
import { AudioUtils } from './Utils/AudioUtils';

const { ccclass, property } = _decorator;

@ccclass('InfiniteHeartView')
export class InfiniteHeartView extends BasePanel {
    @property(Label)
    public lbTimer: Label | null = null;

    public onLoad(): void {
        this.addListen();
    }

    public onShow(): void {
        this.initView();
        this.updateUI();
        this.schedule(this.updateUI, 1);
    }

    public addListen(): void {
        // Add event listeners if needed
    }

    public initView(): void {
        // Initialize view components
    }

    public updateUI(): void {
        if (this.lbTimer && UILayerManager.instance.heartManager.lbInfinite) {
            this.lbTimer.string = UILayerManager.instance.heartManager.lbInfinite.string;
        }
    }

    public onCloseClick(): void {
        AudioUtils.btn_close_sound();
        UIManager.deleteNode('InfiniteHeartView');
    }
}