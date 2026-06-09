import { _decorator, Component, Node, Prefab, Label, instantiate, Sprite, Button } from 'cc';
import { DayState, ExcelVideoType } from './../GlobalEnum';
import { ModuleEventKey } from './../IGameRawData';
import { EventManager } from './../Event/EventManager';
import { UIManager } from './../UIManager';
import { BasePanel } from './../BasePanel';
import { AudioUtils } from './../Utils/AudioUtils';
import { GameLogicConfig } from './../GameLogicConfig';
import { DailyChallengeModel } from './../Daily/DailyChallengeModel';
import { DayItem } from './../DayItem';
import { SaveManager } from './../SaveManager';
import { BundleManager } from './../BundleManager';
import { Toast } from './../Toast';
import { I18nManager } from './../I18nManager';
import { DnSdkManager } from './../DnSdkManager';

const { ccclass, property } = _decorator;

@ccclass('DailyChallengeView')
export class DailyChallengeView extends BasePanel {
    @property(Node)
    grid: Node = null;

    @property(Prefab)
    dayItemPrefab: Prefab = null;

    @property(Label)
    lbDate: Label = null;

    @property(Node)
    btnChallenge: Node = null;

    @property(Node)
    btnVideoChallenge: Node = null;

    @property(Label)
    lbBtn: Label = null;

    @property(Label)
    lbBtn1: Label = null;

    today: number = 0;
    year: number = 0;
    month: number = 0;
    challengeData: any;
    dayItemArry: DayItem[] = [];
    selectDay: number = 1;
    isLoaded: boolean = false;
    showAd: boolean = false;

    onLoad(): void {
        this.initView();
        this.addListen();
        this.isLoaded = false;
        BundleManager.instance.loadBundle("level_challenge", () => {
            this.isLoaded = true;
        });
    }

    addListen(): void {
        // No listeners added
    }

    initView(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, false);
        const currentDate = new Date();
        this.year = currentDate.getFullYear();
        this.month = currentDate.getMonth() + 1;
        this.today = currentDate.getDate();
        this.challengeData = DailyChallengeModel.load(this.year, this.month);
        this.lbDate.string = this.challengeData.year + "/" + this.challengeData.month.toString().padStart(2, "0");
        this.scheduleOnce(() => {
            this.buildCalendar();
        });
    }

    buildCalendar(): void {
        this.grid.removeAllChildren();
        const firstDayOfMonth = new Date(this.year, this.month - 1, 1);
        const daysInMonth = new Date(this.year, this.month, 0).getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();
        let todayDay = 1;

        for (let i = 0; i < 42; i++) {
            const dayNumber = i - startDayOfWeek + 1;
            const dayItemNode = instantiate(this.dayItemPrefab);
            dayItemNode.parent = this.grid;
            const dayState = this.getDayState(dayNumber);
            const dayItemComponent = dayItemNode.getComponent(DayItem);
            if (dayState === DayState.Today) {
                todayDay = dayNumber;
            }
            dayItemComponent.init(dayNumber, dayState, dayNumber <= 0 || dayNumber > daysInMonth, this.challengeData.finishedDays, this.onClickDay.bind(this));
            this.dayItemArry.push(dayItemComponent);
        }

        let foundMissed = false;
        for (let i = this.dayItemArry.length - 1; i >= 0; i--) {
            const dayItem = this.dayItemArry[i];
            if (dayItem.state !== DayState.Future && dayItem.state !== DayState.Done && !this.challengeData.finishedDays.includes(dayItem.day)) {
                foundMissed = true;
                this.onClickDay(dayItem.day, dayItem.state);
                break;
            }
        }
        if (!foundMissed) {
            this.onClickDay(todayDay, DayState.Today);
        }
    }

    getDayState(day: number): DayState {
        if (day > this.today) {
            return DayState.Future;
        } else if (day === this.today) {
            return DayState.Today;
        } else if (this.challengeData.finishedDays.includes(day)) {
            return DayState.Done;
        } else {
            return DayState.Missed;
        }
    }

    onClickDay(day: number, state: DayState): void {
        if (state !== DayState.Future && state !== DayState.Done) {
            this.selectDay = day;
            this.dayItemArry.forEach((item, index) => {
                item.setSelect(item.day === day);
            });
            this.refreshChallengeBtn(day, state);
        }
    }

    refreshChallengeBtn(day: number, state: DayState): void {
        let savedLevel = 0;
        const savedData = localStorage.getItem(SaveManager.CHALLENGE);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            savedLevel = parsedData.level && typeof parsedData.level === "number" ? parsedData.level : 0;
        }

        if (state === DayState.Missed) {
            this.btnVideoChallenge.active = true;
            this.btnChallenge.active = false;
            if (savedLevel === day) {
                this.lbBtn1.string = I18nManager.t("CONTINUE");
            } else {
                this.lbBtn1.string = I18nManager.t("CHALLENGE");
                if (!this.showAd) {
                    this.showAd = true;
                    DnSdkManager.instance.sdk?.track("AD_PLACEMENT_SHOW", {
                        ad_placement_name: 58
                    });
                }
            }
        } else {
            this.btnVideoChallenge.active = false;
            this.btnChallenge.active = true;
            this.btnChallenge.getComponent(Sprite).grayscale = this.challengeData.finishedDays.includes(day);
            this.btnChallenge.getComponent(Button).interactable = !this.challengeData.finishedDays.includes(day);
            this.lbBtn.string = savedLevel === day ? I18nManager.t("CONTINUE") : I18nManager.t("CHALLENGE");
        }
    }

    onChallengeClick(): void {
        AudioUtils.btn_click_sound();
        if (this.isLoaded) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.DailyChallenge, this.selectDay);
            UIManager.deleteNode("DailyChallengeView");
        } else {
            Toast.instance.tip_div("Level loading...");
        }
    }

    onVideoChallengeClick(): void {
        AudioUtils.btn_click_sound();
        if (this.isLoaded) {
            DnSdkManager.instance.sdk?.track("AD_CLICK", {
                ad_placement_name: 58
            });
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSeeVideo, [ExcelVideoType.CHALLENGE, this.selectDay]);
        } else {
            Toast.instance.tip_div("Level loading...");
        }
    }

    oHomeClick(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, true);
        AudioUtils.btn_click_sound();
        UIManager.deleteNode("DailyChallengeView");
    }
}