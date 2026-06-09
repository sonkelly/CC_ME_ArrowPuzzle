import { _decorator, Component, Sprite, Label } from 'cc';
import { AchievementConfigManager } from './AchievementConfigManager';
import { I18nManager } from './../I18nManager';
import { UIUtils } from './../Utils/UIUtils';

const { ccclass, property } = _decorator;

@ccclass('AchievementItem')
export class AchievementItem extends Component {
    @property(Sprite)
    public icon: Sprite = null;

    @property(Label)
    public lbName: Label = null;

    @property(Label)
    public lbTime: Label = null;

    public init(data: { groupId: number; level: number; time: number }): void {
        UIUtils.setAchievementIcon(this.icon, `cj${data.groupId}_${data.level}`);
        
        const config = AchievementConfigManager.getConfig(data.groupId, data.level);
        this.lbName.string = I18nManager.t(config.name, data.level);
        this.lbTime.string = this.formatTime(data.time);
    }

    private formatTime(timestamp: number): string {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        return `${year}.${month}.${day}`;
    }
}