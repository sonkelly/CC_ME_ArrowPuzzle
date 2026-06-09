import { _decorator } from 'cc';
import { AbstractPlatformSDK } from './AbstractPlatformSDK';

export class XiaoMiSDK extends AbstractPlatformSDK {
    private static _instance: XiaoMiSDK | undefined;

    public static getInstance(): XiaoMiSDK {
        if (this._instance === undefined) {
            this._instance = new XiaoMiSDK();
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

    public showIntertAd(param1?: any, param2?: any): void {
        // Empty implementation
    }

    public vibrateShort(): void {
        // Empty implementation
    }

    public vibrateLong(): void {
        // Empty implementation
    }

    public showToast(message?: string): void {
        // Empty implementation
    }

    public getPlatformVersionCode(): number | undefined {
        // Empty implementation
        return undefined;
    }

    public platformVersionSupport(versionCode: number): boolean {
        return true;
    }

    public getGameVersion(): string {
        return "1.0.0";
    }
}