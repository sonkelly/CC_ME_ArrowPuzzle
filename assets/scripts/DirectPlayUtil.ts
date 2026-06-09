import { sys } from 'cc';

export class DirectPlayUtil {
    private static _isDirectPlay: boolean = false;
    static isNewUser: boolean = true;

    static get isDirectPlay(): boolean {
        return this._isDirectPlay;
    }

    static set isDirectPlay(value: boolean) {
        this._isDirectPlay = value;
    }

    static init(): void {
        if (sys.platform === sys.Platform.WECHAT_GAME) {
            const launchOptions = wx.getLaunchOptionsSync();
            if (launchOptions && launchOptions.scene) {
                const scene = launchOptions.scene;
                this._isDirectPlay = scene === 1387;
                console.log("【直玩模式】", this._isDirectPlay, "场景值:", scene);
            } else {
                this._isDirectPlay = false;
            }
        } else {
            this._isDirectPlay = false;
        }
    }
}