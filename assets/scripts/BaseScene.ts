import { _decorator, Component, Node } from 'cc';
import { EventManager } from './Event/EventManager';
import { UIManager } from './UIManager';

const { ccclass, property } = _decorator;

@ccclass('BaseScene')
export class BaseScene extends Component {
    @property({
        type: Node,
        tooltip: 'UI弹窗的父节点名称'
    })
    UIParent: Node | null = null;

    start(): void {
        this.init();
        UIManager.default_parent = this.UIParent;
    }

    init(): void {
        this.addListen();
    }

    addListen(): void {
        // Override in subclass
    }

    onDestroy(): void {
        EventManager.offAll(this);
        this.clear();
    }

    clear(): void {
        UIManager.deleteAll();
    }
}