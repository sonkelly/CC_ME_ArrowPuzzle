import { _decorator } from "cc";
import { TimeUtils } from "./../Utils/TimeUtils";
import { DataRecorder } from "./../DataRecorder";
import { RecordUtils } from "./../Utils/RecordUtils";

export enum RewardItemUIState {
    RECEIVED = 0,
    CAN_GET = 1,
    UNRECEIVED = 2
}

export interface IDailyRewardsData {
    lastGetYMD: number;
    getTimes: number;
}

export class DailyRewardsRecorder extends DataRecorder {
    public Data: IDailyRewardsData = {
        lastGetYMD: 0,
        getTimes: 0
    };

    public RecordName(): string {
        return "DailyRewardDataRecorder";
    }

    public GetCacheName(): string {
        return RecordUtils.NeedEncryptSave() 
            ? "3a1ee7f9-ca99-4cc9-b84e-deb95fdbd348" 
            : "__DAILY_REWARDS__";
    }

    public GetData(): IDailyRewardsData {
        return this.Data;
    }

    public SetData(data: IDailyRewardsData | null): void {
        if (data) {
            this.Data = data;
        } else {
            this.Reset();
        }
    }

    public Reset(): void {
        this.Data.lastGetYMD = 0;
        this.Data.getTimes = 0;
    }

    public getReward(): void {
        this.Data.getTimes += 1;
        this.Data.lastGetYMD = TimeUtils.getYMD();
        this.Save();
    }

    public getHasGetTimes(): number {
        return this.Data.getTimes;
    }

    public canGetReward(): boolean {
        if (this.Data.getTimes >= 7) {
            return false;
        }
        const currentYMD = TimeUtils.getYMD();
        return this.Data.lastGetYMD !== currentYMD;
    }
}