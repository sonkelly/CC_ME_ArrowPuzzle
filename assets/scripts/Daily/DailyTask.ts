import { EventManager } from "./../Event/EventManager";
import { GameLogicConfig } from "./../GameLogicConfig";
import { ModuleEventKey } from "./../IGameRawData";

export enum DailyTaskType {
    Login = 1,
    PassLevel = 2,
    SuccessivePass = 3,
    PassCount = 4,
    OnlineTime = 5,
    UsePropCount = 6,
    VideoCount = 7,
    Buy = 8,
    CoinCost = 9
}

export class DailyTask {
    public config: any;
    public dirver: any;
    public isComplete: boolean = false;

    constructor() {
        this.config = undefined;
        this.dirver = undefined;
        this.isComplete = false;
    }

    public update(dt: number): void {
        // Empty update method
    }

    public onComplete(): void {
        this.isComplete = true;
        EventManager.emit(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.onDailyTaskComplete,
            this.config.id
        );
        this.dirver.removeTask(this);
    }
}