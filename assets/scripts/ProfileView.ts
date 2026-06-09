import { _decorator, Sprite, Label, Node } from 'cc';
import { BasePanel } from './BasePanel';
import { UIManager } from './UIManager';
import { AudioUtils } from './Utils/AudioUtils';
import { GameRecord } from './GameRecord';
import { UIUtils } from './Utils/UIUtils';
import { GameLocalStorage } from './GameLocalStorage';

const { ccclass, property } = _decorator;

@ccclass('ProfileView')
export class ProfileView extends BasePanel {
    @property(Sprite)
    private avatar: Sprite = null;

    @property(Label)
    private lbLevel: Label = null;

    @property(Label)
    private lbName: Label = null;

    @property(Node)
    private guideNode: Node = null;

    public onLoad(): void {
        this.addListen();
    }

    public addListen(): void {
        // Empty method as per original code
    }

    public setData(showGuide: boolean): void {
        const isFirstTime: boolean = Number(GameLocalStorage.getItem("modifyName") || 0) === 0;
        this.guideNode.active = showGuide && isFirstTime;
        this.initView();
        if (showGuide) {
            GameLocalStorage.setItem("modifyName", 1);
        }
    }

    private initView(): void {
        const currentLevel: number = GameRecord.GetInstance().BaseRecorder.Data.CurLevel;
        this.lbLevel.string = "Level" + currentLevel;
        this.refreshAvatarAndName();
    }

    private refreshAvatarAndName(): void {
        const baseRecorder = GameRecord.GetInstance().BaseRecorder;
        this.lbName.string = baseRecorder.Data.PlayerNickName;
        UIUtils.setPlayerAvatarIcon(this.avatar, baseRecorder.Data.PlayerAvatar);
    }

    public onChangeAvatarClick(): void {
        AudioUtils.btn_click_sound();
        this.guideNode.active = false;
        GameLocalStorage.setItem("modifyName", 1);
        UIManager.createPanel("game", "ChangeAvatarView", {
            showAnimation: true,
            closeFuncion: () => {
                this.refreshAvatarAndName();
            }
        });
    }

    public onBackClick(): void {
        AudioUtils.btn_close_sound();
        UIManager.deleteNode("ProfileView");
    }
}