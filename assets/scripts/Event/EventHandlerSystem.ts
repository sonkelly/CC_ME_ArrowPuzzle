import { GameLogicConfig } from "./../GameLogicConfig";
import { EventManager } from "./../Event/EventManager";
import { ModuleEventKey } from "./../IGameRawData";
import { ModuleEventHandler } from "./../ModuleEventHandler";

export class EventHandlerSystem extends ModuleEventHandler {
    public OnInit(): void {
        EventManager.on("cloud_ani_hide", this.handler_cloud_ani_hide, this);
        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantCheckSystemUnlock,
            this.handler_WantCheckSystemUnlock,
            this
        );
        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.SystemUnlockEnd,
            this.handler_SystemUnlockEnd,
            this
        );
    }

    private handler_cloud_ani_hide = (): void => {
        EventManager.emit(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantCheckSystemUnlock
        );
    };

    private handler_WantCheckSystemUnlock = (): void => {
        // TODO: Implement handler logic
    };

    private handler_SystemUnlockEnd = (data: any): void => {
        // TODO: Implement handler logic
    };
}