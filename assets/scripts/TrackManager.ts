import { EasDataSDK } from './EasDataSDK';
import { AssDataManager } from './AssDataManager';
import { BaseDataManager } from './BaseDataManager';

// Khai báo các interface cho dữ liệu
interface TrackData {
    installDay: number;
    todayPlayTime: number;
    todayLevelCount: number;
    lastLoginDay: number;
    reported: { [key: string]: boolean };
    updateTime: number;
}

declare const SDKInstance: any;

declare const FBInstant: any;

export class TrackManager {
    private static _instance: TrackManager;
    
    private data: TrackData | undefined;
    private timer: number | null = null;
    private autoSaveTimer: number | null = null;

    public static get instance(): TrackManager {
        if (!this._instance) {
            this._instance = new TrackManager();
        }
        return this._instance;
    }

    public async init(): Promise<void> {
        if (SDKInstance.isFacebookMiniGame()) {
            const currentDay = this.getDay();
            const loadedData = await this.load();
            
            if (loadedData) {
                this.data = loadedData;
            } else {
                const isNewUser = BaseDataManager.isNewUser;
                this.data = {
                    installDay: isNewUser ? currentDay : -1,
                    todayPlayTime: 0,
                    todayLevelCount: 0,
                    lastLoginDay: currentDay,
                    reported: {},
                    updateTime: Date.now()
                };
                console.log("Track init new:", isNewUser);
            }
            
            this.checkDailyReset();
            this.startTimer();
            this.startAutoSave();
        }
    }

    private startTimer(): void {
        if (this.isFirstDay() && !this.timer && !this.isReported("event_15mins")) {
            this.timer = setInterval(() => {
                if (this.data) {
                    this.data.todayPlayTime += 1;
                    this.checkTimeEvents();
                }
            }, 1000);
        }
    }

    private startAutoSave(): void {
        if (this.isFirstDay() && !this.autoSaveTimer && !this.isReported("event_15mins")) {
            this.autoSaveTimer = setInterval(() => {
                if (!this.isReported("event_15mins")) {
                    this.save();
                }
            }, 60000);
        }
    }

    public onLevelComplete(): void {
        if (SDKInstance.isFacebookMiniGame() && this.data) {
            this.data.todayLevelCount++;
            this.checkLevelEvents();
            this.save();
        }
    }

    private checkTimeEvents(): void {
        if (this.isFirstDay() && this.data) {
            const playTime = this.data.todayPlayTime;
            
            if (playTime >= 600 && !this.isReported("event_10mins")) {
                this.report("event_10mins");
            }
            if (playTime >= 900 && !this.isReported("event_15mins")) {
                this.report("event_15mins");
            }
        }
    }

    private checkLevelEvents(): void {
        if (this.isFirstDay() && this.data) {
            const levelCount = this.data.todayLevelCount;
            
            if (levelCount >= 13 && !this.isReported("event_13levels")) {
                this.report("event_13levels");
            }
            if (levelCount >= 20 && !this.isReported("event_20levels")) {
                this.report("event_20levels");
            }
        }
    }

    private report(eventName: string): void {
        console.log("上报事件:", eventName);
        
        if (this.data) {
            this.data.reported[eventName] = true;
        }
        
        const result = FBInstant.logEvent(eventName);
        console.log("logged: ", result);
        
        switch (eventName) {
            case "event_10mins":
                EasDataSDK.trackEvent("ad_placement", { event_10mins: 10 });
                break;
            case "event_15mins":
                EasDataSDK.trackEvent("ad_placement", { event_15mins: 15 });
                break;
            case "event_13levels":
                EasDataSDK.trackEvent("ad_placement", { event_13levels: 13 });
                break;
            case "event_20levels":
                EasDataSDK.trackEvent("ad_placement", { event_20levels: 20 });
                break;
        }
        
        this.save();
    }

    private isReported(eventName: string): boolean {
        return this.data?.reported[eventName] ?? false;
    }

    private isFirstDay(): boolean {
        return this.data?.installDay === this.getDay();
    }

    private checkDailyReset(): void {
        if (this.data) {
            const currentDay = this.getDay();
            if (this.data.lastLoginDay !== currentDay) {
                this.data.lastLoginDay = currentDay;
                this.data.todayPlayTime = 0;
                this.data.todayLevelCount = 0;
                this.save();
            }
        }
    }

    private getDay(): number {
        return Math.floor(Date.now() / 86400000);
    }

    private save(): void {
        if (this.data) {
            this.data.updateTime = Date.now();
            AssDataManager.instance.setTrackDataSync(this.data);
        }
    }

    private async load(): Promise<TrackData | null> {
        const cloudData = await AssDataManager.instance.downloadTrackData();
        const cloudArchive = cloudData?.data?.archive?.a2;
        const localArchive = AssDataManager.instance.getLocalArchiveSync()?.a2;
        
        console.log("云端数据:", cloudArchive);
        console.log("本地数据:", localArchive);
        
        if (!cloudArchive && !localArchive) {
            return null;
        }
        
        if (cloudArchive && !localArchive) {
            return cloudArchive;
        }
        
        if (!cloudArchive && localArchive) {
            return localArchive;
        }
        
        const cloudTime = cloudArchive?.updateTime || 0;
        const localTime = localArchive?.updateTime || 0;
        const finalData = cloudTime >= localTime ? cloudArchive : localArchive;
        
        console.log("最终使用:", finalData === cloudArchive ? "云端" : "本地");
        return finalData;
    }
}