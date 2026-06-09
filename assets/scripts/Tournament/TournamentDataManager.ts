import { ArrowGameConfig } from "./../ArrowGameConfig";
import { I18nManager } from "./../I18nManager";
import { GameLogicConfig } from "./../GameLogicConfig";
import { ShareImage } from "./../ShareData";
import { Utilsqdd } from "./../Utils/Utilsqdd";
import { EventManager } from "./../Event/EventManager";
import { UIManager } from "./../UIManager";
import { ModuleEventKey } from "./../IGameRawData";
import { GameRecord } from "./../GameRecord";
import { BaseDataManager } from "./../BaseDataManager";

export class TournamentDataManager {
    private static _instance: TournamentDataManager;
    private _client: any;
    public curTournamentID: string = "";
    public curLevel: number = 1;
    public leaderboardCache: Map<string, any[]> = new Map();
    public tournamentListCache: any[] = [];
    public tournamentAllInfo: any[] = [];
    public extraTime: number = 259200;
    public KEEP_TIME: number = 86400;
    public MAX_MY_TOURNAMENT_COUNT: number = 30;
    public CONTENT_PAGE_SIZE: number = 40;
    public CONTENT_MAX_PAGE: number = 3;
    public isNewTournament: boolean = false;
    public rewardQueue: any[] = [];

    public static get instance(): TournamentDataManager {
        if (!TournamentDataManager._instance) {
            TournamentDataManager._instance = new TournamentDataManager();
        }
        return TournamentDataManager._instance;
    }

    public fineBoostReady(): boolean {
        if (typeof window === "undefined" || !window.FINEBOOST) {
            console.warn("[FriendsRanking] FINEBOOST not ready");
            return false;
        }
        return true;
    }

    public async createClient(): Promise<void> {
        if (this.fineBoostReady()) {
            const config = {
                appKey: "com.arrows.FB",
                userId: BaseDataManager.uuid,
                timeout: 60000,
                debug: false
            };
            const FriendsRanking = window.FINEBOOST.facebook.FriendsRanking;
            this._client = new FriendsRanking(config);

            if (SDKInstance.isFacebookMiniGame()) {
                const contextID = FBInstant.context.getID();
                const contextType = FBInstant.context.getType();
                console.log("[Context]", contextType, contextID);
            }
        }
    }

    public getClient(): any {
        return this._client;
    }

    public async loadTournamentData(forceRefresh: boolean = false): Promise<void> {
        /*if (SDKInstance.isFacebookMiniGame()) {
            if (forceRefresh) {
                console.log("[Tournament] loadTournamentData start");
                const localList = this.getMyTournamentListFromLocal();
                this.tournamentListCache = localList;
                const ids = localList.map((item: any) => item.id);
                await this.batchGetLeaderboards(ids);
                console.log("[Tournament] loadTournamentData done", localList.length);
            } else {
                console.log("[Tournament] loadTournamentData use cache");
            }
        }*/
    }

    public getMyTournamentListFromLocal(): any[] {
        const myTournamentData = GameRecord.GetInstance().BaseRecorder.Data.MyTournamentData;
        if (!myTournamentData || myTournamentData.length === 0) {
            console.log("[Tournament] getMyTournamentListFromLocal empty");
            return [];
        }

        const sortedList = [...myTournamentData].sort((a: any, b: any) => {
            const aOfficial = a.Official ? 1 : 0;
            const bOfficial = b.Official ? 1 : 0;
            if (aOfficial !== bOfficial) {
                return bOfficial - aOfficial;
            }
            const aTime = a.CreateTime ?? a.EndTime ?? 0;
            const bTime = b.CreateTime ?? b.EndTime ?? 0;
            return bTime - aTime;
        }).slice(0, this.MAX_MY_TOURNAMENT_COUNT).map((item: any) => {
            const level = +item.Level;
            return {
                id: item.ID,
                title: "Arrows Escape Lv" + level,
                endTime: item.EndTime,
                createTime: item.CreateTime,
                contextID: item.ContextID ?? "",
                payload: {
                    official: !!item.Official,
                    level: level,
                    rewards: item.Rewards
                }
            };
        });

        console.log("[Tournament] getMyTournamentListFromLocal done", sortedList.length);
        return sortedList;
    }

    public async getTournamentList(): Promise<any[]> {
        /*if (SDKInstance.isFacebookMiniGame()) {
            console.log("[Tournament] getTournamentList start");
            try {
                const tournaments = await FBInstant.tournament.getTournamentsAsync();
                console.log("[Tournament] getTournamentList success, count=" + tournaments.length);
                console.log("[Tournament] getTournamentList success, list:", tournaments);
                return tournaments.map((tournament: any) => ({
                    id: tournament.getID(),
                    title: tournament.getTitle(),
                    endTime: tournament.getEndTime(),
                    contextID: tournament.getContextID(),
                    payload: JSON.parse(tournament.getPayload() || "{}")
                }));
            } catch (error) {
                console.error("[Tournament] getTournamentList failed", error);
                return [];
            }
        }*/
        return [];
    }

    public async createTournament(level: number, score: number = ArrowGameConfig.arrowScore): Promise<void> {
        /*if (SDKInstance.isFacebookMiniGame()) {
            const endTime = Math.floor(Date.now() / 1000) + 604800;
            const title = "Arrows Escape Lv" + level;
            console.log("[Tournament] createTournament", { level, title, endTime });

            try {
                const tournament = await FBInstant.tournament.createAsync({
                    initialScore: score,
                    data: {
                        official: false,
                        level: level
                    },
                    config: {
                        title: title,
                        image: ShareImage,
                        sortOrder: "HIGHER_IS_BETTER",
                        scoreFormat: "NUMERIC",
                        endTime: endTime
                    }
                });

                this.curTournamentID = tournament.getID();
                const key = "tournament_" + this.curTournamentID;
                const contentData = {
                    tournament: this.curTournamentID,
                    official: false,
                    level: level,
                    endTime: endTime + this.extraTime,
                    content: tournament.getContextID()
                };
                const content = { [key]: JSON.stringify(contentData) };

                await this._client.updateContent(content);
                await this._client.updatePlayerContent({
                    key: key,
                    sortType: 0,
                    player: {
                        uid: BaseDataManager.uuid,
                        name: BaseDataManager.nickName,
                        avatar: BaseDataManager.userAvatar,
                        score: score
                    }
                });

                GameRecord.GetInstance().BaseRecorder.JoinTournament({
                    ID: this.curTournamentID,
                    BestScore: score,
                    CreateTime: Math.floor(Date.now() / 1000),
                    EndTime: endTime,
                    ContextID: tournament.getContextID(),
                    Official: false,
                    Level: level
                });

                console.log("[Tournament] createTournament success");
            } catch (error) {
                console.error("[Tournament] createTournament failed", error);
            }
        }*/
    }

    public async joinTournament(tournamentData: any, isOfficial: boolean = false): Promise<void> {
        /*if (SDKInstance.isFacebookMiniGame()) {
            console.log("[Tournament] joinTournament", tournamentData.id, tournamentData.contextID, tournamentData.payload);
            this.curTournamentID = tournamentData.id;

            const currentContextID = FBInstant.context.getID();
            console.log("[Tournament] joinTournament curcontextID:", currentContextID);

            let level = 100;
            level = tournamentData.payload?.level ? +tournamentData.payload.level : Utilsqdd.randomTwoNum(6, 1000);
            this.curLevel = level;

            let isOfficialTournament = false;
            let rewards: any[] = [];

            if (tournamentData.payload) {
                isOfficialTournament = tournamentData.payload.official || tournamentData.payload.official === "false";
                if (isOfficialTournament && isOfficial && Array.isArray(tournamentData.payload.rewards)) {
                    rewards = tournamentData.payload.rewards.map((reward: any) => ({
                        CfgId: reward.itemId,
                        Num: reward.count
                    }));
                    console.log("[Tournament] joinTournament rewards:", rewards);
                }
            }

            GameRecord.GetInstance().BaseRecorder.Data.MyTournamentData.find((item: any) => item.ID === tournamentData.id);

            if (currentContextID === tournamentData.contextID) {
                console.log("[Tournament] joinTournament same context");
                this.updateLocalMyTournamentData(tournamentData, level, isOfficialTournament, rewards);
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, false);
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.PlayTournament, level);
                return;
            }

            if (tournamentData.contextID !== "") {
                FBInstant.context.switchAsync(tournamentData.contextID, false).then(() => {
                    console.log("[Tournament] 加入锦标赛成功");
                    this.updateLocalMyTournamentData(tournamentData, level, isOfficialTournament, rewards);
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, false);
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.PlayTournament, level);
                }).catch((error: any) => {
                    console.log("[Tournament] 加入锦标赛失败:", error);
                    if (error?.code === "CLIENT_UNSUPPORTED_OPERATION") {
                        console.log("[Tournament] 不能加入本场比赛");
                        this.updateLocalMyTournamentData(tournamentData, level, isOfficialTournament, rewards);
                        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, false);
                        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.PlayTournament, level);
                    }
                });
            } else {
                try {
                    await FBInstant.tournament.joinAsync(this.curTournamentID);
                    console.log("[Tournament] joinTournament success");
                    this.updateLocalMyTournamentData(tournamentData, level, isOfficialTournament, rewards);
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, false);
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.PlayTournament, level);
                } catch (error) {
                    console.error("[Tournament] joinTournament failed", error);
                }
            }
        }*/
    }

    public updateLocalMyTournamentData(tournamentData: any, level: number, isOfficial: boolean, rewards: any[]): void {
        const createTime = tournamentData.createTime === null ? Math.floor(Date.now() / 1000) : tournamentData.createTime;
        GameRecord.GetInstance().BaseRecorder.JoinTournament({
            ID: tournamentData.id,
            BestScore: 0,
            CreateTime: createTime,
            EndTime: tournamentData.endTime,
            ContextID: tournamentData.contextID,
            Level: level,
            Official: isOfficial,
            Rewards: rewards
        });
    }

    public async getCurrentTournament(): Promise<boolean> {
        /*if (!SDKInstance.isFacebookMiniGame()) {
            return false;
        }

        console.log("[Tournament] getCurrentTournament");
        try {
            const currentTournament = await FBInstant.getTournamentAsync();
            console.log("[Tournament] currentTournament", currentTournament);

            if (currentTournament) {
                const tournamentData = {
                    id: currentTournament.getID(),
                    title: currentTournament.getTitle(),
                    endTime: currentTournament.getEndTime(),
                    createTime: null,
                    contextID: currentTournament.getContextID(),
                    payload: JSON.parse(currentTournament.getPayload() || "{}")
                };

                if (Math.floor(Date.now() / 1000) > tournamentData.endTime) {
                    console.log("[Tournament] current Tournament Expired");
                    return false;
                }

                const existingTournament = GameRecord.GetInstance().BaseRecorder.Data.MyTournamentData.find((item: any) => item.ID === tournamentData.id);
                if (!existingTournament) {
                    this.isNewTournament = true;
                }

                await this.joinTournament(tournamentData, true);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }*/

        return false;
    }

    public backToSoloContext(): void {
        /*if (SDKInstance.isFacebookMiniGame()) {
            const contextID = FBInstant.context.getID();
            console.log("[Tournament] switchAsync SOLO start1:", contextID);
            if (contextID != null && contextID !== "null" && contextID !== "SOLO") {
                console.log("[Tournament] switchAsync SOLO start");
                FBInstant.context.switchAsync("SOLO", true).then(() => {
                    console.log("[Tournament] switchAsync SOLO succ");
                }).catch((error: any) => {
                    console.log("[Tournament] switchAsync SOLO error", error);
                });
            }
        }*/
    }

    public share(level: number, score: number): void {
        /*if (SDKInstance.isFacebookMiniGame()) {
            FBInstant.tournament.shareAsync({
                score: score,
                data: {
                    Level: level,
                    Tournament: this.curTournamentID
                }
            }).then(() => {
                console.log("[Tournament] share succ");
                this.backToSoloContext();
            }).catch((error: any) => {
                this.backToSoloContext();
                console.log("[Tournament] share fail:", error);
            });
        }*/
    }

    public getLeaderboardKey(tournamentID: string): string {
        return "tournament_" + tournamentID;
    }

    public async batchGetLeaderboards(tournamentIDs: string[]): Promise<void> {
        if (!this._client) {
            console.warn("[Leaderboard] client not ready");
            return;
        }

        /*const keys = tournamentIDs.map((id: string) => this.getLeaderboardKey(id));
        const recorder = GameRecord.GetInstance().BaseRecorder;

        if (keys.length === 0) {
            return;
        }

        console.log("[Leaderboard] batchGetLeaderboards", keys);

        try {
            const response = await this._client.getContent(keys, {
                pageNumber: 1,
                pageSize: 100
            });

            let dataChanged = false;
            const values = response.data?.values ?? {};
            const createTimestamps = response.data?.createTimestamp ?? {};

            keys.forEach((key: string) => {
                const tournamentID = key.replace("tournament_", "");

                if (values[key]) {
                    const tournamentData = recorder.Data.MyTournamentData.find((item: any) => item.ID === tournamentID);
                    const playerList = response.data?.player?.[key]?.list ?? [];
                    const topRankList = this.getTopRankList(playerList, 3);
                    this.leaderboardCache.set(key, topRankList);

                    const payload = JSON.parse(values[key]);
                    const rewards = payload.rewards ?? [];

                    if (tournamentData) {
                        if (tournamentData.Official && rewards.length > 0) {
                            tournamentData.Rewards = rewards;
                        }

                        const content = payload.content ?? "";
                        if (content !== "") {
                            tournamentData.ContextID = content;
                        }

                        const createTimestamp = createTimestamps[key] ?? Math.floor(Date.now() / 1000);
                        if (createTimestamp) {
                            tournamentData.CreateTime = createTimestamp;
                        }
                    }
                } else {
                    const originalLength = recorder.Data.MyTournamentData.length;
                    recorder.Data.MyTournamentData = recorder.Data.MyTournamentData.filter((item: any) => item.ID !== tournamentID);
                    if (recorder.Data.MyTournamentData.length !== originalLength) {
                        dataChanged = true;
                    }
                    this.tournamentListCache = this.tournamentListCache.filter((item: any) => item.id !== tournamentID);
                }
            });

            if (dataChanged) {
                recorder.Save();
            }

            console.log("[Leaderboard] batchGetLeaderboards success");
        } catch (error) {
            console.error("[Leaderboard] batchGetLeaderboards failed", error);
        }*/
    }

    public async getLeaderboard(tournamentID: string): Promise<any[]> {
        /*const key = this.getLeaderboardKey(tournamentID);

        if (this.leaderboardCache.has(key)) {
            return this.leaderboardCache.get(key);
        }

        console.warn("[Leaderboard] cache miss, fallback single fetch", key);

        try {
            const response = await this._client.getContent([key], {
                pageNumber: 1,
                pageSize: 100
            });
            const playerList = response.data?.player?.[key]?.list ?? [];
            const topRankList = this.getTopRankList(playerList, 3);
            this.leaderboardCache.set(key, topRankList);
            return playerList;
        } catch (error) {
            console.error("[Leaderboard] getLeaderboard failed", error);
            return [];
        }*/
    }

    public async submitScore(score: number): Promise<void> {
        /*console.log("[Leaderboard] submitScore start", {
            tournamentID: this.curTournamentID,
            uid: BaseDataManager.uuid,
            score: score,
            isNew: this.isNewTournament
        });

        const recorder = GameRecord.GetInstance().BaseRecorder;

        if (!recorder.Data.MyTournamentData || recorder.Data.MyTournamentData.length === 0) {
            console.log("[Leaderboard] submitScore, no joined tournaments");
            return;
        }

        const tournamentData = recorder.Data.MyTournamentData.find((item: any) => item.ID === this.curTournamentID);

        if (!tournamentData) {
            console.warn("[Leaderboard] submitScore skipped, not joined tournament", this.curTournamentID);
            return;
        }

        if (score <= 0) {
            score = tournamentData.BestScore;
        }
        if (score < tournamentData.BestScore) {
            score = Math.max(score, tournamentData.BestScore);
        }

        if (this.isNewTournament) {
            const key = "tournament_" + this.curTournamentID;
            const contentData = {
                tournament: this.curTournamentID,
                official: tournamentData.Official,
                level: tournamentData.Level,
                endTime: tournamentData.EndTime + this.extraTime,
                rewards: tournamentData.Rewards,
                content: tournamentData.ContextID
            };
            const content = { [key]: JSON.stringify(contentData) };

            await this._client.updateContent(content);
            await this._client.updatePlayerContent({
                key: key,
                sortType: 0,
                player: {
                    uid: BaseDataManager.uuid,
                    name: BaseDataManager.nickName,
                    avatar: BaseDataManager.userAvatar,
                    score: score
                }
            });

            FBInstant.tournament.postScoreAsync(score).then(() => {
                recorder.UpdateTournamentBestScore(this.curTournamentID, score);
                console.log("[Tournament] postScore succ");
            }).catch((error: any) => {
                console.log("[Tournament] postScore fail:", error);
            });
        } else {
            const key = this.getLeaderboardKey(this.curTournamentID);

            try {
                await this._client.updatePlayerContent({
                    key: key,
                    sortType: 0,
                    player: {
                        uid: BaseDataManager.uuid,
                        name: BaseDataManager.nickName,
                        avatar: BaseDataManager.userAvatar,
                        score: score
                    }
                });
                console.log("[Leaderboard] submitScore1 success");

                FBInstant.tournament.postScoreAsync(score).then(() => {
                    recorder.UpdateTournamentBestScore(this.curTournamentID, score);
                    console.log("[Tournament] postScore succ");
                }).catch((error: any) => {
                    console.log("[Tournament] postScore fail:", error);
                });
            } catch (error: any) {
                console.error("[Leaderboard] submitScore failed", error);

                if (error.code === 801) {
                    const key = "tournament_" + this.curTournamentID;
                    const contentData = {
                        tournament: this.curTournamentID,
                        official: tournamentData.Official,
                        level: tournamentData.Level,
                        endTime: tournamentData.EndTime + this.extraTime,
                        rewards: tournamentData.Rewards,
                        content: tournamentData.ContextID
                    };
                    const content = { [key]: JSON.stringify(contentData) };

                    await this._client.updateContent(content);
                    await this._client.updatePlayerContent({
                        key: key,
                        sortType: 0,
                        player: {
                            uid: BaseDataManager.uuid,
                            name: BaseDataManager.nickName,
                            avatar: BaseDataManager.userAvatar,
                            score: score
                        }
                    });

                    FBInstant.tournament.postScoreAsync(score).then(() => {
                        recorder.UpdateTournamentBestScore(this.curTournamentID, score);
                        console.log("[Tournament] postScore succ");
                    }).catch((error: any) => {
                        console.log("[Tournament] postScore fail:", error);
                    });
                }
            }
        }
            */
    }

    public async getContentByPages(maxPages: number, pageSize: number): Promise<any[]> {
        if (!this._client) {
            return [];
        }

        const results: any[] = [];
        for (let page = 1; page <= maxPages; page++) {
            console.log("[Tournament] getContent page=" + page);
            try {
                const response = await this._client.getContent(null, {
                    pageNumber: page,
                    pageSize: pageSize
                });
                const values = response.data?.values;
                if (!values || Object.keys(values).length === 0) {
                    console.log("[Tournament] empty page, stop fetch");
                    break;
                }
                results.push(response);
            } catch (error) {
                console.error("[Tournament] getContent failed, page=" + page, error);
                break;
            }
        }
        return results;
    }

    public async loadAllTournamentFromContent(): Promise<void> {
        if (!this._client) {
            return;
        }

        const currentTime = Math.floor(Date.now() / 1000);

        try {
            const pages = await this.getContentByPages(this.CONTENT_MAX_PAGE, this.CONTENT_PAGE_SIZE);
            const allTournaments: any[] = [];

            for (const page of pages) {
                const values = page.data?.values ?? {};
                const players = page.data?.player ?? {};
                const createTimestamps = page.data?.createTimestamp ?? {};

                for (const key of Object.keys(values)) {
                    if (!key.startsWith("tournament_")) {
                        continue;
                    }

                    const tournamentID = key.replace("tournament_", "");
                    let payload: any = {};
                    try {
                        payload = JSON.parse(values[key]);
                    } catch (error) {
                        console.warn("[Tournament] payload parse failed", key);
                    }

                    const createTimestamp = createTimestamps[key] ?? Math.floor(Date.now() / 1000);

                    if (payload?.level) {
                        const level = payload.level;
                        const endTime = payload.endTime ? payload.endTime - this.extraTime : 
                                       payload.endtime ? payload.endtime - this.extraTime : 
                                       createTimestamp + 604800;
                        const isOfficial = payload.official ?? false;
                        const rewards = payload.rewards ?? [];
                        const content = payload.content ?? "";

                        if (currentTime - endTime > this.KEEP_TIME) {
                            continue;
                        }

                        const playerList = players[key]?.list ?? [];
                        const topRankList = this.getTopRankList(playerList, 3);
                        this.leaderboardCache.set(key, topRankList);

                        allTournaments.push({
                            id: tournamentID,
                            title: "Arrows Escape Lv" + level,
                            createTime: createTimestamp,
                            endTime: endTime,
                            contextID: content,
                            payload: {
                                official: isOfficial,
                                level: level,
                                rewards: rewards
                            }
                        });
                    }
                }
            }

            const tournamentMap = new Map<string, any>();
            for (const tournament of allTournaments) {
                tournamentMap.set(tournament.id, tournament);
            }

            this.tournamentAllInfo = this.sortTournaments(Array.from(tournamentMap.values()));
            console.log("[Tournament] loadAllTournamentFromContent done", this.tournamentAllInfo.length);
        } catch (error) {
            console.error("[Tournament] loadAllTournamentFromContent failed", error);
        }
    }

    public async getTournamentListWithRank(): Promise<any[]> {
        console.log("[Tournament] getTournamentListWithRank");
        await this.loadAllTournamentFromContent();

        const result = this.tournamentAllInfo.map((tournament: any) => ({
            ...tournament,
            rankList: this.leaderboardCache.get(this.getLeaderboardKey(tournament.id)) ?? []
        }));

        console.log("[Tournament] getTournamentListWithRank done", result.length);
        return result.slice(0, this.MAX_MY_TOURNAMENT_COUNT);
    }

    public getMyTournamentList(): any[] {
        console.log("[Tournament] getMyTournamentList");
        const result = this.tournamentListCache.map((tournament: any) => ({
            ...tournament,
            rankList: this.leaderboardCache.get(this.getLeaderboardKey(tournament.id)) ?? []
        }));
        console.log("[Tournament] getMyTournamentList done", result.length);
        return result;
    }

    public sortTournaments(tournaments: any[]): any[] {
        const currentTime = Date.now() / 1000;
        return tournaments.sort((a: any, b: any) => {
            const aOfficial = a.payload?.official === true || a.payload?.official === "true";
            const bOfficial = b.payload?.official === true || b.payload?.official === "true";

            if (aOfficial !== bOfficial) {
                return aOfficial ? -1 : 1;
            }

            const aExpired = a.endTime < currentTime;
            const bExpired = b.endTime < currentTime;

            if (aExpired !== bExpired) {
                return aExpired ? 1 : -1;
            }

            const aTime = a.createTime ?? a.endTime ?? 0;
            const bTime = b.createTime ?? b.endTime ?? 0;
            return bTime - aTime;
        });
    }

    public CheckTournamentSettlement(): void {
        const currentTime = Math.floor(Date.now() / 1000);
        const recorder = GameRecord.GetInstance().BaseRecorder;
        let dataChanged = false;
        this.rewardQueue = [];

        for (const tournament of recorder.Data.MyTournamentData) {
            if (tournament.EndTime > currentTime) {
                continue;
            }

            if (tournament.Official && tournament.Rewards && tournament.Rewards.length !== 0) {
                if (!tournament.RewardClaimed) {
                    if (tournament.Settled) {
                        if (tournament.Rank === null) {
                            const rank = this.getMyRankInTournament(tournament.ID);
                            tournament.Rank = rank;
                            dataChanged = true;
                        }
                    } else {
                        const rank = this.getMyRankInTournament(tournament.ID);
                        tournament.Rank = rank;
                        tournament.Settled = true;
                        dataChanged = true;
                    }

                    const reward = this.getRewardByRank(tournament);
                    if (reward) {
                        this.rewardQueue.push({
                            item: tournament,
                            reward: reward
                        });
                    }
                }
            } else {
                tournament.Settled = true;
                tournament.RewardClaimed = true;
                dataChanged = true;
            }
        }

        if (this.rewardQueue.length > 0) {
            this.tryShowNextReward();
        } else if (dataChanged) {
            recorder.Save();
        }
    }

    public tryShowNextReward(): void {
        const rewardData = this.rewardQueue.shift();

        if (!rewardData) {
            GameRecord.GetInstance().BaseRecorder.CleanMyTournamentData();
            EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet, [false]);
            return;
        }

        let count = 0;
        count = rewardData.reward.Number ?? rewardData.reward.Num;

        const reward = {
            CfgId: rewardData.reward.CfgId,
            Num: count
        };

        console.log("[Tournament] show reward", rewardData.item.Level, reward);

        UIManager.createPanel("game", "CommonRewardView", {
            showAnimation: true,
            setData: {
                title: I18nManager.t("Tournament Rewards"),
                rewards: [reward],
                cb: () => {
                    rewardData.item.RewardClaimed = true;
                    this.tryShowNextReward();
                }
            }
        });
    }

    public getMyRankInTournament(tournamentID: string): number | null {
        const key = this.getLeaderboardKey(tournamentID);
        const leaderboard = this.leaderboardCache.get(key);

        if (!leaderboard || leaderboard.length === 0) {
            return null;
        }

        const index = leaderboard.findIndex((player: any) => player.uid === BaseDataManager.uuid);
        return index >= 0 ? index + 1 : null;
    }

    public getRewardByRank(tournament: any): any | null {
        if (!tournament.Rank || !tournament.Rewards) {
            return null;
        }
        if (tournament.Rank <= 0 || tournament.Rank > tournament.Rewards.length) {
            return null;
        }
        return tournament.Rewards[tournament.Rank - 1];
    }

    public sortRankList(rankList: any[]): any[] {
        if (!rankList || rankList.length === 0) {
            return [];
        }

        return [...rankList].sort((a: any, b: any) => {
            const aScore = Number(a.score) || 0;
            const bScore = Number(b.score) || 0;

            if (aScore !== bScore) {
                return bScore - aScore;
            }

            const aTimestamp = Number(a.updateTimestamp ?? 0) || 0;
            const bTimestamp = Number(b.updateTimestamp ?? 0) || 0;
            const aHasTimestamp = aTimestamp > 0;
            const bHasTimestamp = bTimestamp > 0;

            if (aHasTimestamp && bHasTimestamp) {
                return bTimestamp - aTimestamp;
            }
            if (aHasTimestamp && !bHasTimestamp) {
                return -1;
            }
            if (!aHasTimestamp && bHasTimestamp) {
                return 1;
            }
            return 0;
        });
    }

    public getTopRankList(rankList: any[], count: number = 3): any[] {
        if (!rankList || rankList.length === 0) {
            return [];
        }
        return this.sortRankList(rankList).slice(0, Math.max(0, count));
    }
}