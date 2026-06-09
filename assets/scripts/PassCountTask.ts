import { _decorator } from "cc";
import { ModuleEventKey } from "./IGameRawData";
import { DailyTaskDataManager } from "./Daily/DailyTaskDataManager";
import { EventManager } from "./Event/EventManager";
import { GameLogicConfig } from "./GameLogicConfig";
import { DailyTask } from "./Daily/DailyTask";

export class PassCountTask extends DailyTask {
    public onAdd(): void {
        // Empty implementation
    }

    public onRemove(): void {
        // Empty implementation
    }

    public onGameSucc(): void {
        EventManager.emit(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.modifyDailyTaskProgress,
            this.config.id,
            1
        );
        
        const currentProgress = DailyTaskDataManager.getTaskProgress(this.config.id);
        if (this.config.target <= currentProgress) {
            this.onComplete();
        }
    }
}