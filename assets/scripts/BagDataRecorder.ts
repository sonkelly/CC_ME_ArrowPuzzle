import { Utilsqdd } from "./Utils/Utilsqdd";
import { DataRecorder } from "./DataRecorder";
import { RecordUtils } from "./Utils/RecordUtils";

interface IBagItemInfo {
    Uid: number;
    CfgId: number;
    Num: number;
}

interface IBagData {
    ArrItemInfo: IBagItemInfo[];
}

export class BagDataRecorder extends DataRecorder {
    public Data: IBagData = new (class implements IBagData {
        ArrItemInfo: IBagItemInfo[] = [];
    })();

    public RecordName(): string {
        return "bagRecord";
    }

    public GetData(): IBagData {
        return this.Data;
    }

    public SetData(data: IBagData): void {
        this.Data = data;
        if (Utilsqdd.isNil(this.Data.ArrItemInfo)) {
            this.Data.ArrItemInfo = [];
        }
    }

    public Reset(): void {
        this.Data.ArrItemInfo = [];
    }

    public AddBagItem(cfgId: number, num: number): void {
        const itemInfo = this.getItemInfo(cfgId);
        if (itemInfo == null) {
            const newItem: IBagItemInfo = {
                Uid: RecordUtils.CalcNextUUID(),
                CfgId: cfgId,
                Num: num
            };
            this.Data.ArrItemInfo.push(newItem);
        } else {
            itemInfo.Num += num;
        }
        this.Save();
    }

    public ConsumeBagItem(cfgId: number, num: number): void {
        const itemInfo = this.getItemInfo(cfgId);
        if (itemInfo != null) {
            itemInfo.Num -= num;
            if (itemInfo.Num < 1) {
                this.Data.ArrItemInfo = this.Data.ArrItemInfo.filter(
                    (item) => item.Uid !== itemInfo.Uid
                );
            }
            this.Save();
        }
    }

    private getItemInfo(cfgId: number): IBagItemInfo | undefined {
        return this.Data.ArrItemInfo.find((item) => item.CfgId === cfgId);
    }

    public GetCacheName(): string {
        return RecordUtils.NeedEncryptSave() 
            ? "4f5a8489-49d9-411a-a686-3e5241011d79" 
            : "_BAG_";
    }
}