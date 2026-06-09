import { _decorator, Component } from "cc";
import { JsonClassStorage } from "./../JsonClass";
import { DataRecorder } from "./../DataRecorder";
import { RecordUtils } from "./../Utils/RecordUtils";

interface IShopGoodsInfo {
    Id: number;
    Unlock: boolean;
    VideoNum: number;
}

interface IShopData {
    ArrUnlockGoodsInfo: IShopGoodsInfo[];
}

export class ShopDataRecorder extends DataRecorder {
    private Data: IShopData = new (class implements IShopData {
        ArrUnlockGoodsInfo: IShopGoodsInfo[] = [];
    })();

    public RecordName(): string {
        return "shopRecord";
    }

    public GetCacheName(): string {
        return RecordUtils.NeedEncryptSave() ? "e6d2b2fc-6f26-4dcb-ab62-e6462da8a360" : "__SHOP_DATA__";
    }

    public GetData(): IShopData {
        return this.Data;
    }

    public SetData(data: IShopData | null): void {
        if (data) {
            this.Data = data;
        } else {
            this.Reset();
        }
        if (this.Data.ArrUnlockGoodsInfo == null) {
            this.Data.ArrUnlockGoodsInfo = [];
        }
    }

    public Reset(): void {
        this.Data.ArrUnlockGoodsInfo = [];
    }

    public ShopVideoSee(goodsId: number, videoNum: number): boolean {
        const config = JsonClassStorage.instance.getOneJson("PayConfigWx", "ID", goodsId);
        let goodsInfo = this.getShopGoodsInfo(goodsId);
        
        if (goodsInfo == null) {
            goodsInfo = { Id: goodsId, Unlock: false, VideoNum: videoNum };
            this.Data.ArrUnlockGoodsInfo.push(goodsInfo);
        } else {
            goodsInfo.VideoNum += videoNum;
        }
        
        if (goodsInfo.VideoNum >= config.Price) {
            goodsInfo.Unlock = true;
        } else {
            this.Save();
        }
        
        return goodsInfo.Unlock;
    }

    public ShopVideoReset(goodsId: number): void {
        const goodsInfo = this.getShopGoodsInfo(goodsId);
        if (goodsInfo != null) {
            goodsInfo.VideoNum = 0;
            goodsInfo.Unlock = false;
            this.Save();
        }
    }

    private getShopGoodsInfo(goodsId: number): IShopGoodsInfo | undefined {
        return this.Data.ArrUnlockGoodsInfo.find((info) => info.Id === goodsId);
    }
}