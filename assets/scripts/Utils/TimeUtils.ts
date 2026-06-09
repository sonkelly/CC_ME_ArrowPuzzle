import { I18nManager } from "./../I18nManager";

export class TimeUtils {
    static now(): number {
        return Math.floor(Date.now() / 1000);
    }

    static convertTimeStrToTimestamp(timeStr: string, isUTC: boolean = false): number {
        if (!timeStr) {
            console.warn("时间字符串为空，转换失败");
            return 0;
        }

        const dateStr = timeStr.replace(" ", "T");
        let timestamp = 0;

        try {
            if (isUTC) {
                timestamp = new Date(dateStr + "Z").getTime();
            } else {
                timestamp = new Date(dateStr).getTime();
            }

            if (isNaN(timestamp)) {
                console.warn("时间字符串解析失败：" + timeStr);
                return 0;
            }
        } catch (error) {
            console.error("时间转换异常：", error);
            return 0;
        }

        return timestamp;
    }

    static formatCountdownTime(targetTimestamp: number): string {
        const remaining = targetTimestamp - Date.now();
        if (remaining <= 0) {
            return "00:00";
        }

        const dayMs = 86400000;
        const hourMs = 3600000;
        const minuteMs = 60000;

        const days = Math.floor(remaining / dayMs);
        if (days > 0) {
            const remainingAfterDays = remaining % dayMs;
            const hours = Math.floor(remainingAfterDays / hourMs);
            return `${days}${I18nManager.t("D")} ${hours}${I18nManager.t("H")}`;
        }

        const hours = Math.floor(remaining / hourMs);
        if (hours > 0) {
            const remainingAfterHours = remaining % hourMs;
            const minutes = Math.floor(remainingAfterHours / minuteMs);
            return `${hours}${I18nManager.t("H")}:${minutes}${I18nManager.t("M")}`;
        }

        const minutes = Math.floor(remaining / minuteMs);
        const seconds = Math.floor((remaining % minuteMs) / 1000);
        return `${this.padZero(minutes)}:${this.padZero(seconds)}`;
    }

    static formatCountdownTimeZh(targetTimestamp: number): string {
        const remaining = targetTimestamp - Date.now();
        if (remaining <= 0) {
            return "00:00";
        }

        const dayMs = 86400000;
        const hourMs = 3600000;
        const minuteMs = 60000;

        const days = Math.floor(remaining / dayMs);
        if (days > 0) {
            const remainingAfterDays = remaining % dayMs;
            return `${days}天 ${Math.floor(remainingAfterDays / hourMs)}时`;
        }

        const hours = Math.floor(remaining / hourMs);
        if (hours > 0) {
            const remainingAfterHours = remaining % hourMs;
            return `${hours}时:${Math.floor(remainingAfterHours / minuteMs)}分`;
        }

        const minutes = Math.floor(remaining / minuteMs);
        const seconds = Math.floor((remaining % minuteMs) / 1000);
        return `${this.padZero(minutes)}:${this.padZero(seconds)}`;
    }

    static padZero(value: number): string {
        return value.toString().padStart(2, "0");
    }

    static numberTommss(seconds: number): string {
        if (seconds < 0) {
            seconds = 0;
        }

        const minutes = Math.round((seconds - 30) / 60);
        const secs = seconds % 60;
        return `${minutes < 10 ? "0" + minutes : minutes}:${secs < 10 ? "0" + secs : secs}`;
    }

    static getTodayKey(): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, "0");
        const day = today.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    static getYMD(timestamp: number = Date.now()): number {
        const date = new Date(timestamp);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }

    static formatTimestampToMonthDay(timestamp: number, useSlash: boolean = false): string {
        if (typeof timestamp !== "number" || isNaN(timestamp)) {
            return "";
        }

        const date = new Date(timestamp);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        if (useSlash) {
            return `${month}/${day}`;
        } else {
            return `${month}月${day}日`;
        }
    }

    calculateDayNumber(year: number, month: number, day: number): number {
        const baseDate = new Date(2026, 0, 1);
        const targetDate = new Date(year, month - 1, day);
        const diffMs = targetDate.getTime() - baseDate.getTime();
        return Math.floor(diffMs / 86400000) + 1;
    }

    static getCurrentTimeFormatted(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}