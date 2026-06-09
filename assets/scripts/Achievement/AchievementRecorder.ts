import { DataRecorder } from "./../DataRecorder";
import { RecordUtils } from "./../Utils/RecordUtils";

interface IAchievementData {
    progress: number;
    level: number;
    claimedLevel: number;
    lastUpdateDay: number;
    dailyProgress: number;
    streak: number;
    lastPlayDay: number;
}

class IAchievementDataMap {
    titles = [];
}

export class AchievementRecorder extends DataRecorder {
    private Data: IAchievementDataMap = new IAchievementDataMap();

    public RecordName(): string {
        return "achievementRecord";
    }

    public GetCacheName(): string {
        return RecordUtils.NeedEncryptSave() ? "731bb6e5-de79-4333-9df3-f8692bd39645" : "__ACHIEVEMENT_DATA__";
    }

    public GetData(): IAchievementDataMap {
        return this.Data;
    }

    public SetData(data: IAchievementDataMap | null): void {
        if (data) {
            this.Data = data;
        } else {
            this.Reset();
        }
    }

    public Reset(): void {
        this.Data = new IAchievementDataMap();
    }

    public OnNewDay(): void {
        // No implementation needed
    }
}