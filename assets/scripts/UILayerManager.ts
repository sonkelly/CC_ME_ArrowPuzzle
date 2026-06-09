import { _decorator, Component, Node, Tween, tween, v3 } from 'cc';
import { GameLogicConfig } from './GameLogicConfig';
import { GameController } from './GameController';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { AudioManager } from './AudioManager';
import { HeartManager } from './HeartManager';
import { GoldNode } from './GoldNode';
import { GameManager } from './GameManager';
import { SceneNameEnum, MainNavTabType } from './GlobalEnum';
import { PoolManager } from './PoolManager';
import { DirectPlayUtil } from './DirectPlayUtil';

const { ccclass, property } = _decorator;

@ccclass('UILayerManager')
export class UILayerManager extends Component {
    public static instance: UILayerManager = null;

    @property(Node)
    public UIGameMenuLayer: Node = null;

    @property(Node)
    public UIMainMenuLayer: Node = null;

    @property(Node)
    public UIGroundEffectLayer: Node = null;

    @property(Node)
    public UILayer: Node = null;

    @property(Node)
    public UIEffectLayer: Node = null;

    @property(Node)
    public UISkyLayer: Node = null;

    @property(GoldNode)
    public glodNode: GoldNode = null;

    @property(HeartManager)
    public heartManager: HeartManager = null;

    @property(Node)
    public mainSelectTab: Node = null;

    @property(Node)
    public mainUnSelectTab: Node = null;

    public curActiveScene: SceneNameEnum = SceneNameEnum.MainScene;
    public isShowing: boolean = false;

    public onLoad(): void {
        UILayerManager.instance = this;
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateGoldBar, this.onUpdateGoldBar, this);
        if (!DirectPlayUtil.isDirectPlay) {
            this.onUpdateGoldBar(true);
            this.showMainMenu(true);
        }
    }

    public onDestroy(): void {
        EventManager.offAll(this);
    }

    public showMainMenu(show: boolean = false): void {
        this.curActiveScene = SceneNameEnum.MainScene;
        this.UIGameMenuLayer.active = false;
        this.UIMainMenuLayer.active = true;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.OnUpdateMainMenu, show);
        if (GameManager.instance.tabSelected === MainNavTabType.Main) {
            this.onUpdateGoldBar(true);
        } else {
            this.onUpdateGoldBar(false);
        }
        AudioManager.instance.stop_loop_effect();
        PoolManager.instance.maxRecyclePerFrame = 100;
        GameController.instance.is_ready = false;
    }

    public showGameMenu(): void {
        this.curActiveScene = SceneNameEnum.GameScene;
        this.onUpdateGoldBar(false);
        PoolManager.instance.maxRecyclePerFrame = 1;
        this.UIGameMenuLayer.active = true;
        this.UIMainMenuLayer.active = false;
    }

    public isInGame(): boolean {
        return this.UIGameMenuLayer.active;
    }

    public onUpdateGoldBar(show: boolean): void {
        if (this.isShowing === show) {
            return;
        }
        Tween.stopAllByTarget(this.glodNode.node.parent);
        this.isShowing = show;
        if (show) {
            tween(this.glodNode.node.parent)
                .to(0.2, { position: v3(0, SDKInstance.isFacebookMiniGame() ? -50 : -115, 0) }, { easing: 'backOut' })
                .start();
        } else {
            tween(this.glodNode.node.parent)
                .to(0.2, { position: v3(0, 290, 0) }, { easing: 'backIn' })
                .start();
        }
    }

    public showOrHideGoldBarWitoutAnim(show: boolean): void {
        this.isShowing = show;
        const yPosition = show ? (SDKInstance.isFacebookMiniGame() ? -50 : -115) : 290;
        this.glodNode.node.parent.setPosition(0, yPosition);
    }
}