
export class AssetUrlManager {
    private static _instance: AssetUrlManager | null = null;

    public moduleType: any = {
        core: {
            ani: {
                loading: "core/ani/loading"
            },
            config: {
                AchievementConfig: "core/config/AchievementConfig",
                ActivityConfig: "core/config/ActivityConfig",
                AvatarConfig: "core/config/AvatarConfig",
                BaseConfig: "core/config/BaseConfig",
                DailyRewards: "core/config/DailyRewards",
                DifficultyProfile: "core/config/DifficultyProfile",
                DifficultyProfileChalleng: "core/config/DifficultyProfileChalleng",
                DifficultyProfileTournament: "core/config/DifficultyProfileTournament",
                DifficultyProfileWx: "core/config/DifficultyProfileWx",
                i18n: "core/config/i18n",
                ItemData: "core/config/ItemData",
                LevelConfig: "core/config/LevelConfig",
                PayConfig: "core/config/PayConfig",
                PayConfigWx: "core/config/PayConfigWx",
                RescueProfile: "core/config/RescueProfile",
                RescueProfileFB: "core/config/RescueProfileFB",
                TableIndex: "core/config/TableIndex",
                TaskConfig: "core/config/TaskConfig",
                TaskDesConfig: "core/config/TaskDesConfig",
                TierConfig: "core/config/TierConfig",
                VideoConfig: "core/config/VideoConfig"
            },
            prefab: {
                LoadingView: "core/prefab/LoadingView",
                Toast: "core/prefab/Toast"
            },
            shader: {},
            sounds: {
                button_click: "core/sounds/pop/button_click"
            },
            texture: {
                diaoxuetishi: "core/texture/diaoxuetishi",
                singleColor: "core/texture/singleColor",
                wait_round: "core/texture/wait_round"
            }
        },
        editor: {
            res: {
                ColorItem: "editor/res/prefab/ColorItem",
                default_sprite_splash: "editor/res/textrue/default_sprite_splash",
                tongy_17: "editor/res/textrue/tongy_17"
            },
            scene: {
                LevelEditor: "editor/scene/LevelEditor",
                MapEdit: "editor/scene/MapEdit",
                MapEditCustom: "editor/scene/MapEditCustom",
                MapImage: "editor/scene/MapImage"
            },
            script: {
                ColorItem: "editor/script/ColorItem",
                Main: "editor/script/Main",
                MapData: "editor/script/MapData",
                MapEdit: "editor/script/MapEdit",
                MapEditCustom: "editor/script/MapEditCustom",
                MapImage: "editor/script/MapImage"
            }
        },
        game: {
            Anim: {
                clickAnim: "game/Anim/clickAnim",
                diaoxuetishi: "game/Anim/diaoxuetishi",
                finger: "game/Anim/finger",
                guideScale: "game/Anim/guideScale",
                locked: "game/Anim/locked",
                "logo-001": "game/Anim/logo-001",
                logo: "game/Anim/logo",
                rotation: "game/Anim/rotation",
                timer: "game/Anim/timer",
                updown: "game/Anim/updown",
                zoom: "game/Anim/zoom"
            },
            prefab: {
                ArrowBody: "game/prefab/arrow/ArrowBody",
                ArrowHead: "game/prefab/arrow/ArrowHead",
                ArrowItem_Arrow: "game/prefab/arrow/ArrowItem_Arrow",
                ArrowTailEnd: "game/prefab/arrow/ArrowTailEnd",
                GridItem_Arrow: "game/prefab/arrow/GridItem_Arrow",
                lineItem: "game/prefab/arrow/lineItem",
                Pixel: "game/prefab/arrow/Pixel",
                gold: "game/prefab/gold",
                heart: "game/prefab/heart",
                HitLb: "game/prefab/HitLb",
                DailyRewardsItem: "game/prefab/pop/activity/dailyRewards/DailyRewardsItem",
                DailyRewardsView: "game/prefab/pop/activity/dailyRewards/DailyRewardsView",
                DailyTaskListItem: "game/prefab/pop/activity/dailyTask/DailyTaskListItem",
                DailyTaskView: "game/prefab/pop/activity/dailyTask/DailyTaskView",
                CommonRewardView: "game/prefab/pop/common/CommonRewardView",
                ConfirmView: "game/prefab/pop/common/ConfirmView",
                GoldNode: "game/prefab/pop/common/GoldNode",
                HeartManager: "game/prefab/pop/common/HeartManager",
                ToggleSwitch: "game/prefab/pop/common/ToggleSwitch",
                AchievementItem: "game/prefab/pop/game/AchievementItem",
                AchievementItem_en: "game/prefab/pop/game/AchievementItem_en",
                AchievementTaskItem: "game/prefab/pop/game/AchievementTaskItem",
                AchievementTaskItem_en: "game/prefab/pop/game/AchievementTaskItem_en",
                AchievementView: "game/prefab/pop/game/AchievementView",
                AchiRewardItem: "game/prefab/pop/game/AchiRewardItem",
                DailyChallengeView: "game/prefab/pop/game/DailyChallengeView",
                DayItem: "game/prefab/pop/game/DayItem",
                diaoxuetishi: "game/prefab/pop/game/diaoxuetishi",
                FillHeartView: "game/prefab/pop/game/FillHeartView",
                GameLoseView: "game/prefab/pop/game/GameLoseView",
                GameLoseViewWX: "game/prefab/pop/game/GameLoseViewWX",
                GameMenuView: "game/prefab/pop/game/GameMenuView",
                GameWinView: "game/prefab/pop/game/GameWinView",
                GameWinViewWX: "game/prefab/pop/game/GameWinViewWX",
                HpItem: "game/prefab/pop/game/HpItem",
                InfiniteHeartView: "game/prefab/pop/game/InfiniteHeartView",
                LoseHeartView: "game/prefab/pop/game/LoseHeartView",
                LoseHeartViewWX: "game/prefab/pop/game/LoseHeartViewWX",
                ShopView: "game/prefab/pop/game/ShopView",
                TierInfoItem: "game/prefab/pop/game/TierInfoItem",
                TierInfoView: "game/prefab/pop/game/TierInfoView",
                WechatCollectReward: "game/prefab/pop/game/WechatCollectReward",
                FriendRankItem: "game/prefab/pop/main/FriendRankItem",
                LeaderboardMenu: "game/prefab/pop/main/LeaderboardMenu",
                MainMenu: "game/prefab/pop/main/MainMenu",
                MainNavView: "game/prefab/pop/main/MainNavView",
                RankItem: "game/prefab/pop/main/RankItem",
                ShopItemBig: "game/prefab/pop/main/ShopItemBig",
                ShopItemSmall: "game/prefab/pop/main/ShopItemSmall",
                ShopMenu: "game/prefab/pop/main/ShopMenu",
                TournamentFullRank: "game/prefab/pop/main/TournamentFullRank",
                TournamentItem: "game/prefab/pop/main/TournamentItem",
                TournamentMenu: "game/prefab/pop/main/TournamentMenu",
                TournamentRankItem: "game/prefab/pop/main/TournamentRankItem",
                ToutFullRankItem: "game/prefab/pop/main/ToutFullRankItem",
                AvatarItem: "game/prefab/pop/profile/AvatarItem",
                ChangeAvatarView: "game/prefab/pop/profile/ChangeAvatarView",
                ProfileView: "game/prefab/pop/profile/ProfileView",
                SettingView: "game/prefab/pop/setting/SettingView",
                RemoveAdsView: "game/prefab/pop/shop/RemoveAdsView"
            },
            sounds: {
                BGM_01: "game/sounds/bgm/BGM_01",
                achieve: "game/sounds/effect/pop/achieve",
                arrow1: "game/sounds/effect/pop/arrow1",
                arrow2: "game/sounds/effect/pop/arrow2",
                arrow3: "game/sounds/effect/pop/arrow3",
                arrow4: "game/sounds/effect/pop/arrow4",
                arrow5: "game/sounds/effect/pop/arrow5",
                arrow6: "game/sounds/effect/pop/arrow6",
                arrow7: "game/sounds/effect/pop/arrow7",
                arrow8: "game/sounds/effect/pop/arrow8",
                arrowfb: "game/sounds/effect/pop/arrowfb",
                error: "game/sounds/effect/pop/error",
                fail: "game/sounds/effect/pop/fail",
                fali: "game/sounds/effect/pop/fali",
                reveiceItem: "game/sounds/effect/pop/reveiceItem",
                timer: "game/sounds/effect/pop/timer",
                win: "game/sounds/effect/pop/win",
                win1: "game/sounds/effect/pop/win1"
            },
            texture: {
                "PINK BODY TEXTURE": "game/texture/snake/pink/PINK BODY TEXTURE",
                "PINK HEAD TEXTURE": "game/texture/snake/pink/PINK HEAD TEXTURE",
                "PINK TAIL END TEXTURE": "game/texture/snake/pink/PINK TAIL END TEXTURE",
                "PINK TAIL TEXTURE": "game/texture/snake/pink/PINK TAIL TEXTURE"
            }
        },
        level: {},
        level_challenge: {},
        level_rescue: {},
        level_rescue_fb: {},
        level_tournament: {},
        level_wx: {},
        tour_thumbnail: {}
    };

    static moduleArr: string[] = ["core", "home", "game", "sub1"];
    static core: Map<string, any> = new Map();
    static home: Map<string, any> = new Map();
    static game: Map<string, any> = new Map();
    static sub1: Map<string, any> = new Map();

    static get instance(): AssetUrlManager {
        if (!AssetUrlManager._instance) {
            AssetUrlManager._instance = new AssetUrlManager();
        }
        return AssetUrlManager._instance;
    }
}