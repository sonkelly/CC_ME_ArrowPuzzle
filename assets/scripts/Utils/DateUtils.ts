export class DateUtils {
    public static getNowFormatDate(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        
        const monthStr = month >= 1 && month <= 9 ? "0" + month : String(month);
        const dayStr = day >= 0 && day <= 9 ? "0" + day : String(day);
        
        return year + "-" + monthStr + "-" + dayStr;
    }

    public static formatTime(totalSeconds: number): string {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        
        return hours.toString().padStart(2, "0") + ":" + 
               minutes.toString().padStart(2, "0") + ":" + 
               seconds.toString().padStart(2, "0");
    }
}