import { DataRecorder } from "./../DataRecorder";
import { RecordUtils } from "./../Utils/RecordUtils";

export enum DailyTaskState {
    UNCOMPLETE = 0,
    COMPLETE = 1,
    RECEIVED = 2
}

export class DailyTaskInfo {
    public taskId: number = 0;
    public state: DailyTaskState = DailyTaskState.UNCOMPLETE;
    public progress: number = 0;
    public preProgress: number = 0;
}

export class IDailyTaskData {
    public todayTasks: DailyTaskInfo[] = [];
    public dailyAutoOpen: boolean = true;
    public nextRefreshTime: number | null = null;
}

export class DailyTaskRecorder extends DataRecorder {
    public Data: IDailyTaskData = new IDailyTaskData();

    public RecordName(): string {
        return "TaskDataRecorder";
    }

    public GetCacheName(): string {
        return RecordUtils.NeedEncryptSave() ? "9de8422a-34b6-45a5-a37e-b9e4ea5ba3b8" : "__DAILY_TASK__";
    }

    public GetData(): IDailyTaskData {
        return this.Data;
    }

    public SetData(data: IDailyTaskData | null): void {
        if (data) {
            this.Data = data;
        } else {
            this.Reset();
        }
    }

    public Reset(): void {
        this.Data.dailyAutoOpen = true;
        this.Data.nextRefreshTime = null;
        this.Data.todayTasks = [];
    }

    public getDailyTaskData(taskId: number): DailyTaskInfo | undefined {
        return this.Data.todayTasks.find((task: DailyTaskInfo) => task.taskId === taskId);
    }
}