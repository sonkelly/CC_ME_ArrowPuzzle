import { _decorator } from 'cc';
import { LevelStatus } from './../YZ_Constant';

const { ccclass, property } = _decorator;

export enum YwAdType {
    BANNER = 1,
    INTERSTITIAL = 2,
    REWARD_VIDEO = 3,
    SPLASH = 4,
    NATIVE_BANNER = 5,
    NATIVE_INTERSTITIAL = 6,
    NATIVE_ICON = 7,
    INTERSTITIAL_VIDEO = 8,
    NATIVE = 9,
    NATIVE_TEMPLATE = 10,
    NATIVE_SPLASH = 11,
    NATIVE_TEMPLATE_SPLASH = 12,
    NATIVE_TEMPLATE_INTERSTITIAL = 13,
    NATIVE_TEMPLATE_BANNER = 14
}

export enum YwAdStatus {
    REQUEST = 0,
    REQUEST_SUCCESS = 1,
    REQUEST_FAIL = 2,
    SHOW_SUCCESS = 3,
    SHOW_FAIL = 4,
    CLICK = 5,
    REWARD_SUCCESS = 6,
    REWARD_FAIL = 7,
    AD_ID_REQUEST = 10,
    AD_ID_REQUEST_SUCCESS = 11,
    AD_ID_REQUEST_FAIL = 12
}

export class AdEventParameter {
    public adId: string;
    public code: number | undefined;
    public msg: string | undefined;
    public tag: string | undefined;

    constructor(adId: string, code?: number, msg?: string, tag?: string) {
        this.adId = adId;
        this.code = code;
        this.msg = msg;
        this.tag = tag;
    }

    public toJsonData(): Record<string, any> {
        const data: Record<string, any> = {};
        data.adId = this.adId;
        if (this.code) {
            data.code = this.code;
        }
        if (this.msg) {
            data.msg = this.msg;
        }
        if (this.tag) {
            data.tag = this.tag;
        }
        return data;
    }
}

export class EventAdInfo {
    public adType: YwAdType;
    public adStatus: YwAdStatus;
    public adEventParameter: AdEventParameter | null;
    public time: number;

    constructor(adType: YwAdType, adStatus: YwAdStatus, adEventParameter: AdEventParameter | null) {
        this.time = new Date().getTime();
        this.adType = adType;
        this.adStatus = adStatus;
        this.adEventParameter = adEventParameter;
    }

    public toJsonData(): Record<string, any> {
        try {
            const data: Record<string, any> = {};
            data.ad_type = this.adType;
            data.ad_status = this.adStatus;
            if (this.adEventParameter != null) {
                if (this.adEventParameter.adId) {
                    data.ad_id = this.adEventParameter.adId;
                }
                data.ad_info = this.adEventParameter.toJsonData();
            }
            data.time = this.time;
            return data;
        } catch (error) {
            console.error("EventAdInfo toJsonData erro msg =" + error);
        }
        return {};
    }
}

@ccclass('EventLevelInfo')
export class EventLevelInfo {
    public levelID: string;
    public levelStatus: LevelStatus;
    public model: string | undefined;
    public time: number;

    constructor(levelID: string, levelStatus: LevelStatus, model?: string) {
        this.time = new Date().getTime();
        this.levelID = levelID;
        this.levelStatus = levelStatus;
        this.model = model;
    }

    public toJsonData(): Record<string, any> {
        try {
            const data: Record<string, any> = {};
            data.level_id = this.levelID;
            if (this.model) {
                data.module = this.model;
            }
            switch (this.levelStatus) {
                case LevelStatus.GameStart:
                    data.status = 1;
                    break;
                case LevelStatus.GameWin:
                    data.status = 2;
                    break;
                case LevelStatus.GameFail:
                    data.status = 3;
                    break;
                case LevelStatus.GameSkip:
                    data.status = 4;
                    break;
            }
            data.time = this.time;
            return data;
        } catch (error) {
            console.error("EventLevelInfo toJsonData erro msg =" + error);
        }
        return {};
    }
}