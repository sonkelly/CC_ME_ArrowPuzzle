import { view } from "cc";

export class DeviceUtils {
    static isTablet(): boolean {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes("ipad")) {
            return true;
        }
        
        if (userAgent.includes("android") && !userAgent.includes("mobile")) {
            return true;
        }
        
        const visibleWidth = view.getVisibleSize().width;
        const visibleHeight = view.getVisibleSize().height;
        
        return visibleHeight / visibleWidth < 1.6;
    }
}