import { _decorator } from 'cc';

// Định nghĩa interface cho cấu hình thành tích
interface AchievementConfig {
    groupId: number;
    level: number;
    type: number;
    name: string;
    // Thêm các thuộc tính khác nếu cần
}

// Định nghĩa interface cho nhóm thành tích
interface AchievementGroup {
    groupId: number;
    name: string;
}

export class AchievementConfigManager {
    private static cfgMap: Map<number, AchievementConfig[]> = new Map();
    private static typeMap: Map<number, { groupId: number }[]> = new Map();
    private static configList: AchievementConfig[] = [];

    static init(configs: AchievementConfig[] = []): void {
        this.configList = configs;
        
        configs.forEach((config: AchievementConfig) => {
            // Xử lý cfgMap
            if (!this.cfgMap.has(config.groupId)) {
                this.cfgMap.set(config.groupId, []);
            }
            this.cfgMap.get(config.groupId)!.push(config);

            // Xử lý typeMap
            if (!this.typeMap.has(config.type)) {
                this.typeMap.set(config.type, []);
            }
            this.typeMap.get(config.type)!.push({
                groupId: config.groupId
            });
        });

        // Sắp xếp các cấu hình theo level trong mỗi group
        this.cfgMap.forEach((configs: AchievementConfig[]) => {
            configs.sort((a: AchievementConfig, b: AchievementConfig) => a.level - b.level);
        });
    }

    static getNextConfig(groupId: number, currentLevel: number): AchievementConfig | undefined {
        const groupConfigs = this.cfgMap.get(groupId);
        if (!groupConfigs) {
            return undefined;
        }
        return groupConfigs.find((config: AchievementConfig) => config.level === currentLevel + 1);
    }

    static getConfig(groupId: number, level: number): AchievementConfig | undefined {
        const groupConfigs = this.cfgMap.get(groupId);
        if (!groupConfigs) {
            return undefined;
        }
        return groupConfigs.find((config: AchievementConfig) => config.level === level);
    }

    static getType(groupId: number): number | undefined {
        const groupConfigs = this.cfgMap.get(groupId);
        if (!groupConfigs || groupConfigs.length === 0) {
            return undefined;
        }
        return groupConfigs[0].type;
    }

    static getGroupsByType(type: number): AchievementConfig[] {
        const resultMap: Map<number, AchievementConfig> = new Map();
        
        for (const config of this.configList) {
            if (config.type === type && !resultMap.has(config.groupId)) {
                resultMap.set(config.groupId, config);
            }
        }
        
        return Array.from(resultMap.values());
    }

    static getAllGroups(): AchievementGroup[] {
        const groupMap: Map<number, string> = new Map();
        
        for (const config of this.configList) {
            if (!groupMap.has(config.groupId)) {
                groupMap.set(config.groupId, config.name);
            }
        }
        
        return Array.from(groupMap.entries()).map(([groupId, name]) => ({
            groupId,
            name
        }));
    }
}