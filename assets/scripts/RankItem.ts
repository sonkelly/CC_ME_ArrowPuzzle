import { _decorator, Component, Node, Sprite, Label } from 'cc';
import { BaseDataManager } from './BaseDataManager';
import { TierManager } from './TierManager';
import { I18nManager, Language } from './I18nManager';
import { UIUtils } from './Utils/UIUtils';

const { ccclass, property } = _decorator;

@ccclass('RankItem')
export class RankItem extends Component {
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

    @property(Sprite)
    public tierIcon: Sprite = null;

    @property(Label)
    public lbTier: Label = null;

    @property(Node)
    public waitNode: Node = null;

    public data: any = undefined;

    public init(data: any, score: number | null, isSelf: boolean, isLocal: boolean): void {
        this.data = data;
        this.witheBg.active = !isSelf;
        this.greenBg.active = isSelf;

        if (!isLocal) {
            if (isSelf) {
                UIUtils.setPlayerAvatarIcon(this.avatar, BaseDataManager.userAvatar);
                this.lbName.string = BaseDataManager.nickName;
            } else {
                UIUtils.setPlayerAvatarIcon(this.avatar, data.extendsInfo.avatar);
                this.lbName.string = data.extendsInfo.nickname;
            }
        }

        this.lbScore.string = I18nManager.t("Level:{0}", data.scores[0]);

        let titleId = 0;
        if (data.extendsInfo.title && data.extendsInfo.title > 0) {
            titleId = data.extendsInfo.title;
        }
        this.updateMyRanking(score, null, titleId);
    }

    public updateTier(tierId: number): void {
        if (tierId > 0) {
            const tierConfig = TierManager.instance.getCfgByTier(tierId);
            if (tierConfig) {
                this.tierIcon.node.active = true;
                this.lbTier.node.active = true;

                const isEnglish = I18nManager.getLanguage() === Language.EN;
                UIUtils.setTierIcon(this.tierIcon, tierConfig.icon);
                this.lbTier.string = isEnglish ? tierConfig.enName : tierConfig.name;
            }
        } else {
            this.tierIcon.node.active = false;
            this.lbTier.node.active = false;
        }
    }

    public updateMyRanking(rank: number | null, score: number | null, tierId: number): void {
        this.updateTier(tierId);

        if (score !== null) {
            this.lbScore.string = I18nManager.t("Level:{0}", score);
        }

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