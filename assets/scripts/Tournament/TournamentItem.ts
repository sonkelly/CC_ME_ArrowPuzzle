import { _decorator, Component, Node, Label, Prefab, Sprite, Button, instantiate } from 'cc';
import { TournamentDataManager } from './../Tournament/TournamentDataManager';
import { AudioUtils } from './../Utils/AudioUtils';
import { CCExtends } from './../CCExtends';
import { UIUtils } from './../Utils/UIUtils';
import { Utilsqdd } from './../Utils/Utilsqdd';
import { CommonActivityTimer } from './../CommonActivityTimer';
import { TournamentRankItem } from './../Tournament/TournamentRankItem';
import { TournamentWxMgr } from './../Tournament/TournamentWxMgr';
import { I18nManager, Language } from './../I18nManager';
import { TimeUtils } from './../Utils/TimeUtils';
import { UIManager } from './../UIManager';

const { ccclass, property } = _decorator;

@ccclass('TournamentItem')
export class TournamentItem extends Component {
    @property(Node)
    public item: Node = null;

    @property(Node)
    public btnCreate: Node = null;

    @property(Label)
    public lbTitle: Label = null;

    @property(CommonActivityTimer)
    public lbTime: CommonActivityTimer = null;

    @property(Node)
    public btnJoin: Node = null;

    @property(Label)
    public lbJoin: Label = null;

    @property(Node)
    public btnPlay: Node = null;

    @property(Label)
    public lbPlay: Label = null;

    @property(Node)
    public btnRank: Node = null;

    @property(Node)
    public rankContent: Node = null;

    @property(Prefab)
    public rankItem: Prefab = null;

    @property(Sprite)
    public icon: Sprite = null;

    @property(Node)
    public tipsNode: Node = null;

    @property(Node)
    public tipsNode_en: Node = null;

    public data: any = null;

    public init(data: any, isPlaying: boolean, rewardData: any): void {
        this.data = data;
        this.item.active = true;
        this.btnCreate.active = false;
        this.btnJoin.active = !isPlaying;
        this.btnPlay.active = isPlaying;

        let level: number;
        if (data.payload && data.payload.level) {
            level = +data.payload.level;
        } else {
            level = Utilsqdd.randomTwoNum(1, 198);
        }

        if (SDKInstance.isFacebookMiniGame()) {
            this.lbTitle.string = data.title;
            this.btnRank.active = false;
        } else {
            this.btnRank.active = true;
            if (SDKInstance.isWxPlatform()) {
                this.lbTitle.string = data.title.replace("官方", TimeUtils.formatTimestampToMonthDay(1000 * (data.endTime - 1), false));
            } else {
                this.lbTitle.string = TimeUtils.formatTimestampToMonthDay(1000 * (data.endTime - 1), true) + " Tournament";
            }
        }

        UIUtils.setTournamentThumbnail(this.icon, "Level_" + level);

        this.lbTime.init(1000 * data.endTime, I18nManager.t("Time Left:") + " ", () => {
            this.lbTime.node.active = false;
            this.btnJoin.getComponent(Sprite).grayscale = true;
            this.btnJoin.getComponent(Button).interactable = false;
            this.btnPlay.getComponent(Sprite).grayscale = true;
            this.btnPlay.getComponent(Button).interactable = false;
            this.lbJoin.string = I18nManager.t("Finished");
            this.lbPlay.string = I18nManager.t("Finished");
        }, false);

        if (1000 * data.endTime - Date.now() <= 0) {
            this.lbTime.node.active = false;
            this.btnJoin.getComponent(Sprite).grayscale = true;
            this.btnJoin.getComponent(Button).interactable = false;
            this.btnPlay.getComponent(Sprite).grayscale = true;
            this.btnPlay.getComponent(Button).interactable = false;
            this.lbJoin.string = I18nManager.t("Finished");
            this.lbPlay.string = I18nManager.t("Finished");
        } else {
            this.lbTime.node.active = true;
            this.btnJoin.getComponent(Sprite).grayscale = false;
            this.btnJoin.getComponent(Button).interactable = true;
            this.btnPlay.getComponent(Sprite).grayscale = false;
            this.btnPlay.getComponent(Button).interactable = true;
            this.lbJoin.string = I18nManager.t("Join Tournament");
            this.lbPlay.string = I18nManager.t("Play Tournament");
        }

        if (data.rankList && data.rankList.length > 0) {
            this.tipsNode.active = false;
            this.tipsNode_en.active = false;
            this.rankContent.active = true;
            CCExtends.DestroyNodeAllChildren(this.rankContent);

            const rewards = data.payload?.rewards;
            const count = Math.min(3, data.rankList.length);
            for (let i = 0; i < count; i++) {
                const rankItemNode = instantiate(this.rankItem);
                rankItemNode.parent = this.rankContent;
                rankItemNode.getComponent(TournamentRankItem).init(data.rankList[i], i + 1, rewards ? rewards[i] : undefined, rewardData);
            }
        } else {
            this.rankContent.active = false;
            if (!SDKInstance.isFacebookMiniGame()) {
                this.tipsNode.active = I18nManager.getLanguage() === Language.ZH;
                this.tipsNode_en.active = I18nManager.getLanguage() === Language.EN;
            }
        }
    }

    public showWaitNode(): void {
        this.rankContent.children.forEach((child: Node) => {
            child.getComponent(TournamentRankItem).showWaitNode();
        });
    }

    public hideWaitNode(): void {
        this.rankContent.children.forEach((child: Node) => {
            child.getComponent(TournamentRankItem).hideWaitNode();
        });
    }

    public async onPlayClick(): Promise<void> {
        AudioUtils.btn_click_sound();
        if (SDKInstance.isFacebookMiniGame()) {
            TournamentDataManager.instance.isNewTournament = false;
            await TournamentDataManager.instance.joinTournament(this.data);
        } else {
            TournamentWxMgr.instance.joinTournament(this.data);
        }
    }

    public async onJoinClick(): Promise<void> {
        AudioUtils.btn_click_sound();
        if (SDKInstance.isFacebookMiniGame()) {
            TournamentDataManager.instance.isNewTournament = false;
            await TournamentDataManager.instance.joinTournament(this.data);
        } else {
            TournamentWxMgr.instance.joinTournament(this.data);
        }
    }

    public async onCreateClick(): Promise<void> {
        AudioUtils.btn_click_sound();
        await TournamentDataManager.instance.createTournament(100);
    }

    public onRankClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "TournamentFullRank", {
            showAnimation: true,
            setData: (this.tipsNode.active || this.tipsNode_en.active) ? null : this.data.id
        });
    }
}