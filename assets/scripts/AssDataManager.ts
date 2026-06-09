import { BaseDataManager } from "./BaseDataManager";
import { GameRecord } from "./GameRecord";

export class AssDataManager {
    private _client: any = undefined;
    private _readyPromise: Promise<void> | null = null;
    private static _instance: AssDataManager;

    public static get instance(): AssDataManager {
        if (!AssDataManager._instance) {
            AssDataManager._instance = new AssDataManager();
        }
        return AssDataManager._instance;
    }

    public fineBoostReady(): boolean {
        if (typeof window === "undefined" || !window.FINEBOOST) {
            console.warn("[ASS] FINEBOOST not ready");
            return false;
        }
        return true;
    }

    public async createClient(): Promise<void> {
        if (!this.fineBoostReady()) {
            return;
        }

        const config = {
            isInland: false,
            bundleId: "com.arrows.FB",
            deviceId: BaseDataManager.uuid,
            timeout: 60000,
            debug: false,
            globalStorageFallbackEnabled: false,
            sessionSupport: false,
            enableAssetsArchive: false,
            isDevelopStage: false
        };

        const ASS = window.FINEBOOST.ASS;
        this._client = new ASS(config, (error: any) => {
            console.log("[ASS] errorCallback:", error);
        });
    }

    public async ready(): Promise<void> {
        if (this._readyPromise) {
            return this._readyPromise;
        }

        this._readyPromise = (async () => {
            await this.createClient();
            if (this._client) {
                await this._client.init();
                try {
                    await this._client.login();
                    console.log("[ASS] login success");
                } catch (error) {
                    console.log("[ASS] login failed → register");
                    await this._client.register();
                    console.log("[ASS] register success");
                }
            }
        })();

        return this._readyPromise;
    }

    public downloadArchive(): any {
        if (this._client) {
            return this._client.downloadArchive(["a1"]);
        }
    }

    public uploadArchive(archiveKeys: string[]): void {
        if (this._client) {
            this._client.uploadArchive(archiveKeys).then((result: any) => {
                console.log("[ASS] 同步本地存档到云端成功:", archiveKeys, result);
            }).catch((error: any) => {
                console.log("[ASS] 同步本地存档到云端失败:", archiveKeys, error);
            });
        }
    }

    public setLocalArchiveSync(): void {
        if (this._client) {
            const data = {
                a1: GameRecord.GetInstance().CollectNetSaveInfo()
            };
            const result = this._client.setLocalArchiveSync(data, true);
            console.log("[ASS] 保存本地存档:", result);
            if (result !== 0) {
                this.uploadArchive(["a1"]);
            }
        }
    }

    public getLocalArchiveSync(): any {
        if (this._client) {
            const data = this._client.getLocalArchiveSync((error: any) => {
                console.log("[ASS] 获取本地存档 error:", error);
            });
            console.log("[ASS] 获取本地存档:", data);
            return data || null;
        }
    }

    public downloadTrackData(): Promise<any> {
        if (!this._client) {
            return Promise.resolve(null);
        }
        return this._client.downloadArchive(["a2"]);
    }

    public setTrackDataSync(trackData: any): void {
        if (this._client) {
            const data = {
                a2: trackData
            };
            const result = this._client.setLocalArchiveSync(data, true);
            console.log("[ASS] 保存买量事件本地存档:", result);
            if (result !== 0) {
                this.uploadArchive(["a2"]);
            }
        }
    }
}