import { AchievementType, ItemID } from "./../GlobalEnum";
import { JsonClassStorage } from "./../JsonClass";
import { GameRecord } from "./../GameRecord";
import { AchievementConfigManager } from "./AchievementConfigManager";
import { UILayerManager } from "./../UILayerManager";
import { FlyEffectManager } from "./../FlyEffectManager";
import { EventManager } from "./../Event/EventManager";
import { GameLogicConfig } from "./../GameLogicConfig";
import { ModuleEventKey } from "./../IGameRawData";
import { HeartSource } from "./../HeartManager";
import { I18nManager } from "./../I18nManager";
import { DirectPlayUtil } from "./../DirectPlayUtil";

interface AchievementSaveData {
    progress: number;
    level: number;
    claimedLevel: number;
    dailyProgress: number;
    lastUpdateDay: number;
    streak: number;
    lastPlayDay: number;
}

interface TitleRecord {
    id: number;
    groupId: number;
    level: number;
    time: number;
}

interface AchievementListEntry {
    groupId: number;
    name: string;
    level: number;
    claimedLevel: number;
    curProgress: number;
    target: number;
    desc: string;
    canClaim: boolean;
    isMax: boolean;
    rewardIds: number[];
    rewardNums: number[];
}

export class AchievementManager {
    private static _instance: AchievementManager;
    private recorder: any;
    private save: { [key: string]: any } = {};
    private _animationCount: number;
    private debugOffset: number = 0;

    public static get instance(): AchievementManager {
        if (!this._instance) {
            this._instance = new AchievementManager();
        }
        return this._instance;
    }

    public init(): void {
        const configData = JsonClassStorage.instance.getTableJson("AchievementConfig").json;
        AchievementConfigManager.init(configData);
        this.recorder = GameRecord.GetInstance().AchievementRecorder;
        this.save = this.recorder.Data || {};
        if (!this.save.titles) {
            this.save.titles = [];
        }
    }

    private getSave(key: string): AchievementSaveData {
        if (!this.save[key]) {
            this.save[key] = {
                progress: 0,
                level: 0,
                claimedLevel: 0,
                dailyProgress: 0,
                lastUpdateDay: 0,
                streak: 0,
                lastPlayDay: 0
            };
        }
        return this.save[key];
    }

    public onEvent(eventType: AchievementType, amount: number = 1): void {
        if (DirectPlayUtil.isDirectPlay) {
            return;
        }

        const groups = AchievementConfigManager.getGroupsByType(eventType);
        if (!groups || groups.length === 0) {
            return;
        }

        let needSave = false;
        for (const group of groups) {
            switch (eventType) {
                case AchievementType.HP_COST:
                case AchievementType.HEART_COST:
                    this.updateNormal(group.groupId, amount);
                    break;
                case AchievementType.LEVEL_COMPLETE:
                case AchievementType.RESCUE_COMPLETE:
                    this.updateDaily(group.groupId, amount);
                    break;
                case AchievementType.LOGIN_DAY:
                    needSave = this.updateLogin(group.groupId);
                    break;
            }
        }
        this.saveToLocal(needSave);
    }

    private updateNormal(groupId: number, amount: number): void {
        const saveData = this.getSave(groupId);
        saveData.progress += amount;
        this.checkUpgrade(groupId, saveData);
    }

    private updateDaily(groupId: number, amount: number): void {
        const saveData = this.getSave(groupId);
        const currentDay = this.getDay();
        if (!saveData.lastUpdateDay || saveData.lastUpdateDay !== currentDay) {
            saveData.dailyProgress = 0;
            saveData.lastUpdateDay = currentDay;
        }
        saveData.dailyProgress += amount;
        this.checkUpgrade(groupId, saveData, true);
    }

    private updateLogin(groupId: number): boolean {
        const saveData = this.getSave(groupId);
        const currentDay = this.getDay();
        if (saveData.lastPlayDay !== currentDay) {
            saveData.lastPlayDay = currentDay;
            saveData.progress += 1;
            this.checkUpgrade(groupId, saveData);
            return true;
        }
        return false;
    }

    public onGameResult(isWin: boolean): void {
        if (DirectPlayUtil.isDirectPlay) {
            return;
        }

        const groups = AchievementConfigManager.getGroupsByType(AchievementType.WIN_STREAK);
        if (!groups || groups.length === 0) {
            return;
        }

        for (const group of groups) {
            const saveData = this.getSave(group.groupId);
            if (isWin) {
                saveData.streak = (saveData.streak || 0) + 1;
                this.updateStreak(group.groupId);
            } else {
                saveData.streak = 0;
            }
        }
        this.saveToLocal(false);
    }

    private updateStreak(groupId: number): void {
        const saveData = this.getSave(groupId);
        while (true) {
            const config = AchievementConfigManager.getNextConfig(groupId, saveData.level);
            if (!config) {
                break;
            }
            if ((saveData.streak || 0) < config.target) {
                break;
            }
            saveData.level++;
            this.triggerAchievement(groupId, saveData.level);
        }
    }

    private checkUpgrade(groupId: number, saveData: AchievementSaveData, isDaily: boolean = false): void {
        while (true) {
            const config = AchievementConfigManager.getNextConfig(groupId, saveData.level);
            if (!config) {
                break;
            }
            const currentProgress = isDaily ? saveData.dailyProgress : saveData.progress;
            if (currentProgress < config.target) {
                break;
            }
            if (isDaily) {
                saveData.dailyProgress -= config.target;
            } else {
                saveData.progress -= config.target;
            }
            saveData.level++;
            this.triggerAchievement(groupId, saveData.level);
        }
    }

    public claim(groupId: number, parentNode: any): boolean {
        const saveData = this.getSave(groupId);
        if (saveData.claimedLevel >= saveData.level) {
            return false;
        }

        saveData.claimedLevel++;
        const config = AchievementConfigManager.getConfig(groupId, saveData.claimedLevel);
        this.giveReward(config, parentNode);
        this.addTitleRecord(config);
        if (AchievementConfigManager.getType(groupId) === AchievementType.WIN_STREAK) {
            saveData.streak = 0;
        }
        this.saveToLocal(true);
        return true;
    }

    public hasRedPoint(): boolean {
        for (const key in this.save) {
            if (key === "titles") {
                continue;
            }
            const saveData = this.save[key] as AchievementSaveData;
            if (saveData.level > saveData.claimedLevel) {
                return true;
            }
        }
        return false;
    }

    public hasRedPointByGroup(groupId: number): boolean {
        const saveData = this.getSave(groupId);
        return saveData.level > saveData.claimedLevel;
    }

    private triggerAchievement(groupId: number, level: number): void {
        if (DirectPlayUtil.isDirectPlay) {
            return;
        }

        console.log("达成成就", groupId, level);
        const config = AchievementConfigManager.getConfig(groupId, level);
        if (config) {
            EventManager.emit(`${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.TriggerAchievement}`, config);
        }
    }

    private addTitleRecord(config: any): void {
        if (!config) {
            return;
        }

        const record: TitleRecord = {
            id: config.id,
            groupId: config.groupId,
            level: config.level,
            time: Date.now()
        };
        debugger
        this.save.titles.push(record);
    }

    private saveToLocal(needSaveToNet: boolean): void {
        this.recorder.Data = this.save;
        this.recorder.Save();
        if (needSaveToNet) {
            EventManager.emit(`${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.WantSaveRecordToNet}`, [false]);
        }
    }

    private giveReward(config: any, parentNode: any): void {
        if (!config) {
            return;
        }

        const rewardIds: number[] = config.rewardIds;
        const rewardNums: number[] = config.rewardNums;
        this._animationCount = rewardIds.length;

        for (let i = 0; i < rewardIds.length; i++) {
            const rewardId = rewardIds[i];
            if (SDKInstance.isGooglePlayNative() && rewardId === ItemID.Line) {
                continue;
            }

            const amount = rewardNums[i] != null ? rewardNums[i] : 1;
            let targetNode = null;
            if (parentNode) {
                targetNode = parentNode.children[i];
            }
            if (!targetNode) {
                targetNode = UILayerManager.instance.UILayer;
            }

            if (rewardId === ItemID.GOLD) {
                FlyEffectManager.instance.playFlyCoins(amount, targetNode.worldPosition, () => {
                    EventManager.emit(`${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.WantAddGold}`, amount, false);
                    this._animationCount--;
                    this.animComplete();
                });
            } else if (rewardId === ItemID.HEART || rewardId === ItemID.InfiniteHeart) {
                FlyEffectManager.instance.playFlyHearts(amount, targetNode.worldPosition, targetNode.scale, () => {
                    if (rewardId === ItemID.InfiniteHeart) {
                        EventManager.emit(`${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.SetHeartInfinite}`, amount);
                    } else {
                        EventManager.emit(`${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.WantAddHeart}`, amount, true, HeartSource.Other);
                    }
                    this._animationCount--;
                    this.animComplete();
                });
            } else if (targetNode.children[0]) {
                EventManager.emit(`${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.WantAddItem}`, [rewardId, amount], false);
                FlyEffectManager.instance.playFlyGoods(rewardId, amount, targetNode.worldPosition, {
                    flyNode: targetNode.children[0],
                    targetNode: UILayerManager.instance.mainUnSelectTab,
                    callback: () => {
                        this._animationCount--;
                        this.animComplete();
                    }
                });
            } else {
                EventManager.emit(`${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.WantAddItem}`, [rewardId, amount], true);
                this._animationCount--;
                this.animComplete();
            }
        }
    }

    private animComplete(): void {
        if (this._animationCount <= 0) {
            EventManager.emit(`${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.WantSaveRecordToNet}`, [false]);
        }
    }

    public getAchievementList(): AchievementListEntry[] {
        const result: AchievementListEntry[] = [];
        const allGroups = AchievementConfigManager.getAllGroups();

        for (const group of allGroups) {
            const groupId = group.groupId;
            const saveData = this.getSave(groupId);
            const currentLevel = saveData.level;
            const claimedLevel = saveData.claimedLevel;
            const nextLevel = claimedLevel + 1;
            const config = AchievementConfigManager.getConfig(groupId, nextLevel);

            if (config) {
                this.refreshDailyIfNeeded(config.type, saveData);
                let currentProgress = 0;
                switch (config.type) {
                    case AchievementType.LEVEL_COMPLETE:
                    case AchievementType.RESCUE_COMPLETE:
                        currentProgress = saveData.dailyProgress || 0;
                        break;
                    case AchievementType.WIN_STREAK:
                        currentProgress = saveData.streak || 0;
                        break;
                    default:
                        currentProgress = saveData.progress || 0;
                }

                const isCompleted = currentLevel >= nextLevel;
                const displayProgress = isCompleted ? config.target : Math.min(currentProgress, config.target);

                result.push({
                    groupId: groupId,
                    name: config.name,
                    level: currentLevel,
                    claimedLevel: claimedLevel,
                    curProgress: displayProgress,
                    target: config.target,
                    desc: I18nManager.t(config.desc, config.target),
                    canClaim: isCompleted,
                    isMax: false,
                    rewardIds: config.rewardIds,
                    rewardNums: config.rewardNums
                });
            } else {
                result.push({
                    groupId: groupId,
                    name: group.name,
                    level: currentLevel,
                    claimedLevel: claimedLevel,
                    curProgress: 1,
                    target: 1,
                    desc: "",
                    canClaim: false,
                    isMax: true,
                    rewardIds: [],
                    rewardNums: []
                });
            }
        }
        return result;
    }

    private refreshDailyIfNeeded(type: AchievementType, saveData: AchievementSaveData): void {
        const currentDay = this.getDay();
        if ((type === AchievementType.LEVEL_COMPLETE || type === AchievementType.RESCUE_COMPLETE) && saveData.lastUpdateDay !== currentDay) {
            saveData.dailyProgress = 0;
            saveData.lastUpdateDay = currentDay;
        }
    }

    public getTitleList(): TitleRecord[] {
        return (this.save.titles || []).slice().sort((a: TitleRecord, b: TitleRecord) => {
            if (a.groupId !== b.groupId) {
                return a.groupId - b.groupId;
            }
            return a.level - b.level;
        });
    }

    public format(template: string, ...args: any[]): string {
        return template.replace(/\{(\d+)\}/g, (match, index) => {
            return args[index] !== undefined ? args[index] : match;
        });
    }

    public now(): number {
        return Date.now() + this.debugOffset;
    }

    public getDay(): number {
        return Math.floor(this.now() / 86400000);
    }

    public addHours(hours: number): void {
        this.debugOffset += 3600 * hours * 1000;
    }

    public addDays(days: number): void {
        this.debugOffset += 86400000 * days;
    }

    public reset(): void {
        this.debugOffset = 0;
    }
}