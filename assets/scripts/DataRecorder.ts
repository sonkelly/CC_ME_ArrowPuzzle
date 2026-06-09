import { GameRecord } from "./GameRecord";
import { RecordUtils } from "./Utils/RecordUtils";

export class DataRecorder {
    public Update(): void {
        this.OnUpdate();
    }

    public TurnNewDay(): void {
        this.OnNewDay();
    }

    public Save(): void {
        GameRecord.GetInstance().FlagRecordChange();
        RecordUtils.SaveRecord(this.GetCacheName(), this.GetData());
    }

    public Load(): void {
        const data = RecordUtils.LoadRecord(this.GetCacheName());
        if (data == null) {
            this.Reset();
            console.log(this.RecordName() + " 缺失，进行数据重置");
        } else {
            this.SetData(data);
        }
    }

    protected OnUpdate(): void {
        // Override in subclass
    }

    protected OnNewDay(): void {
        // Override in subclass
    }

    protected GetCacheName(): string {
        // Override in subclass
        return "";
    }

    protected GetData(): any {
        // Override in subclass
        return null;
    }

    protected SetData(data: any): void {
        // Override in subclass
    }

    protected Reset(): void {
        // Override in subclass
    }

    protected RecordName(): string {
        // Override in subclass
        return "";
    }
}