import { _decorator } from 'cc';

export class EventManager {
    private static events: Map<string, Map<any, { callback: Function; target: any }>> = new Map();
    private static targets: Map<any, string[]> = new Map();

    public EventName = {
        cloud_ani_hide: "cloud_ani_hide",
        on_game_resume: "on_game_resume"
    };

    public WSEventName = {
        ws_connected: "ws_connected",
        ws_onerror: "ws_onerror",
        ws_onclose: "ws_onclose",
        ws_msg_10001: "ws_msg_10001"
    };

    public DataEventName = {
        raw_data_BaseData: "raw_data_BaseData"
    };

    public PlayerEventName = {
        player_refresh_prop_and_skill: "player_refresh_prop_and_skill",
        player_refresh_task_target: "player_refresh_task_target",
        player_initiative_target: "player_initiative_target",
        player_clear_trace_target: "player_clear_trace_target",
        player_refresh_spine: "player_refresh_spine"
    };

    public static on(eventName: string, callback: Function, target: any): void {
        if (typeof callback === "function") {
            if (!this.events.has(eventName)) {
                this.events.set(eventName, new Map());
            }
            this.events.get(eventName)!.set(target, {
                callback: callback,
                target: target
            });

            if (!this.targets.has(target)) {
                this.targets.set(target, []);
            }
            this.targets.get(target)!.push(eventName);
        } else {
            console.error("没有事件响应函数！", eventName, callback, target);
        }
    }

    public static onByArray(eventNames: string[], callbacks: { [key: string]: Function }): void {
        for (const eventName of eventNames) {
            this.on(eventName, callbacks[eventName], callbacks);
        }
    }

    public static off(eventName: string, target: any): void {
        if (this.events.has(eventName)) {
            this.events.get(eventName)!.delete(target);
        } else {
            console.warn("没有这个监听函数", eventName);
        }
    }

    public static offAll(target: any): void {
        if (this.targets.has(target)) {
            const eventNames = this.targets.get(target);
            if (Array.isArray(eventNames)) {
                for (const eventName of eventNames) {
                    this.off(eventName, target);
                }
            }
            this.targets.delete(target);
        }
    }

    public static emit(eventName: string, ...args: any[]): void {
        const eventMap = this.events.get(eventName);
        if (eventMap) {
            eventMap.forEach((eventData) => {
                eventData.callback.call(eventData.target, ...args);
            });
        }
    }
}