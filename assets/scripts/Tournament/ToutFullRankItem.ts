import { _decorator, Component, Node, Sprite, Label } from 'cc';
import { BaseDataManager } from './../BaseDataManager';
import { I18nManager } from './../I18nManager';
import { UIUtils } from './../Utils/UIUtils';

const { ccclass, property } = _decorator;

@ccclass('ToutFullRankItem')
export class ToutFullRankItem extends Component {
    @property(Node)
    public witheBg: Node = null;

    @property(Node)
    public greenBg: Node = null;

    @property([Node])
    public rankBg: Node[] = [];

    @property(Sprite)
    public avatar: Sprite = null;

    @property(Label)
    public lbRank: Label = null;

    @property(Label)
    public lbName: Label = null;

    @property(Label)
    public lbScore: Label = null;

    @property(Node)
    public waitNode: Node = null;

    public data: any = undefined;

    public init(data: any, rank: number, isMe: boolean): void {
        this.data = data;
        this.witheBg.active = !isMe;
        this.greenBg.active = isMe;

        if (isMe) {
            UIUtils.setPlayerAvatarIcon(this.avatar, BaseDataManager.userAvatar);
            this.lbName.string = BaseDataManager.nickName;
        } else {
            UIUtils.setPlayerAvatarIcon(this.avatar, data.avatar);
            this.lbName.string = data.name;
        }

        this.lbScore.string = I18nManager.t("Score: {0}", data.score);
        this.updateMyRanking(rank);
    }

    public updateMyRanking(rank: number): void {
        if (!rank) {
            this.lbRank.node.active = true;
            this.rankBg.forEach((bg: Node) => {
                bg.active = false;
            });
            this.lbRank.string = "100+";
            return;
        }

        if (typeof rank === "number" && rank <= 3) {
            this.lbRank.node.active = false;
            this.rankBg.forEach((bg: Node, index: number) => {
                bg.active = index === rank - 1;
            });
        } else {
            this.lbRank.node.active = true;
            this.rankBg.forEach((bg: Node) => {
                bg.active = false;
            });
        }

        this.lbRank.string = rank.toString();
    }
}