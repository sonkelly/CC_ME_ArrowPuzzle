import { _decorator, Component, Node } from 'cc';
import { LogUtils } from './LogUtils';

export class EngineUtils {
    public static getEngineName(): string {
        return window.CocosEngine ? "cocos" : "laya";
    }

    public static isCocos(): boolean {
        return !!window.CocosEngine;
    }

    public static getCocosEngineVersion(): number {
        if (window.CocosEngine) {
            const versionParts: string[] = window.CocosEngine.split(".");
            return 100 * Number(versionParts[0]) + 10 * Number(versionParts[1]) + 1 * Number(versionParts[2]);
        }
        console.log("XminigameSDK", "非Cocos引擎");
        return 0;
    }

    public static getMainCamera(callback: (camera: any) => void): void {
        let attemptCount: number = 0;
        
        const tryGetCamera = (): void => {
            LogUtils.warn("0000000iiii", attemptCount);
            attemptCount++;
            
            setTimeout(() => {
                if (attemptCount >= 10) {
                    callback(undefined);
                } else {
                    tryGetCamera();
                }
            }, 10);
        };
        
        tryGetCamera();
    }
}