import { _decorator, Component } from 'cc';
import { UIManager } from './UIManager';
import { GameManager } from './GameManager';
import { BasePanel } from './BasePanel';
import { AudioUtils } from './Utils/AudioUtils';

const { ccclass, property } = _decorator;

@ccclass('LoseHeartView')
export class LoseHeartView extends BasePanel {
    onLoad(): void {
        this.initView();
        this.addListen();
    }

    addListen(): void {
    }

    initView(): void {
        AudioUtils.game_fail();
    }

    onStayClick(): void {
        AudioUtils.btn_click_sound();
        GameManager.instance.curStage.onGameRestart();
        UIManager.deleteNode('LoseHeartView');
    }

    onExitClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.deleteNode('LoseHeartView');
    }

    oCloseClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.deleteNode('LoseHeartView');
    }
}