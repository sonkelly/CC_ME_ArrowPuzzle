import { _decorator, Label, Node, Prefab, Slider, Animation, sp, view, UITransform, Sprite, Vec3, tween, instantiate, Tween, v3 } from 'cc';
import { ItemID, GameType, LevelType } from './GlobalEnum';
import { BasePanel } from './BasePanel';
import { GameController } from './GameController';
import { ModuleEventKey } from './IGameRawData';
import { BagDataManager } from './BagDataManager';
import { BaseDataManager } from './BaseDataManager';
import { FB1vs1DataManager } from './FB1vs1DataManager';
import { GameRecord } from './GameRecord';
import { EventManager } from './Event/EventManager';
import { UIManager } from './UIManager';
import { GameManager } from './GameManager';
import { Global } from './Global';
import { AudioUtils } from './Utils/AudioUtils';
import { CCExtends } from './CCExtends';
import { JsonClassStorage } from './JsonClass';
import { NezpTools } from './NezpTools';
import { UIUtils } from './Utils/UIUtils';
import { Toast } from './Toast';
import { GameLogicConfig } from './GameLogicConfig';
import { I18nManager } from './I18nManager';
import { TimeUtils } from './Utils/TimeUtils';
import { GameLocalStorage } from './GameLocalStorage';
import { ToggleSwitch, ToggleState } from './ToggleSwitch';
import { Utilsqdd } from './Utils/Utilsqdd';
import { DirectPlayUtil } from './DirectPlayUtil';
import { EasOperateSDK } from './EasOperateSDK';

const { ccclass, property } = _decorator;

declare const SDKInstance: any;
declare const FBInstant: any;

@ccclass('GameMenuView')
export class GameMenuView extends BasePanel {
    // Instance properties (not decorated)
    levelHp: number = 3;
    duration: number = EasOperateSDK.combo_duration;
    nezpPvpContainer: any = null;
    nezpPvpData: any = {};
    nezpPvpView: any = null;
    isShow: boolean = false;
    emojiCfg: string[] = ["ase", "cool", "inc", "wd"];
    emojiTxt: string[] = ["Awesome", "Cool", "Incredible", "Well Done"];

    // Decorated properties
    @property(Label)
    lbLevel: Label = null!;

    @property(Label)
    lbTarget: Label = null!;

    @property(Node)
    hpNode: Node = null!;

    @property(Prefab)
    hpItem: Prefab = null!;

    @property(Slider)
    zoomSlider: Slider = null!;

    @property(Animation)
    erroAnim: Animation = null!;

    @property(Label)
    lbGuideTxt: Label = null!;

    @property(Node)
    hardNode: Node = null!;

    @property(Node)
    superHardNode: Node = null!;

    @property(Label)
    lbHint: Label = null!;

    @property(Label)
    lbHintPrice: Label = null!;

    @property(Node)
    tournamentUI: Node = null!;

    @property(Label)
    lbScore: Label = null!;

    @property(Label)
    lbHpPrice: Label = null!;

    @property(Label)
    lbCombo: Label = null!;

    @property(Node)
    finger: Node = null!;

    @property(Node)
    pvpUI: Node = null!;

    @property(Label)
    lbSelfScore: Label = null!;

    @property(Node)
    waitNode1: Node = null!;

    @property(Node)
    waitNode2: Node = null!;

    @property(Node)
    guideWheelNode: Node = null!;

    @property(Node)
    lbTimeNode: Node = null!;

    @property(Label)
    lbTimer: Label = null!;

    @property(Node)
    shareNode: Node = null!;

    @property(Label)
    lbSwitch: Label = null!;

    @property(Node)
    btnPause: Node = null!;

    @property(Label)
    lbRescue: Label = null!;

    @property(Label)
    lbLine: Label = null!;

    @property({ type: ToggleSwitch, displayName: "颜色开关" })
    colorToggle: ToggleSwitch = null!;

    @property(Node)
    guideColorNode: Node = null!;

    @property(Node)
    tips50: Node = null!;

    @property(sp.Skeleton)
    pctSpine: sp.Skeleton = null!;

    @property(Node)
    winEmoji: Node = null!;

    @property(Node)
    emoji: Node = null!;

    @property(Label)
    lbEmoji: Label = null!;

    onDestroy(): void {
        EventManager.offAll(this);
    }

    onLoad(): void {
        this.init();
        this.addListener();
    }

    addListener(): void {
        const self = this;
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameFail, this.onGameFail, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameWin, this.onGameWin, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.InitHp, this.onInitHp, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ReduceHp, this.onReduceHp, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateTarget, this.onUpdateTarget, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ErrorAnim, this.onErrorAnim, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateZoomSlider, this.onUpdateSlider, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UseTips, this.onUseTips, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.StartLoad, this.onStartLoad, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.LoadFinished, this.onLoadFinished, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowGuideText, this.onShowGuideText, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.BagDataChange, this.updateHintNum, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateTournamentScore, this.UpdateTournamentScore, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateCombo, this.OnUpdateCombo, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.HidePvpUI, this.onHidePvpUI, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.TimeUpdated, this.onTimeUpdated, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowTips50, this.onShowTips50, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WinEmojiAnim, this.onWinEmojiAnim, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGameUI, this.updateUI, this);

        this.pctSpine.setCompleteListener(() => {
            self.tips50.active = false;
        });
    }

    start(): void {
        const self = this;
        const visibleSize = view.getVisibleSize();
        this.erroAnim.node.getComponent(UITransform).width = visibleSize.width;
        this.erroAnim.node.getComponent(UITransform).height = visibleSize.height;
        this.schedule(this.updateTips, 1);
        this.updateHintNum();

        const fillHpData = JsonClassStorage.instance.getOneJson("ItemData", "ItemId", ItemID.FillHp);
        this.lbHpPrice.string = fillHpData.Price.toString();

        this.scheduleOnce(() => {
            self.btnPause.setPosition(446, Global.isForeignGame() ? -8 : -180);
            self.hpNode.setPosition(0, SDKInstance.isFacebookMiniGame() ? -10 : -50);
            self.lbLevel.node.setPosition(SDKInstance.isFacebookMiniGame() ? 0 : -408, SDKInstance.isFacebookMiniGame() ? -75 : -8);
            self.lbRescue.node.setPosition(SDKInstance.isFacebookMiniGame() ? 0 : -408, SDKInstance.isFacebookMiniGame() ? -75 : -8);
            self.hardNode.setPosition(SDKInstance.isFacebookMiniGame() ? 0 : -408, SDKInstance.isFacebookMiniGame() ? 60 : -64);
            self.superHardNode.setPosition(self.hardNode.position);
            self.tournamentUI.setPosition(-424, SDKInstance.isFacebookMiniGame() ? -50 : -236);
            self.lbTarget.node.parent.setPosition(-490, SDKInstance.isFacebookMiniGame() ? 20 : -165);
        });

        if (SDKInstance.isWxPlatform()) {
            const handleNode = this.zoomSlider.handle.node;
            handleNode.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
            handleNode.on(Node.EventType.TOUCH_END, this.onTouchEnded, this);
            handleNode.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnded, this);
        }

        const isDefaultSkin = GameManager.instance.curSkin === 0;
        this.colorToggle.setState(isDefaultSkin ? ToggleState.On : ToggleState.Off);
        this.colorToggle.setOnCallback(() => {
            AudioUtils.btn_click_sound();
            console.log("彩色模式已开启");
            GameManager.instance.curSkin = 0;
            GameLocalStorage.setItem("curSkin", 0);
            GameManager.instance.curStage.changeSkin();
            if (GameManager.instance.curStage.curGuideStep === 6) {
                GameManager.instance.curStage.checkGuide(true);
            }
        });
        this.colorToggle.setOffCallback(() => {
            AudioUtils.btn_click_sound();
            console.log("彩色模式已关闭");
            GameManager.instance.curSkin = 1;
            GameLocalStorage.setItem("curSkin", 1);
            GameManager.instance.curStage.changeSkin();
            if (GameManager.instance.curStage.curGuideStep === 6) {
                GameManager.instance.curStage.checkGuide(true);
            }
        });

        const recorder = GameRecord.GetInstance().BaseRecorder;
        this.colorToggle.node.active = !isDefaultSkin || recorder.Data.CurLevel >= 15;
        if (DirectPlayUtil.isDirectPlay) {
            this.btnPause.active = false;
        }
    }

    init(): void {
        this.lbTimeNode.active = !Global.isForeignGame() && !DirectPlayUtil.isDirectPlay;
    }

    updateUI(): void {
        this.btnPause.active = true;
        this.lbTimeNode.active = !Global.isForeignGame();
        this.updateHintNum();
    }

    updateHintNum(): void {
        const hintCount = BagDataManager.getItemNumByItemCfgId(ItemID.Hint);
        this.lbHint.string = hintCount.toString();
        this.lbHint.node.active = hintCount > 0 && !DirectPlayUtil.isDirectPlay;

        const hintData = JsonClassStorage.instance.getOneJson("ItemData", "ItemId", ItemID.Hint);
        this.lbHintPrice.string = hintData.Price.toString();
        this.lbHintPrice.node.parent.active = hintCount <= 0 && !DirectPlayUtil.isDirectPlay;

        this.updateLineNum();
    }

    updateLineNum(): void {
        const self = this;
        const lineCount = BagDataManager.getItemNumByItemCfgId(ItemID.Line);
        this.lbLine.string = lineCount.toString();
        this.lbLine.node.active = lineCount > 0 && (SDKInstance.isWxPlatform() || SDKInstance.isFacebookMiniGame()) && !DirectPlayUtil.isDirectPlay;
        this.scheduleOnce(() => {
            self.shareNode.active = lineCount <= 0 && !self.lbSwitch.node.active && (SDKInstance.isWxPlatform() || SDKInstance.isFacebookMiniGame()) && !DirectPlayUtil.isDirectPlay;
        }, 0.1);
    }

    onStartLoad(): void {
        this.zoomSlider.node.active = false;
    }

    onLoadFinished(): void {
        this.zoomSlider.node.active = true;
    }

    updataLevelLabel(): void {
        if (DirectPlayUtil.isDirectPlay) return;

        this.winEmoji.active = false;
        this.isShow = false;
        this.lbGuideTxt.node.active = false;
        this.guideWheelNode.active = false;
        this.finger.active = false;
        this.lbSwitch.node.active = false;

        const lineCount = BagDataManager.getItemNumByItemCfgId(ItemID.Line);
        this.shareNode.active = lineCount <= 0 && (SDKInstance.isWxPlatform() || SDKInstance.isFacebookMiniGame());

        const curLevel = GameManager.instance.curLevel;
        const isRescue = (GameManager.instance.isRescueLevel() || GameManager.instance.forceRescueLevel(curLevel)) && GameManager.instance.gameType === GameType.MainLevel;

        this.colorToggle.node.active = GameManager.instance.curSkin !== 0 || curLevel >= 15;
        this.lbLevel.node.active = !isRescue;
        this.lbLevel.string = I18nManager.t("Level {0}", curLevel);
        this.lbScore.node.active = true;
        this.lbScore.string = I18nManager.t("Score: {0}", GameManager.instance.currentScore);
        this.pvpUI.active = false;
        this.lbTarget.node.parent.active = !isRescue;

        if (!SDKInstance.isFacebookMiniGame()) {
            this.lbScore.node.setPosition(this.lbScore.node.position.x, isRescue ? 70 : -15);
        }

        this.lbRescue.node.active = isRescue;

        if (GameManager.instance.gameType === GameType.Pvp) {
            this.lbLevel.node.active = false;
            this.lbScore.node.active = false;
            this.hardNode.active = false;
            this.superHardNode.active = false;
            this.scheduleOnce(() => {
                this.showPvpUI();
            }, 0.1);
            this.lbCombo.node.setPosition(0, -336);
            return;
        }

        if (Global.NEZPPVP) {
            Global.NEZPPVP.style.display = "none";
        }

        this.lbCombo.node.setPosition(0, Global.isForeignGame() ? -160 : -258);

        if (GameManager.instance.gameType === GameType.Challenge) {
            this.hardNode.active = false;
            this.superHardNode.active = true;
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            this.lbLevel.string = year + "/" + month.toString().padStart(2, "0") + "/" + GameManager.instance.curLevel.toString().padStart(2, "0");
            return;
        }

        if (GameManager.instance.gameType === GameType.Tournament) {
            this.hardNode.active = false;
            this.superHardNode.active = false;
            this.tournamentUI.active = true;
            this.lbLevel.node.active = false;
            return;
        }

        if (isRescue) {
            this.hardNode.active = false;
            this.superHardNode.active = false;
        } else {
            const diffType = GameManager.instance.getDiffType(curLevel);
            this.hardNode.active = diffType === LevelType.HARD;
            this.superHardNode.active = diffType === LevelType.SUPER_HARD;
        }
    }

    showPvpUI(): void {
        this.pvpUI.active = true;
        this.lbSelfScore.string = "0";

        const lbFriendScore = this.pvpUI.getChildByName("lbFriendScore");
        const pvpData = FB1vs1DataManager.instance.get1vs1Data();
        if (pvpData && pvpData.score && pvpData.score > 0) {
            lbFriendScore.getComponent(Label).string = pvpData.score.toString();
        } else {
            lbFriendScore.getComponent(Label).string = "???";
        }
        this.updatePvpAvaterAndName(pvpData);
    }

    updatePvpAvaterAndName(pvpData: any): void {
        this.pvpUI.getChildByName("lbSelfName").getComponent(Label).string = BaseDataManager.nickName;
        const selfAvatar = this.pvpUI.getChildByPath("avatarNode/avatar");
        UIUtils.setPlayerAvatarIcon(selfAvatar.getComponent(Sprite), BaseDataManager.userAvatar);

        const lbFriendName = this.pvpUI.getChildByName("lbFriendName");
        const friendAvatar = this.pvpUI.getChildByPath("avatarNode2/avatar");
        if (pvpData && pvpData.name) {
            lbFriendName.getComponent(Label).string = pvpData.name;
        } else {
            lbFriendName.getComponent(Label).string = I18nManager.t("Your friend");
        }
        if (pvpData && pvpData.avatar) {
            UIUtils.setPlayerAvatarIcon(friendAvatar.getComponent(Sprite), pvpData.avatar);
        } else {
            UIUtils.setPlayerAvatarIcon(friendAvatar.getComponent(Sprite), "1");
        }
    }

    UpdateTournamentScore(score: number): void {
        const totalScore = GameManager.instance.currentScore + score + this.getScoreByCombo(GameManager.instance.comboCount);
        GameManager.instance.currentScore = Math.max(0, totalScore);
        this.lbScore.string = I18nManager.t("Score: {0}", totalScore);
        this.lbSelfScore.string = totalScore.toString();
    }

    getScoreByCombo(combo: number): number {
        if (combo <= 0) return 0;
        if (combo < 30) return combo;
        if (combo < 60) return 30;
        if (combo < 90) return 60;
        return 90;
    }

    OnUpdateCombo(combo: number): void {
        const comboNode = this.lbCombo.node;
        if (comboNode.active) {
            comboNode.active = GameManager.instance.comboCount >= 2;
        } else {
            comboNode.setScale(Vec3.ZERO);
            comboNode.active = GameManager.instance.comboCount >= 2;
            tween(comboNode)
                .to(0.2, { scale: Vec3.ONE }, { easing: "backOut" })
                .start();
        }
        this.lbCombo.string = I18nManager.t("Combo X{0}", combo);
        this.duration = EasOperateSDK.combo_duration;
    }

    updateTips(): void {
        if (this.duration <= 0) return;
        this.duration--;
        if (this.duration === 0) {
            this.lbCombo.node.active = false;
            this.lbCombo.node.setScale(Vec3.ZERO);
            GameManager.instance.comboCount = 0;
        }
    }

    onInitHp(hp: number, isReset: boolean = false): void {
        if (DirectPlayUtil.isDirectPlay) return;

        if (isReset) {
            this.onResetHp(hp);
        } else {
            this.updataLevelLabel();
            this.levelHp = hp;
            CCExtends.DestroyNodeAllChildren(this.hpNode);
            for (let i = 0; i < hp; i++) {
                const hpItem = instantiate(this.hpItem);
                hpItem.isHide = false;
                hpItem.parent = this.hpNode;
            }
        }
    }

    onReduceHp(reduceCount: number, animate: boolean): void {
        const children = this.hpNode.children;
        let count = 0;
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            if (child.isHide) continue;
            child.isHide = true;
            if (animate) {
                tween(child)
                    .to(0.05, { eulerAngles: v3(0, 0, 15) })
                    .to(0.05, { eulerAngles: v3(0, 0, -15) })
                    .to(0.05, { eulerAngles: v3(0, 0, 10) })
                    .to(0.05, { eulerAngles: v3(0, 0, -10) })
                    .to(0.05, { eulerAngles: v3(0, 0, 5) })
                    .to(0.05, { eulerAngles: v3(0, 0, -5) })
                    .to(0.1, { eulerAngles: Vec3.ZERO })
                    .call(() => {
                        child.getChildByName("1").active = false;
                    })
                    .start();
            } else {
                child.getChildByName("1").active = false;
            }
            count++;
            if (count >= reduceCount) break;
        }
    }

    onResetHp(hp: number): void {
        const children = this.hpNode.children;
        for (let i = children.length - 1; i >= 0; i--) {
            children[i].getChildByName("1").active = i < hp;
        }
    }

    onUpdateTarget(current: number, total: number): void {
        if (this.lbTarget.node.parent.active) {
            this.lbTarget.string = current + "/" + total;
        }
    }

    onErrorAnim(): void {
        this.erroAnim.play();
    }

    onTimeUpdated(data: { remaining: number }): void {
        const remaining = data.remaining;
        if (GameManager.instance.gameType === GameType.MainLevel && GameManager.instance.curLevel <= 3) {
            this.lbTimer.string = "∞";
            this.lbTimer.node.setScale(2, 2, 2);
            this.lbTimer.node.setPosition(40, 5, 0);
        } else {
            this.lbTimer.string = TimeUtils.numberTommss(remaining);
            this.lbTimer.node.setScale(1, 1, 1);
            this.lbTimer.node.setPosition(40, 0, 0);
        }
    }

    onGridClick(): void {
        AudioUtils.btn_click_sound();
        if (!GameManager.instance.curStage.ready) return;

        const self = this;

        if (SDKInstance.isGooglePlayNative() || DirectPlayUtil.isDirectPlay) {
            const showGrid = GameManager.instance.curStage.ShowGrid;
            GameManager.instance.curStage.ShowGrid = !showGrid;
            this.lbSwitch.string = "";
            return;
        }

        if (this.lbSwitch.node.active) {
            const showGrid = GameManager.instance.curStage.ShowGrid;
            GameManager.instance.curStage.ShowGrid = !showGrid;
            this.lbSwitch.string = GameManager.instance.curStage.ShowGrid ? I18nManager.t("Off") : I18nManager.t("On");
            return;
        }

        if (this.lbLine.node.active) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantRemoveItem, [ItemID.Line, 1]);
            const showGrid = GameManager.instance.curStage.ShowGrid;
            GameManager.instance.curStage.ShowGrid = !showGrid;
            this.lbSwitch.node.active = true;
            this.lbSwitch.string = I18nManager.t("Off");
            return;
        }

        if (SDKInstance.isFacebookMiniGame()) {
            /*SDKInstance.shareImage({
                resultCallback: (success: boolean) => {
                    if (success) {
                        self.shareNode.active = false;
                        self.lbSwitch.node.active = true;
                        self.lbSwitch.string = I18nManager.t("Off");
                        GameManager.instance.shared = true;
                        const showGrid = GameManager.instance.curStage.ShowGrid;
                        GameManager.instance.curStage.ShowGrid = !showGrid;
                    }
                }
            });
            */
        } else {
            SDKInstance.shareAppMessage({
                resultCallback: (success: boolean) => {
                    if (success) {
                        self.scheduleOnce(() => {
                            self.shareNode.active = false;
                            self.lbSwitch.node.active = true;
                            self.lbSwitch.string = I18nManager.t("Off");
                            GameManager.instance.shared = true;
                            const showGrid = GameManager.instance.curStage.ShowGrid;
                            GameManager.instance.curStage.ShowGrid = !showGrid;
                        }, 0.5);
                    }
                },
                templateId: "3",
                adLocation: "game"
            });
        }
    }

    onTipsClick(): void {
        AudioUtils.btn_click_sound();
        if (!GameManager.instance.curStage.ready) return;

        if (DirectPlayUtil.isDirectPlay) {
            GameManager.instance.curStage.useHint();
            return;
        }

        if (this.lbHint.node.active) {
            GameManager.instance.curStage.useHint();
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantRemoveItem, [ItemID.Hint, 1]);
            return;
        }

        const hintData = JsonClassStorage.instance.getOneJson("ItemData", "ItemId", ItemID.Hint);
        if (GameRecord.GetInstance().BaseRecorder.Data.Gold < hintData.Price) {
            UIManager.createPanel("game", "ShopView", { setData: true });
        } else {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantConsumeGold, hintData.Price);
            GameManager.instance.curStage.useHint();
        }
    }

    onUseTips(): void {
        GameManager.instance.curStage.useHint();
    }

    onFillHpClick(): void {
        AudioUtils.btn_click_sound();
        if (!GameManager.instance.curStage.ready) return;

        if (GameManager.instance.curStage.isHpFull()) {
            Toast.instance.tip_div("Hearts are full!");
            return;
        }

        const fillHpData = JsonClassStorage.instance.getOneJson("ItemData", "ItemId", ItemID.FillHp);
        if (GameRecord.GetInstance().BaseRecorder.Data.Gold < fillHpData.Price) {
            UIManager.createPanel("game", "ShopView", { setData: true });
            return;
        }

        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantConsumeGold, fillHpData.Price);
        GameManager.instance.curStage.fullHp();
        CCExtends.DestroyNodeAllChildren(this.hpNode);
        for (let i = 0; i < this.levelHp; i++) {
            const hpItem = instantiate(this.hpItem);
            hpItem.isHide = false;
            hpItem.parent = this.hpNode;
        }
        Toast.instance.tip_div("Hearts full!");
    }

    onSlider(slider: Slider, customData: any): void {
        GameManager.instance.curStage.gameCamera.sliderUpdateOrthoHeight(slider.progress);
        const guideStep = GameManager.instance.curStage.curGuideStep;
        if (guideStep === 4 || guideStep === 5) {
            GameManager.instance.curStage.checkGuide(false);
            this.onShowGuideText(99);
        }
    }

    onTouchStart(event: any): void {
        GameManager.instance.curStage.gameCamera.isSlidering = true;
    }

    onTouchEnded(event: any): void {
        GameManager.instance.curStage.gameCamera.isSlidering = false;
    }

    onUpdateSlider(progress: number): void {
        this.zoomSlider.progress = progress;
    }

    onShowGuideText(step: number): void {
        if (step === 1) {
            this.lbGuideTxt.node.active = true;
            this.lbGuideTxt.string = I18nManager.t("Tap to move");
            this.guideWheelNode.active = false;
        } else if (step === 2) {
            this.lbGuideTxt.node.active = true;
            const platform = SDKInstance.getPlatform();
            if (platform === "IOS" || platform === "ANDROID") {
                this.lbGuideTxt.string = I18nManager.t("Pinch to zoom");
                this.guideWheelNode.active = false;
            } else {
                this.lbGuideTxt.string = I18nManager.t("Scroll the mouse wheel to zoom");
                this.guideWheelNode.active = true;
            }
            GameLocalStorage.setItem("guide_step", 5);
        } else if (step === 3) {
            GameLocalStorage.setItem("guide_step", 5);
        } else if (step === 4) {
            this.lbGuideTxt.node.active = true;
            this.lbGuideTxt.string = I18nManager.t("Change arrow color");
            this.colorToggle.node.active = true;
            this.guideColorNode.active = true;
            GameLocalStorage.setItem("guide_step", 6);
        } else {
            this.guideWheelNode.active = false;
            this.lbGuideTxt.node.active = false;
            this.finger.active = false;
            this.guideColorNode.active = false;
        }
    }

    onShowSliderGuide(): void {
        this.finger.active = true;
        Tween.stopAllByTarget(this.finger);
        const progress = this.zoomSlider.progress; // unused
        const slideTween = tween(this.finger)
            .by(1, { position: new Vec3(100, 0, 0) }, { easing: "quadOut" })
            .to(0.1, { position: Vec3.ZERO });
        tween(this.finger)
            .then(slideTween)
            .repeatForever()
            .start();
    }

    onGameFail(type: any): void {
        console.log("onGameFail: ", type);
        GameController.instance.is_pause = true;
        if (Global.isForeignGame()) {
            UIManager.createPanel("game", "GameLoseView", {
                showAnimation: true,
                setData: {
                    hp: this.levelHp,
                    type: type
                }
            });
        } else {
            UIManager.createPanel("game", "GameLoseViewWX", {
                showAnimation: true,
                setData: {
                    hp: GameController.instance.baseCfg.ReviveHp,
                    type: type
                }
            });
        }
    }

    onGameWin(level: any, isRealWin: boolean, isRescue: boolean): void {
        console.log("onGameWin======", level, isRealWin, isRescue);
        this.lbGuideTxt.node.active = false;
        this.guideWheelNode.active = false;
        this.finger.active = false;
        this.guideColorNode.active = false;

        if (Global.isForeignGame()) {
            UIManager.createPanel("game", "GameWinView", {
                setData: {
                    isRealWin: isRealWin,
                    isRescue: isRescue
                }
            });
        } else {
            UIManager.createPanel("game", "GameWinViewWX", {
                setData: {
                    isRealWin: isRealWin,
                    isRescue: isRescue
                }
            });
        }
    }

    onPauseClick(): void {
        AudioUtils.btn_click_sound();
        if (GameManager.instance.curStage.ready) {
            UIManager.createPanel("game", "SettingView", {
                showAnimation: true,
                setData: {
                    isMain: false,
                    gameType: GameManager.instance.gameType
                }
            });
        }
    }

    initNEZPContainer(): void {
        if (!SDKInstance.isFacebookMiniGame() || this.nezpPvpContainer) return;

        console.log("initNEZPContainer=======");
        this.nezpPvpContainer = {
            id: "NEZPPVP",
            element: Global.NEZPPVP,
            referNode: this.pvpUI
        };

        const visibleSize = view.getVisibleSize();

        if (this.nezpPvpContainer.element) {
            console.log("重置已有容器========");
            this.nezpPvpContainer.element.querySelectorAll("iframe").forEach((iframe: any) => iframe.remove());
        } else {
            this.nezpPvpContainer.element = NezpTools.createContainer(this.nezpPvpContainer.id, "publicContainer", this.nezpPvpContainer.referNode);
            if (!this.nezpPvpContainer.element) return;

            console.log("创建新容器=====");
            const worldPos = this.nezpPvpContainer.referNode.parent.getComponent(UITransform).convertToWorldSpaceAR(this.nezpPvpContainer.referNode.position);
            worldPos.y = visibleSize.height - worldPos.y;

            const offset = {
                left: (worldPos.x - this.nezpPvpContainer.referNode.getComponent(UITransform).width / 2) * NezpTools.staticDomRatio,
                top: (worldPos.y - this.nezpPvpContainer.referNode.getComponent(UITransform).height / 2) * NezpTools.staticDomRatio
            };

            this.nezpPvpContainer.element.style.width = NezpTools.staticDomRatio * this.nezpPvpContainer.referNode.getComponent(UITransform).width + "px";
            this.nezpPvpContainer.element.style.height = NezpTools.staticDomRatio * this.nezpPvpContainer.referNode.getComponent(UITransform).height + "px";
            this.nezpPvpContainer.element.style.position = "absolute";
            this.nezpPvpContainer.element.style.left = offset.left + "px";
            this.nezpPvpContainer.element.style.top = offset.top + "px";
            this.nezpPvpContainer.element.style.display = "none";
            this.nezpPvpContainer.element.style.pointerEvents = "none";
            this.nezpPvpContainer.element.style.border = "none";
            this.nezpPvpContainer.element.style.outline = "none";
            this.nezpPvpContainer.element.style.overflow = "hidden";
            Global.NEZPPVP = this.nezpPvpContainer.element;
        }

        this.nezpPvpData = {};
    }

    renderPvpOverlayView(): void {
        if (!SDKInstance.isFacebookMiniGame()) return;

        const self = this;
        this.waitNode1.active = true;
        tween(this.waitNode1).by(1, { angle: 360 }).repeatForever().start();
        this.waitNode2.active = true;
        tween(this.waitNode2).by(1, { angle: 360 }).repeatForever().start();

        const uuid = BaseDataManager.uuid;
        const playerID2 = this.nezpPvpData.playerID2;
        const playerName2 = this.nezpPvpData.playerName2 || "";
        const friendName = playerName2 === "" ? "Your friend" : playerName2;

        console.log("renderPvpOverlayView:", playerID2, friendName);
        this.isShow = true;

        const sr = NezpTools.staticDomRatio;
        const viewWidth = 890 * sr;
        const viewHeight = 180 * sr;
        const avatarSize = 102 * sr;
        const marginLeft = 5.5 * sr;
        const marginTop = 39 * sr;
        const marginRight = 7 * sr;
        const nameWidth = 240 * sr;
        const nameHeight = 45 * sr;
        const nameLeft = 135 * sr;
        const nameTop = 17 * sr;
        const nameRight = 135 * sr;
        const nameFontSize = 35 * sr;

        let xmlString = `
            <View>
                <View onTapEvent="SendGift_${uuid}" style="width: ${viewWidth}px;height: ${viewHeight}px;box-sizing: border-box;position: relative;">
                    <Image src="{{FBInstant.players[${uuid}].photo}}"  style="position: absolute;left: ${marginLeft}px;top: ${marginTop}px; width: ${avatarSize}px; height: ${avatarSize}px;" className="profilePicture" />
                    <Text content="{{FBInstant.players[${uuid}].name}}" style="width: ${nameWidth}px;height: ${nameHeight}px;position: absolute;left: ${nameLeft}px;top: ${nameTop}px;font-size: ${nameFontSize}px;line-height: ${nameHeight}px;margin: 0px; color: rgb(213, 204, 113);white-space: nowrap;overflow: hidden;text-overflow: ellipsis;" className="playerName"/>
                    <Image src="{{FBInstant.players[${playerID2}].photo}}"  style="position: absolute;right: ${marginRight}px;top: ${marginTop}px; width: ${avatarSize}px; height: ${avatarSize}px;" className="profilePicture" />
                    <Text content="{{FBInstant.players[${playerID2}].name}}" style="width: ${nameWidth}px;height: ${nameHeight}px;position: absolute;right: ${nameRight}px;top: ${nameTop}px;font-size: ${nameFontSize}px;line-height: ${nameHeight}px;margin: 0px; color: rgb(255, 255, 255);white-space: nowrap;overflow: hidden;text-overflow: ellipsis;text-align: right;" className="playerName"/>
                </View>
            </View>
        `;

        if (playerID2.length < 17 || playerID2 === "25415163034850301") {
            xmlString = `
                <View>
                    <View onTapEvent="SendGift_${uuid}" style="width: ${viewWidth}px;height: ${viewHeight}px;box-sizing: border-box;position: relative;">
                        <Image src="{{FBInstant.players[${uuid}].photo}}"  style="position: absolute;left: ${marginLeft}px;top: ${marginTop}px; width: ${avatarSize}px; height: ${avatarSize}px;" className="profilePicture" />
                        <Text content="{{FBInstant.players[${uuid}].name}}" style="width: ${nameWidth}px;height: ${nameHeight}px;position: absolute;left: ${nameLeft}px;top: ${nameTop}px;font-size: ${nameFontSize}px;line-height: ${nameHeight}px;margin: 0px; color: rgb(213, 204, 113);white-space: nowrap;overflow: hidden;text-overflow: ellipsis;" className="playerName"/>
                        <Image src="default.png"  style="position: absolute;right: ${marginRight}px;top: ${marginTop}px; width: ${avatarSize}px; height: ${avatarSize}px;" className="profilePicture" />
                        <Text content="${friendName}" style="width: ${nameWidth}px;height: ${nameHeight}px;position: absolute;right: ${nameRight}px;top: ${nameTop}px;font-size: ${nameFontSize}px;line-height: ${nameHeight}px;margin: 0px; color: rgb(255, 255, 255);white-space: nowrap;overflow: hidden;text-overflow: ellipsis;text-align: right;" className="playerName" />
                    </View>
                </View>
            `;
        }

        if (this.nezpPvpView) {
            this.nezpPvpView.updateAsync({ updatedData: this.nezpPvpData })
                .then(() => {
                    console.log("nezpPvpView updateAsync OverlayView succ ");
                    if (Global.NEZPPVP) {
                        Global.NEZPPVP.style.display = "block";
                    }
                    if (self.isShow && self.nezpPvpView) {
                        self.nezpPvpView.showAsync();
                    }
                    self.waitNode1.active = false;
                    self.waitNode2.active = false;
                })
                .catch((error: any) => {
                    console.log("nezpPvpView updateAsync OverlayView fail: ", error);
                });
        } else {
            FBInstant.overlayViews.createOverlayViewWithXMLStringAsync(xmlString, Global.NEZPPVP, "", "overlayViews.css", this.nezpPvpData, "")
                .then((overlayView: any) => {
                    self.nezpPvpView = overlayView;
                    console.log("创建nezpPvpView成功");
                    if (self.nezpPvpView) {
                        const iframeElement = self.nezpPvpView.iframeElement;
                        iframeElement.style.width = "100%";
                        iframeElement.style.height = viewHeight + "px";
                        iframeElement.style.position = "absolute";
                        iframeElement.style.left = "0px";
                        iframeElement.style.top = "0px";
                        iframeElement.style.pointerEvents = "none";
                        iframeElement.style.border = "none";
                        iframeElement.style.outline = "none";
                        if (Global.NEZPPVP) {
                            Global.NEZPPVP.style.display = "block";
                        }
                        self.nezpPvpView.showAsync();
                        self.scheduleOnce(() => {
                            self.waitNode1.active = false;
                            self.waitNode2.active = false;
                        }, 0.5);
                    }
                })
                .catch((error: any) => {
                    const pvpData = FB1vs1DataManager.instance.get1vs1Data();
                    self.updatePvpAvaterAndName(pvpData);
                    self.waitNode1.active = false;
                    self.waitNode2.active = false;
                    console.error("创建nezpPvpView失败：", error);
                });
        }
    }

    tempShowOrHideOverlayView(show: boolean): void {
        // Intentional empty method
    }

    onHidePvpUI(): void {
        this.pvpUI.active = false;
    }

    onShowTips50(): void {
        if (!this.tips50.active) {
            this.tips50.active = true;
            this.pctSpine.setAnimation(0, "animation", false);
        }
    }

    onWinEmojiAnim(level: any, isRescue: boolean): void {
        if (this.winEmoji.active || !this.winEmoji) return;

        try {
            this.winEmoji.active = true;
            const index = Utilsqdd.randomTwoNum(0, 3);
            this.lbEmoji.string = I18nManager.t(this.emojiTxt[index]);

            const animConfig = {
                armatureName: "default",
                ani: "animation",
                time: 1,
                scale: Vec3.ONE,
                timeScale: 1.5
            };
            const emojiName = this.emojiCfg[index];
            const self = this;
            UIUtils.show_effect(
                "$emoji/" + emojiName + "/" + emojiName,
                animConfig,
                this.emoji,
                null,
                () => {
                    self.winEmoji.active = false;
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameWin, level, true, isRescue);
                },
                this.emoji
            );
        } catch (error) {
            this.winEmoji.active = false;
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameWin, level, true, isRescue);
        }
    }

    calcBeatPlayerPercent(score: number, time: number, maxTime: number = 60): number {
        let scorePercent = 70 - 1.3 * score;
        scorePercent = Math.max(scorePercent, 0);
        let timePercent = 25 + 0.04 * (maxTime - time);
        timePercent = Math.max(timePercent, 0);
        let totalPercent = scorePercent + timePercent;
        totalPercent = Math.min(totalPercent, 99.99);
        return parseFloat(totalPercent.toFixed(2));
    }
}