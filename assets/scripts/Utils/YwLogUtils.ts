import { _decorator } from 'cc';
import { PlatUtils } from './PlatUtils';
import { Utils } from './../Utils';

const { ccclass } = _decorator;

export enum YwLogType {
    INFO = 0,
    WARN = 1,
    ERRO = 2,
    YOUWAN = 3
}

@ccclass
export class YwLogUtils {
    public static showLogToConsole: boolean = false;
    public static showLogToLogView: boolean = false;
    private static logArray: string[] = new Array();

    public static showLog(message: string, ...args: any[]): void {
        let logMessage = message;
        if (args && args.length > 0) {
            args.forEach((arg: any) => {
                logMessage += " " + arg;
            });
        }

        if (Utils.instance._isServerInit) {
            if (!this.showLogToConsole && !this.showLogToLogView) {
                this.logArray.length = 0;
                return;
            }

            if (this.logArray.length > 0) {
                const pendingLogs = this.logArray.slice(0);
                this.logArray.length = 0;
                for (let i = 0; i < pendingLogs.length; i++) {
                    this.printLogsToConsole(pendingLogs[i]);
                }
                pendingLogs.length = 0;
            }

            this.printLogsToConsole(logMessage);
        } else {
            this.logArray.push(logMessage);
        }
    }

    private static printLogsToConsole(message: string): void {
        this.showLogToConsole;
        if (PlatUtils.isBrowser || PlatUtils.IsWechat) {
            console.log("%c" + Utils.instance.getTimeLocaleString() + " --- [YwAdCommon] --- " + message, "color: #FF6400;");
        } else {
            console.log(Utils.instance.getTimeLocaleString() + " --- [YwAdCommon] --- " + message);
        }
    }
}