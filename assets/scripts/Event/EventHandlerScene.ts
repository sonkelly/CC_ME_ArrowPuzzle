import { GameLogicConfig } from "./../GameLogicConfig";
import { EventManager } from "./../Event/EventManager";
import { ModuleEventKey } from "./../IGameRawData";
import { ModuleEventHandler } from "./../ModuleEventHandler";

export class EventHandlerScene extends ModuleEventHandler {
    public OnInit(): void {
        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.MainSceneEnterEnd,
            this.handler_MainSceneEnterEnd,
            this
        );
    }

    public handler_MainSceneEnterEnd(): void {
        console.log("handler_MainSceneEnterEnd");
    }
}