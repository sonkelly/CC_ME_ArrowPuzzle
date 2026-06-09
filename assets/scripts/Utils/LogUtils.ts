import { ConfigHelper } from './../ConfigHelper';
import { PlatformUtils } from './../Utils/PlatformUtils';

export class LogUtils {
    public static logTag: string = "===========>>>";

    public static log(...args: any[]): void {
        const message = this.dateFormat() + " " + LogUtils.logTag + " ";
        if (PlatformUtils.isNative()) {
            if (!PlatformUtils.isIOS()) {
                console.log(message + JSON.stringify(args));
            }
        } else if ((PlatformUtils.isFourThreeNineNinePlatform() || PlatformUtils.isQQGameH5()) && ConfigHelper.getGameConfig()) {
            if (ConfigHelper.getGameConfig().logSwitch) {
                console.log(message, ...args);
            }
        } else {
            console.log(message, ...args);
        }
    }

    public static error(...args: any[]): void {
        const message = this.dateFormat() + " " + LogUtils.logTag + " ";
        if (PlatformUtils.isNative()) {
            console.error(message + JSON.stringify(args));
        } else {
            console.error(message, ...args);
        }
    }

    public static warn(...args: any[]): void {
        const message = this.dateFormat() + " " + LogUtils.logTag + " ";
        if (PlatformUtils.isNative()) {
            console.warn(message + JSON.stringify(args));
        } else {
            console.warn(message, ...args);
        }
    }

    public static info(...args: any[]): void {
        const message = this.dateFormat() + " " + LogUtils.logTag + " ";
        if (PlatformUtils.isNative()) {
            if (!PlatformUtils.isIOS()) {
                console.info(message + JSON.stringify(args));
            }
        } else if ((PlatformUtils.isFourThreeNineNinePlatform() || PlatformUtils.isQQGameH5()) && ConfigHelper.getGameConfig()) {
            if (ConfigHelper.getGameConfig().logSwitch) {
                console.info(message, ...args);
            }
        } else {
            console.info(message, ...args);
        }
    }

    public static dateFormat(fmt: string = "YYYY-mm-dd HH:MM:SS", date: Date = new Date()): string {
        const opt: { [key: string]: string } = {
            "Y+": date.getFullYear().toString(),
            "m+": (date.getMonth() + 1).toString(),
            "d+": date.getDate().toString(),
            "H+": date.getHours().toString(),
            "M+": date.getMinutes().toString(),
            "S+": date.getSeconds().toString()
        };

        for (const key in opt) {
            if (opt.hasOwnProperty(key)) {
                const ret = new RegExp("(" + key + ")").exec(fmt);
                if (ret) {
                    fmt = fmt.replace(ret[1], ret[1].length === 1 ? opt[key] : opt[key].padStart(ret[1].length, "0"));
                }
            }
        }

        return fmt + "." + date.getMilliseconds();
    }
}