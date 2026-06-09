import { _decorator, Component, Label } from 'cc';
import { TimeUtils } from './Utils/TimeUtils';
import { I18nManager } from './I18nManager';

const { ccclass, property } = _decorator;

@ccclass('CommonActivityTimer')
export class CommonActivityTimer extends Component {
    private _label: Label | null = null;
    public endTime: number = 0;
    private _currentInterval: number = 0;
    public isShowFinished: boolean = false;
    public endCallBack: (() => void) | null = null;
    public preFix: string = "";

    public onLoad(): void {
        // Không cần xử lý gì trong onLoad
    }

    public init(endTime: number, preFix: string, endCallBack: (() => void) | null, isShowFinished: boolean = false): void {
        if (!this._label) {
            this._label = this.getComponent(Label);
        }
        this.preFix = preFix;
        this.isShowFinished = isShowFinished;
        this.endCallBack = endCallBack;
        this.resetEndTime(endTime);
    }

    public resetEndTime(endTime: number): void {
        this.endTime = endTime;
        this._updateCountdownText();
        const diffMs = this.endTime - Date.now();
        this._startTimerByDiffMs(diffMs);
    }

    private _startTimerByDiffMs(diffMs: number): void {
        this.unschedule(this._updateCountdownText);
        
        if (diffMs <= 0) {
            this._currentInterval = 0;
        } else {
            let interval: number = 0;
            if (diffMs >= 86400000) { // >= 1 ngày
                interval = 3600; // 1 giờ
            } else if (diffMs >= 3600000) { // >= 1 giờ
                interval = 60; // 1 phút
            } else {
                interval = 1; // 1 giây
            }
            this._currentInterval = interval;
            this.schedule(this._updateCountdownText, interval);
        }
    }

    private _updateCountdownText(): void {
        if (this._label) {
            this._label.string = this.preFix + TimeUtils.formatCountdownTime(this.endTime);
            
            const remainingTime = this.endTime - Date.now();
            
            if (remainingTime <= 0 && this.isShowFinished) {
                this._label.string = I18nManager.t("Finished");
            }
            
            if (remainingTime <= 0 && this.endCallBack) {
                this.endCallBack();
            }
            
            this._checkAndSwitchTimer(remainingTime);
        }
    }

    private _checkAndSwitchTimer(remainingTime: number): void {
        const newInterval = remainingTime <= 0 ? 0 : 
                           remainingTime >= 86400000 ? 3600 : 
                           remainingTime >= 3600000 ? 60 : 1;
        
        if (newInterval !== this._currentInterval) {
            this._startTimerByDiffMs(remainingTime);
        }
    }

    public onDestroy(): void {
        this.unscheduleAllCallbacks();
    }
}