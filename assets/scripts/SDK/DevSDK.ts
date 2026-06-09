import { _decorator } from "cc";
import { AbstractPlatformSDK } from "./AbstractPlatformSDK";

export class DevSDK extends AbstractPlatformSDK {
    private static _instance: DevSDK | undefined;

    public static getInstance(): DevSDK {
        if (this._instance === undefined) {
            this._instance = new DevSDK();
        }
        return this._instance;
    }

    public static getGameVersion(): string {
        return "1.0.1";
    }

    public initAdService(): void {
        // Empty implementation
    }

    public showVideoAd(params?: { videOnStartCallback?: () => void; videoCallback?: (success: boolean) => void }): void {
        if (params === undefined) {
            params = {};
        }
        if (params.videOnStartCallback) {
            params.videOnStartCallback();
        }
        if (params.videoCallback) {
            params.videoCallback(true);
        }
    }

    public showBannerAd(): void {
        // Empty implementation
    }

    public hideBannerAd(): void {
        // Empty implementation
    }

    public showIntertAd(params?: any): void {
        // Empty implementation
    }

    public vibrateShort(): void {
        // Empty implementation
    }

    public vibrateLong(): void {
        // Empty implementation
    }

    public showToast(params?: any): void {
        // Empty implementation
    }

    public getPlatformVersionCode(): void {
        // Empty implementation
    }

    public platformVersionSupport(version: any): boolean {
        return true;
    }

    public getNetworkType(callback: (networkType: number) => void): void {
        callback(1);
    }
}