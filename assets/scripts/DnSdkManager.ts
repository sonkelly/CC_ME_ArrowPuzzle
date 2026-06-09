import { _decorator, Component, game } from 'cc';
import { GameChannel } from './GameChannel';

const { ccclass } = _decorator;

@ccclass('DnSdkManager')
export class DnSdkManager extends Component {
    public static instance: DnSdkManager | undefined = undefined;
    private sdk: any;

    public onLoad(): void {
        game.addPersistRootNode(this.node);
        DnSdkManager.instance = this;

        const dnSdk = (window as any).dnSdk;
        const SDK = dnSdk?.SDK;
        if (SDK) {
            SDK.setDebug(false);

            let userActionSetId = 123; //1220359562
            let secretKey = ""; //4fbec65e4bb36802544ddb248ae962ec
            let appId = ""; //wxb555c860a0799da9

            if (GameChannel.isCloneXJJ) {
                userActionSetId = 123; //1221021897
                secretKey = ""; //7b079bd15c17d6bcca16ec9a10959181
                appId = ""; //wx5ce62ccefb797a8d
            }

            try {
                this.sdk = new SDK({
                    user_action_set_id: userActionSetId,
                    secret_key: secretKey,
                    appid: appId
                });

                const initResult = this.sdk?.getInitResult();
                console.log("[DnSdkManager] initResult:", initResult, userActionSetId);
                this.sdk?.onAppStart();
            } catch (error) {
                console.warn("[DnSdkManager] init error:", error);
            }
        }
    }
}