import { _decorator, Component, Sprite, Label } from 'cc';
import { I18nManager, Language } from './I18nManager';
import { UIUtils } from './Utils/UIUtils';

const { ccclass, property } = _decorator;

@ccclass('TierInfoItem')
export class TierInfoItem extends Component {
    @property(Sprite)
    public bg: Sprite = null;

    @property(Sprite)
    public icon: Sprite = null;

    @property(Label)
    public lbName: Label = null;

    @property(Label)
    public lbTarget: Label = null;

    public init(data: { bg: string; icon: string; enName: string; name: string; need: number }): void {
        UIUtils.setTierBg(this.bg, data.bg);
        UIUtils.setTierIcon(this.icon, data.icon);
        
        this.lbName.string = I18nManager.getLanguage() === Language.EN ? data.enName : data.name;
        
        const needText = I18nManager.getLanguage() === Language.EN ? "Need: " : "所需: ";
        const levelText = I18nManager.getLanguage() === Language.EN ? "Levels" : "关卡";
        this.lbTarget.string = needText + data.need + levelText;
    }
}