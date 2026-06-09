import { _decorator, Component, Node, Prefab, Label, Vec3, view, sp, assetManager, JsonAsset } from 'cc';
import { ArrowGameConfig } from './ArrowGameConfig';
import { GameType, LevelType, FailType, AchievementType } from './GlobalEnum';
import { BundleManager } from './BundleManager';
import { GameController } from './GameController';
import { ModuleEventKey } from './IGameRawData';
import { TournamentDataManager } from './Tournament/TournamentDataManager';
import { GameRecord } from './GameRecord';
import { EventManager } from './Event/EventManager';
import { AudioManager } from './AudioManager';
import { PoolManager } from './PoolManager';
import { UILayerManager } from './UILayerManager';
import { TimeTaskManager } from './TimeTaskManager';
import { Toast } from './Toast';
import { GameLogicConfig } from './GameLogicConfig';
import { DailyChallengeModel } from './Daily/DailyChallengeModel';
import { CCExtends } from './CCExtends';
import { Utilsqdd } from './Utils/Utilsqdd';
import { ArrowItem } from './ArrowItem';
import { ClickManager } from './ClickManager';
import { GameManager } from './GameManager';
import { GridItem, GridType } from './GridItem';
import { HintManager } from './HintManager';
import { LevelDataManager } from './LevelDataManager';
import { SaveManager } from './SaveManager';
import { StageCamera } from './StageCamera';
import { PlatformManager } from './PlatformManager';
import { GameLocalStorage } from './GameLocalStorage';
import { LieyouSDK } from './SDK/LieyouSDK';
import { DnSdkManager } from './DnSdkManager';
import { UIUtils } from './Utils/UIUtils';
import { effect_component } from './effect_component';
import { LevelLoader } from './LevelLoader';
import { Global } from './Global';
import { AchievementManager } from './Achievement/AchievementManager';
import { EasDataSDK } from './EasDataSDK';
import { EasOperateSDK } from './EasOperateSDK';
import { DirectPlayUtil } from './DirectPlayUtil';
import { TournamentWxMgr } from './Tournament/TournamentWxMgr';
import { RankDataManager } from './RankDataManager';
import { GameAssetManager } from './GameAssetManager';
import { Utils } from './Utils';
import { ZanFlyEffect } from './ZanFlyEffect';
import { TierManager } from './TierManager';

const { ccclass, property } = _decorator;

declare var SDKInstance: any; // Global SDK instance
declare var FBInstant: any; // Facebook Instant Games

@ccclass('Stage')
export class Stage extends Component {
    @property(StageCamera)
    gameCamera: StageCamera | null = null;

    @property(ClickManager)
    clickMgr: ClickManager | null = null;

    @property(Node)
    pointParent: Node | null = null;

    @property(Node)
    arrowParent: Node | null = null;

    @property(Node)
    longLineParent: Node | null = null;

    @property(Node)
    RescueContainer: Node | null = null;

    @property(Prefab)
    gridItemArrow: Prefab | null = null;

    @property(Prefab)
    pointPrefab: Prefab | null = null;

    @property(Prefab)
    arrowPrefab: Prefab | null = null;

    @property(Prefab)
    linePrefab: Prefab | null = null;

    @property(Node)
    clickNode: Node | null = null;

    @property(Node)
    zoomNode: Node | null = null;

    @property(Label)
    lbRescue: Label | null = null;

    @property(Label)
    lbRescue1: Label | null = null;

    @property(Node)
    lockedNode: Node | null = null;

    @property(Node)
    hintGuideNode: Node | null = null;

    @property
    cellSize: number = 10;

    blockPrefab: Prefab | null = null;
    hintManager: HintManager | undefined;
    _hp: number = 3;
    maxHp: number = 3;
    arrayGrid: (GridItem | null)[][] = [];
    pointMap: Map<number, Node> = new Map();
    _gridItems: Node[] = [];
    _arrows: ArrowItem[] = [];
    _arrowTarget: number = 10;
    _curArrowProgress: number = 0;
    _showGrid: boolean = false;
    lineMap: Map<number, Node> = new Map();
    soundIdx: number = 1;
    curGuideStep: number = 1;
    gameType: GameType = GameType.MainLevel;
    saveMgr: SaveManager | null = null;
    levelType: LevelType = LevelType.EASY;
    viewWidth: number = 0;
    viewHeight: number = 0;
    curdirectGuideStep: number = 1;
    ready: boolean = false;
    isFail: boolean = false;
    failType: FailType = FailType.Hp;
    curData: any = undefined;
    _gameManager: GameManager | null = null;
    _gameController: GameController | null = null;
    pendingArrows: ArrowItem[] = [];
    activeArrows: ArrowItem[] = [];
    arrowBodyQueues: Map<ArrowItem, any[]> = new Map();
    MAX_ACTIVE_ARROWS: number = 60;
    MAX_BODY_PER_FRAME: number = 200;
    soundOP: number = 1;
    PIXEL_ANIM_DELAY: number = .08;
    deltaTime: number = .016;
    spineScale: Vec3 = new Vec3(.08, .08, .08);
    spineOffset: Vec3 = new Vec3(0, 0, 0);
    spineNode: any = null;
    huojiName: string | undefined;
    zanPos: Vec3 = new Vec3(0, 0, 0);
    mistakeCount: number = 0;
    _hasChecked50Percent: boolean = false;
    isGuideShowing: boolean = false;
    finishCalled: boolean = false;
    _winComplete: (() => void) | null = null;
    pixelMinX: number = Infinity;
    pixelMaxX: number = -Infinity;
    pixelMinY: number = Infinity;
    pixelMaxY: number = -Infinity;
    pixelWinAnims: { node: Node; delay: number; startTime: number }[] = [];
    animWinTime: number = 0;
    isPlayingWinAnim: boolean = false;
    pixelAnims: { node: Node; startTime: number; delay: number }[] = [];
    pixelTime: number = 0;
    PIXEL_DURATION: number = .2;
    PIXEL_SCALE_MAX: number = 2;
    PIXEL_SCALE_NORMAL: number = 1;

    onLoad() {
        EventManager.on(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.GameStart, this.startGame, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.DailyChallenge, this.dailyChallenge, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.PlayTournament, this.onPlayTournament, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.PlayTPvp, this.onPlayPvp, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.OnGMGameWin, this.onGMGameWin, this);
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        const size = view.getVisibleSize();
        this.viewWidth = size.width;
        this.viewHeight = size.height;
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
        EventManager.offAll(this);
    }

    start() {
        GameManager.instance.curStage = this;
        const size = view.getVisibleSize();
        this.viewWidth = size.width;
        this.viewHeight = size.height;
        this.hintManager = new HintManager(this);
        this._gameManager = GameManager.instance;
        this._gameController = GameController.instance;
    }

    startGame(data: any, type: GameType = GameType.MainLevel) {
        this._gameManager.startGame(data, type);
        this._gameController.is_ready = false;
        this.gameType = type;
        this._hasChecked50Percent = false;
        this.hintGuideNode.active = false;
        if (type === GameType.MainLevel) {
            TournamentDataManager.instance.backToSoloContext();
            AchievementManager.instance.onEvent(AchievementType.LOGIN_DAY);
        }
        const size = view.getVisibleSize();
        this.viewWidth = size.width;
        this.viewHeight = size.height;
        this.clear();
        UILayerManager.instance?.showGameMenu();
        this.clickMgr.init(this);
        this.init();
    }

    dailyChallenge(level: number) {
        this.startGame(level, GameType.Challenge);
        if (SDKInstance.isWxPlatform() || SDKInstance.isGooglePlayNative()) {
            const date = new Date();
            const month = date.getMonth() + 1;
            const levelId = 100 * month + level;
            if (SDKInstance.isGooglePlayNative()) {
                Utils.instance.StartGame(levelId.toString(), GameManager.instance.getLevelMode());
            } else {
                LieyouSDK.gameBeginLevel(levelId, GameManager.instance.getLevelMode());
            }
        }
    }

    onPlayTournament(level: number) {
        this.startGame(level, GameType.Tournament);
        if (SDKInstance.isWxPlatform() || SDKInstance.isGooglePlayNative()) {
            if (SDKInstance.isGooglePlayNative()) {
                Utils.instance.StartGame(level.toString(), GameManager.instance.getLevelMode());
            } else {
                LieyouSDK.gameBeginLevel(level, GameManager.instance.getLevelMode());
            }
        }
    }

    onPlayPvp(level: number) {
        this.startGame(level, GameType.Pvp);
    }

    async init(): Promise<void> {
        this.isFail = false;
        this.ready = false;
        this._showGrid = false;
        this.saveMgr = null;
        GameController.instance.is_pause = false;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.StartLoad);

        const levelData = await this.loadLevelData(this._gameManager.curLevel);
        let savedData: any = null;
        if (!DirectPlayUtil.isDirectPlay || DirectPlayUtil.isNewUser) {
            if (this.gameType === GameType.MainLevel) {
                this.saveMgr = new SaveManager(SaveManager.ARROW);
                savedData = this.saveMgr?.load();
            } else if (this.gameType === GameType.Challenge) {
                this.saveMgr = new SaveManager(SaveManager.CHALLENGE);
                savedData = this.saveMgr?.load();
            }
            if (this.gameType === GameType.MainLevel || this.gameType === GameType.Challenge) {
                if (!savedData || (savedData.level === this._gameManager.curLevel && savedData.paramHash === levelData.paramHash)) {
                    this.saveMgr?.setLevel(this._gameManager.curLevel, levelData.paramHash);
                } else {
                    savedData.removedArrowIds = [];
                    savedData.errorArrowIds = [];
                    savedData.hp = 0;
                    savedData.score = 0;
                    savedData.level = this._gameManager.curLevel;
                    savedData.remainingSeconds = 0;
                    this.saveMgr?.clear();
                    this.saveMgr?.setLevel(this._gameManager.curLevel, levelData.paramHash);
                }
            }
        }

        const removedSet: Set<number> = savedData ? new Set(savedData.removedArrowIds) : null;
        const errorSet: Set<number> = savedData ? new Set(savedData.errorArrowIds) : null;

        GameController.instance.is_pause = false;
        this.curArrowProgress = 0;
        this.Hp = this.getLevelHp();
        this.finishCalled = false;
        this._gameManager.initRemainingSeconds(this.gameType, levelData.Arrows.length);
        this._gameManager.usedTime = 0;
        this.mistakeCount = 0;
        this._gameManager.resetIdleTimer();
        if (savedData) {
            if (savedData.hp > 0) {
                const diff = this._hp - savedData.hp;
                this._hp = savedData.hp;
                EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ReduceHp, diff, false);
            }
            if (savedData.score && savedData.score > 0) {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.UpdateTournamentScore, savedData.score);
            } else {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.UpdateTournamentScore, 0);
            }
            if (savedData.remainingSeconds && savedData.remainingSeconds > 0) {
                this._gameManager.setRemainingSeconds(savedData.remainingSeconds);
            }
            this.mistakeCount = savedData.mistakeCount && savedData.mistakeCount > 0 ? savedData.mistakeCount : 0;
            this._gameManager.usedTime = Number(GameLocalStorage.getItem('usedTime') || 0);
        }

        this.generateStage(levelData, removedSet, errorSet);
        this.loadRescueSpine(this._gameManager.curLevel, levelData.XSize, levelData.YSize);
    }

    private loadLevelData(level: number): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const isRescue = this._gameManager.isRescueLevel() || this._gameManager.forceRescueLevel(level);
            let bundleName: string;
            if (this.gameType === GameType.Challenge) {
                bundleName = 'level_challenge';
            } else {
                bundleName = PlatformManager.getLevelBundleName(this.gameType, isRescue);
            }
            let bundle = assetManager.getBundle(bundleName);
            if (!bundle) {
                console.warn('资源包 未加载');
                bundle = await BundleManager.instance.loadBundle(bundleName);
            }
            let adjustedLevel = level;
            if (isRescue && !this._gameManager.isRescueLevel()) {
                if (level === 6) adjustedLevel = 4;
                else if (level === 11) adjustedLevel = 5;
            }
            
            const jsonName = LevelDataManager.instance.getLevelJsonName(adjustedLevel, this.gameType, isRescue);
            if (this.gameType !== GameType.MainLevel || Global.isUseLocalLevel()) {
                bundle.load(jsonName, JsonAsset, (err: Error | null, asset: JsonAsset | null) => {
                    if (err || !asset) {
                        console.warn('Level loading failed: ' + jsonName);
                        bundle.load('$level_gen/Level_2', JsonAsset, (err2: Error | null, fallback: JsonAsset | null) => {
                            if (err2 || !fallback) {
                                console.warn('Level loading failed: ' + jsonName);
                                this.generateStageFinish();
                                return;
                            }
                            console.log('重新加载关卡成功: ' + jsonName);
                            resolve(fallback.json);
                        });
                        return;
                    }
                    console.log('加载关卡成功: ' + jsonName);
                    resolve(asset.json);
                });
            } else {
                try {
                    const data = await LevelLoader.loadLevel(adjustedLevel, this.gameType, isRescue, bundle, jsonName);
                    console.log('加载远程关卡成功: Level_' + level);
                    resolve(data);
                } catch (err) {
                    console.warn('加载远程关卡失败: ' + level);
                    this.generateStageFinish();
                }
            }
        });
    }

    preloadNextLevel(level: number) {
        if (level !== this._gameManager.maxLevel && !Global.isUseLocalLevel()) {
            let isRescue = false;
            let nextLevel = level + 1;
            if (level < 12) {
                isRescue = (level === 1 || level === 2 || level === 5 || level === 10);
            } else {
                isRescue = this.shouldEnterRescueAfter(level);
            }
            if (isRescue && level < 12) {
                nextLevel = this.getRescueLevel(level);
            }
            LevelLoader.preloadLevel(nextLevel, isRescue);
        }
    }

    loadRescueSpine(level: number, xSize: number, ySize: number) {
        if (this.gameType === GameType.MainLevel && (this._gameManager.isRescueLevel() || this._gameManager.forceRescueLevel(level))) {
            if (!this._gameManager.isRescueLevel()) {
                if (level === 6) level = 4;
                else if (level === 11) level = 5;
            }
            const offsetX = xSize % 2 === 0 ? 5 : 0;
            const offsetY = ySize % 2 === 0 ? -5 : 0;
            this.lbRescue1.node.setPosition(offsetX, -20 + offsetY);
            const profile = LevelLoader.getProfile(level, true);
            if (profile) {
                let spineName = profile.spineName;
                if (Global.isForeignGame()) {
                    spineName = 'chaiquan';
                    this.spineOffset.set(offsetX, offsetY, 0);
                    this.spineScale.set(.08, .08, .08);
                } else if (spineName === 'chaiquan') {
                    this.spineOffset.set(offsetX, offsetY, 0);
                    this.spineScale.set(.08, .08, .08);
                } else {
                    this.spineOffset.set(offsetX, offsetY, 0);
                    this.spineScale.set(.07, .07, .07);
                }
                this.huojiName = 'gou_huojiu';
                if (spineName === 'huangdi') this.huojiName = 'huangdi_huojiu';
                else if (spineName === 'nvwang') this.huojiName = 'nvwang_huojiu';

                const config = {
                    armatureName: 'default',
                    ani: 'animation',
                    time: 0,
                    scale: this.spineScale,
                    offset_pos: this.spineOffset
                };
                this.spineNode = UIUtils.show_effect('$spine/' + spineName + '/' + spineName, config, this.RescueContainer, null, null, this.RescueContainer);
                this.spineNode.node.active = true;
                this.scheduleOnce(async () => {
                    this.lbRescue1.node.active = true;
                    await GameAssetManager.loadAssetByPath('game', '$spine/' + this.huojiName + '/' + this.huojiName, sp.SkeletonData);
                }, .5);
            }
        }
    }

    update(dt: number) {
        this.deltaTime = dt;
        this.updatePixel(dt);
        this.updateWinWnim(dt);
        if (this._gameController.is_ready && !this.finishCalled) {
            while (this.activeArrows.length < this.MAX_ACTIVE_ARROWS && this.pendingArrows.length > 0) {
                this.activeArrows.push(this.pendingArrows.shift()!);
            }
            let index = 0;
            let count = 0;
            while (index < this.MAX_BODY_PER_FRAME && this.activeArrows.length > 0) {
                count = (count + 1) % this.activeArrows.length;
                const arrow = this.activeArrows[count];
                const queue = this.arrowBodyQueues.get(arrow);
                if (queue && queue.length !== 0) {
                    const segment = queue.shift();
                    arrow.createBodySegment(segment);
                    index++;
                    count++;
                } else {
                    this.arrowBodyQueues.delete(arrow);
                    this.activeArrows.splice(count, 1);
                }
            }
            if (!this.finishCalled && this.pendingArrows.length === 0 && this.activeArrows.length === 0) {
                this.finishCalled = true;
                this.generateStageFinish();
            }
        }
    }

    updatePixel(dt: number) {
        if (this.pixelAnims.length === 0) return;
        this.pixelTime += dt;
        const duration = this.PIXEL_DURATION;
        const scaleMax = this.PIXEL_SCALE_MAX;
        const scaleNormal = this.PIXEL_SCALE_NORMAL;
        for (let i = this.pixelAnims.length - 1; i >= 0; i--) {
            const anim = this.pixelAnims[i];
            const elapsed = this.pixelTime - anim.startTime - anim.delay;
            if (elapsed < 0) continue;
            let scale = scaleNormal;
            if (elapsed < duration) {
                scale = scaleNormal + (scaleMax - scaleNormal) * (elapsed / duration);
            } else if (elapsed < 2 * duration) {
                scale = scaleMax - (scaleMax - scaleNormal) * ((elapsed - duration) / duration);
            } else {
                scale = scaleNormal;
                this.pixelAnims.splice(i, 1);
            }
            anim.node.setScale(scale, scale, 1);
        }
    }

    updateWinWnim(dt: number) {
        if (!this.isPlayingWinAnim) return;
        this.animWinTime += dt;
        let completeCount = 0;
        for (let i = 0; i < this.pixelWinAnims.length; i++) {
            const anim = this.pixelWinAnims[i];
            const elapsed = this.animWinTime - anim.delay;
            if (elapsed < 0) continue;
            let scale = 1;
            if (elapsed < .25) {
                scale = 1 + elapsed / .25;
            } else if (elapsed < .5) {
                scale = 2 - (elapsed - .25) / .25 * 2;
            } else {
                scale = 0;
                completeCount++;
            }
            anim.node.setScale(scale, scale, 1);
        }
        if (completeCount >= this.pixelWinAnims.length) {
            this.isPlayingWinAnim = false;
            if (this._winComplete) {
                this._winComplete();
                this._winComplete = null;
            }
        }
    }

    generateStage(data: any, removedSet: Set<number> | null, errorSet: Set<number> | null) {
        console.log('关卡: ' + this._gameManager.curLevel + ', ' + data.XSize + 'x' + data.YSize);
        this.curData = data;
        const xSize = data.XSize;
        const ySize = data.YSize;
        const arrowsData = data.Arrows;

        this.arrayGrid = Array.from({ length: xSize }, () => Array(ySize).fill(null));

        const halfWidth = xSize * this.cellSize / 2;
        const halfHeight = ySize * this.cellSize / 2;
        const left = -halfWidth;
        const right = xSize * this.cellSize - halfWidth;
        const bottom = -halfHeight;
        const top = ySize * this.cellSize - halfHeight;

        let isHard = this.levelType === LevelType.HARD || this.levelType === LevelType.SUPER_HARD;
        if (!SDKInstance.isFacebookMiniGame() && this.gameType === GameType.Tournament) {
            isHard = true;
        }
        ArrowGameConfig.moveLen = 8;
        this.gameCamera.setMoveRect(left, right, bottom, top, isHard, this._gameManager.curLevel === 2 || this._gameManager.curLevel === 4);

        this.blockPrefab = this.gridItemArrow;
        const totalArrows = arrowsData.length;
        const removedCount = (removedSet ? removedSet.size : 0);
        const remainingArrows = totalArrows - removedCount;
        this.arrowTarget = totalArrows;
        this._curArrowProgress = totalArrows - remainingArrows;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.UpdateTarget, this._curArrowProgress, this.arrowTarget);
        if (this._gameManager.isRescueLevel() || this._gameManager.forceRescueLevel(this._gameManager.curLevel)) {
            this.lbRescue1.string = '' + (this.arrowTarget - this._curArrowProgress);
        }
        this.MAX_BODY_PER_FRAME = remainingArrows > 150 ? 200 : 60;

        let arrowCount = 0;
        for (let i = 0; i < arrowsData.length; i++) {
            const arrowData = arrowsData[i];
            const firstIndex = arrowData.Indices[0];
            if (removedSet && removedSet.has(firstIndex)) continue;
            const isLast = (++arrowCount === remainingArrows);
            const isError = errorSet && errorSet.has(firstIndex);
            this.genArrow(arrowData, this.arrowPrefab, xSize, halfWidth, halfHeight, isLast, isError);
        }
    }

    genArrow(data: any, prefab: Prefab, xSize: number, halfWidth: number, halfHeight: number, isLast: boolean, isError: boolean) {
        const dx = data.Dx;
        const dy = data.Dy;
        const x = data.X;
        const y = data.Y;
        const indices = data.Indices;

        const arrowNode = PoolManager.instance.get(prefab);
        arrowNode.setParent(this.arrowParent);
        arrowNode.setPosition(0, 0, 0);
        arrowNode.active = true;

        const arrowComp = arrowNode.getComponent(ArrowItem);
        arrowComp.posX = x;
        arrowComp.posY = y;
        arrowComp.myDirX = dx;
        arrowComp.myDirY = dy;
        arrowComp.arrowId = indices[0];
        arrowComp.isError = isError;
        arrowComp.colorType = data.ColorType ? data.ColorType : Utilsqdd.randomTwoNum(1, ArrowGameConfig.arrowColors.length);
        arrowComp.init();

        this._arrows.push(arrowComp);

        indices.forEach((index: number, idx: number) => {
            const gridX = index % xSize;
            const gridY = Math.floor(index / xSize);
            const posX = gridX * this.cellSize - halfWidth + 5;
            const posY = gridY * this.cellSize - halfHeight;

            const gridNode = PoolManager.instance.get(this.blockPrefab);
            gridNode.setParent(arrowNode);
            gridNode.setPosition(new Vec3(posX, posY, 0));
            arrowComp.indices.push(gridNode.position);

            const gridComp = gridNode.getComponent(GridItem);
            this._gridItems.push(gridNode);
            gridComp.arrowComp = arrowComp;
            gridComp.node.getWorldPosition(gridComp.worldPos);
            gridComp.init();
            this.arrayGrid[gridX][gridY] = gridComp;

            if (gridX === x && gridY === y) {
                this.setArrowDirection(arrowComp, gridComp, dx, dy);
            }
            arrowComp.gridItems.push(gridComp);
        });

        arrowComp.prepareMoveData();

        const bodySegments: any[] = [];
        for (let segIdx = 0; segIdx < arrowComp.segmentLinePos.length - 1; segIdx++) {
            const startPos = arrowComp.segmentLinePos[segIdx];
            const endPos = arrowComp.segmentLinePos[segIdx + 1];
            const totalDist = Math.abs(startPos.x - endPos.x) + Math.abs(startPos.y - endPos.y);
            const segCount = Math.ceil(totalDist / 2);
            for (let subIdx = 0; subIdx < segCount; subIdx++) {
                const isLastSegment = (segIdx === arrowComp.segmentLinePos.length - 2 && subIdx === segCount - 1);
                const isTail = (segIdx === 0 && subIdx === 1);
                const isTailEnd = (segIdx === 0 && subIdx === 0);
                let dis = 0;
                if (segIdx === arrowComp.segmentLinePos.length - 2 && subIdx < segCount - 2 && subIdx !== 0) {
                    // skip
                } else {
                    if (segIdx === arrowComp.segmentLinePos.length - 2 && subIdx === segCount - 2) {
                        dis = totalDist;
                    }
                    bodySegments.push({
                        startPos: startPos,
                        endPos: endPos,
                        segIndex: subIdx,
                        segCount: segCount,
                        pathIndex: segIdx,
                        isLastSegment: isLastSegment,
                        isTail: isTail,
                        isTailEnd: isTailEnd,
                        dis: dis
                    });
                }
            }
        }
        this.arrowBodyQueues.set(arrowComp, bodySegments);
        this.pendingArrows.push(arrowComp);

        if (isLast) {
            this._gameController.is_ready = true;
        }
    }

    setArrowDirection(arrowComp: ArrowItem, gridComp: GridItem, dx: number, dy: number) {
        if (dx === 0 && dy === -1) {
            arrowComp.arrowDir = 1;
            gridComp.gridType = GridType.Down;
        } else if (dx === 0 && dy === 1) {
            arrowComp.arrowDir = 0;
            gridComp.gridType = GridType.Up;
        } else if (dx === -1 && dy === 0) {
            arrowComp.arrowDir = 2;
            gridComp.gridType = GridType.Left;
        } else if (dx === 1 && dy === 0) {
            arrowComp.arrowDir = 3;
            gridComp.gridType = GridType.Right;
        }
    }

    isInRange(x: number, y: number): boolean {
        return x >= 0 && x < this.arrayGrid.length && y >= 0 && y < this.arrayGrid[0].length;
    }

    getLevelHp(): number {
        this.levelType = this._gameManager.getDiffType(this._gameManager.curLevel);
        if (this.gameType === GameType.Challenge || this.gameType === GameType.Tournament) {
            return this._gameController.baseCfg.SuperHardHp;
        }
        if (this.levelType === LevelType.HARD) return this._gameController.baseCfg.HardHp;
        if (this.levelType === LevelType.SUPER_HARD) return this._gameController.baseCfg.SuperHardHp;
        return this._gameController.baseCfg.NormalHp;
    }

    generateStageFinish() {
        this._gameManager.firstInGame = true;
        this.showPixelPoint();
        this.soundIdx = 1;
        this.soundOP = 1;
        TimeTaskManager.addTimeTask(() => {
            this.ready = true;
            EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.LoadFinished);
            this.checkGuide();
            this.directPlayGuide();
            this._gameManager.startTimer();
            this.loadFullAssets();
            if (this.gameType === GameType.MainLevel) {
                this.preloadNextLevel(this._gameManager.curLevel);
            }
        }, .7);
    }

    loadFullAssets() {
        if (DirectPlayUtil.isDirectPlay) {
            TournamentWxMgr.instance.loadTournamentData(true);
            RankDataManager.instance.createClient();
            LevelLoader.loadRemoteProfile();

            const mainBundleName = PlatformManager.getLevelBundleName(GameType.MainLevel);
            BundleManager.instance.loadBundle(mainBundleName, () => {});
            const tourBundleName = PlatformManager.getLevelBundleName(GameType.Tournament);
            BundleManager.instance.loadBundle(tourBundleName, () => {});
            const rescueBundleName = PlatformManager.getLevelBundleName(GameType.MainLevel, true);
            BundleManager.instance.loadBundle(rescueBundleName, () => {});

            GameAssetManager.loadAssetByPath('game', 'prefab/$effect/effect_component', Prefab, () => {
                effect_component.init_pool();
            });
            GameAssetManager.loadAssetByPath('game', 'prefab/$effect/zan', Prefab, () => {
                ZanFlyEffect.init_pool();
            });
            AchievementManager.instance.init();
            TierManager.instance.init();
        }
    }

    showPixelPoint() {
        this.pixelMinX = Infinity;
        this.pixelMaxX = -Infinity;
        this.pixelMinY = Infinity;
        this.pixelMaxY = -Infinity;
        const xSize = this.curData.XSize;
        const ySize = this.curData.YSize;
        const halfWidth = xSize * this.cellSize / 2;
        const halfHeight = ySize * this.cellSize / 2;
        const keySet: Set<number> = new Set();

        for (let i = 0; i < this._gridItems.length; i++) {
            const gridItem = this._gridItems[i];
            const key = this.toKey(Math.round(gridItem.position.x), Math.round(gridItem.position.y));
            if (this.pointMap.has(key)) {
                keySet.add(key);
            } else {
                const pointNode = PoolManager.instance.get(this.pointPrefab);
                pointNode.setParent(this.pointParent);
                pointNode.setPosition(gridItem.position);
                pointNode.scale = Vec3.ZERO;
                keySet.add(key);
                this.pointMap.set(key, pointNode);
            }
            this.pixelMinX = Math.min(this.pixelMinX, gridItem.position.x);
            this.pixelMaxX = Math.max(this.pixelMaxX, gridItem.position.x);
            this.pixelMinY = Math.min(this.pixelMinY, gridItem.position.y);
            this.pixelMaxY = Math.max(this.pixelMaxY, gridItem.position.y);
        }

        this.curData.Arrows.forEach((arrowData: any) => {
            for (let i = 0; i < arrowData.Indices.length; i++) {
                const index = arrowData.Indices[i];
                const gridX = index % xSize;
                const gridY = Math.floor(index / xSize);
                const posX = gridX * this.cellSize - halfWidth + 5;
                const posY = gridY * this.cellSize - halfHeight;
                const key = this.toKey(Math.round(posX), Math.round(posY));
                if (keySet.has(key)) continue;
                keySet.add(key);
                const pointNode = PoolManager.instance.get(this.pointPrefab);
                pointNode.setParent(this.pointParent);
                pointNode.setPosition(posX, posY);
                pointNode.scale = Vec3.ONE;
                this.pixelMinX = Math.min(this.pixelMinX, posX);
                this.pixelMaxX = Math.max(this.pixelMaxX, posX);
                this.pixelMinY = Math.min(this.pixelMinY, posY);
                this.pixelMaxY = Math.max(this.pixelMaxY, posY);
                this.pointMap.set(key, pointNode);
            }
        });
    }

    checkShowGrid() {
        if (this._showGrid) {
            for (let i = 0; i < this._arrows.length; i++) {
                const arrow = this._arrows[i];
                if (!arrow.isRemoved && !arrow.skip) {
                    let lineNode = this.lineMap.get(arrow.arrowId);
                    if (lineNode) {
                        lineNode.active = true;
                    } else {
                        lineNode = PoolManager.instance.get(this.linePrefab);
                        lineNode.setParent(this.longLineParent);
                        lineNode.setPosition(arrow.headPos);
                        switch (arrow.arrowDir) {
                            case 0: lineNode.angle = 0; break;
                            case 1: lineNode.angle = 180; break;
                            case 2: lineNode.angle = 90; break;
                            case 3: lineNode.angle = 270; break;
                        }
                        this.lineMap.set(arrow.arrowId, lineNode);
                    }
                }
            }
        } else {
            this.longLineParent.children.forEach((child) => {
                child.active = false;
            });
        }
    }

    showArrowGrid(arrow: ArrowItem) {
        if (!arrow.isRemoved && !arrow.skip) {
            let lineNode = this.lineMap.get(arrow.arrowId);
            if (lineNode) {
                lineNode.active = true;
            } else {
                lineNode = PoolManager.instance.get(this.linePrefab);
                lineNode.setParent(this.longLineParent);
                lineNode.setPosition(arrow.headPos);
                switch (arrow.arrowDir) {
                    case 0: lineNode.angle = 0; break;
                    case 1: lineNode.angle = 180; break;
                    case 2: lineNode.angle = 90; break;
                    case 3: lineNode.angle = 270; break;
                }
                this.lineMap.set(arrow.arrowId, lineNode);
            }
        }
    }

    useHint(saveRecord: boolean = false) {
        const hintArrow = this.hintManager.getHintArrow();
        if (hintArrow) {
            this.gameCamera.focusToTarget(hintArrow.headPos);
            this.hintManager.playHint(hintArrow);
            if (!saveRecord) {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.WantSaveRecordToNet, [false]);
                this._gameManager.hintNum++;
                this._gameManager.resetIdleTimer();
            }
        } else {
            Toast.instance.tip_div('No arrow can be removed!');
        }
    }

    guideHint() {
        const hintArrow = this.hintManager.getHintArrow();
        if (hintArrow) {
            const pos = this.getVaildArrowPos(hintArrow);
            if (pos) {
                this.hintGuideNode.active = true;
                this.hintGuideNode.worldPosition = pos;
                this.hintManager.playHint(hintArrow);
                if (this._gameManager.curLevel === 5) {
                    this.hintGuideNode.setScale(.3, .3, .3);
                }
            }
        }
    }

    playRemoveSound() {
        if (!SDKInstance.isFacebookMiniGame() || (EasOperateSDK.arrow_multi_sound !== false && EasOperateSDK.arrow_multi_sound !== 'false')) {
            AudioManager.instance.load_and_play_effect('arrow' + this.soundIdx, false, 'game');
            this.soundIdx += this.soundOP;
            if (this.soundIdx > 8) {
                this.soundIdx = 8;
                this.soundOP = -1;
            }
            if (this.soundIdx <= 0) {
                this.soundIdx = 1;
                this.soundOP = 1;
            }
        } else {
            AudioManager.instance.load_and_play_effect('arrowfb', false, 'game');
        }
        this.hintGuideNode.active = false;
        if (SDKInstance.isGooglePlayNative()) {
            this.ShowGrid = false;
        }
    }

    removeArrow(arrowId: number, gridItems: GridItem[], dir: number) {
        this._gameManager.onPlayerAction();
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.UpdateTournamentScore, ArrowGameConfig.arrowScore);
        this.saveMgr?.setScore(this._gameManager.currentScore);
        this._gameManager.comboCount++;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.UpdateCombo, this._gameManager.comboCount);
        if (this._gameManager.comboCount % EasOperateSDK.combo_nice_num === 0) {
            UIUtils.showZanFlyEffect(this.zanPos);
        }
        this._gameManager.resetIdleTimer();
        this.saveMgr?.addRemovedArrow(arrowId);
        this.checkProgress50PercentSimple();

        if (this.longLineParent.active) {
            const lineNode = this.lineMap.get(arrowId);
            CCExtends.SetNodeActive(lineNode, false);
        }

        gridItems.forEach((gridItem: GridItem) => {
            for (let i = 0; i < this.arrayGrid.length; i++) {
                for (let j = 0; j < this.arrayGrid[i].length; j++) {
                    if (this.arrayGrid[i][j] === gridItem) {
                        this.arrayGrid[i][j] = null;
                        break;
                    }
                }
            }
        });

        this.PIXEL_ANIM_DELAY = this.deltaTime * (this.cellSize / ArrowGameConfig.moveLen);
        const animPixels = this.getArrowFullTrackPixels(gridItems, dir);
        this.playTrackAnimation(animPixels);
    }

    checkProgress50PercentSimple() {
        if (this._hasChecked50Percent || this.arrowTarget < 70) return;
        const progress = (this._curArrowProgress + 1) / this.arrowTarget;
        if (progress >= .55) {
            this._hasChecked50Percent = true;
        } else if (progress >= .5 && progress < .55) {
            this._hasChecked50Percent = true;
            EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowTips50);
        }
    }

    loseHp(count: number = 1, arrowId: number) {
        if (count < 0) return;
        this.saveMgr?.addErrorArrow(arrowId);
        this._hp -= 1;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ErrorAnim);
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ReduceHp, 1, true);
        this.mistakeCount++;
        this.saveMgr?.setMistakeCount(this.mistakeCount);
        this.saveMgr?.setHp(this._hp);
        this._gameManager.resetIdleTimer();
        const scorePenalty = Math.floor(.1 * this._gameManager.currentScore);
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.UpdateTournamentScore, -scorePenalty);
        this.saveMgr?.setScore(this._gameManager.currentScore);
        AchievementManager.instance.onEvent(AchievementType.HP_COST);
    }

    delayCheckFail() {
        if (this._hp <= 0 && this.ready) {
            this.onGameLose(FailType.Hp);
        }
    }

    onGameWin(shouldAnim: boolean = true) {
        console.log('关卡胜利');
        this._gameManager.onLevelWin();
        let isRescueWin = false;
        let levelId = GameManager.instance.curLevel;
        const recorder = GameRecord.GetInstance().BaseRecorder;

        if (shouldAnim && (SDKInstance.isWxPlatform() || SDKInstance.isGooglePlayNative())) {
            if (GameManager.instance.gameType === GameType.Challenge) {
                const date = new Date();
                date.getFullYear();
                levelId = 100 * (date.getMonth() + 1) + GameManager.instance.curLevel;
            }
            if (SDKInstance.isWxPlatform()) {
                if (DirectPlayUtil.isDirectPlay && !DirectPlayUtil.isNewUser) {
                    LieyouSDK.gameFinishLevel(levelId, 'Feed');
                } else {
                    LieyouSDK.gameFinishLevel(levelId, GameManager.instance.getLevelMode());
                }
            }
        }

        if (this.gameType === GameType.MainLevel) {
            AchievementManager.instance.onGameResult(true);
            TierManager.instance.onLevelComplete();
            CCExtends.SetNodeActive(this.lbRescue1.node, false);
            if (this.spineNode) {
                this.spineNode.node.active = false;
                const config = {
                    armatureName: 'default',
                    ani: 'animation',
                    time: 0,
                    scale: this.spineScale,
                    offset_pos: this.spineOffset
                };
                UIUtils.show_effect('$spine/' + this.huojiName + '/' + this.huojiName, config, this.RescueContainer, null, null, this.RescueContainer);
            }
            if (this._gameManager.isRescueLevel()) {
                isRescueWin = true;
                recorder.OnRescueComplete();
                AchievementManager.instance.onEvent(AchievementType.RESCUE_COMPLETE);
            } else {
                AchievementManager.instance.onEvent(AchievementType.LEVEL_COMPLETE);
                if (!DirectPlayUtil.isNewUser || !DirectPlayUtil.isDirectPlay) {
                    recorder.LevelPass(this._gameManager.maxLevel);
                    this._gameManager.passCount++;
                    isRescueWin = false;
                    if (recorder.Data.CurLevel > 12) {
                        const shouldRescue = this.shouldEnterRescueAfter(this._gameManager.curLevel);
                        const rescueLevel = this.getRescueLevel(recorder.Data.CurLevel);
                        recorder.PendingRescue(shouldRescue, rescueLevel);
                    }
                }
            }
        }

        this._gameManager.onGameWinEvent(isRescueWin);
        this.saveMgr?.clear();
        if (this.gameType === GameType.Challenge) {
            DailyChallengeModel.markFinished(this._gameManager.curLevel);
        }

        if (shouldAnim) {
            if (this.spineNode) {
                this.playGameWinAnim(Vec3.ZERO, () => {
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.GameWin, this.gameType, true, isRescueWin);
                    this._gameManager.resetUsedTime();
                });
            } else {
                this.playGameWinAnim(Vec3.ZERO, () => {
                    this._gameManager.resetUsedTime();
                });
                EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.WinEmojiAnim, this.gameType, isRescueWin);
            }
        } else {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.GameWin, this.gameType, false, isRescueWin);
        }
    }

    shouldEnterRescueAfter(level: number): boolean {
        return level === 1 || level === 2 || level === 3 || level === 6 || level === 11 ||
            (level >= 11 && level < 100 ? level % 5 === 4 : level >= 100 && level % 10 === 9);
    }

    getRescueLevel(level: number): number {
        let count = 0;
        for (let i = 1; i <= level; i++) {
            if (this.shouldEnterRescueAfter(i)) count++;
        }
        if (count > LevelLoader.maxRescue) count = LevelLoader.maxRescue;
        return count;
    }

    onGMGameWin(score?: number) {
        this._gameManager.currentScore = (score == null) ? this._arrowTarget * ArrowGameConfig.arrowScore : score;
        this.onGameWin(false);
    }

    onGameLose(failType: FailType) {
        if (this.isFail || DirectPlayUtil.isDirectPlay) return;
        this.failType = failType;
        this.isFail = true;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.GameFail, failType);
        if (this.gameType === GameType.MainLevel) {
            AchievementManager.instance.onGameResult(false);
        }
        this._gameManager.onGameFailEvent();
    }

    onGameRevive(failType: FailType, extraHp: number = 0) {
        this.isFail = false;
        this._gameController.is_pause = false;
        if (failType === FailType.Hp) {
            if (extraHp > 0) {
                this.resetHp(extraHp);
            } else {
                this.Hp = this.getLevelHp();
            }
            this.saveMgr?.setHp(this.Hp);
            this._gameManager.addLifeNum++;
        } else {
            this._gameManager.addTimeNum++;
        }
        this._gameManager.onGameRevive(failType);
    }

    resetHp(hp: number) {
        this._hp = hp;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.InitHp, this._hp, true);
    }

    onGameRestart() {
        console.log('===== 重新开始关卡 =====');
        this._hasChecked50Percent = false;
        this.hintGuideNode.active = false;
        this.clear(true);
        this.Hp = this.getLevelHp();
        this.saveMgr?.clear();
        this.init();
        this._gameManager.onGameRestart();

        if (SDKInstance.isWxPlatform() || SDKInstance.isGooglePlayNative()) {
            let levelId = GameManager.instance.curLevel;
            if (GameManager.instance.gameType === GameType.Challenge) {
                const date = new Date();
                date.getFullYear();
                levelId = 100 * (date.getMonth() + 1) + GameManager.instance.curLevel;
            }
            if (SDKInstance.isGooglePlayNative()) {
                Utils.instance.StartGame(levelId.toString(), GameManager.instance.getLevelMode());
            } else {
                LieyouSDK.gameBeginLevel(levelId, GameManager.instance.getLevelMode());
            }
        }

        if (this.gameType === GameType.MainLevel) {
            const firstReplay = Number(GameLocalStorage.getItem('first_replay_chapter') || 0);
            if (firstReplay === 0) {
                GameLocalStorage.setItem('first_replay_chapter', 1);
                EasDataSDK.userSetOnce({ first_replay_chapter: this._gameManager.getLevelId() });
            }
        }
    }

    onBackHome() {
        console.log('===== 返回主页面 =====');
        this.clear(true);
        this.saveMgr?.clear();
    }

    isHpFull(): boolean {
        return this._hp >= this.maxHp;
    }

    fullHp() {
        this._hp = this.maxHp;
        this.saveMgr?.clear();
    }

    clear(recycle: boolean = false) {
        this.pendingArrows = [];
        this.activeArrows = [];
        this.arrowBodyQueues.clear();
        this.arrayGrid = [];
        this._gridItems = [];
        this.hintManager.reset();

        for (let i = this._arrows.length - 1; i >= 0; i--) {
            const arrow = this._arrows[i];
            arrow.getComponent(ArrowItem).clear(recycle);
            PoolManager.instance.put(arrow.node);
        }
        this._arrows = [];

        for (let i = this.pointParent.children.length - 1; i >= 0; i--) {
            if (recycle) {
                this.pointParent.children[i].active = false;
            } else {
                PoolManager.instance.put(this.pointParent.children[i]);
            }
        }
        for (let i = this.longLineParent.children.length - 1; i >= 0; i--) {
            if (recycle) {
                this.longLineParent.children[i].active = false;
            } else {
                PoolManager.instance.put(this.longLineParent.children[i]);
            }
        }
        if (!recycle) {
            this.pointMap.clear();
            this.lineMap.clear();
        }
        for (let i = this.RescueContainer.children.length - 1; i >= 0; i--) {
            effect_component.recycle(this.RescueContainer.children[i]);
        }
        this.lbRescue1.node.active = false;
        this.spineNode = null;
    }

    changeSkin() {
        for (let i = 0; i < this._arrows.length; i++) {
            this._arrows[i].resetColor();
        }
    }

    saveArrowDataToNet() {
        if (!SDKInstance.isFacebookMiniGame()) return;
        let data: any;
        if (this._gameManager.gameType === GameType.MainLevel) {
            const arrowData = localStorage.getItem(SaveManager.ARROW);
            if (arrowData) {
                data = { ArrowData: JSON.parse(arrowData) };
            }
        } else if (this._gameManager.gameType === GameType.Challenge) {
            const challengeData = localStorage.getItem(SaveManager.CHALLENGE);
            if (challengeData) {
                data = { ChallengeData: JSON.parse(challengeData) };
            }
        }
        if (data) {
            FBInstant.player.setDataAsync(data)
                .then(() => FBInstant.player.flushDataAsync())
                .then(() => console.log('Arrow saving to FB!'))
                .catch((err: any) => console.log('Error saving data:', err));
        }
    }

    playGameWinAnim(centerPos: Vec3, completeCallback: () => void) {
        const activePoints = this.pointParent.children.filter((child) => child.active);
        const pointMap: Map<number, Node> = new Map();
        for (let i = 0; i < activePoints.length; i++) {
            const node = activePoints[i];
            const key = this.toKey(Math.round(node.position.x), Math.round(node.position.y));
            pointMap.set(key, node);
        }

        const visited: Set<number> = new Set();
        const queue: { x: number; y: number; d: number }[] = [];

        const nearPoints = this.findNearPoints(centerPos, pointMap);
        for (const pt of nearPoints) {
            queue.push({ x: pt.x, y: pt.y, d: 0 });
        }

        this.pixelWinAnims = [];
        while (queue.length > 0) {
            const current = queue.shift()!;
            const key = this.toKey(current.x, current.y);
            if (visited.has(key)) continue;
            visited.add(key);
            const pointNode = pointMap.get(key);
            if (pointNode) {
                this.pixelWinAnims.push({
                    node: pointNode,
                    delay: .03 * current.d,
                    startTime: 0
                });
                const neighbors = [
                    { x: current.x - this.cellSize, y: current.y },
                    { x: current.x + this.cellSize, y: current.y },
                    { x: current.x, y: current.y - this.cellSize },
                    { x: current.x, y: current.y + this.cellSize }
                ];
                for (const n of neighbors) {
                    const nKey = this.toKey(n.x, n.y);
                    if (!visited.has(nKey) && pointMap.has(nKey)) {
                        queue.push({ x: n.x, y: n.y, d: current.d + 1 });
                    }
                }
            }
        }

        this.animWinTime = 0;
        this.isPlayingWinAnim = true;
        this._winComplete = completeCallback;
    }

    findNearPoints(centerPos: Vec3, pointMap: Map<number, Node>): { x: number; y: number }[] {
        let closestKey: number = 0;
        let minDist = Infinity;
        for (const [key, node] of pointMap.entries()) {
            const dx = node.position.x - centerPos.x;
            const dy = node.position.y - centerPos.y;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
                minDist = dist;
                closestKey = key;
            }
        }
        const coord = this.fromKey(closestKey);
        const candidates = [
            { x: coord.x, y: coord.y },
            { x: coord.x + this.cellSize, y: coord.y },
            { x: coord.x, y: coord.y + this.cellSize },
            { x: coord.x + this.cellSize, y: coord.y + this.cellSize }
        ];
        const result: { x: number; y: number }[] = [];
        for (const pt of candidates) {
            const key = this.toKey(pt.x, pt.y);
            if (pointMap.has(key)) {
                result.push(pt);
            }
        }
        return result;
    }

    getArrowFullTrackPixels(gridItems: GridItem[], dir: number): Node[] {
        const tailPixels: Node[] = [];
        gridItems.forEach((gridItem: GridItem) => {
            const key = this.toKey(Math.round(gridItem.node.position.x), Math.round(gridItem.node.position.y));
            const pointNode = this.pointMap.get(key);
            if (pointNode) {
                pointNode.active = true;
                tailPixels.push(pointNode);
            }
        });

        const headPixels: Node[] = [];
        if (gridItems.length === 0) return tailPixels;

        const firstGrid = gridItems[0];
        let x = Math.round(firstGrid.node.position.x);
        let y = Math.round(firstGrid.node.position.y);

        while (true) {
            switch (dir) {
                case 2: x -= this.cellSize; break;
                case 3: x += this.cellSize; break;
                case 0: y += this.cellSize; break;
                case 1: y -= this.cellSize; break;
            }
            if (x < this.pixelMinX || x > this.pixelMaxX || y < this.pixelMinY || y > this.pixelMaxY) break;
            const key = this.toKey(x, y);
            const pointNode = this.pointMap.get(key);
            if (pointNode) {
                pointNode.active = true;
                headPixels.push(pointNode);
            }
        }

        const reversedTail = tailPixels.reverse();
        const combined = reversedTail.concat(headPixels);
        const seen = new Map<string, Node>();
        const unique: Node[] = [];
        combined.forEach((node: Node) => {
            if (!seen.has(node.uuid)) {
                seen.set(node.uuid, node);
                unique.push(node);
            }
        });
        return unique;
    }

    playTrackAnimation(pixels: Node[]) {
        if (pixels.length === 0) return;
        for (let i = 0; i < pixels.length; i++) {
            this.pixelAnims.push({
                node: pixels[i],
                startTime: this.pixelTime,
                delay: i * this.PIXEL_ANIM_DELAY
            });
        }
    }

    checkGuide(forceSkip: boolean = false, guideStep?: number) {
        CCExtends.SetNodeActive(this.zoomNode, false);
        CCExtends.SetNodeActive(this.clickNode, false);
        this.isGuideShowing = false;

        if (this.gameType !== GameType.MainLevel || DirectPlayUtil.isDirectPlay) return;

        if (forceSkip) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowGuideText, 99);
            this.zoomNode.active = false;
            this.clickNode.active = false;
            this.curGuideStep = 99;
            GameLocalStorage.setItem('guide_step', 99);
            return;
        }

        const savedStep = Number(GameLocalStorage.getItem('guide_step') || 0);

        if (this._gameManager.curLevel === 1) {
            if (savedStep < 1 && (this.curGuideStep === 1 || this.curGuideStep === 2 || this.curGuideStep === 3)) {
                if (this.curGuideStep === 1) {
                    DnSdkManager.instance.sdk?.track('TUTORIAL_START', {});
                    EasDataSDK.trackEvent('guide', { guild_id: 1 });
                }
                const hintArrow = this.hintManager.getHintArrow();
                const pos = this.getVaildArrowPos(hintArrow);
                if (pos) {
                    this.clickNode.active = true;
                    this.clickNode.worldPosition = pos;
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowGuideText, 1);
                }
                this.isGuideShowing = true;
            } else {
                GameLocalStorage.setItem('guide_step', 1);
                DnSdkManager.instance.sdk?.onTutorialFinish();
                this.isGuideShowing = false;
                this.clickNode.active = false;
                EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowGuideText, 99);
            }
        } else if (savedStep < 5 && this._gameManager.curLevel === 2) {
            if (guideStep === 5) {
                this.curGuideStep = 5;
                this.zoomNode.active = false;
                EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowGuideText, 3);
                this.isGuideShowing = false;
            } else {
                EasDataSDK.trackEvent('guide', { guild_id: 2 });
                this.curGuideStep = 4;
                const platform = SDKInstance.getPlatform();
                if (platform === 'IOS' || platform === 'ANDROID') {
                    this.zoomNode.setScale(.4, .4, .4);
                    this.zoomNode.active = true;
                }
                this.isGuideShowing = true;
                EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowGuideText, 2);
            }
        } else if (savedStep < 6 && this._gameManager.curLevel === 15) {
            EasDataSDK.trackEvent('guide', { guild_id: 3 });
            this.curGuideStep = 6;
            EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowGuideText, 4);
        } else {
            CCExtends.SetNodeActive(this.zoomNode, false);
            CCExtends.SetNodeActive(this.clickNode, false);
            EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ShowGuideText, 99);
        }
    }

    getVaildArrowPos(arrow?: ArrowItem | null): Vec3 | null {
        if (arrow) {
            const midIndex = Math.floor(arrow.gridItems.length / 2);
            return arrow.gridItems[midIndex].node.worldPosition;
        }
        for (let i = 0; i < this._arrows.length; i++) {
            if (!this._arrows[i].skip) {
                const midIndex = Math.floor(this._arrows[i].gridItems.length / 2);
                return this._arrows[i].gridItems[midIndex].node.worldPosition;
            }
        }
        return null;
    }

    directPlayGuide(hide: boolean = false) {
        if (!DirectPlayUtil.isDirectPlay) return;
        if (hide) {
            CCExtends.SetNodeActive(this.clickNode, false);
        } else {
            const hintArrow = this.hintManager.getHintArrow();
            const pos = this.getVaildArrowPos(hintArrow);
            if (pos) {
                this.clickNode.active = true;
                this.clickNode.worldPosition = pos;
            }
        }
    }

    toKey(x: number, y: number): number {
        return (Math.round(x / this.cellSize) << 16) | (65535 & Math.round(y / this.cellSize));
    }

    fromKey(key: number): { x: number; y: number } {
        const low = 65535 & key;
        return {
            x: (key >> 16) * this.cellSize,
            y: low * this.cellSize
        };
    }

    // ---------- getter/setter ----------
    get Hp(): number { return this._hp; }
    set Hp(value: number) {
        this._hp = value;
        this.maxHp = value;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.InitHp, this._hp);
    }

    get gridItems(): Node[] { return this._gridItems; }
    set gridItems(value: Node[]) { this._gridItems = value; }

    get arrowTarget(): number { return this._arrowTarget; }
    set arrowTarget(value: number) { this._arrowTarget = value; }

    get arrows(): ArrowItem[] { return this._arrows; }
    set arrows(value: ArrowItem[]) { this._arrows = value; }

    get curArrowProgress(): number { return this._curArrowProgress; }
    set curArrowProgress(value: number) {
        this._curArrowProgress = value;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.UpdateTarget, this._curArrowProgress, this.arrowTarget);
        if (this._gameManager.isRescueLevel() || this._gameManager.forceRescueLevel(this._gameManager.curLevel)) {
            this.lbRescue1.string = '' + (this.arrowTarget - value);
        }
        if (value >= this.arrowTarget) {
            this.onGameWin();
        }
    }

    get ShowGrid(): boolean { return this._showGrid; }
    set ShowGrid(value: boolean) {
        if (this._showGrid !== value) {
            this._showGrid = value;
            this.checkShowGrid();
        }
    }
}