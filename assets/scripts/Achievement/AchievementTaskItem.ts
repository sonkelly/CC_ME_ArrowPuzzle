import { _decorator, Component, Sprite, Node, Prefab, ProgressBar, Label, instantiate } from 'cc';
import { UIUtils } from './../Utils/UIUtils';
import { Goods } from './../Goods';
import { CCExtends } from './../CCExtends';
import { I18nManager, Language } from './../I18nManager';
import { ItemID } from './../GlobalEnum';

const { ccclass, property } = _decorator;

@ccclass('AchievementTaskItem')
export class AchievementTaskItem extends Component {
    @property(Sprite)
    private icon: Sprite = null;

    @property(Node)
    private redP: Node = null;

    @property(Node)
    private rewardPanel: Node = null;

    @property(Prefab)
    private goods: Prefab = null;

    @property(ProgressBar)
    private progressBar: ProgressBar = null;

    @property(Label)
    private lbProgress: Label = null;

    @property(Label)
    private lbName: Label = null;

    @property(Label)
    private lbTarget: Label = null;

    @property(Node)
    private receiveNode: Node = null;

    public init(data: any): void {
        if (data.isMax) {
            console.log("满级了");
            UIUtils.setAchievementIcon(this.icon, "cj" + data.groupId + "_" + data.claimedLevel);
            this.lbName.string = I18nManager.t(data.name, data.claimedLevel);
            this.lbTarget.string = I18nManager.getLanguage() === Language.EN ? "Finished" : "已完成";
            this.rewardPanel.active = false;
            this.redP.active = false;
            this.receiveNode.active = false;
            this.progressBar.node.active = false;
            this.lbProgress.node.active = false;
            return;
        }

        UIUtils.setAchievementIcon(this.icon, "cj" + data.groupId + "_" + (data.claimedLevel + 1));
        this.lbName.string = I18nManager.t(data.name, data.claimedLevel + 1);
        this.lbTarget.string = data.desc;
        this.rewardPanel.active = true;
        CCExtends.DestroyNodeAllChildren(this.rewardPanel);

        for (let i = 0; i < data.rewardIds.length; i++) {
            if (!SDKInstance.isGooglePlayNative() || data.rewardIds[i] !== ItemID.Line) {
                const goodsNode = instantiate(this.goods);
                goodsNode.parent = this.rewardPanel;
                goodsNode.getComponent(Goods).setData2(data.rewardIds[i], data.rewardNums[i]);
            }
        }

        this.progressBar.node.active = true;
        this.lbProgress.node.active = true;
        this.progressBar.progress = data.curProgress / data.target;
        this.lbProgress.string = data.curProgress + "/" + data.target;
        this.receiveNode.active = data.canClaim;
        this.redP.active = data.canClaim;
    }
}