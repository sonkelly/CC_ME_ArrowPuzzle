import { _decorator, Component, Label, CCString } from 'cc';
import { Utilsqdd } from './Utils/Utilsqdd';

const { ccclass, property } = _decorator;

@ccclass('TimeCounter')
export class TimeCounter extends Component {
    public static EventType = {
        ON_TIME_COMPLETE: 'ON_TIME_COMPLETE'
    };

    @property(Label)
    public label: Label | null = null;

    @property(CCString)
    public sufix: string = '';

    @property
    public keepZero: boolean = true;

    @property
    public zeroPlaceholder: string = '';

    private _duration: number = 0;
    private _elapsed: number = 0;
    private _timeComplete: boolean = true;

    public update(deltaTime: number): void {
        if (this._timeComplete) {
            return;
        }

        this._elapsed += deltaTime;
        this.label!.string = Utilsqdd.formatTime(Math.max(0, this._duration - this._elapsed), this.keepZero) + this.sufix;

        if (this._elapsed >= this._duration) {
            this._timeComplete = true;
            if (this.zeroPlaceholder) {
                this.label!.string = this.zeroPlaceholder;
            }
            this.node.emit(TimeCounter.EventType.ON_TIME_COMPLETE, this);
        }
    }

    public startCount(): void {
        this._elapsed = 0;
        this._timeComplete = false;
    }

    public stopCount(): void {
        this._timeComplete = true;
    }

    public setDuration(duration: number): void {
        this._duration = duration;
        if (this.label) {
            this.label.string = Utilsqdd.formatTime(duration, this.keepZero) + this.sufix;
        }
    }

    public getDuration(): number {
        return this._duration;
    }

    public getElapsed(): number {
        return this._elapsed;
    }

    public isComplete(): boolean {
        return this._timeComplete;
    }
}