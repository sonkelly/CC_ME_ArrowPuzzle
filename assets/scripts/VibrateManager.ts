import { _decorator, Component, game } from 'cc';
import { GameLocalStorage } from './GameLocalStorage';

const { ccclass } = _decorator;

@ccclass('VibrateManager')
export class VibrateManager extends Component {
    public static instance: VibrateManager | null = null;
    private vibrate_is_open: boolean = true;

    public onLoad(): void {
        if (!VibrateManager.instance) {
            VibrateManager.instance = this;
            game.addPersistRootNode(this.node);
        }
        const shakeSetting = GameLocalStorage.getItem("last_setting_shake") || "1";
        this.vibrate_is_open = Number(shakeSetting) === 1;
    }

    public vibrateShort(): void {
        if (this.vibrate_is_open) {
            SDKInstance.vibrateShort();
        }
    }

    public vibrateLong(): void {
        if (this.vibrate_is_open) {
            SDKInstance.vibrateLong();
        }
    }
}