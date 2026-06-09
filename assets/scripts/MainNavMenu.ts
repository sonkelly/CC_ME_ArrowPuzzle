import { _decorator, Component } from 'cc';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { GameLogicConfig } from './GameLogicConfig';

const { ccclass } = _decorator;

@ccclass('MainNavMenu')
export class MainNavMenu extends Component {
    public menuName: string = '';

    public InitMenu(): void {
        this.OnInit();
    }

    public ShowMenu(): void {
        this.node.active = true;
        this.OnShow();
        EventManager.emit(
            `${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.ON_MENU_SHOW}`,
            this.menuName,
            this
        );
    }

    public HideMenu(): void {
        this.node.active = false;
        this.OnHide();
        EventManager.emit(
            `${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.ON_MENU_HIDE}`,
            this.menuName
        );
    }

    public HandleEvent(eventName: string, eventData: any): void {
        this.OnEvent(eventName, eventData);
    }

    protected OnInit(): void {
        // Override in subclass
    }

    protected OnShow(): void {
        // Override in subclass
    }

    protected OnHide(): void {
        // Override in subclass
    }

    protected OnEvent(eventName: string, eventData: any): void {
        // Override in subclass
    }

    protected onDestroy(): void {
        if (this.node.active) {
            EventManager.emit(
                `${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.ON_MENU_HIDE}`,
                this.menuName
            );
        }
    }
}