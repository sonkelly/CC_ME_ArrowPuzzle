import { _decorator, Component } from 'cc';
import { Utils } from './Utils';

const { ccclass } = _decorator;

@ccclass('CheckIsShowIcon')
export class CheckIsShowIcon extends Component {
    onEnable(): void {
        const showVideoIcon = Utils.instance.getConfigBoolValue("show_video_icon");
        this.node.active = showVideoIcon;
    }
}