import { _decorator, Component } from 'cc';
import { VirtualScrollView } from './VScrollView';
import { AudioUtils } from './Utils/AudioUtils';
import { BasePanel } from './BasePanel';
import { TierInfoItem } from './TierInfoItem';
import { TierManager } from './TierManager';
import { UIManager } from './UIManager';

const { ccclass, property } = _decorator;

@ccclass('TierInfoView')
export class TierInfoView extends BasePanel {
    @property(VirtualScrollView)
    public tierList: VirtualScrollView = null;

    public static tierConfig: any[] = [];

    public onLoad(): void {
        this.addListen();
        TierInfoView.tierConfig = TierManager.instance.cfgList;
        this.tierList.renderItemFn = (itemNode: any, index: number) => {
            itemNode.getComponent(TierInfoItem).init(TierInfoView.tierConfig[index]);
        };
        this.tierList.refreshList(TierInfoView.tierConfig);
    }

    public onHide(): void {
        // No implementation needed
    }

    public onDestroy(): void {
        // No implementation needed
    }

    public addListen(): void {
        // No implementation needed
    }

    public onCloseClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.deleteNode('TierInfoView');
    }
}