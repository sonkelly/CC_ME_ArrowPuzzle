import { _decorator, Component, Node, EditBox } from 'cc';
import { BasePanel } from './BasePanel';
import { GameType, SettingToggleEnum, ItemID } from './GlobalEnum';
import { GameController } from './GameController';
import { AudioManager } from './AudioManager';
import { VibrateManager } from './VibrateManager';
import { UIManager } from './UIManager';
import { AudioUtils } from './Utils/AudioUtils';
import { GameLocalStorage } from './GameLocalStorage';
import { Toast } from './Toast';
import { ToggleSwitch, ToggleState } from './ToggleSwitch';
import { GameRecord } from './GameRecord';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { GameLogicConfig } from './GameLogicConfig';
import { UILayerManager } from './UILayerManager';
import { GameManager } from './GameManager';
import { SaveManager } from './SaveManager';
import { I18nManager } from './I18nManager';
import { Global } from './Global';
import { DnSdkManager } from './DnSdkManager';
import { HeartSource } from './HeartManager';

const { ccclass, property } = _decorator;

@ccclass('SettingView')
export class SettingView extends BasePanel {
    @property(Node)
    public bg: Node = null;

    @property({
        type: ToggleSwitch,
        displayName: "背景音乐开关"
    })
    public bgmToggle: ToggleSwitch = null;

    @property({
        type: ToggleSwitch,
        displayName: "音效开关"
    })
    public sfxToggle: ToggleSwitch = null;

    @property({
        type: ToggleSwitch,
        displayName: "震动开关"
    })
    public vbToggle: ToggleSwitch = null;

    @property(Node)
    public btnHome: Node = null;

    @property(Node)
    public btnRestart: Node = null;

    @property(Node)
    public GMNode: Node = null;

    @property(Node)
    public enterGameNode: Node = null;

    @property(Node)
    public btnDelete: Node = null;

    @property(EditBox)
    public levelEditBox: EditBox = null;

    @property(EditBox)
    public goldEditBox: EditBox = null;

    @property(EditBox)
    public energyEditBox: EditBox = null;

    @property(EditBox)
    public hintEditBox: EditBox = null;

    @property(Node)
    public btnGMGameWin: Node = null;

    @property(Node)
    public GMTourNode: Node = null;

    @property(EditBox)
    public tourScoreEditBox: EditBox = null;

    public static debugClickNum: number = 0;

    public onLoad(): void {
        this.init_view();
        this.addListen();
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, false);
    }

    public addListen(): void {}

    public setData(data: { isMain: boolean; gameType: GameType }): void {
        this.btnHome.active = !data.isMain;
        this.btnRestart.active = !data.isMain;
        /*if (Global.isForeignGame()) {
            this.GMNode.active = false;
        } else {
            this.GMNode.active = Global.isShowGM();
        }*/
        this.GMNode.active = Global.isShowGM();
        this.btnDelete.active = this.GMNode.active;
        this.enterGameNode.active = data.gameType === GameType.MainLevel;
        this.GMTourNode.active = data.gameType === GameType.Tournament;
        if (this.btnHome.active) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, true);
        }
        this.btnGMGameWin.active = this.btnHome.active;
        this.init_view();
    }

    public init_view(): void {
        this.debugClickNum = 0;
        AudioManager.instance.pause_loop_effect();

        let bgmEnabled = false;
        if (SDKInstance.isFacebookMiniGame()) {
            bgmEnabled = Number(GameLocalStorage.getItem("last_setting_music_bg") || 0) === 1;
        } else {
            bgmEnabled = Number(GameLocalStorage.getItem("last_setting_music_bg") || 1) === 1;
        }
        this.bgmToggle.setState(bgmEnabled ? ToggleState.On : ToggleState.Off);

        const sfxEnabled = Number(GameLocalStorage.getItem("last_setting_music_effect") || 1) === 1;
        this.sfxToggle.setState(sfxEnabled ? ToggleState.On : ToggleState.Off);

        const vbEnabled = Number(GameLocalStorage.getItem("last_setting_shake") || 1) === 1;
        this.vbToggle.setState(vbEnabled ? ToggleState.On : ToggleState.Off);

        GameController.instance.is_pause = true;

        this.bgmToggle.setOnCallback(() => {
            VibrateManager.instance.vibrateShort();
            AudioUtils.btn_click_sound();
            console.log("背景音乐已开启");
            AudioManager.instance.bgm_is_open = true;
            if (AudioManager.instance) {
                AudioManager.instance.set_swtich(SettingToggleEnum.BGM, true);
            }
            GameLocalStorage.setItem("last_setting_music_bg", 1);
        });

        this.bgmToggle.setOffCallback(() => {
            VibrateManager.instance.vibrateShort();
            AudioUtils.btn_click_sound();
            console.log("背景音乐已关闭");
            AudioManager.instance.bgm_is_open = false;
            if (AudioManager.instance) {
                AudioManager.instance.set_swtich(SettingToggleEnum.BGM, false);
            }
            GameLocalStorage.setItem("last_setting_music_bg", 0);
        });

        this.sfxToggle.setOnCallback(() => {
            VibrateManager.instance.vibrateShort();
            AudioUtils.btn_click_sound();
            console.log("音效已开启");
            AudioManager.instance.effect_is_open = true;
            if (AudioManager.instance) {
                AudioManager.instance.set_swtich(SettingToggleEnum.Effect, true);
            }
            GameLocalStorage.setItem("last_setting_music_effect", 1);
        });

        this.sfxToggle.setOffCallback(() => {
            VibrateManager.instance.vibrateShort();
            console.log("音效已关闭");
            AudioManager.instance.effect_is_open = false;
            if (AudioManager.instance) {
                AudioManager.instance.set_swtich(SettingToggleEnum.Effect, false);
            }
            GameLocalStorage.setItem("last_setting_music_effect", 0);
        });

        this.vbToggle.setOnCallback(() => {
            AudioUtils.btn_click_sound();
            console.log("震动已开启");
            VibrateManager.instance.vibrate_is_open = true;
            GameLocalStorage.setItem("last_setting_shake", 1);
        });

        this.vbToggle.setOffCallback(() => {
            AudioUtils.btn_click_sound();
            console.log("震动已关闭");
            VibrateManager.instance.vibrate_is_open = false;
            GameLocalStorage.setItem("last_setting_shake", 0);
        });
    }

    public onBackClick(): void {
        AudioUtils.btn_click_sound();
        if (this.btnHome.active) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, false);
        }
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, true);
        AudioManager.instance.resume_loop_effect();
        UIManager.deleteNode("SettingView");
        GameController.instance.is_pause = false;
    }

    public onContinueClick(): void {
        AudioUtils.btn_click_sound();
        if (this.btnHome.active) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, false);
        }

        if (GameManager.instance.gameType !== GameType.MainLevel) {
            this.scheduleOnce(() => {
                GameManager.instance.curStage.onGameRestart();
                UIManager.deleteNode("SettingView");
            });
            this.bg.active = false;
            return;
        }

        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        if (baseRecorder.Data.HeartData.CurrentHearts <= 0 && !baseRecorder.isHeartInInfinite()) {
            UIManager.createPanel("game", "FillHeartView", {
                showAnimation: true,
                setData: true
            });
        } else {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantUseHeart, 1);
            GameController.instance.is_pause = false;
            this.bg.active = false;
            this.scheduleOnce(() => {
                UIManager.deleteNode("SettingView");
                GameManager.instance.curStage.onGameRestart();
            });
        }
    }

    public onHomeClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.deleteNode("SettingView");

        if (GameManager.instance.gameType === GameType.Tournament || GameManager.instance.gameType === GameType.Pvp) {
            GameManager.instance.curStage.onGameWin(false);
        } else {
            GameManager.instance.curStage.clear(true);
            GameManager.instance.stopCountdown();
            UILayerManager.instance.showMainMenu();

            const baseRecorder = GameRecord.GetInstance().BaseRecorder;
            const currentLevel = baseRecorder.Data.CurLevel;

            if (GameManager.instance.gameType === GameType.MainLevel && 
                (!GameManager.instance.isRescueLevel() || GameManager.instance.forceRescueLevel(currentLevel))) {
                if (DnSdkManager.instance.sdk) {
                    DnSdkManager.instance.sdk.track("LEVEL_EXIT", {
                        ad_cnt: GameManager.instance.adCnt,
                        game_mode: "主线",
                        level_id: currentLevel,
                        coin_amount: baseRecorder.Data.Gold,
                        stamina_value: baseRecorder.Data.HeartData.CurrentHearts
                    });
                }
            }
        }
    }

    public onDeleteClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "ConfirmView", {
            nodeParent: this.node,
            showAnimation: true,
            setData: {
                title: I18nManager.t("Confirm!"),
                desc: I18nManager.t("Are you sure to delete all save data? This action cannot be undone."),
                yesTxt: I18nManager.t("Delete"),
                noTxt: I18nManager.t("Cancel"),
                yesCb: () => {
                    GameLocalStorage.clear();
                    AudioManager.instance.stop_bgm();
                    AudioManager.instance.updateIsOpen();
                    SaveManager.clear2();
                    UIManager.deleteNode("SettingView");
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantResetRecord);
                },
                noCb: () => {}
            }
        });
    }

    public onEnterLevelClick(): void {
        const result = this.checkIsPositiveIntegerAfterFloor(this.levelEditBox);
        if (!result.valid || (result.valid && result.integer <= 0)) {
            Toast.instance.tip_div("请输入大于0的整数");
        } else {
            console.log("跳关至: ", result.integer);
            new SaveManager(SaveManager.ARROW).clear();
            GameManager.instance.curStage.clear(true);
            if (this.btnHome.active) {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, false);
            }
            GameRecord.GetInstance().BaseRecorder.SkipToLevel(result.integer);
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, result.integer, GameType.MainLevel);
            UIManager.deleteNode("SettingView");
        }
    }

    public onAddHeartClick(): void {
        AudioUtils.btn_click_sound();
        const result = this.checkIsPositiveIntegerAfterFloor(this.energyEditBox);
        const isValid = result.valid;
        const integerValue = result.integer;
        if (isValid) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddHeart, integerValue, true, HeartSource.Other);
        } else {
            Toast.instance.tip_div("请输入大于0的整数");
        }
    }

    public onAddGoldClick(): void {
        AudioUtils.btn_click_sound();
        const result = this.checkIsPositiveIntegerAfterFloor(this.goldEditBox);
        const isValid = result.valid;
        const integerValue = result.integer;
        if (isValid) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddGold, integerValue, true);
        } else {
            Toast.instance.tip_div("请输入大于0的整数");
        }
    }

    public onAddProp1Click(): void {
        AudioUtils.btn_click_sound();
        const result = this.checkIsPositiveIntegerAfterFloor(this.hintEditBox);
        const isValid = result.valid;
        const integerValue = result.integer;
        if (isValid) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantAddItem, [ItemID.Hint, integerValue]);
        } else {
            Toast.instance.tip_div("请输入大于0的整数");
        }
    }

    public onInfiniteEnergy(): void {
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.SetHeartInfinite, 1);
    }

    public onGMGameWin(): void {
        if (this.btnHome.active) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, false);
        }
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.OnGMGameWin, null);
        UIManager.deleteNode("SettingView");
    }

    public onGMTourWin(): void {
        const result = this.checkIsPositiveIntegerAfterFloor(this.tourScoreEditBox);
        const isValid = result.valid;
        const integerValue = result.integer;
        if (isValid) {
            if (this.btnHome.active) {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, false);
            }
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.OnGMGameWin, integerValue);
            UIManager.deleteNode("SettingView");
        } else {
            Toast.instance.tip_div("请输入大于0的整数");
        }
    }

    public checkIsPositiveIntegerAfterFloor(editBox: EditBox): { valid: boolean; integer: number | null } {
        if (!editBox) {
            console.error("请先绑定目标EditBox组件");
            return { valid: false, integer: null };
        }

        const text = editBox.string.trim();
        const number = parseFloat(text);

        if (isNaN(number) || number < 0) {
            return { valid: false, integer: null };
        }

        const flooredValue = Math.floor(number);
        const isValid = flooredValue >= 0;

        return {
            valid: isValid,
            integer: isValid ? flooredValue : null
        };
    }

    public onDebugButtonClick(): void {
        if (!SDKInstance.isWxPlatform()) {
            this.debugClickNum++;
            if (this.debugClickNum > 20) {
                this.GMNode.active = true;
                this.btnDelete.active = true;
            }
        }
    }
}