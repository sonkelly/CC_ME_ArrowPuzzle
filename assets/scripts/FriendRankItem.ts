import { _decorator, Component, Node, Sprite, Label } from 'cc';
import { BaseDataManager } from './BaseDataManager';
import { TierManager } from './TierManager';
import { I18nManager, Language } from './I18nManager';
import { UIUtils } from './Utils/UIUtils';

const { ccclass, property } = _decorator;

@ccclass('FriendRankItem')
export class FriendRankItem extends Component {
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

    @property(Sprite)
    public tierIcon: Sprite = null;

    @property(Label)
    public lbTier: Label = null;

    public data: any = undefined;

    public init(data: any, rank: number, isGreenBg: boolean, isSelf: boolean): void {
        this.data = data;
        this.witheBg.active = !isGreenBg;
        this.greenBg.active = isGreenBg;

        if (!isSelf) {
            if (isGreenBg) {
                UIUtils.setPlayerAvatarIcon(this.avatar, BaseDataManager.userAvatar);
                this.lbName.string = BaseDataManager.nickName;
            } else {
                UIUtils.setPlayerAvatarIcon(this.avatar, data.archive.avatar);
                this.lbName.string = data.archive.nickname;
            }
        }

        this.lbScore.string = I18nManager.t("Level:{0}", data.archive.score);

        if (data.archive.title && data.archive.title > 0) {
            const tierConfig = TierManager.instance.getCfgByTier(data.archive.title);
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

        if (typeof rank === 'number' && rank <= 3) {
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