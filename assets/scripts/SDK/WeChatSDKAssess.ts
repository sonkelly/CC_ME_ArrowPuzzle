import { _decorator, Component } from 'cc';
import { AbstractPlatformSDK } from './AbstractPlatformSDK';

export class WeChatSDKAssess extends AbstractPlatformSDK {
    private static _instance: WeChatSDKAssess | undefined;

    public static getInstance(): WeChatSDKAssess {
        if (this._instance === undefined) {
            this._instance = new WeChatSDKAssess();
        }
        return this._instance;
    }

    public initAdService(): void {
        // Empty implementation
    }

    public showVideoAd(params: { videoCallback?: (success: boolean) => void } = {}): void {
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
        wx.vibrateShort();
    }

    public vibrateLong(): void {
        wx.vibrateLong();
    }

    public showToast(title: string): void {
        wx.showToast({
            title: title,
            icon: "none"
        });
    }

    public getPlatformVersionCode(): void {
        // Empty implementation
    }

    public platformVersionSupport(version: string): boolean {
        return true;
    }

    public getGameVersion(): string {
        return "1.0.0";
    }
}