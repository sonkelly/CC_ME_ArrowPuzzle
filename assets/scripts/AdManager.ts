import { _decorator, director, game, Node, Component } from 'cc';
import { PlatUtils } from './Utils/PlatUtils';
import { AdAgentNative } from './AdAgentNative';
import { YZ_Constant, BannerLocation, BeForGameOverAdId } from './YZ_Constant';
import { Utils } from './Utils';
import { YZ_LocalStorage } from './YZ_LocalStorage';
import { YwLogUtils } from './Utils/YwLogUtils';
import { YwAdType, YwAdStatus } from './Event/EventAdInfo';

const { ccclass, property } = _decorator;

@ccclass('AdManager')
export class AdManager extends Component {
    private _curAdAgent: AdAgentNative | null = null;
    public videoCallBack: Function | null = null;
    public bannerShowCount: number = 0;
    public interstitialShowCount: number = 0;
    public rewardVideoShowCount: number = 0;
    public bannerHeight: number = -1;
    public requestInterstitialCount: number = 0;
    public moveBtnBannerShowCount: number = 0;
    public moveBtnBannerRequestCount: number = 0;
    private _lastShowGameOverAdType: BeForGameOverAdId = BeForGameOverAdId.None;
    public beforRewardTypes: BeForGameOverAdId[] = [
        BeForGameOverAdId.SharePanel,
        BeForGameOverAdId.GoldBox,
        BeForGameOverAdId.Turntable,
        BeForGameOverAdId.CreateShortCut,
        BeForGameOverAdId.RecGame,
        BeForGameOverAdId.LuckBox
    ];
    public rewardBoxPanel: any = null;
    public rewardRecGamePanel: any = null;
    public rewardTurnTablePanel: any = null;
    public rewardShortCutPanel: any = null;
    private _rewardLuckBoxPanel: any = null;
    private _insertLastShowTime: number = 0;
    private _customAdPanel: any = null;
    private _isShowNextLevelAd: boolean = false;

    public Init(): void {
        const self = this;
        if (PlatUtils.IsNativeAndroid) {
            this._curAdAgent = new AdAgentNative();
            this._curAdAgent.Init();
        }

        director.on(YZ_Constant.YZ_AD_MESSAGE, (event: any) => {
            YwLogUtils.showLog(`AdManager 接收到广告消息 #type=${event.type} #status=${event.status}#height:${event.height}`);
            switch (event.type) {
                case YwAdType.BANNER:
                    if (event.status === YwAdStatus.SHOW_SUCCESS) {
                        self.bannerShowCount++;
                        if (event.height) {
                            self.bannerHeight = event.height;
                        }
                    }
                    break;
                case YwAdType.INTERSTITIAL:
                    if (event.status === YwAdStatus.SHOW_SUCCESS) {
                        self.interstitialShowCount++;
                    }
                    break;
                case YwAdType.REWARD_VIDEO:
                    if (event.status === YwAdStatus.SHOW_SUCCESS) {
                        self.rewardVideoShowCount++;
                    }
                    break;
            }
        });
    }

    public OnUpdate(deltaTime: number): void {}

    public showNativeTryGameWidget(callback: Function | null = null): void {
        if (this.checkIsRemoveAd()) {
            YwLogUtils.showLog("已购买去除广告功能！");
        } else if (this.checkShowAdTime()) {
            if (this._curAdAgent) {
                if (!Utils.instance.isShowNativeTryGamesWidget() || PlatUtils.IsHuaWei) {
                    YwLogUtils.showLog("不能显示原生抖动试玩");
                    return;
                }
                this._curAdAgent.showNativeTryGameWidget(callback);
            }
        } else {
            YwLogUtils.showLog("显示原生抖动时间未达限制！");
        }
    }

    public hideNativeTryGameWidget(): void {
        if (this._curAdAgent) {
            this._curAdAgent.hideNativeTryGameWidget();
        }
    }

    public showNativeSplashView(callback: Function | null = null): void {
        if ((PlatUtils.IsHuaWei || PlatUtils.IsOPPO) && this._curAdAgent) {
            this._curAdAgent.showNativeSplashView(callback);
        } else if (callback) {
            callback();
        }
    }

    public ShowBanner(location: BannerLocation = BannerLocation.Home, params: any = null): void {
        if (this.checkIsRemoveAd()) {
            YwLogUtils.showLog("已购买去除广告功能！");
        } else if (this.checkShowAdTime()) {
            if (this._curAdAgent) {
                this._curAdAgent.ShowBanner(location, params);
            }
        } else {
            YwLogUtils.showLog("显示广告条时间未达限制！");
        }
    }

    public HideBanner(location: BannerLocation): void {
        if (this._curAdAgent) {
            this._curAdAgent.HideBanner(location);
        }
    }

    public ShowInterstitial(location: BannerLocation = BannerLocation.Home): void {
        if (this.checkIsRemoveAd()) {
            YwLogUtils.showLog("已购买去除广告功能！");
        } else if (this.checkShowAdTime()) {
            if (this.checkInsertAdTime()) {
                if (this.requestInterstitialCount > 0 && 
                    Utils.instance.checkConfigHasKey("cp_show_video_interval") && 
                    Utils.instance.getConfigIntValue("cp_show_video_interval") > 0) {
                    const interval = Utils.instance.getConfigIntValue("cp_show_video_interval");
                    if (this.requestInterstitialCount % interval === 0) {
                        YwLogUtils.showLog(`调用插屏间隔：${interval}次展示激励视频广告！`);
                        this.ShowVideo(() => {});
                        this.requestInterstitialCount = 0;
                        return;
                    }
                }
                this.requestInterstitialCount++;
                if (this._curAdAgent) {
                    this._curAdAgent.ShowInterstitial(location);
                }
            } else {
                YwLogUtils.showLog("显示插屏时间未达到间隔时间！");
            }
        } else {
            YwLogUtils.showLog("显示插屏时间未达限制！");
        }
    }

    public ShowVideo(callback: Function): void {
        if (this._curAdAgent) {
            this.videoCallBack = callback;
            this._curAdAgent.ShowVideo(callback);
        } else if (callback) {
            callback(false, "视频加载失败！");
        }
    }

    public showInteractiveAd(): void {
        if (this._curAdAgent) {
            this._curAdAgent.showInteractiveAd();
        }
    }

    public ShowAppBox(params: any): void {
        if (this._curAdAgent) {
            this._curAdAgent.ShowAppBox(params);
        }
    }

    public HideAppBox(): void {
        if (this._curAdAgent) {
            this._curAdAgent.HideAppBox();
        }
    }

    public showRewardInsert(): void {
        if (this._curAdAgent) {
            YwLogUtils.showLog("显示 RI");
            this._curAdAgent.showRewardInsert();
        }
    }

    public hideRewardInsert(): void {
        if (this._curAdAgent) {
            this._curAdAgent.hideRewardInsert();
        }
    }

    public ShowMoveBtnBanner(location: BannerLocation, params: any): void {
        const self = this;
        if (PlatUtils.IsWechat) {
            const showInterval = Utils.instance.getConfigIntValue("move_btn_banner_show_interval");
            const delayTime = Utils.instance.getConfigFloatValue("move_btn_banner_delay_time");
            const startCount = Utils.instance.getConfigIntValue("move_btn_banner_start_count");
            const maxCount = Utils.instance.getConfigIntValue("move_btn_banner_max_count");
            const currentBannerShowCount = this.bannerShowCount;

            YwLogUtils.showLog(`展示移动按钮的Banner广告： #bannerShowCount:${currentBannerShowCount} #moveBtnBannerShowCount=${this.moveBtnBannerShowCount} #move_btn_banner_show_interval=${showInterval} #move_btn_banner_max_count=${maxCount} #move_btn_banner_delay_time=${delayTime} #move_btn_banner_start_count=${startCount}`);

            if (delayTime > 0 && (startCount === 0 || currentBannerShowCount > startCount)) {
                this.moveBtnBannerRequestCount++;
                if (this.moveBtnBannerShowCount < maxCount && 
                    (this.moveBtnBannerRequestCount - 1) % (showInterval + 1) === 0) {
                    this.HideBanner(0);
                    YwLogUtils.showLog("触发移动Banner的按钮策略！");
                    setTimeout(() => {
                        YwLogUtils.showLog("达到延迟出发展示Banner广告");
                        self.ShowBanner(location, params);
                    }, delayTime * 1000);

                    director.on(YZ_Constant.YZ_AD_MESSAGE, (event: any) => {
                        YwLogUtils.showLog(`ShowMoveBtnBanner 接收到广告消息 #type=${event.type} #status=${event.status}`);
                        switch (event.type) {
                            case YwAdType.BANNER:
                                if (event.status === YwAdStatus.SHOW_SUCCESS) {
                                    YwLogUtils.showLog(`ShowMoveBtnBanner - bannerHeight:${self.bannerHeight}, btnClose.y:${params.btn.y}`);
                                    if (self.bannerHeight > 0) {
                                        if (params.btn) {
                                            params.btn.y += self.bannerHeight;
                                        }
                                        YwLogUtils.showLog(`btnClose.y:${params.btn.y}`);
                                        self.moveBtnBannerShowCount++;
                                        game.targetOff(params.btn);
                                    }
                                }
                                break;
                        }
                    }, params.btn);
                    return;
                }
            }
        }

        if (params.btn) {
            params.btn.y += 380;
        }
        this.ShowBanner(location, params);
    }

    public ShowStatementRecomment(): any {
        if (this._curAdAgent) {
            if (PlatUtils.IsOPPO || PlatUtils.IsVIVO) {
                return this._curAdAgent.ShowStatementRecomment();
            }
            if (PlatUtils.IsWechat) {
                return Utils.instance.showCrossWidget6();
            }
        }
        return null;
    }

    public getNativeAdData(params: any): any {
        if (this._curAdAgent) {
            YwLogUtils.showLog("adManager 获取原生广告");
            return this._curAdAgent.getNativeAdData(params);
        }
        return null;
    }

    public showStatementAds(params: any): { type: number; node: Node | null } {
        const result = {
            type: -1,
            node: null as Node | null
        };

        if (this.checkShowAdTime()) {
            if (this._curAdAgent && (PlatUtils.IsWechat || PlatUtils.IsBaidu)) {
                return this._curAdAgent.showStatementAds(params);
            } else {
                if (PlatUtils.IsQTT) {
                    Utils.instance.adManager.showInteractiveAd();
                } else {
                    Utils.instance.adManager.ShowInterstitial();
                }
                YwLogUtils.showLog("非oppo和微信平台正常显示结算广告");
                return result;
            }
        } else {
            YwLogUtils.showLog("显示结算页面广告时间未达限制！");
            return result;
        }
    }

    public hideKyxBanner(): void {}

    public showBeforGameOverAd(level: number, isWin: boolean, params: any, callback: Function, callback2: Function): void {
        if (callback) {
            callback();
        }
    }

    public getRewardCloseAndShowCallFunc(type: number): Function | null {
        let func: Function | null = null;
        switch (type) {
            case 1:
                func = Utils.instance.adManager.showShareRecordPanel;
                break;
            case 2:
                func = Utils.instance.adManager.showRewardBoxPanel;
                break;
            case 3:
                func = Utils.instance.adManager.showrewardTurnTablePanel;
                break;
            case 4:
                func = Utils.instance.adManager.showRewardShortCutPanel;
                break;
            case 5:
                func = Utils.instance.adManager.showRecGamePanel;
                break;
            case 6:
                func = Utils.instance.adManager.showRewardLuckBoxPanel;
                break;
        }
        return func;
    }

    public checkShowBeforGameOverAd(level: number, isWin: boolean): BeForGameOverAdId {
        if (!this._curAdAgent || !Utils.instance.ServerConfig) {
            YwLogUtils.showLog("组件初始化失败！");
            return BeForGameOverAdId.None;
        }

        const shareInterval = Utils.instance.ServerConfig.befor_game_over_share_interval;
        const rewardBoxInterval = Utils.instance.ServerConfig.befor_game_over_reward_box_interval;
        const turntableInterval = Utils.instance.ServerConfig.befor_game_over_turntable_interval;
        const desktopInterval = Utils.instance.ServerConfig.auto_desktop_interval;
        const recGameInterval = Utils.instance.ServerConfig.befor_game_over_rec_game_interval;
        const luckBoxInterval = Utils.instance.ServerConfig.befor_game_over_luck_box_interval;
        let shareType = Utils.instance.ServerConfig.befor_game_over_share_type;
        let rewardBoxType = Utils.instance.ServerConfig.befor_game_over_reward_box_type;
        const turntableType = Utils.instance.ServerConfig.befor_game_over_turntable_type;
        const recGameType = Utils.instance.ServerConfig.befor_game_over_rec_game_type;
        const luckBoxType = Utils.instance.ServerConfig.befor_game_over_luck_box_type;
        const desktopType = Utils.instance.ServerConfig.auto_desktop_type;
        const syncList = Utils.instance.ServerConfig.befor_game_over_sync_list;
        const syncInterval = Utils.instance.ServerConfig.befor_game_over_sync_interval;
        const syncType = Utils.instance.ServerConfig.befor_game_over_sync_type;

        if (PlatUtils.IsTest) {
            rewardBoxType = "all";
            rewardBoxInterval = 1;
        }

        let resultType = BeForGameOverAdId.None;
        let canShow = false;

        if (syncList) {
            YwLogUtils.showLog(`进入同步显示弹窗判断：${syncList} <<interval=${syncInterval} <<<type${syncType}`);
            switch (syncType) {
                case "all":
                    canShow = true;
                    break;
                case "success":
                    canShow = isWin;
                    break;
                case "fail":
                    canShow = !isWin;
                    break;
            }

            if (canShow && syncInterval && level % syncInterval === 0) {
                const types = syncList.split("");
                for (let i = 0; i < types.length; i++) {
                    if (i === 0) {
                        resultType = this.beforRewardTypes[parseInt(types[i]) - 1];
                    }
                    let closeFunc: Function | null = null;
                    if (i === types.length - 1) {
                        closeFunc = Utils.instance.rewardCloseFunc;
                    } else {
                        closeFunc = this.getRewardCloseAndShowCallFunc(parseInt(types[i + 1]));
                    }
                    switch (types[i]) {
                        case "1":
                            Utils.instance.shareRecordPanelCloseFunc = closeFunc;
                            break;
                        case "2":
                            Utils.instance.rewardBoxPanelCloseFunc = closeFunc;
                            break;
                        case "3":
                            Utils.instance.turnTablePanelCloseFunc = closeFunc;
                            break;
                        case "4":
                            Utils.instance.rewardShortCutPanelCloseFunc = closeFunc;
                            break;
                        case "5":
                            Utils.instance.rewardRecGamePanelCloseFunc = closeFunc;
                            break;
                        case "6":
                            Utils.instance.rewardLuckBoxPanelCloseFunc = closeFunc;
                            break;
                    }
                }
            }
        } else {
            let typeCount = 0;
            if (shareType) typeCount++;
            if (rewardBoxType) typeCount++;
            if (turntableType) typeCount++;
            if (desktopType) typeCount++;
            if (luckBoxType) typeCount++;
            YwLogUtils.showLog(`显示的类型${typeCount}种，进行顺序切换判断,上一次显示的类型为：${this._lastShowGameOverAdType}`);

            canShow = true;

            if (shareInterval && level % shareInterval === 0) {
                YwLogUtils.showLog(`进入显示分享奖励弹窗判断${shareType} <<`);
                if (typeCount > 1) {
                    canShow = this._lastShowGameOverAdType !== BeForGameOverAdId.SharePanel;
                }
                if (canShow) {
                    switch (shareType) {
                        case "all":
                            YwLogUtils.showLog(`间隔${shareInterval}关，显示分享奖励弹窗！`);
                            resultType = BeForGameOverAdId.SharePanel;
                            break;
                        case "success":
                            if (isWin) {
                                resultType = BeForGameOverAdId.SharePanel;
                                YwLogUtils.showLog(`游戏胜利 >> 间隔${shareInterval}关，显示分享奖励弹窗！`);
                            }
                            break;
                        case "fail":
                            if (!isWin) {
                                resultType = BeForGameOverAdId.SharePanel;
                                YwLogUtils.showLog(`游戏失败 >> 间隔${shareInterval}关，显示分享奖励弹窗！`);
                            }
                            break;
                    }
                }
            }

            if (resultType !== BeForGameOverAdId.None) {
                YwLogUtils.showLog(`结算前广告验证完成，显示结算前广告类型：${resultType}`);
                this._lastShowGameOverAdType = resultType;
                return resultType;
            }

            if (rewardBoxInterval && level % rewardBoxInterval === 0) {
                YwLogUtils.showLog(`进入显示宝箱判断${rewardBoxType} <<`);
                if (typeCount > 1) {
                    canShow = this._lastShowGameOverAdType !== BeForGameOverAdId.GoldBox;
                }
                if (canShow) {
                    switch (rewardBoxType) {
                        case "all":
                            resultType = BeForGameOverAdId.GoldBox;
                            YwLogUtils.showLog(`间隔${rewardBoxInterval}关，显示宝箱弹窗！`);
                            break;
                        case "success":
                            if (isWin) {
                                resultType = BeForGameOverAdId.GoldBox;
                                YwLogUtils.showLog(`游戏胜利 >> 间隔${rewardBoxInterval}关，显示宝箱弹窗！`);
                            }
                            break;
                        case "fail":
                            if (!isWin) {
                                resultType = BeForGameOverAdId.GoldBox;
                                YwLogUtils.showLog(`游戏失败 >> 间隔${rewardBoxInterval}关，显示宝箱弹窗！`);
                            }
                            break;
                    }
                }
            }

            if (resultType !== BeForGameOverAdId.None) {
                YwLogUtils.showLog(`结算前广告验证完成，显示结算前广告类型：${resultType}`);
                this._lastShowGameOverAdType = resultType;
                return resultType;
            }

            if (turntableInterval && level % turntableInterval === 0) {
                YwLogUtils.showLog(`进入显示抽奖弹窗判断${turntableType} <<`);
                if (typeCount > 1) {
                    canShow = this._lastShowGameOverAdType !== BeForGameOverAdId.Turntable;
                }
                if (canShow) {
                    switch (turntableType) {
                        case "all":
                            resultType = BeForGameOverAdId.Turntable;
                            YwLogUtils.showLog(`间隔${turntableInterval}关，显示抽奖弹窗！`);
                            break;
                        case "success":
                            if (isWin) {
                                resultType = BeForGameOverAdId.Turntable;
                                YwLogUtils.showLog(`游戏胜利 >> 间隔${turntableInterval}关，显示抽奖弹窗！`);
                            }
                            break;
                        case "fail":
                            if (!isWin) {
                                resultType = BeForGameOverAdId.Turntable;
                                YwLogUtils.showLog(`游戏失败 >> 间隔${turntableInterval}关，显示抽奖弹窗！`);
                            }
                            break;
                    }
                }
            }

            if (resultType !== BeForGameOverAdId.None) {
                YwLogUtils.showLog(`结算前广告验证完成，显示结算前广告类型：${resultType}`);
                this._lastShowGameOverAdType = resultType;
                return resultType;
            }

            if (desktopInterval && level % desktopInterval === 0) {
                YwLogUtils.showLog(`进入显示添加桌面弹窗判断${desktopType} <<`);
                if (typeCount > 1) {
                    canShow = this._lastShowGameOverAdType !== BeForGameOverAdId.CreateShortCut;
                }
                if (canShow) {
                    switch (desktopType) {
                        case "all":
                            resultType = BeForGameOverAdId.CreateShortCut;
                            YwLogUtils.showLog(`间隔${desktopInterval}关，显示添加桌面弹窗！`);
                            break;
                        case "success":
                            if (isWin) {
                                resultType = BeForGameOverAdId.CreateShortCut;
                                YwLogUtils.showLog(`游戏胜利 >> 间隔${desktopInterval}关，显示添加桌面弹窗！`);
                            }
                            break;
                        case "fail":
                            if (!isWin) {
                                resultType = BeForGameOverAdId.CreateShortCut;
                                YwLogUtils.showLog(`游戏失败 >> 间隔${desktopInterval}关，显示添加桌面弹窗！`);
                            }
                            break;
                    }
                }
            } else {
                YwLogUtils.showLog("结算前广告验证完成，不显示结算前广告！");
            }

            if (resultType !== BeForGameOverAdId.None) {
                YwLogUtils.showLog(`结算前广告验证完成，显示结算前广告类型：${resultType}`);
                this._lastShowGameOverAdType = resultType;
                return resultType;
            }

            if (recGameInterval && level % recGameInterval === 0) {
                YwLogUtils.showLog(`进入显示游戏推荐弹窗判断${recGameType} <<`);
                if (typeCount > 1) {
                    canShow = this._lastShowGameOverAdType !== BeForGameOverAdId.RecGame;
                }
                if (canShow) {
                    switch (recGameType) {
                        case "all":
                            resultType = BeForGameOverAdId.RecGame;
                            YwLogUtils.showLog(`间隔${recGameInterval}关，显示游戏推荐弹窗！`);
                            break;
                        case "success":
                            if (isWin) {
                                resultType = BeForGameOverAdId.RecGame;
                                YwLogUtils.showLog(`游戏胜利 >> 间隔${recGameInterval}关，显示游戏推荐弹窗！`);
                            }
                            break;
                        case "fail":
                            if (!isWin) {
                                resultType = BeForGameOverAdId.RecGame;
                                YwLogUtils.showLog(`游戏失败 >> 间隔${recGameInterval}关，显示游戏推荐弹窗！`);
                            }
                            break;
                    }
                }
            } else {
                YwLogUtils.showLog("结算前广告验证完成，不显示更多游戏广告！");
            }

            if (resultType !== BeForGameOverAdId.None) {
                YwLogUtils.showLog(`结算前广告验证完成，显示结算前广告类型：${resultType}`);
                this._lastShowGameOverAdType = resultType;
                return resultType;
            }

            if (luckBoxInterval && level % luckBoxInterval === 0) {
                YwLogUtils.showLog(`进入显示幸运宝箱弹窗判断${luckBoxType} <<`);
                if (typeCount > 1) {
                    canShow = this._lastShowGameOverAdType !== BeForGameOverAdId.LuckBox;
                }
                if (canShow) {
                    switch (luckBoxType) {
                        case "all":
                            resultType = BeForGameOverAdId.LuckBox;
                            YwLogUtils.showLog(`间隔${luckBoxInterval}关，显示游戏推荐弹窗！`);
                            break;
                        case "success":
                            if (isWin) {
                                resultType = BeForGameOverAdId.LuckBox;
                                YwLogUtils.showLog(`游戏胜利 >> 间隔${luckBoxInterval}关，显示游戏推荐弹窗！`);
                            }
                            break;
                        case "fail":
                            if (!isWin) {
                                resultType = BeForGameOverAdId.LuckBox;
                                YwLogUtils.showLog(`游戏失败 >> 间隔${luckBoxInterval}关，显示游戏推荐弹窗！`);
                            }
                            break;
                    }
                }
            } else {
                YwLogUtils.showLog("结算前广告验证完成，不显示幸运宝箱弹窗！");
            }
        }

        YwLogUtils.showLog(`结算前广告验证完成，显示结算前广告类型：${resultType}`);
        this._lastShowGameOverAdType = resultType;
        return resultType;
    }

    public showShareRecordPanel(params: any): any {
        return null;
    }

    public showRewardBoxPanel(): any {
        return null;
    }

    public showRecGamePanel(): any {
        return null;
    }

    public showrewardTurnTablePanel(): any {
        return null;
    }

    public showRewardShortCutPanel(): any {
        return null;
    }

    public showRewardLuckBoxPanel(): any {
        return null;
    }

    public checkShowAdTime(): boolean {
        if (!Utils.instance._isConfigInit) {
            YwLogUtils.showLog("warn:组件配置未初始化!");
            return false;
        }

        const elapsedTime = (new Date().getTime() - Utils.instance._gameEntryTime) / 1000;
        let showAdTime = 0;

        if (PlatUtils.IsOPPO) {
            showAdTime = 90;
        }

        if (Utils.instance.checkConfigHasKey("first_show_ad_time")) {
            showAdTime = Utils.instance.getConfigIntValue("first_show_ad_time", 0);
        }

        YwLogUtils.showLog(`验证当前广告显示时间：#showAdTime=${showAdTime} #interval=${elapsedTime}`);
        return elapsedTime >= showAdTime;
    }

    public checkIsRemoveAd(): boolean {
        return YZ_LocalStorage.getItem(YZ_Constant.ST_REMOVE_AD, "false") === "true";
    }

    public checkInsertAdTime(): boolean {
        const intervalTime = Utils.instance.getConfigIntValue("interstitial_show_interval_time", -1);
        if (intervalTime > 0) {
            const currentTime = new Date().getTime();
            const elapsedTime = (currentTime - this._insertLastShowTime) / 1000;
            if (elapsedTime < intervalTime) {
                YwLogUtils.showLog(`验证当前插屏广告显示时间：#showAdTime=${intervalTime} #interval=${elapsedTime}`);
                return false;
            }
            this._insertLastShowTime = currentTime;
        }
        return true;
    }

    public showBlockAd(params: any): void {
        if (this._curAdAgent && PlatUtils.IsQQ) {
            this._curAdAgent.showBlockAd(params);
        }
    }

    public hideBlockAd(params: any): void {
        if (this._curAdAgent && PlatUtils.IsQQ) {
            this._curAdAgent.hideBlockAd();
        }
    }

    public showFullScreenVideo(callback: Function): void {
        if (this._curAdAgent) {
            this._curAdAgent.showFullScreenVideo(callback);
        } else if (callback) {
            callback(false, "视频加载失败！");
        }
    }

    public ShowSingleNativeAd(params: any): void {
        if (this.checkShowAdTime()) {
            if (this._curAdAgent && this._curAdAgent.ShowSingleNativeAd) {
                this._curAdAgent.ShowSingleNativeAd(params);
            }
        } else {
            YwLogUtils.showLog("显示广告条时间未达限制！");
        }
    }

    public HideSingleNativeAd(params: any): void {
        if (this._curAdAgent && this._curAdAgent.HideSingleNativeAd) {
            this._curAdAgent.HideSingleNativeAd(params);
        }
    }

    public showCustomAd(params: any): void {
        if (this.checkShowAdTime()) {
            if (this._curAdAgent && this._curAdAgent.showCustomAd) {
                this._curAdAgent.showCustomAd(params);
            }
        } else {
            YwLogUtils.showLog("显示原生模版广告时间未达限制！");
        }
    }

    public hideCustomAd(params: any): void {
        if (this._curAdAgent && this._curAdAgent.hideCustomAd) {
            this._curAdAgent.hideCustomAd(params);
        }
    }

    public showCustomAdPanel(params: any, callback: Function): any {
        return null;
    }

    public showNextLevelAd(callback: Function): void {
        const self = this;
        if (this._isShowNextLevelAd) {
            YwLogUtils.showLog("下一关广告正在加载中···");
        } else {
            this._isShowNextLevelAd = true;
            const adType = Utils.instance.getConfigStringValue("next_level_ad_type");
            const adInterval = Utils.instance.getConfigIntValue("next_level_ad_interval");
            const startLevel = Utils.instance.getConfigIntValue("next_level_ad_start");
            const currentLevel = Utils.instance.currentLevel;

            YwLogUtils.showLog(`显示点击下一关后的广告: #curLevel=${currentLevel} #nextLevelAdType=${adType} #nextLevelAdInterval=${adInterval} #nextLevelStartLevel=${startLevel}`);

            if (adType) {
                if (currentLevel > startLevel && currentLevel % adInterval === 0) {
                    switch (adType) {
                        case "reward_video":
                            YwLogUtils.showLog("next_level_ad：激励视频！");
                            Utils.instance.adManager.ShowVideo((success: boolean, message: string) => {
                                self._isShowNextLevelAd = false;
                                if (callback) {
                                    callback();
                                }
                            });
                            break;
                        case "interstitial":
                            YwLogUtils.showLog("next_level_ad：插屏！");
                            this._isShowNextLevelAd = false;
                            Utils.instance.adManager.ShowInterstitial();
                            break;
                    }
                } else {
                    this._isShowNextLevelAd = false;
                    if (callback) {
                        callback();
                    }
                }
            } else {
                this._isShowNextLevelAd = false;
                if (callback) {
                    callback();
                }
            }
        }
    }
}