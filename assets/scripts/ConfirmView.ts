import { _decorator, Label } from 'cc';
import { BasePanel } from './BasePanel';
import { UIManager } from './UIManager';
import { AudioUtils } from './Utils/AudioUtils';

const { ccclass, property } = _decorator;

@ccclass('ConfirmView')
export class ConfirmView extends BasePanel {
    @property(Label)
    public lbTitle: Label | null = null;

    @property(Label)
    public lbDesc: Label | null = null;

    @property(Label)
    public lbYes: Label | null = null;

    @property(Label)
    public lbNo: Label | null = null;

    public yesCb: (() => void) | null = null;
    public noCb: (() => void) | null = null;

    public onLoad(): void {
        this.addListen();
    }

    public setData(data: {
        title?: string;
        desc: string;
        yesTxt?: string;
        noTxt?: string;
        yesCb?: () => void;
        noCb?: () => void;
    }): void {
        this.initView();

        if (data.title) {
            this.lbTitle!.string = data.title;
        }

        this.lbDesc!.string = data.desc;

        if (data.yesTxt) {
            this.lbYes!.string = data.yesTxt;
        }

        if (data.noTxt) {
            this.lbNo!.string = data.noTxt;
        }

        this.yesCb = data.yesCb || null;
        this.noCb = data.noCb || null;
    }

    public addListen(): void {
        // Add event listeners if needed
    }

    public initView(): void {
        // Initialize view if needed
    }

    public onYesClick(): void {
        AudioUtils.btn_click_sound();
        if (this.yesCb) {
            this.yesCb();
        }
        UIManager.deleteNode('ConfirmView');
    }

    public onNoClick(): void {
        AudioUtils.btn_click_sound();
        if (this.noCb) {
            this.noCb();
        }
        UIManager.deleteNode('ConfirmView');
    }
}