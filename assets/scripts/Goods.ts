import { _decorator, Component, Sprite, Label } from 'cc';
import { UIUtils } from './Utils/UIUtils';
import { JsonClassStorage } from './JsonClass';
import { ItemID } from './GlobalEnum';
import { I18nManager } from './I18nManager';

const { ccclass, property } = _decorator;

@ccclass('Goods')
export class Goods extends Component {
    @property(Sprite)
    public icon: Sprite = null;

    @property(Label)
    public num: Label = null;

    @property
    public preFix: string = '';

    public goodsId: number;
    public goodsNum: number;

    public setData(id: number, num: number, isSpecial: boolean = false): void {
        this.goodsId = id;
        this.goodsNum = num;

        const itemData = JsonClassStorage.instance.getConfig('ItemData', id);
        if (itemData) {
            if (isSpecial && id === ItemID.Hint) {
                UIUtils.setItemIcon(this.icon, 'hint2');
            } else {
                UIUtils.setItemIcon(this.icon, itemData.Icon);
            }
        }

        if (itemData.ItemId === ItemID.InfiniteHeart) {
            this.num.string = I18nManager.t('{0}min', Math.floor(itemData.ExtraParam * num / 60));
        } else if (itemData.ItemId === ItemID.NoAds) {
            this.num.string = '';
        } else {
            this.num.string = this.preFix + num;
        }
    }

    public setData2(id: number, num: number): void {
        this.goodsId = id;
        this.goodsNum = num;

        const itemData = JsonClassStorage.instance.getConfig('ItemData', id);
        if (itemData) {
            if (itemData.ItemId === 20001) {
                UIUtils.setItemIcon(this.icon, 'dj3');
            } else {
                UIUtils.setItemIcon(this.icon, itemData.Icon);
            }
        }

        if (itemData.ItemId === ItemID.InfiniteHeart) {
            this.num.string = I18nManager.t('{0}min', Math.floor(itemData.ExtraParam * num / 60));
        } else if (itemData.ItemId === ItemID.NoAds) {
            this.num.string = '';
        } else {
            this.num.string = this.preFix + num;
        }
    }
}