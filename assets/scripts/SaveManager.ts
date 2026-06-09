import { _decorator, Component } from 'cc';

export class SaveManager {
    private removedSet: Set<number> = new Set();
    private errorSet: Set<number> = new Set();
    private hp: number = 0;
    private score: number = 0;
    private level: number = 0;
    private remainingSeconds: number = 0;
    private paramHash: string = "";
    private mistakeCount: number = 0;
    private KEY: string;
    private TIME_KEY: string;

    public static ARROW: string = "ARROW_GAME_SAVE";
    public static CHALLENGE: string = "ARROW_CHALLENGE_SAVE";
    public static ARROW_TIME: string = "ARROW_TIME";
    public static CHALLENGE_TIME: string = "CHALLENGE_TIME";

    constructor(key: string) {
        this.KEY = key;
        this.TIME_KEY = this.KEY === SaveManager.ARROW ? SaveManager.ARROW_TIME : SaveManager.CHALLENGE_TIME;
    }

    public addRemovedArrow(arrowId: number): void {
        if (!this.removedSet.has(arrowId)) {
            this.removedSet.add(arrowId);
            this.flush();
        }
    }

    public addErrorArrow(arrowId: number): void {
        if (!this.errorSet.has(arrowId)) {
            this.errorSet.add(arrowId);
        }
    }

    public setHp(hp: number): void {
        this.hp = hp;
        this.flush();
    }

    public setScore(score: number): void {
        this.score = score;
        this.flush();
    }

    public setMistakeCount(mistakeCount: number): void {
        this.mistakeCount = mistakeCount;
    }

    public setLevel(level: number, paramHash: string): void {
        this.level = level;
        this.paramHash = paramHash;
        this.flush();
    }

    public setRemainingSeconds(remainingSeconds: number): void {
        this.remainingSeconds = remainingSeconds;
        this.flushTime();
    }

    public isArrowRemoved(arrowId: number): boolean {
        return this.removedSet.has(arrowId);
    }

    public isArrowError(arrowId: number): boolean {
        return this.errorSet.has(arrowId);
    }

    public getHp(): number {
        return this.hp;
    }

    public getScore(): number {
        return this.score;
    }

    public getMistakeCount(): number {
        return this.mistakeCount;
    }

    public getLevel(): number {
        return this.level;
    }

    public getRemainingSeconds(): number {
        return this.remainingSeconds;
    }

    public getParamHash(): string {
        return this.paramHash;
    }

    private flush(): void {
        const data = {
            removedArrowIds: Array.from(this.removedSet),
            errorArrowIds: Array.from(this.errorSet),
            hp: this.hp,
            score: this.score,
            level: this.level,
            paramHash: this.paramHash,
            mistakeCount: this.mistakeCount
        };
        localStorage.setItem(this.KEY, JSON.stringify(data));
    }

    public load(): any {
        const savedData = localStorage.getItem(this.KEY);
        const savedTime = localStorage.getItem(this.TIME_KEY);
        
        if (!savedData) {
            return null;
        }
        
        try {
            const parsedData = JSON.parse(savedData);
            this.removedSet = new Set(parsedData.removedArrowIds || []);
            this.errorSet = new Set(parsedData.errorArrowIds || []);
            this.hp = typeof parsedData.hp === 'number' ? parsedData.hp : 0;
            this.score = parsedData.score && typeof parsedData.score === 'number' ? parsedData.score : 0;
            this.level = parsedData.level && typeof parsedData.level === 'number' ? parsedData.level : 0;
            this.mistakeCount = parsedData.mistakeCount && typeof parsedData.mistakeCount === 'number' ? parsedData.mistakeCount : 0;
            this.paramHash = parsedData.paramHash;
            this.remainingSeconds = savedTime ? +savedTime : 0;
            parsedData.remainingSeconds = this.remainingSeconds;
            return parsedData;
        } catch (error) {
            return null;
        }
    }

    private flushTime(): void {
        localStorage.setItem(this.TIME_KEY, this.remainingSeconds.toString());
    }

    public clear(): void {
        this.removedSet.clear();
        this.errorSet.clear();
        this.hp = 0;
        this.score = 0;
        this.level = 0;
        this.remainingSeconds = 0;
        this.paramHash = "";
        this.mistakeCount = 0;
        localStorage.removeItem(this.KEY);
        localStorage.removeItem(this.TIME_KEY);
    }

    public static clear2(): void {
        localStorage.removeItem(SaveManager.ARROW);
        localStorage.removeItem(SaveManager.CHALLENGE);
    }

    public static getDataFromNet(arrowData?: any, challengeData?: any): void {
        if (arrowData) {
            localStorage.setItem(SaveManager.ARROW, JSON.stringify(arrowData));
        }
        if (challengeData) {
            localStorage.setItem(SaveManager.CHALLENGE, JSON.stringify(challengeData));
        }
    }
}