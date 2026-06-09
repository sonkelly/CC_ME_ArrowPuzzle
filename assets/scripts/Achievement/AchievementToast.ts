import { _decorator, Component, Node, Sprite, Label, tween } from 'cc';
import { ModuleEventKey } from './../IGameRawData';
import { EventManager } from './../Event/EventManager';
import { GameLogicConfig } from './../GameLogicConfig';
import { UIUtils } from './../Utils/UIUtils';
import { AudioManager } from './../AudioManager';
import { I18nManager } from './../I18nManager';

const { ccclass, property } = _decorator;

@ccclass('AchievementToast')
export class AchievementToast extends Component {
    @property(Node)
    toastNode: Node | null = null;

    @property(Sprite)
    icon: Sprite | null = null;

    @property(Label)
    lbName: Label | null = null;

    private static startPos: any = null;
    private static queue: any[] = [];
    private static isPlaying: boolean = false;
    private _flyTween: any = null;
    private _flyFinish: (() => void) | null = null;

    onLoad(): void {
        const self = this;
        this.scheduleOnce(() => {
            self._flyTween = tween(self.toastNode)
                .by(0.2, { x: -451 })
                .call(() => {
                    AudioManager.instance.load_and_play_effect("achieve", false, "game");
                })
                .delay(3)
                .by(0.1, { x: 451 })
                .call(() => {
                    if (self._flyFinish) {
                        self._flyFinish();
                    }
                });
        });

        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.TriggerAchievement,
            this.onTriggerAchievement,
            this
        );
    }

    onDestroy(): void {
        EventManager.offAll(this);
    }

    onTriggerAchievement(eventData: any): void {
        this.push(eventData);
    }

    push(eventData: any): void {
        AchievementToast.queue.push(eventData);
        this.tryPlay();
    }

    private tryPlay = async (): Promise<void> => {
        if (!AchievementToast.isPlaying && AchievementToast.queue.length !== 0) {
            AchievementToast.isPlaying = true;
            while (AchievementToast.queue.length > 0) {
                const eventData = AchievementToast.queue.shift();
                await this.playOne(eventData);
            }
            AchievementToast.isPlaying = false;
        }
    };

    private playOne(eventData: any): Promise<void> {
        const self = this;
        return new Promise<void>((resolve) => {
            UIUtils.setAchievementIcon(self.icon, "cj" + eventData.groupId + "_" + eventData.level);
            self.lbName!.string = I18nManager.t(eventData.name, eventData.level);
            self.playAnim(resolve);
        });
    }

    private playAnim(callback: () => void): void {
        this._flyFinish = callback;
        if (this._flyTween) {
            this._flyTween.start();
        }
    }
}