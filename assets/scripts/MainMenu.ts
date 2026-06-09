import { _decorator, Label, Node, Sprite, ProgressBar, Size, Vec3, sys, Widget, view } from "cc";
import { DnSdkManager } from "./DnSdkManager";
import { LieyouSDK } from "./SDK/LieyouSDK";
import { LevelType, GameType } from "./GlobalEnum";
import { BundleManager } from "./BundleManager";
import { UIManager } from "./UIManager";
import { GameController } from "./GameController";
import { BaseDataManager } from "./BaseDataManager";
import { FB1vs1DataManager } from "./FB1vs1DataManager";
import { ShopDataManager } from "./Shop/ShopDataManager";
import { TournamentDataManager } from "./Tournament/TournamentDataManager";
import { TournamentWxMgr } from "./Tournament/TournamentWxMgr";
import { UILayerManager } from "./UILayerManager";
import { GameManager } from "./GameManager";
import { SaveManager } from "./SaveManager";
import { I18nManager, Language } from "./I18nManager";
import { EPlatformSceneCode } from "./SDK/AbstractPlatformSDK";
import { Loading } from "./Loading";
import { UIUtils } from "./Utils/UIUtils";
import { EventManager } from "./Event/EventManager";
import { ModuleEventKey } from "./IGameRawData";
import { GameRecord } from "./GameRecord";
import { AudioUtils } from "./Utils/AudioUtils";
import { Toast } from "./Toast";
import { GameLogicConfig } from "./GameLogicConfig";
import { MainNavMenu } from "./MainNavMenu";
import { Global } from "./Global";
import { AchievementManager } from "./Achievement/AchievementManager";
import { EasDataSDK } from "./EasDataSDK";
import { ConfigHelper } from "./ConfigHelper";
import { EasOperateSDK } from "./EasOperateSDK";
import { GameLocalStorage } from "./GameLocalStorage";
import { Utils } from "./Utils";
import { TierManager } from "./TierManager";
import { GameChannel } from "./GameChannel";

const { ccclass, property } = _decorator;

@ccclass("MainMenu")
export class MainMenu extends MainNavMenu {
    @property(Label)
    public lbLevel: Label = null;

    @property(Label)
    public lbRescue: Label = null;

    @property(Node)
    public hardNode: Node = null;

    @property(Node)
    public superHardNode: Node = null;

    @property(Node)
    public rescueNode: Node = null;

    @property(Node)
    public fbBtnPanel: Node = null;

    @property(Node)
    public wxBtnPanel: Node = null;

    @property(Node)
    public btnDailyReward: Node = null;

    @property(Node)
    public btnInvite: Node = null;

    @property(Node)
    public btnShare: Node = null;

    @property(Node)
    public btnInviteFB: Node = null;

    @property(Node)
    public btn1vs1: Node = null;

    @property(Node)
    public btnNoAds: Node = null;

    @property(Node)
    public btnAchi: Node = null;

    @property(Sprite)
    public avatar: Sprite = null;

    @property(Node)
    public editBtn: Node = null;

    @property(Node)
    public achievementRedP: Node = null;

    @property(Node)
    public achievementRedP1: Node = null;

    @property([Node])
    public scrollBgs: Node[] = [];

    @property(Node)
    public logoEn: Node = null;

    @property(Node)
    public logoZh: Node = null;

    @property(Node)
    public logojyxjj: Node = null;

    @property(Node)
    public logoGp: Node = null;

    @property(Sprite)
    public tierIcon: Sprite = null;

    @property(ProgressBar)
    public tierProgressBar: ProgressBar = null;

    @property(Label)
    public lbTier: Label = null;

    @property(Label)
    public lbTierName: Label = null;

    public isContinue: boolean = false;
    private _screenSize: Size = new Size();
    private _scrollDir: Vec3 = new Vec3(-1, -1, 0).normalize();
    private _tempMoveStep: Vec3 = new Vec3();
    private _tempNodePos: Vec3 = new Vec3();

    public onDestroy(): void {
        super.onDestroy();
        EventManager.offAll(this);
    }

    public onLoad(): void {
        const self = this;
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.OnUpdateMainMenu, this.updateUI, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ModifyPlayerAvatar, this.updatePlayerAvatar, this);

        const isEditor = sys.isBrowser && (CC_EDITOR || CC_PREVIEW);
        this.editBtn.active = isEditor;

        const isFacebook = SDKInstance.isFacebookMiniGame();
        this.scheduleOnce(() => {
            self.avatar.node.parent.active = isFacebook || SDKInstance.isGooglePlayNative();
            self.avatar.node.parent.getComponent(Widget).top = isFacebook ? 18 : 78;
            self.btn1vs1.parent.getComponent(Widget).top = isFacebook ? 476 : 700;
            self.btnDailyReward.parent.getComponent(Widget).top = isFacebook ? 476 : 700;
        });

        this.logoEn.active = I18nManager.getLanguage() === Language.EN && SDKInstance.isFacebookMiniGame();
        this.logoGp.active = I18nManager.getLanguage() === Language.EN && SDKInstance.isGooglePlayNative();
        this.logoZh.active = I18nManager.getLanguage() === Language.ZH && GameChannel.isOfficial;
        this.logojyxjj.active = I18nManager.getLanguage() === Language.ZH && GameChannel.isCloneXJJ;
        this.btnShare.active = isFacebook;
        this.btnInviteFB.active = isFacebook;
        this.btn1vs1.active = isFacebook;
        this.btnNoAds.active = Global.isForeignGame();
        this.fbBtnPanel.active = I18nManager.getLanguage() === Language.EN;
        this.wxBtnPanel.active = I18nManager.getLanguage() === Language.ZH;

        const currentLevel = GameRecord.GetInstance().BaseRecorder.Data.CurLevel;
        if (!BaseDataManager.isNewUser && currentLevel > 1) {
            SDKInstance.createShortcut();
        }

        if (isFacebook) {
            EasOperateSDK.init();
        }
    }

    public start(): void {
        this._screenSize = view.getVisibleSize();
        this.onCheckJoinTournament();
        if (Global.isFirstEnter) {
            this.firstEnterGame();
        }
    }

    public update(deltaTime: number): void {
        if (this.scrollBgs.length === 9) {
            this._tempMoveStep.set(this._scrollDir);
            this._tempMoveStep.multiplyScalar(50 * deltaTime);

            for (let i = 0; i < this.scrollBgs.length; i++) {
                const bgNode = this.scrollBgs[i];
                if (bgNode) {
                    const position = bgNode.position;
                    this._tempNodePos.x = position.x + this._tempMoveStep.x;
                    this._tempNodePos.y = position.y + this._tempMoveStep.y;
                    this._tempNodePos.z = position.z + this._tempMoveStep.z;
                    bgNode.setPosition(this._tempNodePos);
                }
            }
            this.resetBgNodes();
        }
    }

    private resetBgNodes(): void {
        for (const bgNode of this.scrollBgs) {
            if (bgNode) {
                const position = bgNode.position;
                if (position.x < -3007.5) {
                    bgNode.setPosition(position.x + 6015, position.y, 0);
                } else if (position.x > 6015) {
                    bgNode.setPosition(position.x - 6015, position.y, 0);
                }

                if (position.y < -3189) {
                    bgNode.setPosition(position.x, position.y + 6378, 0);
                } else if (position.y > 6378) {
                    bgNode.setPosition(position.x, position.y - 6378, 0);
                }
            }
        }
    }

    private onCheckJoinTournament(): void {
        /*console.log("onCheckJoinTournament=========");
        if (SDKInstance.isFacebookMiniGame()) {
            const contextId = FBInstant.context.getID();
            console.log("MainMenu current context:", contextId);
            TournamentDataManager.instance.getCurrentTournament();
            FB1vs1DataManager.instance.getEntryPointData();
        }*/
    }

    public OnShow(): void {
        // Empty implementation
    }

    public OnEvent(event: any): void {
        // Empty implementation
    }

    public updateUI(shouldShowProfile?: boolean): void {
        this.updatePlayerAvatar();
        this.updateTierUI();
        this.achievementRedP.active = AchievementManager.instance.hasRedPoint();
        this.achievementRedP1.active = AchievementManager.instance.hasRedPoint();

        const arrowData = new SaveManager(SaveManager.ARROW).load();
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        let currentLevel = baseRecorder.Data.CurLevel;
        const pendingRescue = baseRecorder.Data.pendingRescue;

        this.rescueNode.active = pendingRescue || GameManager.instance.forceRescueLevel(currentLevel);
        this.lbRescue.node.active = this.rescueNode.active;
        this.lbLevel.node.active = !this.rescueNode.active;

        if (pendingRescue) {
            currentLevel = baseRecorder.Data.rescueLevel ?? 1;
        }

        const hasContinueData = arrowData && arrowData.level === currentLevel && (arrowData.removedArrowIds.length > 0 || arrowData.errorArrowIds.length > 0);
        this.isContinue = !!hasContinueData;

        if (this.isContinue) {
            this.lbLevel.string = I18nManager.t("Continue");
        } else {
            this.lbLevel.string = I18nManager.t("Level {0}", currentLevel);
        }

        if (this.rescueNode.active) {
            this.hardNode.active = false;
            this.superHardNode.active = false;
            if (this.isContinue) {
                this.lbRescue.string = I18nManager.t("Continue");
            } else {
                this.lbRescue.string = I18nManager.t("Rescue");
            }
        } else {
            const difficultyType = GameManager.instance.getDiffType(currentLevel);
            this.hardNode.active = difficultyType === LevelType.HARD;
            this.superHardNode.active = difficultyType === LevelType.SUPER_HARD;
        }

        this.refreshBtnDailyRewards();
        this.updateBtnInvite(true);

        const hasNotModifiedName = Number(GameLocalStorage.getItem("modifyName") || 0) === 0;

        if (SDKInstance.isFacebookMiniGame() && currentLevel > EasOperateSDK.modify_name_level && hasNotModifiedName && !shouldShowProfile) {
            UIManager.createPanel("game", "ProfileView", {
                showAnimation: true,
                setData: true
            });
        }
    }

    private updateTierUI(): void {
        const tierData = TierManager.instance.getViewData();
        this.tierProgressBar.progress = tierData.percent;

        if (tierData.isMax) {
            this.lbTier.string = tierData.nextName;
        } else {
            const levelSuffix = I18nManager.getLanguage() === Language.EN ? "Levels" : "关卡";
            this.lbTier.string = tierData.progress + "/" + tierData.target + levelSuffix;
        }

        this.lbTierName.string = tierData.name;
        UIUtils.setTierIcon(this.tierIcon, tierData.icon);
    }

    private firstEnterGame(): void {
        /*if (UILayerManager.instance.UIMainMenuLayer.active) {
            if (SDKInstance.isFacebookMiniGame()) {
                TournamentDataManager.instance.CheckTournamentSettlement();
            } else {
                TournamentWxMgr.instance.CheckTournamentSettlement();
            }
        }*/

        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        const currentLevel = baseRecorder.Data.CurLevel;

        if (currentLevel === 1) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, currentLevel, GameType.MainLevel);

            if (SDKInstance.isWxPlatform() || SDKInstance.isGooglePlayNative()) {
                if (SDKInstance.isGooglePlayNative()) {
                    Utils.instance.StartGame(currentLevel.toString(), "MainLevel");
                } else {
                    LieyouSDK.gameBeginLevel(currentLevel, "MainLevel");
                    DnSdkManager.instance.sdk?.track("LEVEL_ENTER", {
                        game_mode: "主线",
                        level_id: currentLevel,
                        coin_amount: baseRecorder.Data.Gold,
                        stamina_value: baseRecorder.Data.HeartData.CurrentHearts
                    });
                }
            }

            EasDataSDK.trackEvent("login_behavior");
            EasDataSDK.trackEvent("user_registration");
        }

        ShopDataManager.instance.onEnterGame();
        Global.isFirstEnter = false;
    }

    public onPlayClick(): void {
        AudioUtils.btn_click_sound();

        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        let currentLevel = baseRecorder.Data.CurLevel;

        if (baseRecorder.Data.pendingRescue) {
            currentLevel = baseRecorder.Data.rescueLevel ?? 1;
        }

        if (this.isContinue) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, currentLevel, GameType.MainLevel);
        } else if (baseRecorder.Data.HeartData.CurrentHearts <= 0 && !baseRecorder.isHeartInInfinite()) {
            UIManager.createPanel("game", "FillHeartView", {
                showAnimation: true,
                setData: false
            });
        } else {
            if (SDKInstance.isWxPlatform() || SDKInstance.isGooglePlayNative()) {
                if (SDKInstance.isGooglePlayNative()) {
                    const gameMode = baseRecorder.Data.pendingRescue ? "RescueLevel" : "MainLevel";
                    Utils.instance.StartGame(currentLevel.toString(), gameMode);
                } else {
                    const gameMode = baseRecorder.Data.pendingRescue ? "RescueLevel" : "MainLevel";
                    LieyouSDK.gameBeginLevel(currentLevel, gameMode);
                    if (!baseRecorder.Data.pendingRescue) {
                        DnSdkManager.instance.sdk?.track("LEVEL_ENTER", {
                            game_mode: "主线",
                            level_id: currentLevel,
                            coin_amount: baseRecorder.Data.Gold,
                            stamina_value: baseRecorder.Data.HeartData.CurrentHearts
                        });
                    }
                }
            }

            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantUseHeart, 1);
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GameStart, currentLevel, GameType.MainLevel);
        }
    }

    public onSettingClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "SettingView", {
            showAnimation: true,
            setData: {
                isMain: true,
                gameType: GameType.MainLevel
            }
        });
    }

    public onAvatarClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "ProfileView", {
            showAnimation: true,
            setData: false
        });
    }

    public updatePlayerAvatar(): void {
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        UIUtils.setPlayerAvatarIcon(this.avatar, baseRecorder.Data.PlayerAvatar);
    }

    public onChallengeClick(): void {
        AudioUtils.btn_click_sound();

        const currentLevel = GameRecord.GetInstance().BaseRecorder.Data.CurLevel;
        if (currentLevel < GameController.instance.baseCfg.UnlockChalleng) {
            Toast.instance.tip_div("{0} levels unlocked", 0, 0, GameController.instance.baseCfg.UnlockChalleng.toString());
        } else {
            DnSdkManager.instance.sdk?.track("ENTER_CHALLENGE_MODE", {});
            UIManager.createPanel("game", "DailyChallengeView");
        }
    }

    public onShareClick(): void {
        AudioUtils.btn_click_sound();
        SDKInstance.shareImage();
    }

    public onInviteClick(): void {
        const self = this;
        AudioUtils.btn_click_sound();

        /*if (SDKInstance.isFacebookMiniGame()) {
            SDKInstance.invite();
        } else if (SDKInstance.isWxPlatform()) {
            UIManager.createPanel("game", "WechatCollectReward", {
                showAnimation: true,
                closeFuncion: () => {
                    self.updateBtnInvite();
                }
            });
        }*/
    }

    public updateBtnInvite(shouldCheckClaim?: boolean): void {
        const self = this;
        if (shouldCheckClaim === undefined) {
            shouldCheckClaim = false;
        }

        if (SDKInstance.isWxPlatform()) {
            const baseRecorder = GameRecord.GetInstance().BaseRecorder;
            if (shouldCheckClaim && SDKInstance.isSceneCodeEqual(EPlatformSceneCode.MYGAME) && !baseRecorder.Data.ClaimedCollectReward) {
                UIManager.createPanel("game", "WechatCollectReward", {
                    showAnimation: true,
                    closeFuncion: () => {
                        self.updateBtnInvite();
                    }
                });
            }
            this.btnInvite.active = !baseRecorder.Data.ClaimedCollectReward;
        }
    }

    public onDailyTaskClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "DailyTaskView", {
            showAnimation: true,
            setData: {
                checkAutoReceive: false
            }
        });
    }

    private refreshBtnDailyRewards(): void {
        const dailyRewardsRecorder = GameRecord.GetInstance().DailyRewardsRecorder;
        this.btnDailyReward.active = dailyRewardsRecorder.Data.getTimes < 7;
    }

    public onDailtRewardClick(): void {
        const self = this;
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "DailyRewardsView", {
            showAnimation: true,
            closeFuncion: () => {
                self.refreshBtnDailyRewards();
            }
        });
    }

    public onNoAdsClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "RemoveAdsView", {
            showAnimation: true
        });
    }

    public On1vs1Click(): void {
        AudioUtils.btn_click_sound();

        /*if (SDKInstance.isFacebookMiniGame()) {
            FB1vs1DataManager.instance.chooseAsync();
        } else if (SDKInstance.isWxPlatform()) {
            SDKInstance.getUserInfo({
                resultCallback: (success: boolean, userInfo: any) => {
                    if (success) {
                        GameRecord.GetInstance().BaseRecorder.saveUserInfo(userInfo);
                    }
                }
            });
        }*/
    }

    public onAchievementClick(): void {
        const self = this;
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "AchievementView", {
            showAnimation: true,
            closeFuncion: () => {
                self.achievementRedP.active = AchievementManager.instance.hasRedPoint();
                self.achievementRedP1.active = AchievementManager.instance.hasRedPoint();
            }
        });
    }

    public onGameClubClick(): void {
        AudioUtils.btn_click_sound();

        const gameClubLink = ConfigHelper.getGameConfig().gameClubLink;
        if (gameClubLink !== "") {
            const pageManager = wx.createPageManager();
            if (pageManager) {
                pageManager.load({
                    openlink: gameClubLink
                }).then((result: any) => {
                    console.log(result);
                    pageManager.show();
                }).catch((error: any) => {
                    console.error(error);
                });
            } else {
                Toast.instance.tip_div("该版本不支持游戏圈");
            }
        } else {
            Toast.instance.tip_div("暂未开启此功能");
        }
    }

    public onTierClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "TierInfoView", {
            showAnimation: true,
            closeFuncion: () => {
                // Empty callback
            }
        });
    }

    public async onEditClick() {
        await BundleManager.instance.loadBundle("editor");
        Loading.safeLoadScene("LevelEditor");
    }
}