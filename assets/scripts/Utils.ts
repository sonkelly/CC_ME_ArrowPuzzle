import { _decorator, Component, Node, game, director, instantiate, isValid, Widget, native, tween, easing, Label, Tween, v3 } from 'cc';
import { AdManager } from './AdManager';
import { CommonConfig } from './CommonConfig';
import { PlatUtils } from './Utils/PlatUtils';
import { YZ_Tool_Native } from './YZ_Tool_Native';
import { YZ_Constant, VibrateType, LevelStatus, BannerLocation, ViewLocation } from './YZ_Constant';
import { YZ_LocalStorage } from './YZ_LocalStorage';
import { YouWanAnalytics } from './YouWanAnalytics';
import { YwLogUtils } from './Utils/YwLogUtils';
import { AAA_CompatibleTool } from './AAA_CompatibleTool';

const { ccclass, property } = _decorator;

@ccclass('Utils')
export class Utils extends Component {
    private static _instance: Utils = null;

    public static get instance(): Utils {
        return Utils._instance;
    }

    public static set instance(value: Utils) {
        Utils._instance = value;
    }

    @property({ displayName: "组件版本", readonly: true })
    public utilsVersion: string = "Android-Haiwai-3D_3.0.0";

    @property({ type: CommonConfig, displayName: "配置信息" })
    public config: CommonConfig = null;

    public isTestModel: boolean = false;
    public adManager: AdManager = null;
    public currentLevel: number = 0;
    public isSuccess: boolean = undefined;
    public isRecording: boolean = false;
    public rewardCallFunc: Function = null;
    public rewardCloseFunc: Function = null;
    public rewardValue: number = 0;
    public luckBoxShowCount: number = -1;
    public nativeInsertShowCount: number = 0;
    public nativeInsertResizeCloseBtnShowCount: number = 0;
    public nativeBannerShowCount: number = 0;
    public nativeBannerResizeCloseBtnShowCount: number = 0;
    public turnTablePanelCloseFunc: Function = null;
    public shareRecordPanelCloseFunc: Function = null;
    public rewardBoxPanelCloseFunc: Function = null;
    public rewardShortCutPanelCloseFunc: Function = null;
    public rewardRecGamePanelCloseFunc: Function = null;
    public rewardLuckBoxPanelCloseFunc: Function = null;
    private _bannerCloseTime: number = 0;
    private _other_config: any = null;
    private _tool_Native: YZ_Tool_Native = null;
    private _isConfigInit: boolean = false;
    private _isServerInit: boolean = false;
    private _gameEntryTime: number = 0;
    private _isServerLoadSuccess: boolean = false;
    private _recommendGamesBanner: Node = null;
    private _recommendGamesList: Node = null;
    private _tryGamesWidget: Node = null;
    private _moreGamesWidget: Node = null;
    private _moreGamesSidePanelBaidu: Node = null;
    private _recordWidget: Node = null;
    private _shortcutWidget: Node = null;
    private _nativeTryGameNode: Node = null;
    public tryGameDate: any[] = [];
    public nativeNeedChange: boolean = true;
    private _serverConfig: any = {};
    private _cur_tool: any = null;
    public serverShowLog: boolean = false;
    public showLogToConsole: boolean = false;
    public true: any = undefined; // 保留原命名
    public overPageShowTime: number = 0;
    public overPageInsertAdIsTouch: boolean = false;
    public recored_share_count: number = 0;
    public shareRecordPanel: Node = null;
    private _withdrawalWidget: Node = null;
    private _redBagProgressWidget: Node = null;
    private _withdrawalPanel: Node = null;
    private _openRedBagPanel: Node = null;
    private _rewardRedBagPanel: Node = null;
    private _rewardRedBagPanelShowCount: number = 0;
    private _privacyWidget: Node = null;
    private _removeAdWidget: Node = null;
    private _privacyPanel: Node = null;
    public minScale: number = 1;
    public maxScale: number = 1.3;
    public runTime: number = 0.3;
    private _lastReportAdTime: number = 0;
    private _curVivoGamePortalLocation: string = "";
    private _curGameDrawerAdLocation: string = "";
    private _isRealNameAuth: boolean = false;
    private _yzRealNameAuthPanel: Node = null;
    private _yzLoginPanel: Node = null;
    private _notifyDialog: Node = null;

    // Static getter
    public static get Tool_Native(): YZ_Tool_Native {
        if (!Utils._instance) {
            YwLogUtils.showLog("tool native is null");
        }
        return Utils._instance ? Utils._instance._tool_Native : null;
    }

    public static get ServerConfig(): any {
        return Utils._instance ? Utils._instance._serverConfig : null;
    }

    public static set ServerConfig(value: any) {
        if (Utils._instance) {
            Utils._instance._serverConfig = value;
        }
    }

    public static get cur_tool(): any {
        if (Utils._instance) {
            if (!Utils._instance._cur_tool) {
                Utils._instance._cur_tool = Utils.Tool_Native;
            }
            return Utils._instance._cur_tool;
        }
        return null;
    }

    public static get otherConfig(): any {
        return Utils._instance ? Utils._instance._other_config : null;
    }

    public static get gameVersion(): string {
        if (Utils.cur_tool && Utils.cur_tool.gameVersion) {
            return Utils.cur_tool.gameVersion();
        }
        return "-1";
    }

    // ==================== Methods ====================

    private _initConfig(): void {
        const self = this;
        if (this._isConfigInit) {
            YwLogUtils.showLog("warn:配置数据已经初始化，请勿重复初始化!");
            return;
        }
        if (PlatUtils.IsNativeAndroid) {
            this.initTools(null);
            this._isConfigInit = this._initLoacalConfig(null);
            if (this._isConfigInit) {
                Utils.Tool_Native.init();
            }
        }
        this.adManager = new AdManager();
        this.adManager.Init();
        Utils.instance.registerServerInitEvent(() => {
            if (Utils.ServerConfig) {
                self.serverShowLog = self.getConfigBoolValue("is_show_log_view");
                self.showLogToConsole = self.getConfigBoolValue("show_log_to_console");
            }
        }, this);
    }

    private _initLoacalConfig(configData: any): boolean {
        if (!this.config) return false;
        return this.config.init(configData);
    }

    public onLoad(): void {
        Utils.instance = this;
        if ((window as any).SDKInstance && (window as any).SDKInstance.isGooglePlayNative()) {
            game.addPersistRootNode(this.node);
            Utils.instance = this;
            YwLogUtils.showLog("广告组件版本:" + this.utilsVersion);
            this._gameEntryTime = new Date().getTime();
            this._initConfig();
        }
    }

    public update(dt: number): void {
        if (this._isConfigInit && this.adManager) {
            this.adManager.OnUpdate(dt);
        }
    }

    public initTools(configData: any): void {
        if (!this._isConfigInit && PlatUtils.IsNativeAndroid) {
            // nothing
        }
        if (PlatUtils.IsNativeAndroid) {
            this._tool_Native = new YZ_Tool_Native();
        } else {
            YwLogUtils.showLog("initTools warn:本地数据未初始化!");
        }
    }

    public delayCall(callback: Function, delay: number): void {
        this.scheduleOnce(() => {
            callback && callback();
        }, delay);
    }

    public share(data?: any): void {
        if (data === undefined) data = null;
        if (this._isConfigInit) {
            if (Utils.cur_tool && Utils.cur_tool.share) {
                Utils.cur_tool.share(data);
            }
        } else {
            YwLogUtils.showLog("warn:本地数据未初始化!");
        }
    }

    public gameExitOff(): void {
        if (this._isConfigInit) {
            if (PlatUtils.IsNativeAndroid) {
                game.targetOff(this);
            }
        } else {
            YwLogUtils.showLog("warn:本地数据未初始化!");
        }
    }

    public recordStart(): void {
        if (this._isConfigInit) {
            if (Utils.cur_tool && Utils.cur_tool.recordStart) {
                Utils.cur_tool.recordStart();
            }
        } else {
            YwLogUtils.showLog("warn:本地数据未初始化!");
        }
    }

    public recordEnd(): void {
        if (this._isConfigInit) {
            if (Utils.cur_tool && Utils.cur_tool.recordEnd) {
                Utils.cur_tool.recordEnd();
            }
        } else {
            YwLogUtils.showLog("warn:本地数据未初始化!");
        }
    }

    public getShareInfo(): any {
        if (!this._isConfigInit) {
            YwLogUtils.showLog("warn:本地数据未初始化!");
        }
        return null;
    }

    public getInnerRecommendData(): any {
        return null;
    }

    public navigateToMiniGame(appId: string, path?: string): void {
        if (!this._isConfigInit) {
            YwLogUtils.showLog("warn:本地数据未初始化!");
        }
    }

    public isSupportnavigateToMiniGame(): boolean {
        if (!this._isConfigInit) {
            YwLogUtils.showLog("warn:本地数据未初始化!");
            return false;
        }
        return true;
    }

    public showMsg(msg: string): void {
        if (Utils.cur_tool && Utils.cur_tool.showToast) {
            Utils.cur_tool.showToast(msg);
        }
    }

    public hasShortcutInstalled(): boolean {
        return false;
    }

    public canCreateShortcut(): boolean {
        return false;
    }

    public createShortcut(callback?: Function): void {
        if (this._isConfigInit) {
            if (Utils.cur_tool && Utils.cur_tool.createShortcut) {
                Utils.cur_tool.createShortcut(callback);
            }
        } else {
            YwLogUtils.showLog("warn:本地数据未初始化!");
        }
    }

    public commomHttpRequest(url: string, params?: any): void {
        // empty
    }

    public postData(data: any): void {
        if (this._isConfigInit) {
            if (Utils.cur_tool && Utils.cur_tool.postData) {
                Utils.cur_tool.postData(data);
            }
        } else {
            YwLogUtils.showLog("warn:本地数据未初始化!");
        }
    }

    public registerServerInitEvent(callback: Function, target?: any): void {
        if (!this._isConfigInit) {
            YwLogUtils.showLog("warn:本地数据未初始化!");
            return;
        }
        if (this._isServerInit) {
            callback && callback();
        } else {
            director.on(YZ_Constant.EC_ServerInit, () => {
                callback && callback();
            }, target);
        }
    }

    public registerServerDataLoadSuccessEvent(callback: Function, target?: any): void {
        if (this._isServerLoadSuccess) {
            callback && callback();
        } else {
            director.on(YZ_Constant.EC_ServerDataLoadSuccess, () => {
                callback && callback();
            }, target);
        }
    }

    public registerPrivacyCloseEvent(callback: Function, target?: any): void {
        if (YZ_LocalStorage.getItem(YZ_Constant.YZ_GAME_YSXY)) {
            callback && callback();
        } else {
            director.on(YZ_Constant.YZ_PrivacyClose, () => {
                callback && callback();
            }, target);
        }
    }

    public postDataByLocation(eventId: string, data: any, location: string): void {
        // empty
    }

    public postRecommentShowData(data: any): void {
        if (this._isConfigInit) {
            if (Utils.cur_tool && Utils.cur_tool.postRecommentShowData) {
                Utils.cur_tool.postRecommentShowData(data);
            }
        } else {
            YwLogUtils.showLog("warn:本地数据未初始化!");
        }
    }

    public unregisterServerInitEvent(target: any): void {
        game.targetOff(target);
    }

    public emitServerInitEvent(): void {
        YwLogUtils.showLog("emitServerInitEvent");
        this._isServerInit = true;
        director.emit(YZ_Constant.EC_ServerInit);
    }

    public registerRealNameAuthCloseEvent(callback: Function, target?: any): void {
        if (this._isServerLoadSuccess) {
            callback && callback();
        } else {
            director.on(YZ_Constant.EC_RealNameAuthPanelClose, () => {
                callback && callback();
            }, target);
        }
    }

    public emitRealNameAuthCloseEvent(): void {
        director.emit(YZ_Constant.EC_RealNameAuthPanelClose);
    }

    public emitPrivacyCloseEvent(): void {
        director.emit(YZ_Constant.YZ_PrivacyClose);
    }

    public getRecommondGameList(): any[] {
        if (this._isConfigInit) {
            return this.Tool_Native ? this.Tool_Native.getRecommondGameList() : null;
        } else {
            YwLogUtils.showLog("warn:本地数据未初始化!");
            return null;
        }
    }

    public isShowRecommondGamesBanner(): boolean {
        return false;
    }

    public showRecommendGamesBanner(data?: any): boolean {
        return false;
    }

    public hideRecommendGamesBanner(): void {
        // empty
    }

    public isShowRecommondGamesList(): boolean {
        return false;
    }

    public showRecommendGamesList(data?: any): Node {
        return null;
    }

    public hideRecommendGamesList(): void {
        // empty
    }

    public isShowTryGamesWidget(): boolean {
        return false;
    }

    public showTryGamesWidget(data?: any): Node {
        return null;
    }

    public hideTryGamesWidget(): void {
        // empty
    }

    public isShowMoreGamesWidget(): boolean {
        if (PlatUtils.IsNativeAndroid) {
            if (this.getConfigBoolValue("is_more_game")) {
                return true;
            }
            YwLogUtils.showLog("warn:配置中没有is_more_game参数，更多游戏侧边栏组件不显示！");
        }
        return false;
    }

    public showMoreGamesWidget(params?: { group?: string, scale?: number, top?: number, bottom?: number, left?: number, right?: number, parent?: Node }): Node {
        if (params === undefined) params = null;
        if (!this.isShowMoreGamesWidget()) {
            YwLogUtils.showLog("warn:不可显示更多游戏侧边栏");
            return null;
        }
        if (!this.config.moreGamesWidget) {
            YwLogUtils.showLog("warn:未找到预制体 MoreGamesWidget, 请查看CommonUtils组件上是否赋值！");
            return null;
        }
        const widgetNode = instantiate(this.config.moreGamesWidget);
        if (!widgetNode) return null;

        if (this._moreGamesWidget && isValid(this._moreGamesWidget)) {
            this._moreGamesWidget.destroy();
        }
        this._moreGamesWidget = widgetNode;
        const widgetComp = widgetNode.getComponent(Widget);

        if (params) {
            if (params.group) {
                AAA_CompatibleTool.setNodeGroup(widgetNode, params.group);
            } else {
                AAA_CompatibleTool.setNodeGroup(widgetNode, "UI_2D");
            }
            if (params.scale != null) {
                widgetNode.scale = v3(params.scale, params.scale, params.scale);
            }
            if (params.top != null) {
                widgetComp.isAlignTop = true;
                widgetComp.isAlignBottom = false;
                widgetComp.top = params.top;
            } else if (params.bottom != null) {
                widgetComp.isAlignTop = false;
                widgetComp.isAlignBottom = true;
                widgetComp.bottom = params.bottom;
            }
            if (params.left != null) {
                widgetComp.isAlignLeft = true;
                widgetComp.isAlignRight = false;
                widgetComp.left = params.left;
            } else if (params.right != null) {
                widgetComp.isAlignLeft = false;
                widgetComp.isAlignRight = true;
                widgetComp.right = params.right;
            }
            if (params.parent) {
                widgetNode.parent = params.parent;
            } else {
                widgetNode.parent = director.getScene().getChildByName("Canvas");
                YwLogUtils.showLog("warn:未更多游戏挂件父节点，默认Canvas");
            }
        }
        widgetComp.updateAlignment();
        return widgetNode;
    }

    public hideMoreGamesWidget(widget?: Node): void {
        if (widget && isValid(widget)) {
            widget.destroy();
        }
        if (this._moreGamesWidget && isValid(this._moreGamesWidget)) {
            this._moreGamesWidget.destroy();
        }
    }

    public showBaiduMoreGamesBtn(params?: any): Node {
        return null;
    }

    public hideBaiduMoreGamesBtn(widget?: Node): void {
        // empty
    }

    public isShowRecordWidget(): boolean {
        return false;
    }

    public hideRecordWidget(): void {
        // empty
    }

    public showRecordWidget(params?: any): Node {
        return null;
    }

    public isShowCreateShortcutWidget(): boolean {
        return false;
    }

    public showCreateShortcutWidget(params?: any, callback?: Function): Node {
        return null;
    }

    public hideCreateShortcutWidget(widget?: Node): void {
        // empty
    }

    public registerEvent(eventName: string, callback: Function, target: any): void {
        if (!eventName) {
            YwLogUtils.showLog("warn:[Utils.registerEvent] param eventName is null!");
            return;
        }
        if (!callback) {
            YwLogUtils.showLog("warn:[Utils.registerEvent] param callback is null!");
            return;
        }
        if (!target) {
            YwLogUtils.showLog("warn:[Utils.registerEvent] param target is null!");
            return;
        }
        director.on(eventName, () => {
            callback && callback();
        }, target);
    }

    public unregisterEvent(eventName: string): void {
        game.off(eventName);
    }

    public emitCommonEvent(eventName: string): void {
        director.emit(eventName);
    }

    public isShowNativeTryGamesWidget(): boolean {
        return false;
    }

    public canShowCrossWidget6(): boolean {
        return false;
    }

    public showCrossWidget6(): Node {
        return null;
    }

    public showFavoriteGuide(params?: any): void {
        // empty
    }

    public checkAutoSign(): boolean {
        return this.getConfigBoolValue("auto_sign");
    }

    public showLog(msg: string, ...params: any[]): void {
        YwLogUtils.showLog(msg, ...params);
    }

    public getTimeLocaleString(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        return year + "年" + month + "月" + day + "日\t" + hours + ":" + minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
    }

    public vibrate(type: VibrateType = VibrateType.Short): void {
        if (type === VibrateType.Short) {
            native.reflection.callStaticMethod(Utils.Tool_Native.jniClassName, "vibrateShort", "()V");
        } else {
            native.reflection.callStaticMethod(Utils.Tool_Native.jniClassName, "vibrateLong", "()V");
        }
    }

    public StartGame(level: string, data?: any): void {
        this.currentLevel = parseInt(level);
        YouWanAnalytics.EventLevel(level, LevelStatus.GameStart, data);
    }

    public GameWin(level: string, data?: any, showAd: boolean = true): { type: number, node: Node } {
        YouWanAnalytics.EventLevel(level, LevelStatus.GameWin, data);
        return this.AutoShowStatement(level, true, showAd);
    }

    public GameFail(level: string, data?: any, showAd: boolean = true): { type: number, node: Node } {
        YouWanAnalytics.EventLevel(level, LevelStatus.GameFail, data);
        return this.AutoShowStatement(level, false, showAd);
    }

    public GameSkip(level: string, data?: any): void {
        YouWanAnalytics.EventLevel(level, LevelStatus.GameSkip);
    }

    public SendEvent(eventName: string): void {
        YouWanAnalytics.EventWithName(eventName);
    }

    public umaEvent(eventId: string, data?: any): void {
        YwLogUtils.showLog("--------友盟事件上报已废弃！--------");
    }

    public reportOverPageTouchEvent(node: Node): void {
        YwLogUtils.showLog("reportOverPageTouchEvent >>>>>>>");
        this.overPageInsertAdIsTouch = false;
        this.overPageShowTime = new Date().getTime();
        const touchNode = new Node();
        const nodeSize = AAA_CompatibleTool.getNodeSize(node);
        AAA_CompatibleTool.setNodeSize(touchNode, 2 * nodeSize.width, 2 * nodeSize.height);
        touchNode.on(Node.EventType.TOUCH_START, () => {
            const elapsed = (new Date().getTime() - this.overPageShowTime) / 1000;
            const data = { data: elapsed };
            this.SendEventNew("结算页面点击时间", "overPageTouch", JSON.stringify(data));
            touchNode.destroy();
            touchNode.removeFromParent();
        }, node);
        (touchNode as any)._touchListener.swallowTouches = false;
        node.addChild(touchNode);
    }

    public SendEventNew(eventName: string, type: string = "default", data?: any, flag: boolean = true): void {
        YwLogUtils.showLog("自定义事件上报:" + eventName + "，" + type + "," + data);
        if (Utils.cur_tool && Utils.cur_tool.SendEventNew) {
            Utils.cur_tool.SendEventNew(eventName, type, data, flag);
        }
    }

    public static UseTool(tool: any, configKey: string, callback?: Function): void {
        // empty
    }

    private checkResultShow(adType: number): boolean {
        const level = Utils.currentLevel;
        const success = Utils.isSuccess;
        const serverConfig = Utils.ServerConfig;
        if (!serverConfig) {
            YwLogUtils.showLog("warn:服务器配置不存在,只显示结算广告");
            return adType === 3;
        }

        YwLogUtils.showLog("不能自动分享录屏 分享录屏间隔为：" + serverConfig.auto_record_interval + "  分享类型为：" + serverConfig.auto_record_share_type);

        if (serverConfig.auto_video_interval && serverConfig.auto_video_interval !== 0) {
            const interval = serverConfig.auto_video_interval;
            const showType = serverConfig.auto_video_show_type;
            if (level % interval === 0) {
                if (showType === "all") {
                    return adType === 2;
                } else if (showType === "success" && success === true) {
                    return adType === 2;
                } else if (showType === "fail" && success === false) {
                    return adType === 2;
                }
            }
        }

        YwLogUtils.showLog("不能自动弹视频弹视频间隔为：" + serverConfig.auto_video_interval + " 弹视频类型为：" + serverConfig.auto_video_show_type);

        if (serverConfig.auto_rec_insert_interval && serverConfig.auto_rec_insert_interval !== 0) {
            const interval = serverConfig.auto_rec_insert_interval;
            const showType = serverConfig.auto_rec_insert_type;
            if (level % interval === 0) {
                if (showType === "all") {
                    return adType === 4;
                } else if (showType === "success" && success === true) {
                    return adType === 4;
                } else if (showType === "fail" && success === false) {
                    return adType === 4;
                }
            }
        }

        YwLogUtils.showLog("不能自动弹互推插屏间隔为：" + serverConfig.auto_rec_insert_interval + " 弹视频类型为：" + serverConfig.auto_rec_insert_type);
        return adType === 3;
    }

    public AutoShowStatement(level: string, success: boolean, showAd: boolean): { type: number, node: Node } {
        Utils.isSuccess = success;
        const result = { type: -1, node: null as Node };
        if (!showAd) {
            YwLogUtils.showLog("isShowAd为false，只上报不显示广告");
            return result;
        }

        let hasPlayVideo = false;
        if (this.checkResultShow(2)) {
            if (!this.getConfigBoolValue("result_auto_show_video")) {
                return result;
            }
            if (PlatUtils.IsDouyin || PlatUtils.IsQQ || PlatUtils.IsWiFi || PlatUtils.IsBaidu || PlatUtils.IsKwai || PlatUtils.IsHago || PlatUtils.IsNativeAndroid || PlatUtils.IsOPPO) {
                YwLogUtils.showLog("自动播放视频！");
                Utils.adManager.ShowVideo(() => {});
                hasPlayVideo = true;
            } else if (PlatUtils.IsNativeAndroid || PlatUtils.IsNativeIOS) {
                if (this.getConfigByKey("auto_video_type") === "reward_video") {
                    Utils.adManager.ShowVideo(() => {});
                } else {
                    Utils.adManager.showFullScreenVideo();
                }
                hasPlayVideo = true;
            } else {
                hasPlayVideo = true;
                Utils.adManager.ShowVideo(() => {});
            }

            if (hasPlayVideo && (PlatUtils.IsDouyin || PlatUtils.IsQQ || PlatUtils.IsNativeAndroid || PlatUtils.IsNativeIOS || PlatUtils.IsOPPO)) {
                YwLogUtils.showLog("当前强弹了视频，不显示插屏！");
            } else {
                const adsResult = Utils.adManager.showStatementAds();
                if (adsResult) {
                    result.type = adsResult.type;
                    result.node = adsResult.node;
                }
            }
        }

        if (this.checkResultShow(3)) {
            const adsResult = Utils.adManager.showStatementAds();
            if (adsResult) {
                result.type = adsResult.type;
                result.node = adsResult.node;
            }
        }
        return result;
    }

    public AutoStartRecord(level: string): void {
        if (this.getConfigByKey("auto_record_interval") > 0) {
            this.recordStart();
        } else {
            YwLogUtils.showLog("warn:服务器配置不存在auto_record_interva");
        }
    }

    public showShareRecordPanel(params?: any): Node {
        return null;
    }

    public isShowTrySkin(level: number): boolean {
        let interval = 5;
        if (Utils.ServerConfig && this.getConfigByKey("try_skin_level_count")) {
            interval = this.getConfigIntValue("try_skin_level_count");
        }
        if (level % interval === 0) {
            if (this.checkConfigHasKey("try_skin_show_ad_interval") && level % this.getConfigIntValue("try_skin_show_ad_interval") === 0) {
                YwLogUtils.showLog("服务器配置间隔" + this.getConfigIntValue("try_skin_show_ad_interval") + "关试用皮肤展示插屏！");
                Utils.adManager.ShowInterstitial();
            }
            return true;
        }
        return false;
    }

    public showSkipBtn(btn: Node, special: boolean = false, location: BannerLocation = BannerLocation.None): void {
        if (!btn) return;
        let delay = PlatUtils.IsNativeAndroid ? 3 : 0;
        if (this.getConfigByKey("skip_btn_show_delay")) {
            delay = this.getConfigIntValue("skip_btn_show_delay");
        }
        if (special && this.getConfigByKey("special_skip_btn_show_delay")) {
            delay = this.getConfigIntValue("special_skip_btn_show_delay");
        }
        if (PlatUtils.IsTest) {
            Utils.ServerConfig.over_page_skip_btn_show_delay = 3;
        }
        if (location === BannerLocation.Over && this.getConfigByKey("over_page_skip_btn_show_delay")) {
            delay = this.getConfigIntValue("over_page_skip_btn_show_delay");
        }
        if (delay > 0) {
            AAA_CompatibleTool.setNodeOpacity(btn, 0);
            btn.active = false;
            this.scheduleOnce(() => {
                if (btn && isValid(btn)) {
                    btn.active = true;
                    tween(AAA_CompatibleTool.getOpacityTarget(btn))
                        .to(0.3, { opacity: 255 }, { easing: easing.fade })
                        .start();
                }
            }, delay);
        } else {
            if (!btn.active) {
                btn.active = true;
            }
        }
    }

    public delayShowNode(node: Node): void {
        if (!node) return;
        AAA_CompatibleTool.setNodeOpacity(node, 0);
        node.active = true;
        let delay = 0;
        if (this.getConfigByKey("next_btn_show_delay")) {
            delay = this.getConfigIntValue("next_btn_show_delay");
        }
        this.scheduleOnce(() => {
            if (node && isValid(node)) {
                tween(AAA_CompatibleTool.getOpacityTarget(node))
                    .to(0.3, { opacity: 255 }, { easing: easing.fade })
                    .start();
            }
        }, delay);
    }

    public isBoxAutoSelectToggle(): boolean {
        const level = Utils.currentLevel;
        let interval = 0;
        if (this.getConfigByKey("box_auto_select_level")) {
            interval = Number(this.getConfigByKey("box_auto_select_level"));
        } else {
            YwLogUtils.showLog("服务器配置不存在，不自动勾选");
        }
        return interval !== 0 && level % interval === 0;
    }

    public isResultAutoSelectToggle(): boolean {
        const level = Utils.currentLevel;
        let interval = 0;
        if (this.getConfigByKey("result_auto_select_level")) {
            interval = Number(this.getConfigByKey("result_auto_select_level"));
        } else {
            YwLogUtils.showLog("服务器配置不存在，不自动勾选");
        }
        return interval !== 0 && level % interval === 0;
    }

    public isTrySkinAutoSelectToggle(): boolean {
        const level = Utils.currentLevel;
        let interval = 0;
        if (this.getConfigByKey("skin_auto_select_level")) {
            interval = Number(this.getConfigByKey("skin_auto_select_level"));
        } else {
            YwLogUtils.showLog("服务器配置不存在，不自动勾选");
        }
        return interval !== 0 && level % interval === 0;
    }

    public controView(view: ViewLocation): { isSelect: boolean, msg: string, btnType: boolean, is_open: boolean } {
        let randomFlag: boolean;
        let interval: number;
        const defaultResult = {
            isSelect: true,
            msg: "观看视频获得奖励",
            btnType: true,
            is_open: false
        };

        if (!Utils.ServerConfig) {
            YwLogUtils.showLog("服务器配置不存在");
            return defaultResult;
        }

        if (!this.getConfigBoolValue("open_check_btn")) {
            YwLogUtils.showLog("服务器配置不开启勾选！");
            return defaultResult;
        }

        defaultResult.is_open = true;

        switch (view) {
            case ViewLocation.sign:
                interval = this.getConfigByKey("sign_auto_select_level") ? this.getConfigIntValue("sign_auto_select_level") : 0;
                randomFlag = !this.getConfigBoolValue("ad_tip_sign_random") || Math.random() >= 0.5;
                defaultResult.msg = randomFlag ? "查看视频获得双倍奖励" : "不需要视频奖励";
                break;
            case ViewLocation.trySkin:
                interval = this.getConfigByKey("tryskin_auto_select_level") ? this.getConfigIntValue("tryskin_auto_select_level") : 0;
                randomFlag = !this.getConfigBoolValue("ad_tip_tryskin_random") || Math.random() >= 0.5;
                defaultResult.msg = randomFlag ? "查看视频试用皮肤" : "不需要视频试用皮肤";
                break;
            case ViewLocation.box:
                interval = this.getConfigByKey("box_auto_select_level") ? this.getConfigIntValue("box_auto_select_level") : 0;
                randomFlag = !this.getConfigBoolValue("ad_tip_box_random") || Math.random() >= 0.5;
                defaultResult.msg = randomFlag ? "查看视频获得五倍奖励" : "不需要视频奖励";
                break;
            case ViewLocation.successBox:
                interval = this.getConfigByKey("success_box_auto_select_level") ? this.getConfigIntValue("success_box_auto_select_level") : 0;
                break;
            case ViewLocation.failBox:
                interval = this.getConfigByKey("fail_box_auto_select_level") ? this.getConfigIntValue("fail_box_auto_select_level") : 0;
                break;
            case ViewLocation.winPanel:
                interval = this.getConfigByKey("win_panel_auto_select_level") ? this.getConfigIntValue("win_panel_auto_select_level") : 0;
                break;
            case ViewLocation.turntable:
                interval = this.getConfigByKey("turntable_auto_select_level") ? this.getConfigIntValue("turntable_auto_select_level") : 0;
                break;
            default:
                interval = 0;
                break;
        }

        if (interval === 0) {
            defaultResult.isSelect = false;
        } else if (interval === 1) {
            defaultResult.isSelect = true;
        } else if (interval === 2) {
            defaultResult.isSelect = Math.random() >= 0.5;
        }

        defaultResult.btnType = (randomFlag === defaultResult.isSelect);
        return defaultResult;
    }

    public canShowNextVideo(level: number): boolean {
        return false;
    }

    public canShowRedBag(): boolean {
        return false;
    }

    public hideWithdrawalWidget(): void {
        // empty
    }

    public showWithdrawalWidget(params?: any): Node {
        return null;
    }

    public hideRedBagProgressWidget(): void {
        // empty
    }

    public showRedBagProgressWidget(params?: any): Node {
        return null;
    }

    public showWithdrawalPanel(params?: any): Node {
        return null;
    }

    public showOpenRedBagPanel(params?: any): Node {
        return null;
    }

    public showRewardRedBagPanel(params?: any): Node {
        return null;
    }

    public isShowPrivacyWidget(): boolean {
        if (this.getConfigBoolValue("is_privacy")) {
            return true;
        }
        YwLogUtils.showLog("warn:配置中没有is_privacy参数，更用户协议挂件组件不显示！");
        return false;
    }

    public showPrivacyWidget(params?: any): Node {
        if (params === undefined) params = null;
        if (!this.isShowPrivacyWidget()) return null;

        if (this._privacyWidget && isValid(this._privacyWidget)) {
            this._privacyWidget.destroy();
        }
        const privacyNode = new Node();
        this._privacyWidget = privacyNode;
        const labelComp = privacyNode.addComponent(Label);
        if (labelComp) {
            if (params && params.language === "zh") {
                labelComp.string = "<<隐私政策>>";
            } else {
                labelComp.string = "<<Privacy Policy>>";
            }
        }

        if (params) {
            if (params.color) {
                AAA_CompatibleTool.setNodeColor(privacyNode.children[0], params.color);
            }
            if (params.group) {
                AAA_CompatibleTool.setNodeGroup(privacyNode, params.group);
            } else {
                AAA_CompatibleTool.setNodeGroup(privacyNode, "UI_2D");
            }
            if (params.scale != null) {
                AAA_CompatibleTool.setNodeScale(privacyNode, params.scale);
            } else {
                let scale = 1;
                scale = AAA_CompatibleTool.viewSize.height < AAA_CompatibleTool.viewSize.width ? AAA_CompatibleTool.viewSize.height / 1080 : AAA_CompatibleTool.viewSize.width / 1080;
                AAA_CompatibleTool.setNodeScale(privacyNode, scale);
            }
            const widgetComp = privacyNode.addComponent(Widget);
            if (params.top != null) {
                widgetComp.isAlignTop = true;
                widgetComp.isAlignBottom = false;
                widgetComp.top = params.top;
            } else if (params.bottom != null) {
                widgetComp.isAlignTop = false;
                widgetComp.isAlignBottom = true;
                widgetComp.bottom = params.bottom;
            }
            if (params.left != null) {
                widgetComp.isAlignLeft = true;
                widgetComp.isAlignRight = false;
                widgetComp.left = params.left;
            } else if (params.right != null) {
                widgetComp.isAlignLeft = false;
                widgetComp.isAlignRight = true;
                widgetComp.right = params.right;
            }
            widgetComp.updateAlignment();
        }

        if (params && params.parent != null) {
            privacyNode.parent = params.parent;
        } else {
            privacyNode.parent = director.getScene().getChildByName("Canvas");
        }

        privacyNode.on(Node.EventType.TOUCH_END, () => {
            if (PlatUtils.IsNativeAndroid) {
                if (Utils.Tool_Native) {
                    Utils.Tool_Native.showPrivacyAgreement();
                }
            } else {
                this.showPrivacyPanel();
            }
        }, this);

        return privacyNode;
    }

    public hidePrivacyWidget(): void {
        if (this._privacyWidget && isValid(this._privacyWidget)) {
            this._privacyWidget.destroy();
        }
    }

    public isShowRemoveAdWidget(): boolean {
        const removeAd = YZ_LocalStorage.getItem(YZ_Constant.ST_REMOVE_AD, "");
        YwLogUtils.showLog("canShowAd:" + removeAd + " #isRemoveAd=" + this.getConfigByKey("is_remove_ad"));
        if (this.getConfigBoolValue("is_remove_ad") && !removeAd) {
            return true;
        }
        YwLogUtils.showLog("warn:配置中没有is_remove_ad参数，移除广告组件不显示！");
        return false;
    }

    public showRemoveAdWidget(params?: any): Node {
        return null;
    }

    public hideRemoveAdWidget(): void {
        if (this._privacyWidget && isValid(this._privacyWidget)) {
            this._privacyWidget.destroy();
        }
    }

    public isShowPrivacyPanel(): boolean {
        return false;
    }

    public showPrivacyPanel(): void {
        YwLogUtils.showLog("showPrivacyPanel>>>");
    }

    public showSidebarWidget(params?: any, callback?: Function): void {
        // empty
    }

    public showScaleAction(btn1: Node, btn2: Node = null, scaleEnabled: boolean = true, addHandEffect: boolean = true, location: BannerLocation = BannerLocation.None): void {
        if (scaleEnabled) {
            if (!isValid(btn2) || !isValid(btn1)) return;
        } else if (!isValid(btn1)) return;

        let mainBtn = btn1;
        if (this.getConfigBoolValue("change_btn_position") && scaleEnabled === true) {
            let canChange = true;
            if (location === BannerLocation.Over && !this.getConfigBoolValue("over_page_change_btn")) {
                canChange = false;
                YwLogUtils.showLog("结算页面按钮配置不切换位置！");
            }
            if (canChange) {
                const randomSeed = Math.floor(Math.random() * 2 + 1);
                const pos1 = btn1.position;
                const pos2 = btn2.position;
                if (randomSeed % 2 === 0) {
                    btn2.position = pos1;
                    btn1.position = pos2;
                } else {
                    mainBtn = btn1;
                    btn2.position = pos2;
                    btn1.position = pos1;
                }
                mainBtn = (btn2.position.y > btn1.position.y) ? btn2 : btn1;
            }
        }

        if (this.getConfigBoolValue("btn_show_scale")) {
            if (location === BannerLocation.Over && !this.getConfigBoolValue("over_page_scale_btn")) {
                YwLogUtils.showLog("结算页面按钮配置不缩放按钮！");
                return;
            }
            if (btn1) {
                Tween.stopAllByTarget(btn1);
                AAA_CompatibleTool.setNodeScale(btn1, 1);
            }
            if (btn2) {
                Tween.stopAllByTarget(btn2);
                AAA_CompatibleTool.setNodeScale(btn2, 1);
            }
            tween(mainBtn)
                .to(this.runTime, { scale: AAA_CompatibleTool.scale(this.maxScale) })
                .to(this.runTime, { scale: AAA_CompatibleTool.scale(this.minScale) })
                .start();

            if (addHandEffect) {
                if (btn1) {
                    const hand1 = btn1.parent.getChildByName("hand");
                    if (hand1) {
                        hand1.destroy();
                        hand1.removeFromParent();
                    }
                }
                if (btn2) {
                    const hand2 = btn2.parent.getChildByName("hand");
                    if (hand2) {
                        hand2.destroy();
                        hand2.removeFromParent();
                    }
                }
            }
        }
    }

    public reportNativeAdClick(): void {
        // empty
    }

    public canShowOverPageAdBtn(): boolean {
        return this.getConfigBoolValue("show_over_page_ad_btn");
    }

    public showRecBanner(): void {
        if (Utils.adManager.checkShowAdTime()) {
            if (Utils.cur_tool && Utils.cur_tool.showRecBanner) {
                Utils.cur_tool.showRecBanner();
            }
        } else {
            YwLogUtils.showLog("显示广告条时间未达限制！");
        }
    }

    public showGamePortal(): void {
        if (Utils.adManager.checkShowAdTime()) {
            if (Utils.cur_tool && Utils.cur_tool.showGamePortal) {
                Utils.cur_tool.showGamePortal();
            }
        } else {
            YwLogUtils.showLog("显示广告条时间未达限制！");
        }
    }

    public showVivoGamePortalWidget(params?: any): void {
        // empty
    }

    public hideVivoGamePortalWidget(): void {
        // empty
    }

    public showOppoGameDrawerAdWidget(params?: any): void {
        // empty
    }

    public hideOppoGameDrawerAdWidget(): void {
        // empty
    }

    public showOppoRecBanner(params?: any): void {
        // empty
    }

    public hideOppoRecBanner(): void {
        // empty
    }

    public realNameAuth(code: string, name: string, callback?: Function): void {
        YwLogUtils.showLog("进行实名制认证：#code=" + code + " #name=" + name);
        if (Utils.cur_tool && Utils.cur_tool.realNameAuth) {
            Utils.cur_tool.realNameAuth(code, name, callback);
        }
    }

    public GameExit(): void {
        if (Utils.cur_tool && Utils.cur_tool.GameExit) {
            Utils.cur_tool.GameExit();
        }
    }

    public showYzRealNameAuthPanel(params?: any): Node {
        return null;
    }

    public setRealNameAuthLocalData(value: any): void {
        YZ_LocalStorage.setItem("yz_game_real_name", "" + value);
    }

    public getRealNameAuthLocalData(): any {
        let data = YZ_LocalStorage.getItem("yz_game_real_name");
        if (!data) data = 0;
        return data;
    }

    public getConfigByKey(key: string): any {
        if (!this._isConfigInit) {
            YwLogUtils.showLog("warn:本地数据未初始化!");
            return "";
        }
        if (key && Utils.ServerConfig && key in Utils.ServerConfig) {
            return Utils.ServerConfig[key];
        }
        this.showLog("warn:字段：" + key + " 未配置！");
        return "";
    }

    public checkConfigHasKey(key: string): boolean {
        if (!this._isConfigInit) {
            YwLogUtils.showLog("warn:本地数据未初始化!");
            return false;
        }
        if (key && Utils.ServerConfig && key in Utils.ServerConfig) {
            return true;
        }
        this.showLog("warn:字段：" + key + " 未配置！");
        return false;
    }

    public getConfigBoolValue(key: string, defaultValue: boolean = false): boolean {
        if (!this._isConfigInit) {
            YwLogUtils.showLog("warn:本地数据未初始化!");
            return defaultValue;
        }
        if (key && Utils.ServerConfig && key in Utils.ServerConfig) {
            const value = Utils.ServerConfig[key];
            return value === 1 || value === "true";
        }
        this.showLog("warn:字段：" + key + " 未配置！");
        return defaultValue;
    }

    public getConfigIntValue(key: string, defaultValue: number = -1): number {
        if (!this._isConfigInit) {
            YwLogUtils.showLog("warn:本地数据未初始化!");
            return defaultValue;
        }
        if (key && Utils.ServerConfig && key in Utils.ServerConfig) {
            try {
                return parseInt(Utils.ServerConfig[key]);
            } catch (e) {
                return defaultValue;
            }
        }
        this.showLog("warn:字段：" + key + " 未配置！");
        return defaultValue;
    }

    public getConfigFloatValue(key: string, defaultValue: number = -1): number {
        if (!this._isConfigInit) {
            YwLogUtils.showLog("warn:本地数据未初始化!");
            return defaultValue;
        }
        if (key && Utils.ServerConfig && key in Utils.ServerConfig) {
            try {
                return parseFloat(Utils.ServerConfig[key]);
            } catch (e) {
                return defaultValue;
            }
        }
        this.showLog("warn:字段：" + key + " 未配置！");
        return defaultValue;
    }

    public getConfigStringValue(key: string, defaultValue: string = ""): string {
        if (!this._isConfigInit) {
            YwLogUtils.showLog("warn:本地数据未初始化!");
            return defaultValue;
        }
        if (key && Utils.ServerConfig && key in Utils.ServerConfig) {
            try {
                return Utils.ServerConfig[key].toString();
            } catch (e) {
                return defaultValue;
            }
        }
        this.showLog("warn:字段：" + key + " 未配置！");
        return defaultValue;
    }

    public login(successCallback?: Function, failCallback?: Function): void {
        this.showLog("=====login====");
        if (successCallback) {
            PlatUtils.IsDouyin; // maybe unused
            game.targetOff(YZ_Constant.ST_LOGIN_SUCCESS);
            director.on(YZ_Constant.ST_LOGIN_SUCCESS, () => {
                successCallback && successCallback();
            }, this);
        }

        if (failCallback) {
            game.targetOff(YZ_Constant.ST_LOGIN_FAIL);
            director.on(YZ_Constant.ST_LOGIN_FAIL, () => {
                failCallback();
                this.showLoginPanel();
            }, this);
        } else {
            game.targetOff(YZ_Constant.ST_LOGIN_FAIL);
            director.on(YZ_Constant.ST_LOGIN_FAIL, () => {
                this.showLoginPanel();
            }, this);
        }

        if (Utils.cur_tool && Utils.cur_tool.login) {
            Utils.cur_tool.login();
        } else {
            game.targetOff(YZ_Constant.ST_LOGIN_SUCCESS);
            game.targetOff(YZ_Constant.ST_LOGIN_FAIL);
            successCallback && successCallback();
        }
    }

    public showLoginPanel(): void {
        // empty
    }

    public generateUUID(): string {
        let now = new Date().getTime();
        if (window.performance && typeof window.performance.now === "function") {
            now += performance.now();
        }
        return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (now + 16 * Math.random()) % 16 | 0;
            now = Math.floor(now / 16);
            return (c === "x" ? r : (r & 3 | 8)).toString(16);
        });
    }

    public showNotifyPanel(data?: any): void {
        if (data === undefined) data = null;
        YwLogUtils.showLog(JSON.stringify(data));
    }

    public removeAdByPay(): void {
        YwLogUtils.showLog("sendPayToRemoveAd");
        if (Utils.cur_tool && Utils.cur_tool.removeAdByPay) {
            Utils.cur_tool.removeAdByPay();
        }
    }

    public sendPay(payInfo: any, onSuccess?: Function, onFail?: Function): void {
        YwLogUtils.showLog("sendPay: #payInfo=" + JSON.stringify(payInfo));
        director.off(YZ_Constant.YZ_PAY_MESSAGE);
        director.on(YZ_Constant.YZ_PAY_MESSAGE, (event: any) => {
            const eventType = event.type;
            const eventMsg = event.msg;
            YwLogUtils.showLog("YZ_PAY_MESSAGE  #EventType=", eventType + " #EventMsg=", eventMsg);
            switch (eventType) {
                case YZ_Constant.YZ_PAY_SUCCESS:
                    YwLogUtils.showLog("支付成功：", event.msg);
                    onSuccess && onSuccess();
                    YouWanAnalytics.EventWithName(payInfo.pid + ",支付成功");
                    break;
                case YZ_Constant.YZ_PAY_FAIL:
                    YwLogUtils.showLog("支付失败：", event.msg);
                    onFail && onFail(eventMsg);
                    YouWanAnalytics.EventWithName(payInfo.pid + ",支付失败-" + eventMsg);
                    break;
            }
        }, this);

        if (Utils.cur_tool && Utils.cur_tool.sendPay) {
            Utils.cur_tool.sendPay(payInfo);
        }
    }

    public hideLoadSplash(): void {
        if (Utils.Tool_Native) {
            native.reflection.callStaticMethod(Utils.Tool_Native.jniClassName, "hideSplash", "()V");
        }
    }

    public configIsNotNull(): boolean {
        return !!(Utils.ServerConfig && Utils.ServerConfig !== "{}" && JSON.stringify(Utils.ServerConfig).length > 2);
    }

    public jumpToHp(): void {
        if (Utils.cur_tool && Utils.cur_tool.jumpToHp) {
            Utils.cur_tool.jumpToHp();
        }
    }

    public getTimeIntervalSecond(startTime?: number, endTime?: number): number {
        const now = new Date().getTime();
        if (!startTime) {
            return now / 1000;
        }
        if (endTime) {
            return (endTime - startTime) / 1000;
        }
        return (now - startTime) / 1000;
    }

    public queryAllProductDetail(callback?: Function): void {
        director.off(YZ_Constant.YZ_PAY_ALL_QUERY_PRODUCT);
        director.on(YZ_Constant.YZ_PAY_ALL_QUERY_PRODUCT, (event: any) => {
            const code = event.code;
            const msg = event.msg;
            YwLogUtils.showLog("queryAllProductDetail  #EventCode=", code + " #EventMsg=", msg);
            switch (code) {
                case YZ_Constant.YZ_QUERY_SUCCESS:
                    YwLogUtils.showLog("查询商品成功：", JSON.stringify(event.data));
                    callback && callback(event.data);
                    YouWanAnalytics.EventWithName("游戏端收到查询商品成功回调");
                    break;
                case YZ_Constant.YZ_QUERY_FAIL:
                    YwLogUtils.showLog("查询商品失败：", event.msg);
                    YouWanAnalytics.EventWithName("游戏端收到查询商品失败回调");
                    break;
            }
        }, this);

        if (Utils.cur_tool && Utils.cur_tool.queryAllProductDetail) {
            Utils.cur_tool.queryAllProductDetail(callback);
        }
    }
}