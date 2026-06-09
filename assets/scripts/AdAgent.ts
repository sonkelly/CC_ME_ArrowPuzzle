import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('AdAgent')
export class AdAgent {
    public Init(): void {}

    public ShowBanner(param1: any, param2: any): void {}

    public HideBanner(param1: any): void {}

    public ShowInterstitial(param1: any): void {}

    public ShowVideo(param1: any): void {}

    public showInteractiveAd(): void {}

    public ShowAppBox(param1: any): void {}

    public HideAppBox(): void {}

    public showRewardInsert(): void {}

    public hideRewardInsert(): void {}

    public ShowCloseBtnBanner(param1: any, param2: any): void {}

    public ShowStatementRecomment(): void {}

    public getNativeAdData(param1: any): void {}

    public showStatementAds(param1: any): void {}

    public createNativeAd(param1: any, param2: any): void {}

    public hideKyxBanner(): void {}

    public showNativeTryGameWidget(param1: any): void {}

    public hideNativeTryGameWidget(): void {}

    public showBlockAd(param1: any): void {}

    public hideBlockAd(): void {}

    public showFullScreenVideo(param1: any): void {}

    public showNativeSplashView(param1: any): void {}

    public ShowSingleNativeAd(param1: any): void {}

    public HideSingleNativeAd(param1: any): void {}

    public showCustomAd(param1: any): void {}

    public hideCustomAd(param1: any): void {}

    public createCustomADBanner(): void {}
}