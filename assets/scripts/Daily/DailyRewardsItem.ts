import { _decorator, Component, Sprite, SpriteFrame, Node, Label, instantiate } from 'cc';
import { Goods } from './../Goods';
import { GameRecord } from './../GameRecord';
import { I18nManager } from './../I18nManager';

const { ccclass, property } = _decorator;

@ccclass('DailyRewardsItem')
export class DailyRewardsItem extends Component {
    @property(Sprite)
    public bg: Sprite = null;

    @property(SpriteFrame)
    public normalFrame: SpriteFrame = null;

    @property(SpriteFrame)
    public completeFrame: SpriteFrame = null;

    @property(Node)
    public goodsLayout: Node = null;

    @property(Node)
    public goods: Node = null;

    @property(Node)
    public gou: Node = null;

    @property(Label)
    public lbaDay: Label = null;

    private _cfg: any = undefined;

    public init(cfg: any): void {
        this._cfg = cfg;
        this.lbaDay.string = I18nManager.t("Day {0}", cfg.id);

        for (let i = 0; i < cfg.goodsId.length; i++) {
            if (i === 0) {
                this.goods.getComponent(Goods).setData(cfg.goodsId[i], cfg.goodsNum[i]);
            } else {
                const newGoods = instantiate(this.goods);
                newGoods.parent = this.goodsLayout;
                newGoods.getComponent(Goods).setData(cfg.goodsId[i], cfg.goodsNum[i]);
            }
        }

        this.updateState();
    }

    public updateState(): void {
        const recorder = GameRecord.GetInstance().DailyRewardsRecorder;
        const hasGetTimes = recorder.getHasGetTimes();
        const canGetReward = recorder.canGetReward();

        if (this._cfg.id - 1 < hasGetTimes) {
            this.bg.spriteFrame = this.completeFrame;
            this.gou.active = true;
        } else if (this._cfg.id - 1 === hasGetTimes && canGetReward) {
            this.bg.spriteFrame = this.completeFrame;
            this.gou.active = false;
        } else {
            this.bg.spriteFrame = this.normalFrame;
            this.gou.active = false;
        }
    }
}