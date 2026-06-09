export enum ExcelVideoType {
    REVIVE = 1,
    TIPS = 2,
    CHALLENGE = 3,
    FILL_HEART = 4,
    FREE_GOLD = 5,
    SHOP_FREE = 6
}

export enum ItemType {
    CURRENCY = 1,
    PROP = 2,
    NOADS = 3,
    HEART = 4
}

export enum ItemID {
    GOLD = 10001,
    HEART = 10002,
    InfiniteHeart = 10003,
    Hint = 20001,
    FillHp = 20002,
    Line = 20003,
    NoAds = 30001
}

export enum PayConfigID {
    NoAds = 10004
}

export enum SettingToggleEnum {
    BGM = 0,
    Effect = 1,
    Shake = 2
}

export enum MainNavTabType {
    Shop = 0,
    Tournament = 1,
    Main = 2,
    Rank = 3,
    NONE = 4
}

export enum SceneNameEnum {
    LogInScene = "LogInScene",
    Loading = "Loading",
    MainScene = "MainScene",
    GameScene = "GameScene",
    LevelEditor = "LevelEditor"
}

export enum BodyType {
    Body = 0,
    Head = 1,
    Tail = 2,
    TailEnd = 3
}

export enum FailType {
    Hp = 0,
    Time = 1
}

export enum LevelType {
    SUPER_EASY = 1,
    EASY = 2,
    NORMAL = 3,
    HARD = 4,
    SUPER_HARD = 5
}

export enum DayState {
    Future = 0,
    Done = 1,
    Today = 2,
    Missed = 3
}

export enum GameType {
    MainLevel = 0,
    Challenge = 1,
    Tournament = 2,
    Pvp = 3
}

export enum ShopState {
    ENABLE = 0,
    DISABLE = 1
}

export enum PayType {
    Video = 1,
    Coin = 2,
    Currency = 3
}

export enum RankType {
    WORLD = 0,
    COUNTRY = 1,
    WEEKLY = 2
}

export enum ActivityType {
    STREAK_COLLECT = 1,
    WIN_STREAK = 2,
    STREAK_CONTEST = 3,
    WEEKLY_RANK = 4,
    DAILY_RANK = 5
}

export enum AchievementType {
    HP_COST = 1,
    HEART_COST = 2,
    LEVEL_COMPLETE = 3,
    RESCUE_COMPLETE = 4,
    LOGIN_DAY = 5,
    WIN_STREAK = 6
}