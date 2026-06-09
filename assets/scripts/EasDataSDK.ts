import { BaseDataManager } from './BaseDataManager';
import { GameLogicConfig } from './GameLogicConfig';

export class EasDataSDK {
    private static easAnalytics: any;
    private static startTime: number = 0;
    private static reported: boolean = false;

    static init(): void {
        /*if (SDKInstance.isFacebookMiniGame()) {
            const config = {
                appId: "", //2lstctwyodlckphw88d3ixmu
                requestUrl: "", //https://e5log1.fineboost.com/track/h5/
                regUrl: "", //https://spatial.fineboost.com/egs
                fidUrl: "", //https://epcfg.fineboost.com/sapi/v5
                gettimeUrl: "", //https://spatial.fineboost.com/gettime
                pkgName: "", //com.arrows.FB
                currentVersion: GameLogicConfig.fbgame_version,
                logShow: false,
                cors: true
            };

            this.startTime = new Date().getTime();
            this.reported = false;
            this.easAnalytics = new EasAnalyticsAPI(config);
            this.easAnalytics.login(BaseDataManager.uuid);
            this.trackEvent("launch");
            this.easAnalytics.init();

            FBInstant.onPause(() => {
                console.log("Pause event was triggered!");
                this.appEnd();
            });

            document?.addEventListener("visibilitychange", () => {
                console.log("visibilitychange!");
                if (document.visibilityState === "hidden") {
                    this.appEnd();
                }
            });

            window.addEventListener("pagehide", () => {
                console.log("pagehide!");
                this.appEnd();
            });
        }*/
    }

    static trackEvent(eventName: string, properties?: any): void {
        if (this.easAnalytics) {
            if (properties) {
                this.easAnalytics.track(eventName, properties);
            } else {
                this.easAnalytics.track(eventName);
            }
        }
    }

    static userSet(properties: any): void {
        this.easAnalytics?.userSet(properties);
    }

    static userSetOnce(properties: any): void {
        this.easAnalytics?.userSetOnce(properties);
    }

    static userAdd(properties: any): void {
        this.easAnalytics?.userAdd(properties);
    }

    static appEnd(): void {
        if (!this.reported) {
            this.reported = true;
            const currentTime = new Date().getTime();
            const duration = Math.floor((currentTime - this.startTime) / 1000);
            console.log("Duration:", duration);
            this.trackEvent("eas_app_end", {
                __play_time: duration
            });
        }
    }
}