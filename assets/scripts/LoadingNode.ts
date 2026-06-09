import { _decorator, Component, Prefab, ProgressBar, Label, Node, instantiate, AudioClip } from 'cc';
import { DnSdkManager } from './DnSdkManager';
import { EasDataSDK } from './EasDataSDK';
import { Global } from './Global';
import { GameType } from './GlobalEnum';
import { GameController } from './GameController';
import { AchievementManager } from './Achievement/AchievementManager';
import { PlatformManager } from './PlatformManager';
import { RankDataManager } from './RankDataManager';
import { TournamentDataManager } from './Tournament/TournamentDataManager';
import { TournamentWxMgr } from './Tournament/TournamentWxMgr';
import { PoolManager } from './PoolManager';
import { LevelLoader } from './LevelLoader';
import { I18nManager, Language } from './I18nManager';
import { Loading } from './Loading';
import { BundleManager } from './BundleManager';
import { GameAssetManager } from './GameAssetManager';
import { GameLogicConfig } from './GameLogicConfig';
import { effect_component } from './effect_component';
import { LoadingProgressTracker } from './LoadingProgressTracker';
import { ZanFlyEffect } from './ZanFlyEffect';
import { TierManager } from './TierManager';
import { GameChannel } from './GameChannel';
import { TrackManager } from './TrackManager';

const { ccclass, property } = _decorator;

@ccclass('LoadingNode')
export class LoadingNode extends Component {
    @property(Prefab)
    public bodyPre: Prefab = null;

    @property(Prefab)
    public headPre: Prefab = null;

    @property(Prefab)
    public tailPre: Prefab = null;

    @property(Prefab)
    public gridItemArrow: Prefab = null;

    @property(Prefab)
    public pixelPrefab: Prefab = null;

    @property(Prefab)
    public arrowPrefab: Prefab = null;

    @property(ProgressBar)
    public pro_bar: ProgressBar = null;

    @property(Label)
    public lb_progress: Label = null;

    @property(Node)
    public tips: Node = null;

    @property(Node)
    public logoEn: Node = null;

    @property(Node)
    public logoZh: Node = null;

    @property(Node)
    public logojyxjj: Node = null;

    @property(Node)
    public logoGp: Node = null;

    public targetTotalProgress: number = 0;
    public currentShowProgress: number = 0;
    public isCompelete: boolean = false;
    public tracker: LoadingProgressTracker = new LoadingProgressTracker();
    private _progress: number = 0;
    public minStep: number = 1;

    get progress(): number {
        return this._progress;
    }

    set progress(value: number) {
        if (this._progress !== value) {
            this._progress = value;
        }
    }

    public onLoad(): void {
        this.isCompelete = false;
        this.logoEn.active = I18nManager.getLanguage() === Language.EN && SDKInstance.isFacebookMiniGame();
        this.logoGp.active = I18nManager.getLanguage() === Language.EN && SDKInstance.isGooglePlayNative();
        this.logoZh.active = I18nManager.getLanguage() === Language.ZH && GameChannel.isOfficial;
        this.logojyxjj.active = I18nManager.getLanguage() === Language.ZH && GameChannel.isCloneXJJ;

        this.scheduleOnce(async () => {
            this.tracker.addTask("ui_preload");
            this.tracker.addTask("bundle_level");
            this.tracker.addTask("tournament_level");
            this.tracker.addTask("level_rescue");
            this.tracker.addTask("effect_pool");

            EasDataSDK.trackEvent("loading_start");
            GameController.instance.init();

            for (let i = 0; i < 250; i++) {
                const arrow = instantiate(this.arrowPrefab);
                PoolManager.instance.put(arrow);
                const head = instantiate(this.headPre);
                PoolManager.instance.put(head);
                const tail = instantiate(this.tailPre);
                PoolManager.instance.put(tail);
            }

            for (let i = 0; i < 3000; i++) {
                const gridArrow = instantiate(this.gridItemArrow);
                PoolManager.instance.put(gridArrow);
            }

            for (let i = 0; i < 5000; i++) {
                const pixel = instantiate(this.pixelPrefab);
                PoolManager.instance.put(pixel);
            }

            for (let i = 0; i < 12000; i++) {
                const body = instantiate(this.bodyPre);
                PoolManager.instance.put(body);
            }

            await this.loadAllWithProgress();
        }, 0.1);
    }

    public async loadAllWithProgress(): Promise<void> {
        this.loadUIPreload();

        /*if (SDKInstance.isFacebookMiniGame()) {
            TournamentDataManager.instance.loadTournamentData(true);
        } else {
            TournamentWxMgr.instance.loadTournamentData(true);
        }*/

        this.loadSounds();
        RankDataManager.instance.createClient();
        LevelLoader.loadRemoteProfile();

        const mainLevelBundle = PlatformManager.getLevelBundleName(GameType.MainLevel);
        BundleManager.instance.loadBundle(mainLevelBundle, (progress: number) => {
            this.tracker.updateTask("bundle_level", progress);
        });

        if (false && SDKInstance.isFacebookMiniGame()) {
            BundleManager.instance.loadBundle("tour_thumbnail", (progress: number) => {
                this.tracker.updateTask("tournament_level", progress);
            });
        } else {
            const tournamentBundle = PlatformManager.getLevelBundleName(GameType.Tournament);
            BundleManager.instance.loadBundle(tournamentBundle, (progress: number) => {
                this.tracker.updateTask("tournament_level", progress);
            });
        }

        const rescueBundle = PlatformManager.getLevelBundleName(GameType.MainLevel, true);
        BundleManager.instance.loadBundle(rescueBundle, (progress: number) => {
            this.tracker.updateTask("level_rescue", progress);
        });

        await this.loadEffectPrefab();

        effect_component.init_pool().then(() => {
            this.tracker.finishTask("effect_pool");
        });

        this.loadZanEffectPrefab();
    }

    public loadUIPreload(): void {
        const preloadList = GameLogicConfig.preload_pop_list.main;

        if (preloadList.length !== 0) {
            const progressMap = new Map<string, number>();

            preloadList.forEach((item: string) => {
                progressMap.set(item, 0);

                GameAssetManager.loadAsset("game", item, Prefab, null, (loaded: number, total: number) => {
                    progressMap.set(item, loaded / total);
                    let totalProgress = 0;
                    progressMap.forEach((value: number) => {
                        totalProgress += value;
                    });
                    this.tracker.updateTask("ui_preload", totalProgress / preloadList.length);
                }).then(() => {
                    progressMap.set(item, 1);
                    let totalProgress = 0;
                    progressMap.forEach((value: number) => {
                        totalProgress += value;
                    });
                    this.tracker.updateTask("ui_preload", totalProgress / preloadList.length);

                    const allCompleted = Array.from(progressMap.values()).every((value: number) => value >= 1);
                    if (allCompleted) {
                        this.tracker.finishTask("ui_preload");
                    }
                });
            });
        } else {
            this.tracker.finishTask("ui_preload");
        }
    }

    public async loadEffectPrefab(): Promise<void> {
        await GameAssetManager.loadAssetByPath("game", "prefab/$effect/effect_component", Prefab, (loaded: number, total: number) => {
            this.tracker.updateTask("effect_prefab", loaded / total);
        });
        this.tracker.finishTask("effect_prefab");
    }

    public async loadZanEffectPrefab(): Promise<void> {
        await GameAssetManager.loadAssetByPath("game", "prefab/$effect/zan", Prefab, (loaded: number, total: number) => {
            this.tracker.updateTask("zan", loaded / total);
        });
        this.tracker.finishTask("zan");
        ZanFlyEffect.init_pool();
    }

    public async loadSounds(): Promise<void> {
        await GameAssetManager.loadAsset("game", "arrowfb", AudioClip);
        await GameAssetManager.loadAsset("game", "arrow1", AudioClip);
        await GameAssetManager.loadAsset("game", "arrow2", AudioClip);
        await GameAssetManager.loadAsset("game", "arrow3", AudioClip);
        await GameAssetManager.loadAsset("game", "arrow4", AudioClip);
        await GameAssetManager.loadAsset("game", "arrow5", AudioClip);
        await GameAssetManager.loadAsset("game", "arrow6", AudioClip);
        await GameAssetManager.loadAsset("game", "arrow7", AudioClip);
        await GameAssetManager.loadAsset("game", "arrow8", AudioClip);
        await GameAssetManager.loadAsset("game", "error", AudioClip);
        await GameAssetManager.loadAsset("game", "reveiceItem", AudioClip);
        await GameAssetManager.loadAsset("core", "button_click", AudioClip);
    }

    public refreshProgress(): void {
        const remainingProgress = this.targetTotalProgress - this.currentShowProgress;

        if (remainingProgress > 0) {
            const step = Math.max(this.minStep, 0.1 * remainingProgress);
            this.currentShowProgress = Math.min(this.currentShowProgress + step, this.targetTotalProgress);
        } else {
            this.currentShowProgress = Math.min(this.currentShowProgress + this.minStep, 100);
        }

        this.pro_bar.progress = this.currentShowProgress / 100;
        this.lb_progress.string = I18nManager.t("LOADING......{0}%", Math.floor(this.currentShowProgress));

        if (this.currentShowProgress >= 100 && this.tracker.isAllFinished()) {
            this.loadSceneComp();
        }
    }

    public update(deltaTime: number): void {
        if (!this.isCompelete) {
            this.targetTotalProgress = this.tracker.totalProgress;
            this.refreshProgress();
        }
    }

    public async loadSceneComp(): Promise<void> {
        if (!this.isCompelete) {
            this.isCompelete = true;
            this.pro_bar.progress = 1;
            this.lb_progress.string = I18nManager.t("LOADING......{0}%", 100);

            AchievementManager.instance.init();
            TierManager.instance.init();
            TrackManager.instance.init();

            DnSdkManager.instance.sdk?.track("LOAD_FINISH", {});

            this.scheduleOnce(() => {
                Global.isFirstEnter = true;
                Loading.safeLoadScene("GameScene");
            }, 0.1);
        }
    }
}