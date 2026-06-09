import { I18nManager, Language } from "./I18nManager";
import { JsonClassStorage } from "./JsonClass";
import { GameRecord } from "./GameRecord";

interface TierConfig {
    tier: number;
    need: number;
    name?: string;
    enName?: string;
    icon?: string;
}

interface TierData {
    tier: number;
    progress: number;
}

interface ViewData {
    name: string;
    tier: number;
    icon: string;
    progress: number;
    target: number;
    percent: number;
    nextName: string;
    isMax: boolean;
}

export class TierManager {
    private static _instance: TierManager;
    
    private cfgList: TierConfig[] = [];
    private data: TierData | undefined;

    static get instance(): TierManager {
        if (!this._instance) {
            this._instance = new TierManager();
        }
        return this._instance;
    }

    init(): void {
        this.cfgList = JsonClassStorage.instance.getTableJson("TierConfig").json;
        const recordData = GameRecord.GetInstance().BaseRecorder.Data;
        if (!recordData.TierData) {
            recordData.TierData = this.calcTierByHistory(recordData.CurLevel - 1 || 0);
        }
        this.data = recordData.TierData;
    }

    private calcTierByHistory(level: number): TierData {
        let remainingLevel = level;
        let progress = 0;
        let tier = 0;

        for (const config of this.cfgList) {
            if (remainingLevel < config.need) {
                progress = remainingLevel;
                break;
            }
            remainingLevel -= config.need;
            tier = config.tier;
        }

        return {
            tier: tier,
            progress: progress
        };
    }

    onLevelComplete(completedLevels: number = 1): void {
        if (this.isMaxTier()) {
            return;
        }

        this.data!.progress += completedLevels;

        while (true) {
            const nextConfig = this.getNext();
            if (!nextConfig) {
                break;
            }
            if (this.data!.progress < nextConfig.need) {
                break;
            }
            this.data!.progress -= nextConfig.need;
            this.data!.tier++;
        }

        this.save();
    }

    getCurrent(): TierConfig | undefined {
        return this.cfgList.find(config => config.tier === this.data!.tier);
    }

    getNext(): TierConfig | undefined {
        return this.cfgList.find(config => config.tier === this.data!.tier + 1);
    }

    isMaxTier(): boolean {
        const lastConfig = this.cfgList[this.cfgList.length - 1];
        return this.data!.tier >= lastConfig.tier;
    }

    getCfgByTier(tier: number): TierConfig | undefined {
        return this.cfgList.find(config => config.tier === tier);
    }

    getViewData(): ViewData {
        const currentConfig = this.getCurrent();
        const nextConfig = this.getNext();
        const fallbackConfig = currentConfig || this.cfgList[0];
        const isEnglish = I18nManager.getLanguage() === Language.EN;
        
        const getName = (config: TierConfig | undefined): string => {
            if (config) {
                return isEnglish ? config.enName! : config.name!;
            }
            return isEnglish ? "Unranked" : "未定段";
        };

        const isMax = this.isMaxTier();

        return {
            name: getName(currentConfig),
            tier: this.data!.tier,
            icon: fallbackConfig?.icon || "xzz1",
            progress: isMax ? fallbackConfig.need : this.data!.progress,
            target: isMax ? fallbackConfig.need : (nextConfig?.need || fallbackConfig.need),
            percent: isMax ? 1 : (nextConfig ? this.data!.progress / nextConfig.need : 0),
            nextName: isMax ? (isEnglish ? "Max" : "已到达最高段位!") : getName(nextConfig),
            isMax: isMax
        };
    }

    save(): void {
        GameRecord.GetInstance().BaseRecorder.Save();
    }
}