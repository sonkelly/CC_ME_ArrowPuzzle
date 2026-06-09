import { _decorator } from 'cc';

export class Popup {
    private static popupUI: Array<() => void> = [];
    private static _curPopup: boolean = false;

    public static get curPopup(): boolean {
        return this._curPopup;
    }

    public static push(callback: () => void): void {
        this.popupUI.push(callback);
        if (this._curPopup) {
            console.log("已有弹框在显示", this.popupUI.length);
        } else if (this.popupUI.length > 0) {
            this._curPopup = true;
            const firstCallback = this.popupUI.shift();
            if (firstCallback) {
                firstCallback();
            }
        }
    }

    public static next(): void {
        setTimeout(() => {
            if (this.popupUI.length === 0) {
                this._curPopup = false;
            } else {
                const firstCallback = this.popupUI.shift();
                if (firstCallback) {
                    firstCallback();
                }
                console.log("已有弹框在显示", this.popupUI.length);
            }
        }, 100);
    }
}