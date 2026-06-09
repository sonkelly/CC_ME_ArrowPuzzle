import { DirectPlayUtil } from "./../DirectPlayUtil";
import { DnSdkManager } from "./../DnSdkManager";
import { EasDataSDK } from "./../EasDataSDK";
import { SaveManager } from "./../SaveManager";
import { GameLogicConfig } from "./../GameLogicConfig";
import { Api } from "./../Api";
import { Loading } from "./../Loading";
import { TimeUtils } from "./../Utils/TimeUtils";
import { EventManager } from "./../Event/EventManager";
import { ModuleEventKey } from "./../IGameRawData";
import { AssDataManager } from "./../AssDataManager";
import { BaseDataManager } from "./../BaseDataManager";
import { FB1vs1DataManager } from "./../FB1vs1DataManager";
import { ShopDataManager } from "./../Shop/ShopDataManager";
import { TournamentDataManager } from "./../Tournament/TournamentDataManager";
import { GameRecord } from "./../GameRecord";
import { ModuleEventHandler } from "./../ModuleEventHandler";

export class EventHandlerLogin extends ModuleEventHandler {
    public OnInit(): void {
        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.LoginSuccess,
            this.handler_LoginSuccess,
            this
        );
    }

    public handler_LoginSuccess = async (params: any[], isNewUser: boolean = false): Promise<void> => {
        const uuid = params[0];
        BaseDataManager.uuid = uuid;
        BaseDataManager.isNewUser = isNewUser;
        console.log("========== 登录成功 ", uuid);

        /*if (SDKInstance.isFacebookMiniGame()) {
            await AssDataManager.instance.ready();
        }*/

        ShopDataManager.instance.init();
        GameRecord.Create(uuid);

        /*if (SDKInstance.isFacebookMiniGame()) {
            EasDataSDK.init();
        }*/

        //TournamentDataManager.instance.createClient();
        //FB1vs1DataManager.instance.createClient();

        const localData = GameRecord.GetInstance().LoadGameData();
        let serverRawData: any = null;
        let serverData: any = null;

        if (false && (SDKInstance.isFacebookMiniGame() || SDKInstance.isWxPlatform() || SDKInstance.isDebug())) {
            try {
                serverRawData = await this.getPlayerRecordWithTimeout(uuid);
            } catch (error) {
                console.warn("获取服务器数据失败:", error);
            }
            if (serverRawData) {
                if (SDKInstance.isFacebookMiniGame()) {
                    serverData = serverRawData.GameData;
                } else {
                    serverRawData = serverRawData.data;
                    serverData = GameRecord.GetInstance().GetNetGameData(serverRawData);
                }
            }
        } else {
            serverRawData = null;
            serverData = null;
        }

        console.log("本地数据：", JSON.stringify(localData));
        console.log("服务器数据：", JSON.stringify(serverData));

        if (localData && serverData) {
            const localSaveTime = localData.SaveTimeMill;
            if (serverData.SaveTimeMill > localSaveTime) {
                console.log("serverVersion > localVersion , 使用更新的服务器数据");
                GameRecord.GetInstance().InitByNetRecord(serverRawData, true);
                GameRecord.GetInstance().SaveAllToCache();
            } else {
                GameRecord.GetInstance().LoadRecordLoad(localData);
                console.log("serverVersion < localVersion , 使用本地数据");
            }
            this.enterGameScene();
            this.checkSilentUser(serverData);
        } else if (serverData) {
            console.log("使用服务器数据");
            this.checkSilentUser(serverData);
            GameRecord.GetInstance().InitByNetRecord(serverRawData, true);
            GameRecord.GetInstance().SaveAllToCache();
            this.enterGameScene();
        } else if (localData) {
            console.log("使用本地数据:", localData);
            GameRecord.GetInstance().LoadRecordLoad(localData);
            this.checkSilentUser(localData);
            this.enterGameScene();
        } else {
            console.log("创建新用户数据======");
            this.createNewData();
            this.enterGameScene();
        }

        EventManager.emit(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.LoginSuccess1
        );
    };

    public enterGameScene(): void {
        if (DirectPlayUtil.isDirectPlay) {
            Loading.safeLoadScene("GameScene");
        } else {
            Loading.safeLoadScene("LoadingScene");
        }
    }

    public createNewData(): void {
        console.log("createNewData=============");
        GameRecord.GetInstance().ResetAll();
        GameRecord.GetInstance().SaveAllToCache();
        BaseDataManager.isNewUser = true;
        DirectPlayUtil.isNewUser = true;

        DnSdkManager.instance.sdk?.setOpenId(BaseDataManager.uuid);
        DnSdkManager.instance.sdk?.onRegister();

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        GameRecord.GetInstance().Data.LastLoginDate = todayStart;

        EasDataSDK.userSetOnce({
            register_time: TimeUtils.getCurrentTimeFormatted()
        });
    }

    public checkSilentUser(data: any): void {
        if (!data) return;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const lastLoginDate = data.LastLoginDate || 0;
        const daysSinceLastLogin = Math.floor((todayStart - lastLoginDate) / 86400000);

        if (SDKInstance.isWxPlatform()) {
            DnSdkManager.instance.sdk?.setOpenId(BaseDataManager.uuid);
            if (lastLoginDate !== 0 && daysSinceLastLogin >= 7) {
                DnSdkManager.instance.sdk?.track("RE_ACTIVE", {
                    backFlowDay: 7
                });
            }
            GameRecord.GetInstance().SaveLoginDate(todayStart);
        } else {
            EasDataSDK.userSet({
                login_interval_day: daysSinceLastLogin
            });
            EasDataSDK.userSet({
                last_login_time: TimeUtils.getCurrentTimeFormatted()
            });
        }
    }

    public checkLevelVersion(localData: any, serverData: any): void {
        let localVersion = 0;
        let serverVersion = 0;

        if (localData) {
            localVersion = localData.LevelVersion ?? 0;
        }
        if (serverData) {
            serverVersion = serverData.LevelVersion ?? 0;
        }

        const currentVersion = Math.max(localVersion, serverVersion);
        console.log("checkLevelVersion localVersion: ", localVersion);
        console.log("checkLevelVersion serverVersion: ", serverVersion);
        console.log("checkLevelVersion curLevelVersion: ", currentVersion);
        console.log("checkLevelVersion config version: ", GameLogicConfig.level_version);

        if (GameLogicConfig.level_version > currentVersion) {
            console.log("level update!!!");
            GameRecord.GetInstance().SaveLevelVersion(GameLogicConfig.level_version);
            SaveManager.clear2();
        } else {
            console.log("level not update!!!");
        }
    }

    public getPlayerRecordWithTimeout = async (uuid: string, timeout: number = 1000): Promise<any> => {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("请求超时")), timeout);
        });

        try {
            const dataPromise = SDKInstance.isFacebookMiniGame()
                ? this.getFBOrASSData()
                : Api.getPlayerRecordFromNet(uuid);
            return await Promise.race([dataPromise, timeoutPromise]);
        } catch (error) {
            console.error("获取玩家记录失败:", error);
            return null;
        }
    };

    public getFBOrASSData = async (): Promise<any> => {
        try {
            const archiveData = await AssDataManager.instance.downloadArchive();
            const archive = archiveData?.data?.archive;
            if (archive?.a1) {
                console.log("使用 ASS 云存档");
                return archive.a1;
            }
        } catch (error) {
            console.log("ASS 获取失败:", error);
        }

        console.log("ASS 无数据 → 使用 FB 云存档");
        try {
            const netKeys = GameRecord.GetInstance().recorderNetKeys;
            return await this.getNetData(netKeys);
        } catch (error) {
            console.warn("FB 获取失败:", error);
            return null;
        }
    };

    public getNetData(keys: string[], retryCount: number = 5): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await FBInstant.player.getDataAsync(keys);
                resolve(data);
            } catch (error) {
                if (retryCount > 1) {
                    this.getNetData(keys, retryCount - 1).then(resolve).catch(reject);
                } else {
                    reject(new Error("getDataAsync多次失败：" + JSON.stringify(error)));
                }
            }
        });
    }
}