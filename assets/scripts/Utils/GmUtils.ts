import { ModuleEventKey } from "./../IGameRawData";
import { AchievementManager } from "./../Achievement/AchievementManager";
import { EventManager } from "./../Event/EventManager";
import { GameManager } from "./../GameManager";
import { GameLogicConfig } from "./../GameLogicConfig";

export class GmUtils {
    public static AddGold(gold: number): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddGold, gold, true);
    }

    public static AddBagItem(itemId: number, count: number): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddItem, [itemId, count]);
    }

    public static AddHeart(heart: number): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddHeart, heart, true);
    }

    public static UseHeart(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantUseHeart, 1);
    }

    public static InfiniteHeart(enabled: boolean): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.SetHeartInfinite, enabled);
    }

    public static GameFailForOrder(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameFail, {
            reason: "order"
        });
    }

    public static GameFailForTime(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameFail, {
            reason: "timeup"
        });
    }

    public static GameWin(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameWin, false);
    }

    public static ForceEndStreakActivity(): void {
        // Empty implementation
    }

    public static SetLevelRemainTime(seconds: number): void {
        GameManager.instance.GMSetRemainingSeconds(seconds);
    }

    public static AchiAddDay(days: number): void {
        AchievementManager.instance.addDays(days);
    }

    public static AchiRestDay(): void {
        AchievementManager.instance.reset();
    }
}