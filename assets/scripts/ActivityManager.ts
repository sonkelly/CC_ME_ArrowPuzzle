import { _decorator } from 'cc';

interface ActivityData {
    type: string;
    [key: string]: any;
}

export class ActivityManager {
    private acticityData: ActivityData[] = [];
    private static _instance: ActivityManager | undefined;

    public static get instance(): ActivityManager {
        if (!this._instance) {
            this._instance = new ActivityManager();
        }
        return this._instance;
    }

    public setActivityData(data: ActivityData[]): void {
        this.acticityData = data;
    }

    public getActivityDataByType(type: string): ActivityData | undefined {
        return this.acticityData.find((item: ActivityData) => {
            return item.type === type;
        });
    }
}