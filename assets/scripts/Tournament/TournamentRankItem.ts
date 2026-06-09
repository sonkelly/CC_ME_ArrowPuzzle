import { _decorator, Component, Node, Sprite, Label, tween } from 'cc';
import { UIUtils } from './../Utils/UIUtils';
import { Goods } from './../Goods';
import { BaseDataManager } from './../BaseDataManager';
import { I18nManager } from './../I18nManager';

const { ccclass, property } = _decorator;

@ccclass('TournamentRankItem')
export class TournamentRankItem extends Component {
    @property(Node)
    selfBg: Node = null;

    @property([Node])
    rankBg: Node[] = [];

    @property(Sprite)
    avatar: Sprite = null;

    @property(Label)
    lbRank: Label = null;

    @property(Label)
    lbName: Label = null;

    @property(Label)
    lbScore: Label = null;

    @property(Goods)
    goods: Goods = null;

    @property(Node)
    waitNode: Node = null;

    data: any = undefined;

    init(data: any, rank: number, reward: any, isSelf: boolean): void {
        this.data = data;

        if (!isSelf) {
            const isCurrentPlayer = (data.uid ?? data.openid) === BaseDataManager.uuid;
            this.selfBg.active = isCurrentPlayer;

            if (isCurrentPlayer) {
                UIUtils.setPlayerAvatarIcon(this.avatar, BaseDataManager.userAvatar);
                this.lbName.string = BaseDataManager.nickName;
            } else {
                UIUtils.setPlayerAvatarIcon(this.avatar, data.avatar);
                this.lbName.string = data.name;
            }
        }

        this.lbScore.string = I18nManager.t("Score: {0}", data.score);

        if (rank <= 3) {
            this.lbRank.node.active = false;
            this.rankBg.forEach((bg, index) => {
                bg.active = index === rank - 1;
            });
        } else {
            this.lbRank.node.active = true;
            this.rankBg.forEach((bg) => {
                bg.active = false;
            });
        }

        this.lbRank.string = rank.toString();

        if (reward) {
            this.goods.node.active = true;
            const count = reward.Number ?? reward.Num;
            this.goods.setData(reward.CfgId, count);
        } else {
            this.goods.node.active = false;
        }
    }

    showWaitNode(): void {
        this.waitNode.active = true;
        tween(this.waitNode)
            .by(1, { angle: 360 })
            .repeatForever()
            .start();
    }

    hideWaitNode(): void {
        this.waitNode.active = false;
    }
}