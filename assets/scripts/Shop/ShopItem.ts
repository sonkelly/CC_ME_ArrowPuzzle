import { _decorator, Component, Node, Label, instantiate } from 'cc';
import { PayType } from './../GlobalEnum';
import { ShopDataManager } from './../Shop/ShopDataManager';
import { AudioUtils } from './../Utils/AudioUtils';
import { Goods } from './../Goods';
import { GameRecord } from './../GameRecord';
import { I18nManager } from './../I18nManager';

const { ccclass, property } = _decorator;

@ccclass('ShopItem')
export class ShopItem extends Component {
    @property(Node)
    public goodsLayout: Node = null;

    @property(Node)
    public goods: Node = null;

    @property(Node)
    public btnBuy: Node = null;

    @property(Label)
    public lbPrice: Label = null;

    @property(Node)
    public purchased: Node = null;

    @property(Node)
    public btnCoin: Node = null;

    @property(Label)
    public lbCoin: Label = null;

    @property(Node)
    public btnVideo: Node = null;

    @property(Label)
    public lbVideo: Label = null;

    @property(Label)
    public lbDesc: Label = null;

    public config: any = undefined;

    public init(config: any): void {
        this.config = config;
        this.btnBuy.active = config.PriceType === PayType.Currency;
        this.btnCoin.active = config.PriceType === PayType.Coin;
        this.btnVideo.active = config.PriceType === PayType.Video;

        if (this.purchased) {
            this.purchased.active = false;
        }

        this.lbCoin.string = config.Price.toString();

        const purchaseInfo = ShopDataManager.instance.getPurchaseInfo(config.ID.toString());
        this.lbPrice.string = purchaseInfo ? purchaseInfo.price : "$" + config.Price;

        if (!SDKInstance.isFacebookMiniGame()) {
            this.updateVideoUI(config.ID);
        }

        for (let i = 0; i < config.DropIds.length; i++) {
            if (i === 0) {
                this.goods.getComponent(Goods).setData(config.DropIds[i], config.DropNums[i], true);
            } else {
                const newGoods = instantiate(this.goods);
                newGoods.parent = this.goodsLayout;
                newGoods.getComponent(Goods).setData(config.DropIds[i], config.DropNums[i], true);
            }
        }

        if (config.Type === 2 || config.Type === 3) {
            this.lbDesc.string = I18nManager.t(config.Desc);
        } else {
            this.lbDesc.string = "";
        }

        this.updateNoAdsUI();
    }

    public updateNoAdsUI(): void {
        if (this.config.Type === 2 && this.purchased) {
            const baseRecorder = GameRecord.GetInstance().BaseRecorder;
            this.purchased.active = baseRecorder.Data.PurchasedNoAds;
        }
    }

    public onBuyClick(): void {
        AudioUtils.btn_click_sound();
        ShopDataManager.instance.buy(this.config.ID.toString(), this.goodsLayout);
    }

    public onCoinClick(): void {
        AudioUtils.btn_click_sound();
        ShopDataManager.instance.buyByCoin(this.config, this.goodsLayout);
    }

    public onVideoClick(): void {
        AudioUtils.btn_click_sound();
        ShopDataManager.instance.buyByVideo(this.config, this.goodsLayout);
    }

    public updateVideoUI(goodsId: number): void {
        if (this.config.ID === goodsId) {
            const shopGoodsInfo = GameRecord.GetInstance().ShopDataRecorder.getShopGoodsInfo(this.config.ID);
            const videoNum = shopGoodsInfo ? shopGoodsInfo.VideoNum : 0;
            this.lbVideo.string = "(" + videoNum + "/" + this.config.Price + ")";
        }
    }
}