import { _decorator, Component } from 'cc';
import { Goods } from './Goods';
import { ListItem } from './ListItem';

const { ccclass, property } = _decorator;

@ccclass('GoodsListItem')
export class GoodsListItem extends ListItem {
    @property(Goods)
    public goods: Goods | null = null;

    constructor() {
        super();
    }

    public setData(data: any[], index: number): void {
        if (this.goods) {
            this.goods.setData(data[0], data[1]);
        }
    }
}