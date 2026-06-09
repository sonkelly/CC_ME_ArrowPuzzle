import { _decorator, Component, Node, Label } from 'cc';
import { ModuleEventKey } from './IGameRawData';
import { GameRecord } from './GameRecord';
import { EventManager } from './Event/EventManager';
import { AudioUtils } from './Utils/AudioUtils';
import { JsonClassStorage } from './JsonClass';
import { GameLogicConfig } from './GameLogicConfig';
import { UIManager } from './UIManager';
import { GameManager } from './GameManager';
import { AchievementType, ItemID } from './GlobalEnum';
import { I18nManager } from './I18nManager';
import { AchievementManager } from './Achievement/AchievementManager';
import { EasDataSDK } from './EasDataSDK';

const { ccclass, property } = _decorator;

export enum HeartSource {
    Recovery = "natural_recovery",
    Ad = "energy_ad",
    LevelPass = "chapter_id",
    Share = "shared",
    Subscribed = "subscribed",
    GoldExc = "gold_exchange",
    Other = "other"
}

@ccclass('HeartManager')
export class HeartManager extends Component {
    @property(Node)
    public heart: Node = null;

    @property(Label)
    public lbHeart: Label = null;

    @property(Label)
    public lbTime: Label = null;

    @property(Node)
    public InfiniteNode: Node = null;

    @property(Label)
    public lbInfinite: Label = null;

    public static currentHearts: number = 5;
    public static maxHearts: number = 5;
    public static recoverInterval: number = 1800;
    public static lastTimestamp: number = 0;
    public static nextRecoverTime: number = 0;
    public static infiniteTime: number = 0;

    public onLoad(): void {
        this.updateAll();
        this.addListener();
    }

    public addListener(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateHeartManager, this.updateAll, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddHeart, this.addHearts, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantUseHeart, this.useHeart, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.SetHeartInfinite, this.onSetHeartInfinite, this);
    }

    public onDestroy(): void {
        EventManager.offAll(this);
    }

    public updateAll(): void {
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        const baseConfig = JsonClassStorage.instance.getOneJson("BaseConfig", "ID", 1);
        this.maxHearts = baseConfig.MaxHeart;
        this.recoverInterval = baseConfig.HeartRecoverInterval;
        this.currentHearts = baseRecorder.Data.HeartData.CurrentHearts;
        this.lastTimestamp = baseRecorder.Data.HeartData.LastTimestamp;

        const now = Date.now();
        const infiniteTimestamp = baseRecorder.Data.HeartData.InfiniteTimestamp ?? 0;
        this.infiniteTime = Math.max(0, Math.floor((infiniteTimestamp - now) / 1000));

        this.updateInfiniteUI(true);
        this.updateHeartFromTime(true);
        this.updateTimer();
        this.schedule(this.updateTimer, 1);
        this.updateUI();
    }

    public updateHeartFromTime(saveData: boolean = false): void {
        if (this.currentHearts >= this.maxHearts) {
            return;
        }

        const now = Date.now();
        const elapsedSeconds = Math.floor((now - this.lastTimestamp) / 1000);
        const recoveredHearts = Math.floor(elapsedSeconds / this.recoverInterval);

        if (recoveredHearts > 0) {
            this.currentHearts = Math.min(this.maxHearts, this.currentHearts + recoveredHearts);
            this.lastTimestamp = now - (elapsedSeconds % this.recoverInterval) * 1000;

            if (saveData) {
                const baseRecorder = GameRecord.GetInstance().BaseRecorder;
                baseRecorder.Data.HeartData.CurrentHearts = this.currentHearts;
                baseRecorder.Save();
            } else {
                this.saveData(true);
            }
        }

        if (this.currentHearts < this.maxHearts) {
            this.nextRecoverTime = this.recoverInterval - (elapsedSeconds % this.recoverInterval);
        } else {
            this.nextRecoverTime = 0;
        }
    }

    public updateTimer(): void {
        if (this.infiniteTime > 0) {
            this.infiniteTime--;
            if (this.infiniteTime <= 0) {
                this.heartInfiniteEnd();
            }
            this.updateInfiniteUI(false);
        }

        if (this.currentHearts >= this.maxHearts) {
            if (this.lbTime) {
                this.lbTime.string = I18nManager.t("FULL");
            }
        } else {
            this.nextRecoverTime--;
            if (this.nextRecoverTime <= 0) {
                this.addHearts(1, true, HeartSource.Recovery);
                this.lastTimestamp = Date.now();
                this.nextRecoverTime = this.recoverInterval;
                this.saveData(true);
            }
            this.updateUI();
        }
    }

    public useHeart(): boolean {
        if (this.isHeartInfinite()) {
            return true;
        }

        if (this.currentHearts <= 0) {
            return false;
        }

        const wasFull = this.currentHearts >= this.maxHearts;
        this.currentHearts--;

        AchievementManager.instance.onEvent(AchievementType.HEART_COST);
        EasDataSDK.trackEvent("item_change", {
            item_id: "energy",
            change_type: 1,
            change_num: -1,
            change_source: GameManager.instance.getLevelId()
        });
        EasDataSDK.userSet({
            energy: this.currentHearts
        });

        if (wasFull) {
            this.lastTimestamp = Date.now();
            this.nextRecoverTime = this.recoverInterval;
            this.saveData(true);
        } else {
            this.saveData(false);
        }

        this.updateHeartFromTime();
        this.updateUI();
        return true;
    }

    public addHearts(amount: number, saveData: boolean, source: HeartSource = HeartSource.Other): void {
        this.currentHearts += amount;

        const changeSource = source === HeartSource.LevelPass ? GameManager.instance.getLevelId() : source;
        EasDataSDK.trackEvent("item_change", {
            item_id: "energy",
            change_type: 0,
            change_num: amount,
            change_source: changeSource
        });
        EasDataSDK.userSet({
            energy: this.currentHearts
        });

        if (saveData) {
            this.saveData();
        }
        this.updateUI();
    }

    public onSetHeartInfinite(multiplier: number): void {
        const itemData = JsonClassStorage.instance.getOneJson("ItemData", "ItemId", ItemID.InfiniteHeart);
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        const now = Date.now();

        this.infiniteTime += itemData.ExtraParam * multiplier;
        const infiniteTimestamp = now + 1000 * this.infiniteTime;
        baseRecorder.SetHeartInfiniteTime(infiniteTimestamp);

        this.InfiniteNode.active = true;
        this.lbInfinite.node.active = true;
        this.lbHeart.node.active = false;
        this.lbTime.node.active = false;
        this.updateInfiniteUI(true);
    }

    public updateInfiniteUI(updateVisibility: boolean = false): void {
        if (updateVisibility) {
            this.InfiniteNode.active = this.infiniteTime > 0;
            this.lbInfinite.node.active = this.infiniteTime > 0;
            this.lbHeart.node.active = this.infiniteTime <= 0;
            this.lbTime.node.active = this.infiniteTime <= 0;
        }

        if (this.infiniteTime) {
            const minutes = Math.floor(this.infiniteTime / 60);
            const seconds = this.infiniteTime % 60;
            this.lbInfinite.string = minutes + ":" + seconds.toString().padStart(2, "0");
        }
    }

    public heartInfiniteEnd(): void {
        this.infiniteTime = 0;
        this.updateInfiniteUI(true);

        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        baseRecorder.Data.HeartData.InfiniteTimestamp = 0;
        baseRecorder.Save();
    }

    public isHeartInfinite(): boolean {
        return this.infiniteTime > 0;
    }

    public updateUI(): void {
        if (this.lbHeart) {
            this.lbHeart.string = "" + this.currentHearts;
        }

        if (this.lbTime && this.currentHearts < this.maxHearts) {
            const minutes = Math.floor(this.nextRecoverTime / 60);
            const seconds = this.nextRecoverTime % 60;
            this.lbTime.string = minutes + ":" + seconds.toString().padStart(2, "0");
        }
    }

    public saveData(saveTimestamp: boolean = false): void {
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        baseRecorder.Data.HeartData.CurrentHearts = this.currentHearts;
        if (saveTimestamp) {
            baseRecorder.Data.HeartData.LastTimestamp = this.lastTimestamp;
        }
        baseRecorder.Save();
    }

    public onAddHeartClick(): void {
        AudioUtils.btn_click_sound();
        if (this.infiniteTime > 0) {
            UIManager.createPanel("game", "InfiniteHeartView", {
                showAnimation: true
            });
        } else {
            UIManager.createPanel("game", "FillHeartView", {
                showAnimation: true,
                setData: false
            });
        }
    }
}