import { Toast } from "./../Toast";
import { GameLogicConfig } from "./../GameLogicConfig";
import { Api } from "./../Api";
import { EventManager } from "./../Event/EventManager";
import { ModuleEventKey } from "./../IGameRawData";
import { AssDataManager } from "./../AssDataManager";
import { BaseDataManager } from "./../BaseDataManager";
import { GameRecord } from "./../GameRecord";
import { ModuleEventHandler } from "./../ModuleEventHandler";

export class EventHandlerRecord extends ModuleEventHandler {
    public OnInit(): void {
        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantResetRecord,
            this.handler_WantResetRecord,
            this
        );
        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet,
            this.handler_WantSaveRecordToNet,
            this
        );
    }

    public handler_WantResetRecord(): void {
        GameRecord.GetInstance().ResetAll();
        GameRecord.GetInstance().SaveAllToCache();

        if (SDKInstance.isFacebookMiniGame()) {
            GameRecord.GetInstance().resetRecordChange();
            const netSaveInfo = GameRecord.GetInstance().CollectNetSaveInfo();
            this.saveDataToFB(netSaveInfo, true);
        } else {
            EventManager.emit(
                GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet,
                [false]
            );
            EventManager.emit(
                GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.LoginSuccess,
                [BaseDataManager.uuid],
                true
            );
        }
    }

    public handler_WantSaveRecordToNet = async (params: any[]): Promise<void> => {
        if (SDKInstance.isIOS() || SDKInstance.isGooglePlayNative()) {
            return;
        }

        const shouldShowToast = params[0] as boolean;

        if (SDKInstance.isFacebookMiniGame()) {
            GameRecord.GetInstance().resetRecordChange();
            const netSaveInfo = GameRecord.GetInstance().CollectNetSaveInfo();
            this.saveDataToFB(netSaveInfo);
        } else {
            const netSaveInfo = GameRecord.GetInstance().CollectNetSaveInfo();
            const response = await Api.savePlayerRecordToNet(BaseDataManager.uuid, netSaveInfo);
            
            if (shouldShowToast) {
                if (response && response.code === 200) {
                    Toast.instance.tip_div("Saved successfully");
                } else if (response) {
                    Toast.instance.tip_div(response.msg);
                }
            }
        }
    };

    public saveDataToFB(data: any, showLoginSuccess: boolean = false): void {
        AssDataManager.instance.setLocalArchiveSync();
        if (showLoginSuccess) {
            EventManager.emit(
                GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.LoginSuccess,
                [BaseDataManager.uuid],
                true
            );
        }
    }
}