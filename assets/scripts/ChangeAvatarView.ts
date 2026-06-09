import { _decorator, EditBox } from 'cc';
import { BasePanel } from './BasePanel';
import { GameRecord } from './GameRecord';
import { UIManager } from './UIManager';
import { VirtualScrollView } from './VScrollView';
import { AudioUtils } from './Utils/AudioUtils';
import { AvatarItem } from './UI/AvatarItem';
import { JsonClassStorage } from './JsonClass';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { GameLogicConfig } from './GameLogicConfig';

const { ccclass, property } = _decorator;

@ccclass('ChangeAvatarView')
export class ChangeAvatarView extends BasePanel {
    @property(VirtualScrollView)
    public vlist: VirtualScrollView | null = null;

    @property(EditBox)
    public nameEditbox: EditBox | null = null;

    public static avatarCfg: any[] = [];
    public baseRecorder: any = undefined;
    public curSelected: number = -1;

    public onLoad(): void {
        this.init_view();
        this.addListen();
    }

    public addListen(): void {
        // Empty method as per original code
    }

    public init_view(): void {
        this.baseRecorder = GameRecord.GetInstance().BaseRecorder;
        this.nameEditbox!.string = this.baseRecorder.Data.PlayerNickName;
        this.avatarCfg = JsonClassStorage.instance.getTableJson("AvatarConfig").json;

        this.avatarCfg.forEach((item: any) => {
            item.clicked = item.ID === +this.baseRecorder.Data.PlayerAvatar;
        });

        this.curSelected = +this.baseRecorder.Data.PlayerAvatar;

        if (this.vlist) {
            this.vlist.renderItemFn = (itemNode: any, index: number) => {
                const avatarItem = itemNode.getComponent(AvatarItem);
                const config = this.avatarCfg[index];
                avatarItem.init(config);
            };

            this.vlist.onItemClickFn = (itemNode: any, index: number) => {
                this.avatarCfg.forEach((item: any, idx: number) => {
                    if (index === idx) {
                        item.clicked = true;
                        this.curSelected = item.ID;
                    } else {
                        item.clicked = false;
                    }
                });
                this.vlist!.refreshList(this.avatarCfg);
            };

            this.vlist.refreshList(this.avatarCfg);
        }
    }

    public onSaveClick(): void {
        AudioUtils.btn_click_sound();

        if (+this.baseRecorder.Data.PlayerAvatar !== this.curSelected) {
            this.baseRecorder.ModifyPlayerAvatar(this.curSelected);
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ModifyPlayerAvatar);
        }

        if (this.baseRecorder.Data.PlayerNickName !== this.nameEditbox!.string) {
            this.baseRecorder.ModifyPlayerName(this.nameEditbox!.string);
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ModifyPlayerName);
        }

        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet, [false]);
        UIManager.deleteNode("ChangeAvatarView");
    }

    public onBackClick(): void {
        AudioUtils.btn_close_sound();
        UIManager.deleteNode("ChangeAvatarView");
    }
}