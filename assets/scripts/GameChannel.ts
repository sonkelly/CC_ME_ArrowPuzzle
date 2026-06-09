import { _decorator, Component } from 'cc';

export class GameChannel {
    public static get type(): string {
        return window.gameTypeName || "main";
    }

    public static get isOfficial(): boolean {
        return this.type === "main";
    }

    public static get isCloneXJJ(): boolean {
        return this.type === "clone_xjj";
    }
}