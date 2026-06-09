import { _decorator, Component, macro, log, native, game, Input } from 'cc';
import { PlatUtils } from './Utils/PlatUtils';
import { Utils } from './Utils';
import { YwLogUtils } from './Utils/YwLogUtils';

const { ccclass, property } = _decorator;

@ccclass('YZ_Tool_Native')
export class YZ_Tool_Native extends Component {
    private className: string = '';
    private _serverConfig: any = null;
    private _uid: string = '0';
    private _service_uid: string = '0';
    private moreGameShowType: number = 0;
    private showGameExitDialogType: number = 0;
    private appList: string = '';
    private _reportLoginTime: number = 0;
    private _reportLoginInterval: number = 30;
    private isReport: boolean = false;
    private _gameExitDialogNode: any = null;
    private deviceInfo: string = '';
    private _reloadTimes: number = 6;
    private _curloadTimes: number = 0;

    public get ServerConfig(): any {
        return this._serverConfig;
    }

    public get uid(): string {
        return '0';
    }

    public get serviceId(): string {
        return '0';
    }

    public get jniClassName(): string {
        if (this.className) {
            return this.className;
        }
        try {
            this.className = native.reflection.callStaticMethod('aa.b.c.a', 'a', '()Ljava/lang/String;');
        } catch (error) {
            // Ignore error
        }
        return this.className;
    }

    public gameVersion(): string {
        return Utils.instance.config.nativeAndroidConfig.version;
    }

    public init(): void {
        if (!PlatUtils.IsNativeAndroid) {
            return;
        }

        const nativeData = this.getNativeData();
        if (!nativeData) {
            YwLogUtils.showLog('没有获取到本地数据，组件初始化失败！');
            return;
        }

        const configData = JSON.parse(nativeData);
        Utils.instance.ServerConfig = configData;
        this.deviceInfo = configData.device_info;
        this.moreGameShowType = configData.more_game_type;
        this.showGameExitDialogType = configData.show_game_exit_dialog;
        this.appList = configData.app_list;
        this._serverConfig = configData;
        Utils.instance.emitServerInitEvent();

        if (PlatUtils.IsNativeAndroid) {
            game.on(Input.EventType.KEY_DOWN, (event: any) => {
                if (event.keyCode === macro.KEY.escape || event.keyCode === macro.KEY.back) {
                    if (PlatUtils.IsNativeAndroid) {
                        this.GameExit();
                    }
                }
            }, this);
        }
    }

    public showGameExitDialog(): any {
        return null;
    }

    public GameExit(): void {
        if (!PlatUtils.IsNativeAndroid) {
            return;
        }

        log('AdAgentNative GameExit');
        try {
            native.reflection.callStaticMethod(this.jniClassName, 'gameExit', '()V');
        } catch (error) {
            log(error);
        }
    }

    public getMoreGameShowType(): void {
        try {
            this.moreGameShowType = native.reflection.callStaticMethod(this.jniClassName, 'getMoreGameShowType', '()I');
        } catch (error) {
            YwLogUtils.showLog(error);
        }
    }

    public getDeviceInfo(): void {
        try {
            this.deviceInfo = native.reflection.callStaticMethod(this.jniClassName, 'getDeviceInfo', '()Ljava/lang/String;');
            YwLogUtils.showLog('获取原生平台手机设备信息：' + this.deviceInfo);
        } catch (error) {
            YwLogUtils.showLog(error);
        }
    }

    public showMoreGames(): void {
        if (!PlatUtils.IsNativeAndroid) {
            return;
        }

        YwLogUtils.showLog('AdAgentNative showMoreGame');
        try {
            native.reflection.callStaticMethod(this.jniClassName, 'showNativeMoreGame', '()V');
        } catch (error) {
            log(error);
        }
    }

    public setLocalConfig(config: any): void {
        // Empty implementation
    }

    public getNativeData(): string {
        let result = '';
        try {
            result = native.reflection.callStaticMethod(this.jniClassName, 'getLocalConfig', '()Ljava/lang/String;');
            YwLogUtils.showLog('获取原生客户端数据数据 : ' + result);
        } catch (error) {
            YwLogUtils.showLog(error);
        }
        return result;
    }

    public navigateToGame(gameId: string, extraData: any, callback: any): void {
        if (!PlatUtils.IsNativeAndroid) {
            return;
        }

        try {
            native.reflection.callStaticMethod(this.jniClassName, 'navigateToGame', '(Ljava/lang/String;)V', gameId);
        } catch (error) {
            YwLogUtils.showLog(error);
        }
    }

    public getRecommondGameList(): any {
        if (PlatUtils.IsNativeAndroid && Utils.instance.Tool_Native && Utils.instance.Tool_Native.ServerConfig) {
            return Utils.instance.Tool_Native.ServerConfig.jump_list;
        }
        return null;
    }

    public postLevel(level: any, score: any, extraData: any): void {
        // Empty implementation
    }

    public postRecommentShowData(data: any): void {
        // Empty implementation
    }

    public postDataByLocation(location: any, data: any, extraData: any): void {
        // Empty implementation
    }

    public sendEvent(eventData: any): void {
        // Empty implementation
    }

    public sendEventNew(eventName: any, eventData: any, callback: any, extraData: any): void {
        // Empty implementation
    }

    public sendEventV3(eventName: any, eventData: any, extraData: any): void {
        // Empty implementation
    }

    public showToast(message: string): void {
        if (!PlatUtils.IsNativeAndroid) {
            return;
        }

        try {
            native.reflection.callStaticMethod(this.jniClassName, 'showToast', '(Ljava/lang/String;)V', message);
        } catch (error) {
            YwLogUtils.showLog(error);
        }
    }

    public showPrivacyAgreement(): void {
        YwLogUtils.showLog('showPrivacyAgreement');
        try {
            native.reflection.callStaticMethod(this.jniClassName, 'showPrivacyAgreement', '()V');
        } catch (error) {
            YwLogUtils.showLog(error);
        }
    }

    public showRealNameAuthPanel(userId: string): void {
        try {
            native.reflection.callStaticMethod(this.jniClassName, 'showRealNameAuthPanel', '(Ljava/lang/String;)V', userId);
        } catch (error) {
            YwLogUtils.showLog(error);
        }
    }

    public realNameAuthResult(result: string): void {
        try {
            native.reflection.callStaticMethod(this.jniClassName, 'realNameAuthResult', '(Ljava/lang/String;)V', result);
        } catch (error) {
            YwLogUtils.showLog(error);
        }
    }

    public realNameAuth(userId: string, userName: string, idCard: string): void {
        // Empty implementation
    }

    public removeAdByPay(): void {
        try {
            const payData: any = {
                pay_type: 'remove_ad'
            };
            payData.price = Utils.instance.getConfigByKey('remove_ad_price') || 1;
            payData.pid = Utils.instance.getConfigByKey('remove_ad_pid') || -1;
            native.reflection.callStaticMethod(this.jniClassName, 'purchaseIntentReq', '(Ljava/lang/String;)V', JSON.stringify(payData));
        } catch (error) {
            YwLogUtils.showLog(error);
        }
    }

    public jumpToHp(): void {
        if (!PlatUtils.IsNativeAndroid) {
            return;
        }

        YwLogUtils.showLog('AdAgentNative jumpToHp');
        try {
            native.reflection.callStaticMethod(this.jniClassName, 'jumpToHp', '()V');
        } catch (error) {
            log(error);
        }
    }

    public sendPay(payData: any): void {
        try {
            native.reflection.callStaticMethod(this.jniClassName, 'purchaseIntentReq', '(Ljava/lang/String;)V', JSON.stringify(payData));
        } catch (error) {
            YwLogUtils.showLog(error);
        }
    }

    public queryAllProductDetail(callback: any): void {
        try {
            native.reflection.callStaticMethod(this.jniClassName, 'queryAllProductDetail', '()V');
        } catch (error) {
            YwLogUtils.showLog(error);
        }
    }
}