import { EventHandlerBag } from "./Event/EventHandlerBag";
import { EventHandlerBase } from "./Event/EventHandlerBase";
import { EventHandlerLogin } from "./Event/EventHandlerLogin";
import { EventHandlerRecord } from "./Event/EventHandlerRecord";
import { EventHandlerScene } from "./Event/EventHandlerScene";
import { EventHandlerSystem } from "./Event/EventHandlerSystem";
import { EventHandlerAd } from "./Event/EventHandlerAd";
import { EventHandleDailyTask } from "./Event/EventHandleDailyTask";
import { ModuleEventHandler } from "./ModuleEventHandler";

export class ModuleEventHandlerMgr {
    private static instance: ModuleEventHandlerMgr;
    private _handlers: ModuleEventHandler[] = [];

    public static GetInstance(): ModuleEventHandlerMgr {
        if (this.instance == null) {
            this.instance = new ModuleEventHandlerMgr();
            this.instance.init();
        }
        return this.instance;
    }

    public Init(): void {
        // Empty initialization method
    }

    private init(): void {
        this.addModuleHandler(new EventHandlerRecord());
        this.addModuleHandler(new EventHandlerSystem());
        this.addModuleHandler(new EventHandlerAd());
        this.addModuleHandler(new EventHandlerBase());
        this.addModuleHandler(new EventHandlerBag());
        this.addModuleHandler(new EventHandlerLogin());
        this.addModuleHandler(new EventHandlerScene());
        this.addModuleHandler(new EventHandleDailyTask());
    }

    private addModuleHandler(handler: ModuleEventHandler): void {
        handler.Init();
        this._handlers.push(handler);
    }

    public initRedPoint(): void {
        this._handlers.forEach((handler: ModuleEventHandler) => {
            handler.initRedPoint();
        });
    }
}