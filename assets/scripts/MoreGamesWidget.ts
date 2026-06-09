import { _decorator, Component, Node } from 'cc';
import { Utils } from './Utils';
import { YwLogUtils } from './Utils/YwLogUtils';

const { ccclass, property } = _decorator;

@ccclass('MoreGamesWidget')
export class MoreGamesWidget extends Component {
    @property(Node)
    private btnMoreGames: Node = null;

    @property
    private bgTexture: any = undefined;

    onLoad(): void {
        this.btnMoreGames = this.node.getChildByName('Btn_MoreGames');
    }

    onEnable(): void {
        Utils.instance.registerServerInitEvent(() => {
            this._setBtnVisible();
        }, this);
    }

    onDisable(): void {
        Utils.instance.unregisterServerInitEvent(this);
    }

    private _setBtnVisible(): void {
        if (!Utils.instance.isShowMoreGamesWidget()) {
            this.node.destroy();
        }
    }

    onBtnClickedHandler(event: any, customEventData: string): void {
        YwLogUtils.showLog('点击更多游戏');
        Utils.instance.Tool_Native.showMoreGames();
    }
}