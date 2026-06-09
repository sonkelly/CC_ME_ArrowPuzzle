import { Node, director, Scheduler, macro } from 'cc';
import { GameLogicConfig } from './../GameLogicConfig';
import { JsonClassStorage } from './../JsonClass';
import { Utilsqdd } from './../Utils/Utilsqdd';
import { ModuleEventKey } from './../IGameRawData';
import { DailyTaskInfo, DailyTaskState } from './../Daily/DailyTaskRecorder';
import { GameRecord } from './../GameRecord';
import { EventManager } from './../Event/EventManager';
import { ModuleEventHandler } from './../ModuleEventHandler';
import { UIManager } from './../UIManager';
import { DailyTaskDriver } from './../Daily/DailyTaskDriver';
import { DailyTaskDataManager } from './../Daily/DailyTaskDataManager';
import { GameType } from './../GlobalEnum';
import { GameManager } from './../GameManager';

export class EventHandleDailyTask extends ModuleEventHandler {
    public id: any = undefined;
    public uuid: any = undefined;
    private _dailyMaxTask: number = 3;
    private _taskDriver: DailyTaskDriver = undefined;
    private autoOpen: boolean = false;

    public OnInit(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.LoginSuccess1, this.onLoginSucc, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.modifyDailyTaskProgress, this.modifyTaskProgress, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.onDailyTaskComplete, this.onDailyTaskComplete, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.receiveDailyTaskReward, this.receiveDailyTaskReward, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.syncTaskPreProgress, this.syncTaskPreProgress, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.refreshDailyTask, this.refreshNewDayDailyTask, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameWin, this.onGameSucc, this);
    }

    private onLoginSucc(): void {
        const dailyTaskDriverNode = new Node("DailyTaskDriver");
        director.addPersistRootNode(dailyTaskDriverNode);
        this._taskDriver = dailyTaskDriverNode.addComponent(DailyTaskDriver);
        this.initDailyTaskConfig();

        if (GameRecord.GetInstance().DailyTaskRecorder.Data.nextRefreshTime == null) {
            this.refreshDailyTask();
        }
        this.initDailyTask();

        Scheduler.enableForTarget(this);
        director.getScheduler().schedule(this.update, this, 1, macro.REPEAT_FOREVER, 0, false);
    }

    private refreshNewDayDailyTask(): void {
        console.log("DailyTaskRecorder refreshDailyTask 2222================");
        this.refreshDailyTask();
        this.initDailyTask();
    }

    private update(dt: number): void {
        if (director.getScene().name === "GameScene") {
            const dailyTaskData = GameRecord.GetInstance().DailyTaskRecorder.Data;
            const currentTime = Date.now();

            if (dailyTaskData.nextRefreshTime <= currentTime) {
                if (DailyTaskDataManager.hasUnreceivedReward()) {
                    if (!UIManager.isShow("DailyTaskView") && !UIManager.isShow("CommonRewardView") && !this.autoOpen) {
                        this.autoOpen = true;
                        UIManager.createPanel("game", "DailyTaskView", {
                            showAnimation: true,
                            setData: {
                                checkAutoReceive: true
                            }
                        });
                    }
                } else {
                    console.log("DailyTaskRecorder refreshDailyTask 3333================");
                    this.refreshDailyTask();
                    this.initDailyTask();
                }
            }
        }
    }

    private initDailyTaskConfig(): void {
        // Empty implementation
    }

    private refreshDailyTask(): void {
        console.log("DailyTaskRecorder refreshDailyTask================");
        const recorder = GameRecord.GetInstance().DailyTaskRecorder;
        const data = recorder.GetData();
        data.todayTasks = [];

        const taskConfigs = JsonClassStorage.instance.getConfigs("TaskConfig");
        for (let i = 0; i < taskConfigs.length; i++) {
            const taskInfo = new DailyTaskInfo();
            taskInfo.taskId = taskConfigs[i].id;
            data.todayTasks.push(taskInfo);
        }

        data.nextRefreshTime = Utilsqdd.getNextTodayZeroTime();
        recorder.Save();
    }

    private onDailyTaskComplete(taskId: number): void {
        const recorder = GameRecord.GetInstance().DailyTaskRecorder;
        const taskData = recorder.getDailyTaskData(taskId);

        if (taskData.state === DailyTaskState.UNCOMPLETE) {
            taskData.state = DailyTaskState.COMPLETE;
            recorder.Save();
            console.log("DailyTaskRecorder onDailyTaskComplete: ", taskId);
        }
    }

    private receiveDailyTaskReward(taskId: number, isSilent: boolean = false): void {
        const recorder = GameRecord.GetInstance().DailyTaskRecorder;
        const taskConfig = JsonClassStorage.instance.getConfig("TaskConfig", taskId);

        if (taskConfig) {
            if (!isSilent) {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddItem, [taskConfig.goodsId, taskConfig.goodsNum], false);
            }
            recorder.getDailyTaskData(taskId).state = DailyTaskState.RECEIVED;
            console.log("DailyTaskRecorder receiveDailyTaskReward: ", taskId);
            recorder.Save();
        }
    }

    private modifyTaskProgress(taskId: number, progressDelta: number): void {
        const taskData = GameRecord.GetInstance().DailyTaskRecorder.getDailyTaskData(taskId);
        if (taskData && taskData.state === DailyTaskState.UNCOMPLETE) {
            taskData.progress += progressDelta;
            GameRecord.GetInstance().DailyTaskRecorder.Save();
        }
    }

    private syncTaskPreProgress(taskId: number): void {
        const taskData = GameRecord.GetInstance().DailyTaskRecorder.getDailyTaskData(taskId);
        if (taskData) {
            taskData.preProgress = taskData.progress;
            GameRecord.GetInstance().DailyTaskRecorder.Save();
        }
    }

    private initDailyTask(): void {
        this._taskDriver.removeAll();
        const uncompletedTasks = DailyTaskDataManager.getAllDailyTaskDataByState(DailyTaskState.UNCOMPLETE);
        for (let i = 0; i < uncompletedTasks.length; i++) {
            this._taskDriver.addTask(uncompletedTasks[i]);
        }
    }

    private onGameSucc(gameType: GameType): void {
        if (gameType !== GameType.MainLevel || GameManager.instance.isRescueLevel()) {
            return;
        }
        this._taskDriver.onGameSuc();
    }
}