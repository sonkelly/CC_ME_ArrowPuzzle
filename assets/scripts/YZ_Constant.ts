import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

export enum BeForGameOverAdId {
    None = "none",
    SharePanel = "share_panel",
    GoldBox = "gold_box",
    Turntable = "turntable",
    CreateShortCut = "create_short_cut",
    RecGame = "rec_game",
    LuckBox = "luck_box",
    SyncShow = "sync_show",
    CustomAd = "custom_ad"
}

export enum RewardType {
    Gold = "gold",
    Skin = "Skin"
}

@ccclass('YZ_Reward')
export class YZ_Reward {
    public rewardType: RewardType = RewardType.Gold;
    public rewardValue: number = 0;
}

export enum LevelStatus {
    GameStart = "start",
    GameWin = "complete",
    GameFail = "fail",
    GameSkip = "skip"
}

export enum SubLocation {
    isReward = "isReward",
    isQCross = "isQCross",
    isMoreGame = "isMoreGame",
    isStatement = "isStatement",
    isTryGame = "isTryGame",
    isYzBanner = "isYzBanner",
    isScrollbar = "isScrollbar",
    isGameExitDialog = "isGameExitDialog",
    isBoxInsertAd = "isBoxInsertAd",
    isBeforGameOverAd = "isBeforGameOverAd",
    isVerticalPanel = "isVerticalPanel"
}

export enum VibrateType {
    Short = "short",
    Long = "long"
}

export enum BannerLocation {
    None = 0,
    Home = 1,
    Level = 2,
    Skin = 3,
    Game = 4,
    Pause = 5,
    Over = 6
}

export enum ViewLocation {
    None = 0,
    sign = 1,
    trySkin = 2,
    box = 3,
    over = 4,
    failBox = 5,
    successBox = 6,
    winPanel = 7,
    turntable = 8
}

export enum AldStageType {
    Start = "StartGame",
    Running = "Running",
    GameWin = "GameWin",
    GameFail = "GameFail"
}

export enum AldEventType {
    TrailSkinClick = "皮肤试用点击",
    TrailSkinSuccess = "皮肤试用成功",
    TrailSkinFail = "皮肤试用失败",
    SkipLevelClick = "点击跳过关卡",
    SkipLevelSuccess = "跳过关卡成功",
    SkipLevelFail = "跳过关卡失败",
    GameOverDoubleGoldClick = "点击游戏结束双倍获取金币",
    GameOverDoubleGoldSuccess = "游戏结束双倍获取金币成功",
    GameOverDoubleGoldFail = "游戏结束双倍获取金币失败",
    SignDoubleGoldClick = "点击签到双倍领取",
    SignDoubleGoldSuccess = "签到双倍领取成功",
    SignDoubleGoldFail = "签到双倍领取失败",
    GameOverDoubleStarClick = "点击游戏结束晋级三星",
    GameOverDoubleStarSuccess = "游戏结束晋级三星成功",
    GameOverDoubleStarFail = "游戏结束晋级三星失败",
    GameVersion = "游戏版本",
    LoadSkinScene = "进入皮肤场景",
    PaySkin = "购买皮肤成功"
}

export enum AttributedType {
    Active = 0,
    GameAddiction = 25
}

export enum AttributedKey {
    Active = "active",
    GameAddiction = "game_addiction"
}

export enum NotifyType {
    Normal = "normal",
    SendPay = "send_pay",
    PaySuccess = "pay_success",
    PayFail = "pay_fail"
}

export enum PayType {
    RemoveAd = "remove_ad"
}

export enum AttributedValue {
    Active = "active",
    UserClickInsertAdAction = "user_click_insert_ad_action",
    PlayLevelCountAction = "play_level_count_action",
    PassLevelCountAction = "pass_level_count_action",
    InsertAdFirstShowAction = "insert_ad_first_show_action",
    GameTimeAction = "game_time_action"
}

export function BannerLocationToString(location: BannerLocation): string {
    const bannerNames: string[] = ["none", "home", "level", "skin", "game", "pause", "over"];
    return bannerNames[location];
}

export function BannerLocationToEnum(locationName: string): BannerLocation {
    const bannerNames: string[] = ["none", "home", "level", "skin", "game", "pause", "over"];
    for (let index = 0; index < bannerNames.length; index++) {
        if (bannerNames[index] === locationName) {
            return index as BannerLocation;
        }
    }
    return BannerLocation.None;
}

export class YZ_Constant {
    public static SERVER_VERSION: string = "v1";
    public static ST_UID: string = "UID";
    public static ST_SERVICE_UID: string = "SERVICE_UID";
    public static ST_SOURCE: string = "SOURCE";
    public static ST_RED_BAG_PROGRESS: string = "YZ_RED_BAG_PROGRESS";
    public static ST_RED_BAG_TOTAL_PROGRESS: string = "YZ_RED_BAG_TOTAL_PROGRESS";
    public static ST_RED_BAG_BALANCE: string = "YZ_RED_BAG_BALANCE";
    public static ST_RED_BAG_TOTAL_MONEY: string = "YZ_RED_BAG_TOTAL_MONEY";
    public static ST_FREE_RED_BAG_TIME: string = "YZ_ST_FREE_RED_BAG_TIME";
    public static ST_LAST_OPEN_LEVEL: string = "YZ_ST_LAST_OPEN_LEVEL";
    public static ST_GET_BOX_REWARD_COUNT: string = "YZ_GET_BOX_REWARD_COUNT";
    public static ST_REMOVE_AD: string = "ST_REMOVE_AD";
    public static YZ_EventCommon: string = "YZ_EventCommon";
    public static YZ_PrivacyClose: string = "YZ_PrivacyClose";
    public static EC_ServerInit: string = "ServerInit";
    public static YZ_PAY_MESSAGE: string = "YZ_PAY_MESSAGE";
    public static YZ_PAY_SUCCESS: string = "YZ_PAY_SUCCESS";
    public static YZ_PAY_FAIL: string = "YZ_PAY_FAIL";
    public static YZ_AD_MESSAGE: string = "YZ_AD_MESSAGE";
    public static YZ_PAY_ALL_QUERY_PRODUCT: string = "YZ_PAY_ALL_QUERY_PRODUCT";
    public static YZ_QUERY_SUCCESS: string = "YZ_QUERY_SUCCESS";
    public static YZ_QUERY_FAIL: string = "YZ_QUERY_FAIL";
    public static EC_RealNameAuthPanelClose: string = "RealNameAuthPanelClose";
    public static EC_ServerDataLoadSuccess: string = "ServerDataLoadSuccess";
    public static YZ_NativeAdClick: string = "YZ_NativeAdClick";
    public static EC_OnHide: string = "EventOnHide";
    public static EC_BannerHide: string = "EC_BannerHide";
    public static EC_BannerShow: string = "EC_BannerShow";
    public static EC_OnShow: string = "EventOnShow";
    public static YZ_GAME_YSXY: string = "YZ_GAME_YSXY";
    public static ST_IS_REPORT_USER_ACTIVE: string = "ST_IS_REPORT_USER_ACTIVE";
    public static ST_IS_REPORT_GAME_ADDICTION: string = "ST_IS_REPORT_GAME_ADDICTION";
    public static ST_LUANCH_TYPE: string = "ST_LUANCH_TYPE";
    public static ST_LUANCH_DATA: string = "ST_LUANCH_DATA";
    public static ST_LOGIN_SUCCESS: string = "ST_LOGIN_SUCCESS";
    public static ST_LOGIN_FAIL: string = "ST_LOGIN_FAIL";
    public static ST_DEVICE_ID: string = "ST_DEVICE_ID";
    public static ST_UUID: string = "ST_UUID";
    public static ST_YOUWAN_UID: string = "ST_YOUWAN_UID";
    public static ST_GET_DEVICE_ID: string = "ST_GET_DEVICE_ID";
}