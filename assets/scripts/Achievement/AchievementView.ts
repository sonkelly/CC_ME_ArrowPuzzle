import { _decorator, Prefab, Label } from 'cc';
import { UIManager } from './../UIManager';
import { AudioUtils } from './../Utils/AudioUtils';
import { BasePanel } from './../BasePanel';
import { TabContainer } from './../TabContainer';
import { VirtualScrollView } from './../VScrollView';
import { AchievementManager } from './AchievementManager';
import { AchievementTaskItem } from './AchievementTaskItem';
import { AchievementItem } from './AchievementItem';
import { AudioManager } from './../AudioManager';
import { I18nManager, Language } from './../I18nManager';

const { ccclass, property } = _decorator;

enum AchievementTabType {
    Task = 0,
    MyAchi = 1
}

@ccclass('AchievementView')
export class AchievementView extends BasePanel {
    @property(TabContainer)
    public topTab: TabContainer = null;

    @property(VirtualScrollView)
    public taskList: VirtualScrollView = null;

    @property(Prefab)
    public taskItem_en: Prefab = null;

    @property(Prefab)
    public taskItem_zh: Prefab = null;

    @property(VirtualScrollView)
    public AchievementList: VirtualScrollView = null;

    @property(Prefab)
    public achiItem_en: Prefab = null;

    @property(Prefab)
    public achiItem_zh: Prefab = null;

    @property(Label)
    public lbAchi: Label = null;

    private _selectType: AchievementTabType = AchievementTabType.Task;
    private achiList: any[] = undefined;
    private flying: boolean = false;

    public onLoad(): void {
        this.addListen();
        this.topTab.node.on(TabContainer.Event.TAB_CHANGE, this.onTypeChange, this);
        this.topTab.setIndex(this._selectType, false);

        if (I18nManager.getLanguage() === Language.EN) {
            this.taskList.itemPrefab = this.taskItem_en;
            this.AchievementList.itemPrefab = this.achiItem_en;
        } else {
            this.taskList.itemPrefab = this.taskItem_zh;
            this.AchievementList.itemPrefab = this.achiItem_zh;
        }

        this.achiList = AchievementManager.instance.getAchievementList();

        this.taskList.renderItemFn = (itemNode: any, index: number) => {
            itemNode.getComponent(AchievementTaskItem).init(this.achiList[index]);
        };

        this.taskList.refreshList(this.achiList);

        this.taskList.onItemClickFn = (itemNode: any, index: number) => {
            if (!this.flying) {
                const taskItem = itemNode.getComponent(AchievementTaskItem);
                if (AchievementManager.instance.claim(this.achiList[index].groupId, taskItem.rewardPanel)) {
                    this.achiList = AchievementManager.instance.getAchievementList();
                    this.taskList.refreshList(this.achiList);
                    this.flying = true;
                    AudioManager.instance.load_and_play_effect("achieve", false, "game");
                    this.scheduleOnce(() => {
                        this.flying = false;
                    }, 0.3);
                }
            }
        };
    }

    public onHide(): void {
        this.topTab.node.off(TabContainer.Event.TAB_CHANGE, this.onTypeChange, this);
    }

    public onDestroy(): void {
        // Cleanup if needed
    }

    public addListen(): void {
        // Add listeners if needed
    }

    public renderAchievementList(): void {
        this.AchievementList.node.active = true;
        const titleList = AchievementManager.instance.getTitleList();
        this.lbAchi.node.active = true;
        this.lbAchi.string = I18nManager.t("Number of Medals:{0}", titleList.length);

        this.AchievementList.renderItemFn = (itemNode: any, index: number) => {
            itemNode.getComponent(AchievementItem).init(titleList[index]);
        };

        this.AchievementList.refreshList(titleList);

        this.AchievementList.onItemClickFn = (itemNode: any, index: number) => {
            // Handle item click if needed
        };
    }

    public onTypeChange = (tabType: AchievementTabType): void => {
        this._selectType = tabType;
        switch (this._selectType) {
            case AchievementTabType.Task:
                this.taskList.node.active = true;
                this.AchievementList.node.active = false;
                this.lbAchi.node.active = false;
                break;
            case AchievementTabType.MyAchi:
                this.taskList.node.active = false;
                this.renderAchievementList();
                break;
        }
    };

    public onCloseClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.deleteNode("AchievementView");
    }
}