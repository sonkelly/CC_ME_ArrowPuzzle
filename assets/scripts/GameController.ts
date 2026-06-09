import { assetManager } from 'cc';
import { JsonClassStorage } from './JsonClass';
import { GameAssetManager } from './GameAssetManager';
import { Global } from './Global';
import { GameChannel } from './GameChannel';

interface SegmentRateRule {
    max: number;
    rate: number;
}

interface BaseConfig {
    ID: number;
    HardTimeRate: string;
    SuperHardTimeRate: string;
}

export class GameController {
    private static _instance: GameController | null = null;

    public is_ready: boolean = false;
    public is_pause: boolean = true;
    public baseCfg: BaseConfig | null = null;
    public hardRules: SegmentRateRule[] | undefined;
    public superHardRules: SegmentRateRule[] | undefined;

    public static get instance(): GameController {
        if (!GameController._instance) {
            GameController._instance = new GameController();
        }
        return GameController._instance;
    }

    public async init(): Promise<void> {
        if (!this.baseCfg) {
            if (Global.isUseLocalLevel()) {
                this.baseCfg = JsonClassStorage.instance.getOneJson("BaseConfig", "ID", 1);
            } else {
                this.baseCfg = await this.loadRemoteConfig("BaseConfig");
                if (!this.baseCfg) {
                    this.baseCfg = JsonClassStorage.instance.getOneJson("BaseConfig", "ID", 1);
                }
            }
            this.hardRules = this.parseSegmentRateConfig(this.baseCfg.HardTimeRate);
            this.superHardRules = this.parseSegmentRateConfig(this.baseCfg.SuperHardTimeRate);
        }
        this.reset();
    }

    private async loadRemoteConfig(configName: string): Promise<BaseConfig | null> {
        let baseUrl = "https://www.quduoduodata.top/ossfile/cocos/Arrow/";
        if (GameChannel.isCloneXJJ) {
            baseUrl = "https://www.quduoduodata.top/ossfile/cocos/Arrow_xjj/";
        }
        const url = baseUrl + "wx/config/BaseConfig.json?v=" + Date.now();

        if (GameAssetManager.remoteConfig.has(configName)) {
            return GameAssetManager.remoteConfig.get(configName);
        }

        return new Promise((resolve, reject) => {
            assetManager.loadRemote(url, (error: Error | null, asset: any) => {
                if (error) {
                    console.warn("配置: " + url + " 加载异常");
                    const localConfig = JsonClassStorage.instance.getOneJson("BaseConfig", "ID", 1);
                    resolve(localConfig);
                } else {
                    const config = asset.json.find((item: any) => item.ID === 1);
                    GameAssetManager.remoteConfig.set(configName, config);
                    console.log("加载远程BaseConfig:", config);
                    resolve(config);
                }
            });
        });
    }

    private parseSegmentRateConfig(configStr: string): SegmentRateRule[] {
        if (!configStr) {
            return [];
        }

        return configStr.split(";").map((segment: string) => {
            const parts = segment.split("|");
            const maxStr = parts[0];
            const rateStr = parts[1];
            const max = Number(maxStr);
            const rate = Number(rateStr);

            if (isNaN(max) || isNaN(rate)) {
                console.warn("分段系数配置解析失败：" + segment);
                return null;
            }

            return {
                max: max,
                rate: rate
            };
        }).filter(Boolean) as SegmentRateRule[];
    }

    public reset(): void {
        this.is_ready = false;
        this.is_pause = false;
    }
}