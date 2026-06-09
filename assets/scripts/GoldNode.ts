import { _decorator, Component, Node, Label, CCBoolean } from 'cc';
import { EventManager } from './Event/EventManager';
import { Utilsqdd } from './Utils/Utilsqdd';
import { GameRecord } from './GameRecord';
import { ModuleEventKey } from './IGameRawData';
import { GameLogicConfig } from './GameLogicConfig';
import { AudioUtils } from './Utils/AudioUtils';
import { UIManager } from './UIManager';

const { ccclass, property } = _decorator;

@ccclass('GoldNode')
export class GoldNode extends Component {
    @property(Node)
    public gold: Node = null;

    @property(Label)
    public lbGold: Label = null;

    @property
    public isGame: boolean = false;

    public static currentGlods: number = 1;

    public onLoad(): void {
        this.handlerGoldChange(null);
        this.addListener();
    }

    public addListener(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.GoldChange, this.handlerGoldChange, this);
    }

    public onDestroy(): void {
        EventManager.offAll(this);
    }

    public handlerGoldChange(data: any): void {
        if (data) {
            Utilsqdd.numRollWithFormat(this.lbGold, data[0], data[1]);
            this.currentGlods = data[1];
        } else {
            const baseRecorder = GameRecord.GetInstance().BaseRecorder;
            this.lbGold.string = baseRecorder.Data.Gold.toString();
            this.currentGlods = baseRecorder.Data.Gold;
        }
    }

    public addGolds(amount: number): void {
        this.currentGlods += amount;
        this.lbGold.string = this.currentGlods.toString();
    }

    public onAddGoldClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.createPanel("game", "ShopView", {
            setData: false
        });
    }
}