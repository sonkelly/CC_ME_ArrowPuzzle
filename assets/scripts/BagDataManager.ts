import { GameRecord } from "./GameRecord";

export class BagDataManager {
    public static getItemNumByItemCfgId(cfgId: number): number {
        const itemInfo = GameRecord.GetInstance().BagRecorder.Data.ArrItemInfo.find((item: any) => {
            return item.CfgId === cfgId;
        });
        return itemInfo == null ? 0 : itemInfo.Num;
    }
}