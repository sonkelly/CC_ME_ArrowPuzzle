import { GameLogicConfig } from './GameLogicConfig';

export class EasOperateSDK {
    static intersAdLevel: number = 7;
    static arrow_multi_sound: boolean = false;
    static modify_name_level: number = 15;
    static hint_guide_level: number = 4;
    static hint_guide_seonds: number = 2;
    static combo_duration: number = 3;
    static combo_nice_num: number = 5;
    static free_revive_num: number = 3;

    static init(): void {
        /*const self = this;
        if (SDKInstance.isFacebookMiniGame()) {
            const config = {
                appId: "", //2lstctwyodlckphw88d3ixmu
                requestUrl: "", //https://epcfg.fineboost.com
                pkgName: "", //com.arrows.FB
                currentVersion: GameLogicConfig.fbgame_version,
                logShow: false,
                cors: true
            };
            new EasOperationsAPI(config).ParamAPI().init((result: any, error: any) => {
                if (result.getConfigValue) {
                    const intersAdLevel = Number(result.getConfigValue("Interstitial"));
                    self.intersAdLevel = intersAdLevel;
                    self.arrow_multi_sound = result.getConfigValue("arrow_multi_sound");
                    self.modify_name_level = Number(result.getConfigValue("modify_name_level") || 15);
                    self.hint_guide_level = Number(result.getConfigValue("hint_guide_level") || 10);
                    self.hint_guide_seonds = Number(result.getConfigValue("hint_guide_seonds") || 5);
                    self.combo_duration = Number(result.getConfigValue("combo_duration") || 3);
                    self.combo_nice_num = Number(result.getConfigValue("combo_nice_num") || 5);
                    self.free_revive_num = Number(result.getConfigValue("free_revive_num") || 0);
                    console.log("在线参数 value:");
                    console.log("intersAdLevel =", self.intersAdLevel);
                    console.log("arrow_multi_sound =", self.arrow_multi_sound);
                    console.log("modify_name_level =", self.modify_name_level);
                    console.log("hint_guide_level =", self.hint_guide_level);
                    console.log("hint_guide_seonds =", self.hint_guide_seonds);
                    console.log("combo_duration =", self.combo_duration);
                    console.log("combo_nice_num =", self.combo_nice_num);
                    console.log("free_revive_num =", self.free_revive_num);
                }
            });
        }*/
    }
}