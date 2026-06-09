import { _decorator, Component } from 'cc';
import { DailyTaskType } from './../Daily/DailyTask';
import { PassCountTask } from './../PassCountTask';
import { JsonClassStorage } from './../JsonClass';

const { ccclass, property } = _decorator;

@ccclass('DailyTaskDriver')
export class DailyTaskDriver extends Component {
    private _tasks: any[] = [];

    public addTask(taskId: string): void {
        const task = this.createDailyTask(taskId);
        if (task) {
            task.dirver = this;
            this._tasks.push(task);
            task.onAdd();
        }
    }

    public removeTask(task: any): void {
        const index = this._tasks.indexOf(task);
        if (index >= 0) {
            this._tasks.splice(index, 1);
            task.onRemove();
        }
    }

    public removeAll(): void {
        if (this._tasks.length > 0) {
            for (let i = this._tasks.length - 1; i >= 0; i--) {
                this.removeTask(this._tasks[i]);
            }
        }
    }

    public update(deltaTime: number): void {
        for (let i = 0; i < this._tasks.length; i++) {
            const task = this._tasks[i];
            if (task) {
                task.update(deltaTime);
            }
        }
    }

    public createDailyTask(taskId: string): any {
        const config = JsonClassStorage.instance.getConfig("TaskConfig", taskId);
        if (config) {
            let task: any = null;
            switch (config.type) {
                case DailyTaskType.PassCount:
                    task = new PassCountTask();
                    break;
            }
            if (task) {
                task.config = config;
            }
            return task;
        }
        return null;
    }

    public onGameSuc(): void {
        for (let i = this._tasks.length - 1; i >= 0; i--) {
            this._tasks[i].onGameSucc();
        }
    }
}