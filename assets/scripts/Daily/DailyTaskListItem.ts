import { _decorator, Component, Sprite, SpriteFrame, Node, Label, ProgressBar, math, Tween, tween } from 'cc';
import { ModuleEventKey } from './../IGameRawData';
import { DailyTaskState } from './../Daily/DailyTaskRecorder';
import { GameRecord } from './../GameRecord';
import { EventManager } from './../Event/EventManager';
import { JsonClassStorage } from './../JsonClass';
import { GameLogicConfig } from './../GameLogicConfig';
import { Goods } from './../Goods';
import { TimeCounter } from './../TimeCounter';
import { DailyTaskType } from './../Daily/DailyTask';
import { I18nManager } from './../I18nManager';

const { ccclass, property } = _decorator;

@ccclass('DailyTaskListItem')
export class DailyTaskListItem extends Component {
    @property(Sprite)
    private bg: Sprite = null;

    @property(SpriteFrame)
    private normalFrame: SpriteFrame = null;

    @property(SpriteFrame)
    private completeFrame: SpriteFrame = null;

    @property(Goods)
    private goods: Goods = null;

    @property(Node)
    private gou: Node = null;

    @property(Label)
    private des: Label = null;

    @property(Node)
    private cliam: Node = null;

    @property(Label)
    private finished: Label = null;

    @property(ProgressBar)
    private progress: ProgressBar = null;

    @property(Label)
    private lbProgress: Label = null;

    @property(TimeCounter)
    private timeCounter: TimeCounter = null;

    @property(Node)
    private nProgressGroup: Node = null;

    private _cfg: any = undefined;
    private _taskData: any = undefined;
    public data: any = undefined;

    public init(data: any): void {
        this.data = data;
        const config = JsonClassStorage.instance.getConfig("TaskConfig", data.taskId);
        if (config) {
            this._cfg = config;
            const taskData = GameRecord.GetInstance().DailyTaskRecorder.getDailyTaskData(this._cfg.id);
            this._taskData = taskData;
            this.goods.setData(config.goodsId, config.goodsNum);
            this.des.string = this.getTaskDes(config);
            this.finished.string = this.des.string;
        }
        this.updateState();
    }

    public updateState(): void {
        if (this._cfg) {
            const taskData = GameRecord.GetInstance().DailyTaskRecorder.getDailyTaskData(this._cfg.id);
            this.bg.spriteFrame = taskData.state === DailyTaskState.RECEIVED || taskData.state === DailyTaskState.COMPLETE ? this.completeFrame : this.normalFrame;
            this.gou.active = taskData.state === DailyTaskState.RECEIVED;
            this.des.node.active = taskData.state === DailyTaskState.UNCOMPLETE;
            this.cliam.active = taskData.state === DailyTaskState.COMPLETE;
            this.finished.node.active = taskData.state === DailyTaskState.RECEIVED;
            this.nProgressGroup.active = taskData.state !== DailyTaskState.RECEIVED;

            let progress = taskData.progress;
            progress = math.clamp(progress, 0, this._cfg.target);

            if (this._cfg.type !== DailyTaskType.OnlineTime) {
                this.lbProgress.string = progress + "/" + this._cfg.target;
                const preProgress = taskData.preProgress / this._cfg.target;
                const currentProgress = progress / this._cfg.target;
                this.playProgressAnimation(preProgress, currentProgress);
                if (taskData.preProgress !== taskData.progress) {
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.syncTaskPreProgress, this._cfg.id);
                }
            } else {
                this.timeCounter.setDuration(Math.max(0, this._cfg.target - progress));
                this.timeCounter.startCount();
                this.updateTime();
            }
        }
    }

    public onClick(): void {
        // Empty method
    }

    public update(deltaTime: number): void {
        if (this._cfg && this._cfg.type === DailyTaskType.OnlineTime) {
            this.updateTime();
        }
    }

    private updateTime(): void {
        let progress = this._taskData.progress;
        progress = math.clamp(progress, 0, this._cfg.target);
        this.progress.progress = this._cfg.target === 0 ? 0 : progress / this._cfg.target;
    }

    private getBackgroundType(state: DailyTaskState): number {
        return state === DailyTaskState.COMPLETE ? 2 : 0;
    }

    private playProgressAnimation(from: number, to: number): void {
        if (Tween.getRunningCount(this.progress) > 0) {
            return;
        }
        this.progress.progress = from;
        tween(this.progress)
            .to(1, { progress: to }, { easing: "sineOut" })
            .start();
    }

    private getTaskDes(config: any): string {
        const taskDesConfig = JsonClassStorage.instance.getConfig("TaskDesConfig", config.type);
        if (taskDesConfig) {
            this.des.string = taskDesConfig?.des || "";
            if (config.type === DailyTaskType.PassCount) {
                return config.target === 1 ? I18nManager.t("Win 1 level") : I18nManager.t("Win {0} levels", config.target);
            }
            return taskDesConfig ? taskDesConfig.des : "";
        }
        return "";
    }
}