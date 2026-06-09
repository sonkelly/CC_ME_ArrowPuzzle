import { _decorator, Component } from 'cc';
import { LogUtils } from './../Utils/LogUtils';
import { PlatformUtils } from './../Utils/PlatformUtils';

export enum EPlatformSceneCode {
    NONE = 0,
    DESKTOP = 1,
    MYGAME = 2
}

export class AbstractPlatformSDK {
    public showToast(msg: string): void {
        LogUtils.info("msg ", msg);
    }

    public showInsertVideoAd(param?: any): void {
        // Empty implementation
    }

    public showNativeImageAd(param?: any): void {
        // Empty implementation
    }

    public hideNativeImage(): void {
        // Empty implementation
    }

    public getSystemInfo(): { windowWidth: number; windowHeight: number } {
        return {
            windowWidth: 360,
            windowHeight: 800
        };
    }

    public showNativeIconAd(param?: any): void {
        // Empty implementation
    }

    public hideNativeIconAd(): void {
        // Empty implementation
    }

    public addDesktopIcon(param?: any): void {
        // Empty implementation
    }

    public hasDesktopIcon(options: any = {}): void {
        if (PlatformUtils.isDebug()) {
            if (options.callbackFunction) {
                options.callbackFunction(false);
            }
        } else {
            if (options.callbackFunction) {
                options.callbackFunction(true);
            }
        }
    }

    public showGameBoxBannerAd(param?: any): void {
        // Empty implementation
    }

    public hideGameBoxBannerAd(): void {
        // Empty implementation
    }

    public showGameBoxPortalAd(param?: any): void {
        // Empty implementation
    }

    public hideGameBoxPortalAd(): void {
        // Empty implementation
    }

    public showGameDrawerAd(param?: any): void {
        // Empty implementation
    }

    public hideGameDrawerAd(): void {
        // Empty implementation
    }

    public getNativeAdImageData(): void {
        // Empty implementation
    }

    public getNativeAdIconData(): void {
        // Empty implementation
    }

    public reportNativeAdImageShow(param?: any): void {
        // Empty implementation
    }

    public reportNativeAdImageClick(param?: any): void {
        // Empty implementation
    }

    public reportNativeAdIconShow(param?: any): void {
        // Empty implementation
    }

    public reportNativeAdIconClick(param?: any): void {
        // Empty implementation
    }

    public reportMonitor(): void {
        // Empty implementation
    }

    public toMiniGame(param?: any): void {
        // Empty implementation
    }

    public autoClickNativeAdImage(callback: (result: boolean) => void): void {
        callback(false);
    }

    public autoClickNativeAdIcon(callback: (result: boolean) => void): void {
        callback(false);
    }

    public autoClickVideo(callback: (result: boolean) => void): void {
        callback(false);
    }

    public showCustomAd(param?: any): void {
        // Empty implementation
    }

    public hideCustomAd(): void {
        // Empty implementation
    }

    public shareAppMessage(options: any = {}): void {
        if (options.resultCallback) {
            options.resultCallback(true);
        }
    }

    public shareImage(options: any = {}): void {
        if (options.resultCallback) {
            options.resultCallback(true);
        }
    }

    public jumpLeisureSubject(param?: any): void {
        // Empty implementation
    }

    public showGameDoingSplash(): void {
        // Empty implementation
    }

    public shareGameRecorder(options: any = {}): void {
        if (options.resultCallback) {
            options.resultCallback(true);
        }
    }

    public copyString(param1?: any, param2?: any): void {
        // Empty implementation
    }

    public registerEvent(): void {
        // Empty implementation
    }

    public loginWithAccount(param?: any): void {
        // Empty implementation
    }

    public startPayEvent(param1?: any, param2?: any, param3?: any): void {
        // Empty implementation
    }

    public purchaseEvent(param1?: any, param2?: any, param3?: any, param4?: any, param5?: any, param6?: any, param7?: any): void {
        // Empty implementation
    }

    public onCharge(param1?: any, param2?: any, param3?: any, param4?: any): void {
        // Empty implementation
    }

    public setUserID(param?: any): void {
        // Empty implementation
    }

    public openUrl(param?: any): void {
        // Empty implementation
    }

    public initMySDK(): void {
        // Empty implementation
    }

    public openAppStoreReview(): boolean {
        return false;
    }

    public getNetworkType(param?: any): void {
        // Empty implementation
    }

    public removeAccount(): void {
        // Empty implementation
    }

    public gameRecorderStart(param?: any): void {
        // Empty implementation
    }

    public gameRecorderPause(): void {
        // Empty implementation
    }

    public gameRecorderResume(): void {
        // Empty implementation
    }

    public gameRecorderStop(param?: any): void {
        // Empty implementation
    }

    public getAppName(): void {
        // Empty implementation
    }

    public showAppBox(param?: any): void {
        // Empty implementation
    }

    public showBlockAd(param?: any): void {
        // Empty implementation
    }

    public hideBlockAd(): void {
        // Empty implementation
    }

    public login(options: any = {}): void {
        if (options.resultCallback) {
            options.resultCallback(true);
        }
    }

    public loginQQ(options: any = {}): void {
        if (options.resultCallback) {
            options.resultCallback(true);
        }
    }

    public loginWX(options: any = {}): void {
        if (options.resultCallback) {
            options.resultCallback(true);
        }
    }

    public isWxAppInstalled(): boolean {
        return true;
    }

    public loginApple(options: any = {}): void {
        if (options.resultCallback) {
            options.resultCallback(true);
        }
    }

    public loginTapTap(options: any = {}): void {
        if (options.resultCallback) {
            options.resultCallback(true);
        }
    }

    public getBalance(): void {
        // Empty implementation
    }

    public pay(param?: any): void {
        // Empty implementation
    }

    public present(param?: any): void {
        // Empty implementation
    }

    public logout(): void {
        // Empty implementation
    }

    public setGameRoleInfo(param1?: any, param2?: any): void {
        // Empty implementation
    }

    public setHYGameRoleInfo(param1?: any, param2?: any): void {
        // Empty implementation
    }

    public setExtData(param1?: any, param2?: any, param3?: any, param4?: any): void {
        // Empty implementation
    }

    public exitApp(): void {
        // Empty implementation
    }

    public textCheck(param1?: any, param2?: any): void {
        // Empty implementation
    }

    public showRecommendList(param?: any): void {
        // Empty implementation
    }

    public showRecommendIcon(param?: any): void {
        // Empty implementation
    }

    public showAuthenticationView(): void {
        // Empty implementation
    }

    public showAppPolicy(): void {
        // Empty implementation
    }

    public isShieldPay(): boolean {
        return false;
    }

    public navigateToScene(): void {
        // Empty implementation
    }

    public getUserInfoImpl(): any {
        return null;
    }

    public isSceneCodeEqual(param?: any): boolean {
        return false;
    }

    public getQuery(): any {
        return null;
    }

    public getUserInfo(param?: any): void {
        // Empty implementation
    }

    public genIAAReposrtData(param1?: any, param2?: any, param3?: any, param4?: any): void {
        // Empty implementation
    }

    public invite(): void {
        // Empty implementation
    }

    public officialPage(): void {
        // Empty implementation
    }

    public createShortcut(): void {
        // Empty implementation
    }

    public subscribeBot(): void {
        // Empty implementation
    }

    public getPlatform(): string {
        return "";
    }
}