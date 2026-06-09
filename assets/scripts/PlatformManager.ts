import { _decorator } from 'cc';
import { GameType } from './GlobalEnum';

export class PlatformManager {
    public static getLevelBundleName(gameType: GameType, isRescue: boolean = false): string {
        const isFacebookOrGooglePlay = true || SDKInstance.isFacebookMiniGame() || SDKInstance.isGooglePlayNative();
        
        if (gameType === GameType.Tournament) {
            return true || SDKInstance.isFacebookMiniGame() ? "level" : "level_tournament";
        }
        
        if (gameType === GameType.Pvp) {
            return isFacebookOrGooglePlay ? "level" : "level_wx";
        }
        
        if (isRescue) {
            return isFacebookOrGooglePlay ? "level_rescue_fb" : "level_rescue";
        }
        
        return isFacebookOrGooglePlay ? "level" : "level_wx";
    }

    public static getLevelBundleName2(): string {
        return SDKInstance.isFacebookMiniGame() ? "tour_thumbnail" : "level_tournament";
    }
}