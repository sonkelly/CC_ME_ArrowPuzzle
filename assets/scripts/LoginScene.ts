import { _decorator, Component, Node, dynamicAtlasManager, macro, profiler, sys, director } from 'cc';
import { BundleManager } from './BundleManager';
import { ModuleEventKey } from './IGameRawData';
import { BaseDataManager } from './BaseDataManager';
import { ModuleEventHandlerMgr } from './ModuleEventHandlerMgr';
import { EventManager } from './Event/EventManager';
import { I18nManager, Language } from './I18nManager';
import { MainLoading } from './MainLoading';
import { GameLogicConfig } from './GameLogicConfig';
import { ConfigHelper } from './ConfigHelper';
import { QddSDKHelper } from './QddSDKHelper';
import { DeviceUtils } from './Utils/DeviceUtils';
import { GameLocalStorage } from './GameLocalStorage';
import { JsonLoadder } from './JsonClass';
import { MathUtils } from './Utils/MathUtils';
import { Utilsqdd } from './Utils/Utilsqdd';
import { BaseScene } from './BaseScene';
import { LieyouSDK } from './SDK/LieyouSDK';
import { DirectPlayUtil } from './DirectPlayUtil';
import { GameController } from './GameController';
import { Utils } from './Utils';
import { GameChannel } from './GameChannel';

const { ccclass, property } = _decorator;

@ccclass('LoginScene')
export class LoginScene extends BaseScene {
    @property(Node)
    public UISkyLayer: Node = null;

    @property(Node)
    public loadingNode: Node = null;

    @property(Node)
    public logoEn: Node = null;

    @property(Node)
    public logoZh: Node = null;

    @property(Node)
    public logojyxjj: Node = null;

    @property(Node)
    public logoGp: Node = null;

    public init(): void {
        const self = this;
        (async function() {
            DirectPlayUtil.init();
            dynamicAtlasManager.enabled = false;
            macro.CLEANUP_IMAGE_CACHE = true;
            profiler.hideStats();
            DeviceUtils.isTablet();
            await BundleManager.instance.loadBundle('core');

            if (typeof window.FB !== 'undefined' || window.FBInstant != null) {
                self.logoEn.active = true;
                self.logoZh.active = false;
                self.logoGp.active = false;
                self.logojyxjj.active = false;
            } else if (sys.platform === sys.Platform.WECHAT_GAME) {
                self.logoEn.active = false;
                self.logoZh.active = GameChannel.isOfficial;
                self.logojyxjj.active = GameChannel.isCloneXJJ;
                self.logoGp.active = false;
            } else {
                self.logoEn.active = false;
                self.logoZh.active = false;
                self.logoGp.active = true;
                self.logojyxjj.active = false;
                if (Utils != null) {
                    Utils.instance.registerServerInitEvent(function() {
                        console.log('组件初始化完成>>>>>>> ');
                    }, self);
                }
            }

            if (DirectPlayUtil.isDirectPlay) {
                director.preloadScene('GameScene');
            } else {
                director.preloadScene('LoadingScene');
            }

            self.initSDK();
        })();
    }

    public initSDK(): void {
        const self = this;
        QddSDKHelper.getInstance().initQddSDKHelper(function() {
            console.log('QDDSDK LoginScene init success===================================', ConfigHelper.getGameConfig().logSwitch);
            ConfigHelper.getGameConfig().logSwitch;

            if (SDKInstance.isFacebookMiniGame() || SDKInstance.isGooglePlayNative()) {
                I18nManager.init(Language.EN);
            } else {
                I18nManager.init(Language.ZH);
            }

            if (SDKInstance.isWxPlatform()) {
                LieyouSDK.init().then(function(openId: string) {
                    SDKInstance.login({
                        resultCallback: function(success: boolean, data: any) {
                            if (success) {
                                self.onLogin(data);
                            } else {
                                console.log('QDDSDK login fail==========');
                            }
                        },
                        openId: openId
                    });
                });
            } else {
                self.loginFunc();
            }
        });

        this.initInstance();
        super.init.call(this);
        this.ready();
        this.addListen();
    }

    public loginFunc(): void {
        const self = this;
        SDKInstance.login({
            resultCallback: function(success: boolean, data: any) {
                if (success) {
                    if (SDKInstance.isQQPlatform() || SDKInstance.isOppoPlatform() || SDKInstance.isVivoPlatform()) {
                        SDKInstance.showPrivacyAgreement(function(agreed: boolean) {
                            if (agreed) {
                                self.onLogin(data);
                            } else {
                                if (SDKInstance.isOppoPlatform()) {
                                    qg.exitApplication({ data: '' });
                                }
                                if (SDKInstance.isQQPlatform()) {
                                    qq.exitMiniProgram({});
                                }
                                if (SDKInstance.isKsPlatform()) {
                                    ks.exitMiniProgram();
                                }
                            }
                        });
                    } else {
                        self.onLogin(data);
                    }
                } else {
                    self.schedule(self.retryLogin, 1);
                }
            }
        });
    }

    public ready(): void {
        const self = this;
        (async function() {
            self.load_bundle();
        })();
    }

    public load_bundle(): void {
        const self = this;
        (async function() {
            await BundleManager.instance.loadBundle('game');
        })();
    }

    public loadRes(): void {
        const mainLoading = MainLoading.ins;
        if (mainLoading) {
            mainLoading.preload();
            mainLoading.load_all_res()
                .then(function(result: any) {})
                .catch(function(error: any) {});
        }
    }

    public initInstance(): void {
        // Empty implementation
    }

    public addListen(): void {
        // Empty implementation
    }

    public retryLogin(): void {
        const self = this;
        if (SDKInstance.isHuaWeiPlatform() || SDKInstance.isHonorPlatform()) {
            return;
        }
        SDKInstance.login({
            resultCallback: function(success: boolean, data: any) {
                if (success) {
                    self.onLogin(data);
                    self.unschedule(self.retryLogin);
                }
            }
        });
    }

    public onLogin(data: any): void {
        const self = this;
        (async function(data: any) {
            if (data) {
                BaseDataManager.userCountry = data.country;
                BaseDataManager.userCountry = BaseDataManager.userCountry?.toLocaleUpperCase();
            }

            if (SDKInstance.isDebug()) {
                self.onLoginTypeLocal();
            } else {
                self.onLoginOnLine(data?.openId);
            }
        })(data);
    }

    public onLoginTypeLocal(): void {
        const testOpenId = GameLocalStorage.getItem('test_open_id');
        if (Utilsqdd.isNil(testOpenId)) {
            const newOpenId = '' + MathUtils.Random(100000000, 999999999);
            GameLocalStorage.setItem('test_open_id', newOpenId);
            this.onEnterGame(newOpenId);
        } else {
            this.onEnterGame(testOpenId);
        }
    }

    public onLoginOnLine(openId: string): void {
        if (SDKInstance.isGooglePlayNative()) {
            const testOpenId = GameLocalStorage.getItem('test_open_id');
            if (Utilsqdd.isNil(testOpenId)) {
                const uuid = this.genUUID();
                GameLocalStorage.setItem('test_open_id', uuid);
                openId = uuid;
            } else {
                openId = testOpenId;
            }
        }
        console.log('获取到openId: ', openId);
        this.onEnterGame(openId);
    }

    public genUUID(): string {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c: string) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public onEnterGame(openId: string): void {
        const self = this;
        (async function(openId: string) {
            ModuleEventHandlerMgr.GetInstance().Init();
            JsonLoadder.load(async function() {
                if (DirectPlayUtil.isDirectPlay) {
                    await BundleManager.instance.loadBundle('level_wx');
                    GameController.instance.init();
                }
                EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.LoginSuccess, [openId]);
            });
        })(openId);
    }

    public startGame(): void {
        const loginDate = GameLocalStorage.getItem('login_date');
        this.onLogin(loginDate);
    }
}