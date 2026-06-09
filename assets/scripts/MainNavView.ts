import { _decorator, Component, Node, view, tween, Prefab, instantiate } from 'cc';
import { BasePanel } from './BasePanel';
import { MainMenu } from './MainMenu';
import { CommTabItem } from './CommTabItem';
import { MainNavMenu } from './MainNavMenu';
import { MainNavTabType, GameType } from './GlobalEnum';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { UIManager } from './UIManager';
import { AudioUtils } from './Utils/AudioUtils';
import { Toast } from './Toast';
import { GameLogicConfig } from './GameLogicConfig';
import { UILayerManager } from './UILayerManager';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

@ccclass('MainNavView')
export class MainNavView extends BasePanel {
    @property(Node)
    tabLayer: Node = null;

    @property(Node)
    nodeMenuParent: Node = null;

    @property(MainMenu)
    mainMenu: MainMenu = null;

    arrTab: CommTabItem[] = [];
    arrMenuInst: (MainNavMenu | null)[] = new Array(8);
    isMenuCreateSucc: boolean = undefined;
    tabSelected: MainNavTabType = undefined;
    arrMenuPrefabName: string[] = ['ShopMenu', 'TournamentMenu', 'MainMenu', 'LeaderboardMenu'];
    animating: boolean = false;

    onLoad(): void {
        for (let i = 0; i < this.tabLayer.children.length; i++){
            this.arrTab.push(this.tabLayer.children[i].getComponent(CommTabItem));
        }

        this.initData();
        this.initView();
        this.addListen();
    }

    update(deltaTime: number): void {
        // Empty update function
    }

    addListen(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + '_' + ModuleEventKey.ON_MENU_CHANGE, this.changeMenu, this);
    }

    initData(): void {
        this.arrMenuInst[MainNavTabType.Main] = this.mainMenu;
        this.isMenuCreateSucc = true;
        this.tabSelected = MainNavTabType.NONE;
    }

    initView(): void {
        this.changeMenu(MainNavTabType.Main, false);
        this.updateTabShow();
    }

    async createChildMenu(index: number, showAnimation: boolean = true): Promise<void> {
        const prefabName = this.arrMenuPrefabName[index];
        if (prefabName.length < 2) {
            Toast.instance.tip_div('Function not activated');
            return;
        }

        this.isMenuCreateSucc = false;
        let menuInstance = this.arrMenuInst[index];

        if (menuInstance == null) {
            const prefab = await UIManager.loadAsset('game', prefabName, Prefab);
            const node = instantiate(prefab);
            node.setParent(this.nodeMenuParent);
            menuInstance = node.getComponent(MainNavMenu);
            menuInstance.InitMenu();
            this.arrMenuInst[index] = menuInstance;
        }

        if (!menuInstance.menuName) {
            menuInstance.menuName = prefabName;
        }

        for (let i = 0; i < this.arrMenuInst.length; i++) {
            const currentMenu = this.arrMenuInst[i];
            if (currentMenu != null) {
                if (!showAnimation) {
                    if (i === this.tabSelected) {
                        currentMenu.ShowMenu();
                    } else {
                        currentMenu.HideMenu();
                    }
                }
            }
        }

        this.isMenuCreateSucc = true;
    }

    async changeMenu(newTab: MainNavTabType, showAnimation: boolean = false): Promise<void> {
        if (this.tabSelected === newTab || this.animating) {
            return;
        }

        this.tabSelected = newTab;
        GameManager.instance.tabSelected = newTab;
        this.updateTabShow();
        await this.createChildMenu(this.tabSelected, false);
    }

    playSwitchAnim(fromIndex: number, toIndex: number): void {
        this.animating = true;
        const fromMenu = this.arrMenuInst[fromIndex];
        const toMenu = this.arrMenuInst[toIndex];
        const screenWidth = view.getVisibleSize().width;
        const direction = toIndex > fromIndex ? 1 : -1;

        toMenu.node.active = true;
        toMenu.node.setPosition(direction * screenWidth, 0);

        tween(fromMenu.node)
            .to(0.25, { x: -direction * screenWidth }, { easing: 'quadInOut' })
            .start();

        tween(toMenu.node)
            .to(0.25, { x: 0 }, { easing: 'quadInOut' })
            .call(() => {
                fromMenu.HideMenu();
                fromMenu.node.active = false;
                fromMenu.node.setPosition(0, 0);
                toMenu.ShowMenu();
                this.animating = false;
            })
            .start();
    }

    emitChildMenuEvent(eventName: string, eventData: any): void {
        const currentMenu = this.arrMenuInst[this.tabSelected];
        if (currentMenu != null) {
            currentMenu.HandleEvent(eventName, eventData);
        }
    }

    async onTabClick(tabIndex: number): Promise<void> {
        AudioUtils.btn_click_sound();
        if (this.isMenuCreateSucc) {
            await this.changeMenu(tabIndex);
            UILayerManager.instance.showOrHideGoldBarWitoutAnim(tabIndex === MainNavTabType.Main || tabIndex === MainNavTabType.Shop);
        }
    }

    updateTabShow(): void {
        for (let i = 0; i < this.arrTab.length; i++) {
            const tabItem = this.arrTab[i];
            tabItem.UpdateTabShow(i === this.tabSelected);
            tabItem.ClickFunc = () => {
                this.onTabClick(i);
            };
        }
    }

    onSettingClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel('game', 'SettingView', {
            showAnimation: true,
            setData: {
                isMain: true,
                gameType: GameType.MainLevel
            }
        });
    }
}