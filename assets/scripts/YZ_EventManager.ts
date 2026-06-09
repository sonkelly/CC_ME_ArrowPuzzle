import { _decorator, Component, director, game } from 'cc';
import { YZ_Constant } from './YZ_Constant';

const { ccclass } = _decorator;

@ccclass('YZ_EventManager')
export class YZ_EventManager extends Component {
    public static registerEvent(eventName: string, callback: Function, target: any): void {
        director.on(eventName, callback, target);
    }

    public static unregisterEvent(target: any): void {
        game.targetOff(target);
    }

    public static emitCommonEvent(data: any): void {
        director.emit(YZ_Constant.YZ_EventCommon, data);
    }
}