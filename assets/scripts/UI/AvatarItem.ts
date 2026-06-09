import { _decorator, Component, Sprite, Node } from 'cc';
import { AudioUtils } from './../Utils/AudioUtils';
import { UIUtils } from './../Utils/UIUtils';

const { ccclass, property } = _decorator;

@ccclass('AvatarItem')
export class AvatarItem extends Component {
    @property(Sprite)
    public icon: Sprite = null;

    @property(Node)
    public selected: Node = null;

    @property(Node)
    public selected1: Node = null;

    public init(data: { AvatarName?: string; clicked: boolean }): void {
        UIUtils.setPlayerAvatarIcon(this.icon, data?.AvatarName);
        this.setSelected(data.clicked);
    }

    public setSelected(isSelected: boolean): void {
        this.selected.active = isSelected;
        this.selected1.active = isSelected;
    }

    public onBuyClick(): void {
        AudioUtils.btn_click_sound();
    }
}