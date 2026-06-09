import { _decorator, Component, Camera } from 'cc';
import { GameController } from './GameController';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { AudioManager } from './AudioManager';
import { TimeTaskManager } from './TimeTaskManager';
import { GameLogicConfig } from './GameLogicConfig';
import { LevelDataManager } from './LevelDataManager';
import { GameType, MainNavTabType, LevelType, FailType } from './GlobalEnum';
import { JsonClassStorage } from './JsonClass';
import { PoolManager } from './PoolManager';
import { GameRecord } from './GameRecord';
import { LevelLoader } from './LevelLoader';
import { GameLocalStorage } from './GameLocalStorage';
import { EasDataSDK } from './EasDataSDK';
import { Global } from './Global';
import { DirectPlayUtil } from './DirectPlayUtil';
import { EasOperateSDK } from './EasOperateSDK';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    public static get instance(): GameManager {
        return this._instance!;
    }

    @property(Camera)
    public camera: Camera | null = null;

    public maxLevel: number = 6000;
    private _curLevel: number = 0;
    public curStage: any = null;
    public firstInGame: boolean = true;
    public isDarkMode: boolean = true;
    public curSkin: number = 0;
    public gameType: GameType = GameType.MainLevel;
    public passCount: number = 0;
    public currentScore: number = 0;
    public comboCount: number = 0;
    public adCnt: number = 0;
    public remainingSeconds: number = 0;
    public countdownRunning: boolean = false;
    public countdownStartedByPlayer: boolean = false;
    public shared: boolean = false;
    public usedTime: number = 0;
    private _isTimerRunning: boolean = false;
    public standardTime: number = 180;
    public idleTimer: number = 0;
    public hinting: boolean = false;
    public tabSelected: MainNavTabType = MainNavTabType.Main;
    public referContainer: any = null;
    public hintNum: number = 0;
    public addTimeNum: number = 0;
    public addLifeNum: number = 0;

    public get curLevel(): number {
        return this._curLevel;
    }

    public set curLevel(value: number) {
        this._curLevel = value;
    }

    public onLoad(): void {
        if (GameManager._instance === null) {
            GameManager._instance = this;
        } else if (GameManager._instance !== this) {
            this.node.destroy();
            return;
        }

        this.passCount = 0;
        LevelDataManager.instance.onManagerInit();
        this.curSkin = Number(GameLocalStorage.getItem('curSkin') || 0);
    }

    public start(): void {
        if (LevelLoader.maxLevel) {
            this.maxLevel = LevelLoader.maxLevel;
        }
    }

    public onDestroy(): void {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
        EventManager.offAll(this);
    }

    public update(deltaTime: number): void {
        TimeTaskManager.update2(deltaTime);
        PoolManager.instance.update();
    }

    public startGame(level: number, gameType: GameType): void {
        this.shared = false;
        this.gameType = gameType;
        this.curLevel = level;
        this.comboCount = 0;
        this.currentScore = 0;
        this.countdownStartedByPlayer = false;
        this.adCnt = 0;
        this.resetEasDataTempNum();
    }

    public getRemainingSeconds(): number {
        return this.remainingSeconds;
    }

    public setRemainingSeconds(seconds: number): void {
        this.remainingSeconds = seconds;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.TimeUpdated, {
            remaining: this.remainingSeconds
        });
    }

    public saveRemainingSeconds(): void {
        const saveMgr = this.curStage?.saveMgr;
        if (saveMgr) {
            saveMgr.setRemainingSeconds(this.remainingSeconds);
        }
    }

    public initRemainingSeconds(gameType: GameType, baseTime: number): void {
        if (DirectPlayUtil.isDirectPlay) {
            return;
        }

        let profile: any = null;

        if (gameType === GameType.MainLevel) {
            if (this.isRescueLevel() || this.forceRescueLevel(this.curLevel)) {
                profile = LevelLoader.getProfile(this.curLevel, true);
            } else {
                profile = LevelLoader.getProfile(this.curLevel, false);
            }
        } else if (gameType === GameType.Challenge) {
            profile = JsonClassStorage.instance.getOneJson('DifficultyProfileChalleng', 'level', this.curLevel);
        } else if (gameType === GameType.Tournament) {
            profile = JsonClassStorage.instance.getOneJson('DifficultyProfileTournament', 'level', this.curLevel);
        }

        if (profile) {
            let rate = 0;
            const difficulty = profile.difficulty > 0 ? profile.difficulty : 1;

            if (difficulty <= 3) {
                rate = GameController.instance.baseCfg.TimeRate[difficulty - 1];
            } else if (difficulty === 4) {
                rate = this.getSegmentRate(baseTime, GameController.instance.hardRules);
            } else if (difficulty === 5) {
                rate = this.getSegmentRate(baseTime, GameController.instance.superHardRules);
            }

            this.remainingSeconds = Math.floor(baseTime * (1 + rate));
        } else {
            this.remainingSeconds = 180;
        }

        this.standardTime = this.remainingSeconds;

        if (!Global.isForeignGame()) {
            EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.TimeUpdated, {
                remaining: this.remainingSeconds
            });
        }
    }

    private getSegmentRate(baseTime: number, rules: any[]): number {
        if (rules.length === 0) {
            console.warn('分段规则为空，使用默认系数0');
            return 0;
        }

        const sortedRules = [...rules].sort((a, b) => a.max - b.max);

        for (let i = 0; i < sortedRules.length; i++) {
            const rule = sortedRules[i];
            const previousMax = i === 0 ? 0 : sortedRules[i - 1].max;

            if (i === sortedRules.length - 1) {
                return rule.rate;
            }

            if (baseTime >= previousMax + 1 && baseTime <= rule.max) {
                return rule.rate;
            }
        }

        return sortedRules[0].rate;
    }

    public getDiffType(level: number): LevelType {
        let diffType = LevelType.EASY;
        const profile = LevelLoader.getProfile(level, false);

        if (profile) {
            diffType = profile.difficulty > 0 ? profile.difficulty : 1;
        } else if (this.curLevel === 9 || this.curLevel === 10) {
            diffType = LevelType.HARD;
        }

        return diffType;
    }

    public onPlayerAction(): void {
        if (!this.countdownStartedByPlayer && !Global.isForeignGame()) {
            this.startCountdown();
            this.countdownStartedByPlayer = true;
        }
    }

    public startCountdown(): void {
        if (DirectPlayUtil.isDirectPlay) {
            return;
        }

        if (this.countdownRunning) {
            return;
        }

        if (Global.isForeignGame()) {
            return;
        }

        if (this.gameType === GameType.MainLevel && this.curLevel <= 3) {
            return;
        }

        this.countdownRunning = true;

        if (this.remainingSeconds < 30) {
            AudioManager.instance.load_and_play_effect('timer', true, 'game');
        }

        this.schedule(this._tickCountdown, 1);
    }

    public stopCountdown(): void {
        this.stopTimer();

        if (this.countdownRunning) {
            this.countdownRunning = false;
            this.unschedule(this._tickCountdown);
        }
    }

    private _tickCountdown(): void {
        if (DirectPlayUtil.isDirectPlay) {
            return;
        }

        if (Global.isForeignGame()) {
            return;
        }

        if (this.gameType === GameType.MainLevel && this.curLevel <= 3) {
            return;
        }

        if (!this.countdownRunning || GameController.instance.is_pause || !GameController.instance.is_ready) {
            return;
        }

        this.remainingSeconds--;

        if (this.remainingSeconds === 30) {
            AudioManager.instance.load_and_play_effect('timer', true, 'game');
        }

        if (this.remainingSeconds < 0) {
            this.remainingSeconds = 0;
        } else {
            this.saveRemainingSeconds();
        }

        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.TimeUpdated, {
            remaining: this.remainingSeconds
        });

        if (this.remainingSeconds <= 0) {
            AudioManager.instance.stop_loop_effect();
            this.onTimeUp();
        }
    }

    public onTimeUp(): void {
        this.stopCountdown();
        this.curStage.onGameLose(FailType.Time);
    }

    public startTimer(): void {
        if (!this._isTimerRunning) {
            this._isTimerRunning = true;
            this.schedule(this.updateUsedTimer, 1);
        }
    }

    public updateUsedTimer(): void {
        if (GameController.instance.is_pause) {
            return;
        }

        if (!GameController.instance.is_ready) {
            return;
        }

        if (this.gameType !== GameType.MainLevel) {
            return;
        }

        if (this.curStage.isGuideShowing) {
            return;
        }

        if (DirectPlayUtil.isDirectPlay) {
            return;
        }

        if (this.curLevel > EasOperateSDK.hint_guide_level) {
            return;
        }

        this.idleTimer++;

        if (this.idleTimer >= EasOperateSDK.hint_guide_seonds && !this.hinting) {
            this.showHint();
        }
    }

    public stopTimer(): void {
        if (this._isTimerRunning) {
            this._isTimerRunning = false;
            this.unschedule(this.updateUsedTimer);
        }
    }

    public saveUsedTime(): void {
        // Empty implementation
    }

    public clearUsedTime(): void {
        this.usedTime = 0;
    }

    public resetUsedTime(): void {
        this.usedTime = 0;
    }

    public showHint(): void {
        this.hinting = true;
        this.curStage.guideHint();
    }

    public resetIdleTimer(): void {
        this.idleTimer = 0;
        this.hinting = false;
    }

    public onGameRestart(): void {
        if (!Global.isForeignGame()) {
            this.initRemainingSeconds(this.curLevel, this.gameType);
        }

        EventManager.emit(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.TimeUpdated, {
            remaining: this.remainingSeconds
        });

        this.comboCount = 0;
        this.currentScore = 0;
        this.countdownStartedByPlayer = false;
        this.resetUsedTime();
        this.resetIdleTimer();
        AudioManager.instance.stop_loop_effect();
    }

    public onGameRevive(failType: FailType): void {
        GameController.instance.is_pause = false;

        if (failType === FailType.Time) {
            this.remainingSeconds = GameController.instance.baseCfg.ReviveTime;
        }

        this.startCountdown();

        if (!Global.isForeignGame() && this.remainingSeconds < 30) {
            AudioManager.instance.load_and_play_effect('timer', true, 'game');
        }
    }

    public onLevelWin(): void {
        this.stopCountdown();
        AudioManager.instance.stop_loop_effect();
    }

    public reset(): void {
        GameController.instance.is_pause = false;
        this.countdownStartedByPlayer = false;
        this.stopCountdown();
        AudioManager.instance.stop_loop_effect();
    }

    public getLevelMode(): string {
        let mode = 'MainLevel';

        if (this.gameType === GameType.Challenge) {
            mode = 'Challenge';
        } else if (this.gameType === GameType.Tournament) {
            mode = 'Tournament';
        }

        if (this.isRescueLevel()) {
            mode = 'RescueLevel';
        }

        return mode;
    }

    public isRescueLevel(): boolean {
        return this.gameType === GameType.MainLevel && GameRecord.GetInstance().BaseRecorder.Data.pendingRescue;
    }

    public forceRescueLevel(level: number): boolean {
        if (this.gameType !== GameType.MainLevel) {
            return false;
        }

        let rescueLevels = [1, 2, 3, 6, 11];

        if (DirectPlayUtil.isDirectPlay && DirectPlayUtil.isNewUser) {
            rescueLevels = [1, 2, 3, 4, 5];
        }

        return rescueLevels.includes(level);
    }

    public onGameWinEvent(isWin: boolean): void {
        if (isWin) {
            return;
        }

        EasDataSDK.trackEvent('chapter_finish', {
            model_id: this.gameType,
            chapter_id: this.getLevelId(),
            is_pass: 1,
            level_time: 0,
            level_pass_time: 0,
            tips_num: this.hintNum,
            add_time_num: this.addTimeNum,
            ad_life_num: this.addLifeNum,
            time_num: 0
        });

        GameLocalStorage.setItem('continue_fail_num', 0);
    }

    public onGameFailEvent(): void {
        if (!this.isRescueLevel()) {
            EasDataSDK.trackEvent('chapter_finish', {
                model_id: this.gameType,
                chapter_id: this.getLevelId(),
                is_pass: 0,
                level_time: 0,
                level_pass_time: 0,
                tips_num: this.hintNum,
                add_time_num: this.addTimeNum,
                ad_life_num: this.addLifeNum,
                time_num: 0
            });
        }

        if (this.gameType === GameType.MainLevel) {
            const firstFailChapter = Number(GameLocalStorage.getItem('first_fail_chapter') || 0);
            if (firstFailChapter === 0) {
                GameLocalStorage.setItem('first_fail_chapter', 1);
                EasDataSDK.userSetOnce({
                    first_fail_chapter: this.getLevelId()
                });
            }

            let continueFailNum = Number(GameLocalStorage.getItem('continue_fail_num') || 0);
            continueFailNum += 1;
            GameLocalStorage.setItem('continue_fail_num', continueFailNum);

            EasDataSDK.userSet({
                continue_fail_num: continueFailNum
            });

            EasDataSDK.userAdd({
                total_fail_num: 1
            });
        }
    }

    public getLevelId(): string {
        let levelId = '';

        if (this.gameType === GameType.Challenge) {
            levelId = (100 * (new Date().getMonth() + 1) + this.curLevel).toString();
        } else {
            levelId = this.curLevel.toString();
        }

        return levelId;
    }

    public getLevelId1(): string {
        return (100 * (new Date().getMonth() + 1) + this.curLevel).toString();
    }

    public resetEasDataTempNum(): void {
        this.hintNum = 0;
        this.addTimeNum = 0;
        this.addLifeNum = 0;
    }

    public GMSetRemainingSeconds(seconds: number): void {
        this.remainingSeconds = seconds;
    }
}