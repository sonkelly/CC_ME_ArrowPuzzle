import { JsonClassStorage } from "./../JsonClass";
import { Utilsqdd } from "./../Utils/Utilsqdd";
import { DailyTaskState } from "./../Daily/DailyTaskRecorder";
import { GameRecord } from "./../GameRecord";

export class DailyTaskDataManager {
    static getDailyTaskRewards(taskIds: number[]): [number, number][] {
        const rewards: [number, number][] = [];
        for (let i = 0; i < taskIds.length; i++) {
            const config = JsonClassStorage.instance.getConfig("TaskConfig", taskIds[i]);
            if (config) {
                rewards.push([config.goodsId, config.goodsNum]);
            }
        }
        return rewards;
    }

    static isAllDailyTaskComplete(): boolean {
        const data = GameRecord.GetInstance().DailyTaskRecorder.GetData();
        for (let i = 0; i < data.todayTasks.length; i++) {
            if (data.todayTasks[i].state !== DailyTaskState.RECEIVED) {
                return false;
            }
        }
        return true;
    }

    static getDailyTaskCounterTime(): number {
        return Math.floor(0.001 * (Utilsqdd.getNextTodayZeroTime() - Date.now()));
    }

    static getTaskProgress(taskId: number): number {
        const taskData = GameRecord.GetInstance().DailyTaskRecorder.getDailyTaskData(taskId);
        return taskData ? taskData.progress : 0;
    }

    static getTodayDailyTaskDatas(): any[] {
        const data = GameRecord.GetInstance().DailyTaskRecorder.GetData();
        return Array.from(data.todayTasks);
    }

    static getAllDailyTaskDataByState(state: DailyTaskState): number[] {
        const taskIds: number[] = [];
        const data = GameRecord.GetInstance().DailyTaskRecorder.GetData();
        for (let i = 0; i < data.todayTasks.length; i++) {
            if (data.todayTasks[i].state === state) {
                taskIds.push(data.todayTasks[i].taskId);
            }
        }
        return taskIds;
    }

    static hasUnreceivedReward(): boolean {
        const data = GameRecord.GetInstance().DailyTaskRecorder.GetData();
        for (let i = 0; i < data.todayTasks.length; i++) {
            if (data.todayTasks[i].state === DailyTaskState.COMPLETE) {
                return true;
            }
        }
        return false;
    }
}