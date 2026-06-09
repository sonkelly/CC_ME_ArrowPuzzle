import { _decorator, Component, Prefab, ProgressBar, Label, Node, director, Director } from 'cc';
import { BundleManager } from './BundleManager';
import { MainLoading } from './MainLoading';
import { JsonLoadder } from './JsonClass';
import { BaseScene } from './BaseScene';
import { SceneNameEnum } from './GlobalEnum';

const { ccclass, property } = _decorator;

enum LoadingStatus {
    none = 0,
    prepareLoading = 1,
    loading = 2,
    complete = 3
}

@ccclass('Loading')
export class Loading extends BaseScene {
    @property(Prefab)
    blockPrefab: Prefab | null = null;

    @property(Prefab)
    tetrominoPrefab: Prefab | null = null;

    @property(ProgressBar)
    pro_bar: ProgressBar | null = null;

    @property(Label)
    lb_progress: Label | null = null;

    @property(Node)
    tips: Node | null = null;

    static status: LoadingStatus = LoadingStatus.none;
    static sceneName: string | null = null;
    static lastSceneName: string | null = null;
    static loadRecord: Map<string, boolean> = new Map();
    static POOL_WEIGHT: number = 0.8;
    static RES_WEIGHT: number = 0.2;

    isPoolInitialized: boolean = false;
    resourceProgress: number = 0;
    poolProgress: number = 0;
    targetTotalProgress: number = 0;
    currentShowProgress: number = 0;
    private _progress: number = 0;

    get progress(): number {
        return this._progress;
    }

    set progress(value: number) {
        if (this._progress !== value) {
            this._progress = value;
        }
    }

    static loadScene(sceneName: string): void {
        if (this.status !== LoadingStatus.loading) {
            this.lastSceneName = this.sceneName;
            this.sceneName = sceneName;
            this.status = LoadingStatus.loading;
            SDKInstance.isWxPlatform();
            director.loadScene("Loading");
        }
    }

    static back_login(): void {
        this.status = LoadingStatus.none;
        this.loadRecord.clear();
        director.loadScene(SceneNameEnum.LogInScene);
    }

    static reloadScene(): void {
        this.status = LoadingStatus.none;
        this.loadScene(this.sceneName!);
    }

    onLoad(): void {
        // Empty onLoad
    }

    checkCanEnterNextScene(): void {
        if (this.isPoolInitialized && Loading.status === LoadingStatus.complete) {
            this.loadSceneComp();
        }
    }

    updateTotalProgress(): void {
        this.targetTotalProgress = Math.min(100, Math.floor(
            this.poolProgress * Loading.POOL_WEIGHT + 
            this.resourceProgress * Loading.RES_WEIGHT
        ));
    }

    async start(): Promise<void> {
        this.init();
        this.updateResourceProgress(5);
        this.progress = 0;
        this.start_load();
    }

    start_load(): void {
        if (Loading.sceneName) {
            Loading.status = LoadingStatus.loading;
            this.preloadScene();
            this.load_bundle();
        }
    }

    updateResourceProgress(progress: number): void {
        this.resourceProgress = progress;
        this.updateTotalProgress();
    }

    async load_bundle(): Promise<void> {
        await BundleManager.instance.loadBundle("game");
        this.loadConf();
        this.updateResourceProgress(15);
        this.scheduleOnce(() => {
            if (Loading.status === LoadingStatus.loading) {
                console.error("场景加载超时！");
                Loading.reloadScene();
            }
        }, 30);
    }

    preloadScene(callback?: () => void): void {
        director.preloadScene(
            Loading.sceneName!,
            (completedCount: number, totalCount: number, item: any) => {
                Number((completedCount / totalCount).toFixed(10));
            },
            (error: Error | null) => {
                if (error) {
                    Loading.reloadScene();
                } else {
                    callback && callback();
                }
            }
        );
    }

    static async safeLoadScene(sceneName: string, callback?: () => void): Promise<void> {
        await new Promise<void>((resolve) => {
            director.once(Director.EVENT_AFTER_DRAW, resolve);
        });
        await this.waitOneFrame();
        director.loadScene(sceneName, () => {
            callback && callback();
        }, () => {
            // Empty error callback
        });
    }

    static async waitOneFrame(): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(resolve, 1000 / 60);
        });
    }

    loadConf(): void {
        const self = this;
        const onComplete = () => {
            self.updateResourceProgress(30);
            Loading.loadRecord.set("load_conf", true);
            self.loadRes();
        };

        if (Loading.loadRecord.get("load_conf")) {
            onComplete();
            return;
        }

        JsonLoadder.load(
            () => {
                onComplete();
            },
            () => {
                Loading.reloadScene();
            }
        );
    }

    loadRes(): void {
        const self = this;
        let mainLoading: MainLoading | null = null;

        switch (Loading.sceneName) {
            case SceneNameEnum.MainScene:
                mainLoading = MainLoading.ins;
                break;
        }

        if (!mainLoading) {
            Loading.status = LoadingStatus.complete;
            this.updateResourceProgress(100);
            return;
        }

        mainLoading.preload();
        mainLoading.load_all_res()
            .then(() => {
                Loading.status = LoadingStatus.complete;
                self.updateResourceProgress(100);
                self.checkCanEnterNextScene();
            })
            .catch((error: any) => {
                console.error("场景资源加载异常，场景：" + Loading.sceneName + ".....", error);
                Loading.reloadScene();
            });
    }

    refreshProgress(): void {
        if (this.currentShowProgress < this.targetTotalProgress) {
            const diff = this.targetTotalProgress - this.currentShowProgress;
            this.currentShowProgress += Math.ceil(0.1 * diff);
        } else {
            this.currentShowProgress = this.targetTotalProgress;
        }

        if (this.pro_bar) {
            this.pro_bar.progress = this.currentShowProgress / 100;
        }
        if (this.lb_progress) {
            this.lb_progress.string = "LOADING......" + this.currentShowProgress + "%";
        }
    }

    update(deltaTime: number): void {
        this.refreshProgress();
    }

    async loadSceneComp(): Promise<void> {
        const self = this;
        if (!this.isPoolInitialized) {
            await new Promise<void>((resolve) => {
                const checkInitialized = () => {
                    if (self.isPoolInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInitialized, 50);
                    }
                };
                checkInitialized();
            });
        }
        Loading.safeLoadScene(Loading.sceneName!);
        Loading.status = LoadingStatus.none;
    }
}