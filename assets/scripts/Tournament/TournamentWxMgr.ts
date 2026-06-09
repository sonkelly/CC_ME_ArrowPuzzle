import { I18nManager } from "./../I18nManager";
import { GameLogicConfig } from "./../GameLogicConfig";
import { Api } from "./../Api";
import { Utilsqdd } from "./../Utils/Utilsqdd";
import { EventManager } from "./../Event/EventManager";
import { UIManager } from "./../UIManager";
import { ModuleEventKey } from "./../IGameRawData";
import { GameRecord } from "./../GameRecord";
import { BaseDataManager } from "./../BaseDataManager";

interface TournamentInfo {
    id: number;
    endTime: number;
    createTime: number | null;
    contextID: string;
    payload: {
        level: number;
        official: boolean;
        rewards: any[];
    };
    rankList?: Array<{ openid: string }>;
}

interface MyTournamentData {
    ID: string;
    BestScore: number;
    CreateTime: number;
    EndTime: number;
    ContextID: string;
    Level: number;
    Official: boolean;
    Rewards: any[];
    RewardClaimed?: boolean;
    Settled?: boolean;
    Rank?: number | null;
}

interface RewardItem {
    CfgId: number;
    Number?: number;
    Num?: number;
}

interface RewardQueueItem {
    item: MyTournamentData;
    reward: RewardItem;
}

export class TournamentWxMgr {
    private static _instance: TournamentWxMgr;
    
    tournamentAllInfo: TournamentInfo[] = [];
    curTournamentID: number = 0;
    curLevel: number = 1;
    rewardQueue: RewardQueueItem[] = [];

    static get instance(): TournamentWxMgr {
        if (!TournamentWxMgr._instance) {
            TournamentWxMgr._instance = new TournamentWxMgr();
        }
        return TournamentWxMgr._instance;
    }

    async loadTournamentData(forceRefresh: boolean = false): Promise<void> {
        if (forceRefresh) {
            console.log("[Tournament] loadTournamentData start");
            const response = await Api.requestTournament();
            if (response.code === 200) {
                this.tournamentAllInfo = response.data;
                this.tournamentAllInfo = this.filterAndSortTournaments(this.tournamentAllInfo);
            } else {
                this.tournamentAllInfo = [];
            }
            console.log("[Tournament] loadTournamentData done", this.tournamentAllInfo.length);
        } else {
            console.log("[Tournament] loadTournamentData use cache");
        }
    }

    filterAndSortTournaments(tournaments: TournamentInfo[]): TournamentInfo[] {
        if (!Array.isArray(tournaments)) {
            return [];
        }

        const currentTime = Math.floor(Date.now() / 1000);
        
        return tournaments.filter((tournament) => {
            if (typeof tournament.endTime !== "number" || isNaN(tournament.endTime)) {
                console.warn("[Tournament] 赛事endTime异常，自动过滤:", tournament.id);
                return false;
            }
            
            const isActive = tournament.endTime > currentTime;
            const isRecentEnded = !isActive && (currentTime - tournament.endTime <= 86400);
            
            return isActive || isRecentEnded;
        }).sort((a, b) => {
            const aIsActive = a.endTime > currentTime;
            const bIsActive = b.endTime > currentTime;
            
            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;
            return a.endTime - b.endTime;
        });
    }

    getTournamentListWithRank(): TournamentInfo[] {
        return this.tournamentAllInfo;
    }

    getMyTournamentList(): TournamentInfo[] {
        const myTournamentData = GameRecord.GetInstance().BaseRecorder.Data.MyTournamentData;
        
        if (!myTournamentData || myTournamentData.length === 0) {
            console.log("[Tournament] getMyTournamentList empty");
            return [];
        }

        const myTournamentIds = new Set(myTournamentData.map((data: MyTournamentData) => data.ID));
        
        const filteredTournaments = this.tournamentAllInfo.filter((tournament) => {
            return myTournamentIds.has(tournament.id.toString());
        });

        const sortedTournaments = [...filteredTournaments].sort((a, b) => {
            const aTime = a.createTime ?? a.endTime ?? 0;
            const bTime = b.createTime ?? b.endTime ?? 0;
            return bTime - aTime;
        }).slice(0, 30);

        console.log("[Tournament] getMyTournamentListFromLocal done", sortedTournaments.length);
        return sortedTournaments;
    }

    joinTournament(tournament: TournamentInfo): void {
        console.log("[Tournament] joinTournament: ", tournament);
        this.curTournamentID = tournament.id;

        let level = 100;
        this.curLevel = level;
        
        if (tournament.payload?.level) {
            level = +tournament.payload.level;
        } else {
            level = Utilsqdd.randomTwoNum(1, 398);
        }

        const createTime = tournament.createTime === null 
            ? Math.floor(Date.now() / 1000) 
            : tournament.createTime;

        GameRecord.GetInstance().BaseRecorder.JoinTournament({
            ID: tournament.id.toString(),
            BestScore: 0,
            CreateTime: createTime,
            EndTime: tournament.endTime,
            ContextID: tournament.contextID,
            Level: tournament.payload.level,
            Official: tournament.payload.official,
            Rewards: tournament.payload.rewards
        });

        EventManager.emit(
            `${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.PlayTournament}`, 
            level
        );
    }

    submitScore(score: number): void {
        console.log("[Leaderboard] submitScore start", {
            tournamentID: this.curTournamentID,
            score: score
        });

        const recorder = GameRecord.GetInstance().BaseRecorder;
        
        if (!recorder.Data.MyTournamentData || recorder.Data.MyTournamentData.length === 0) {
            console.log("[Leaderboard] submitScore, no joined tournaments");
            return;
        }

        const tournamentData = recorder.Data.MyTournamentData.find(
            (data: MyTournamentData) => +data.ID === this.curTournamentID
        );

        if (!tournamentData) {
            console.warn("[Leaderboard] submitScore skipped, not joined tournament", this.curTournamentID);
            return;
        }

        if (score <= 0) {
            score = tournamentData.BestScore;
        }

        if (score < tournamentData.BestScore) {
            console.log(
                "[Leaderboard] submitScore skipped, score not improved", 
                `best=${tournamentData.BestScore}`, 
                `incoming=${score}`
            );
            return;
        }

        Api.reportedTournament(this.curTournamentID, score).then(() => {
            recorder.UpdateTournamentBestScore(this.curTournamentID.toString(), score);
        });
    }

    async fetchFullRankingList(tournamentId: number): Promise<any[]> {
        try {
            const response = await Api.requestTournamentRank(tournamentId);
            if (response.code !== 200) {
                return Promise.reject([]);
            }
            return response.data || [];
        } catch (error) {
            console.error("[fetchFullRankingList error]", error);
            return [];
        }
    }

    CheckTournamentSettlement(): void {
        const currentTime = Math.floor(Date.now() / 1000);
        const recorder = GameRecord.GetInstance().BaseRecorder;
        let hasChanges = false;
        this.rewardQueue = [];

        for (const tournamentData of recorder.Data.MyTournamentData) {
            if (tournamentData.EndTime > currentTime) {
                continue;
            }

            if (tournamentData.Official && tournamentData.Rewards && tournamentData.Rewards.length !== 0) {
                if (!tournamentData.RewardClaimed) {
                    if (tournamentData.Settled) {
                        if (tournamentData.Rank === null) {
                            const rank = this.getMyRankInTournament(tournamentData.ID);
                            tournamentData.Rank = rank;
                            hasChanges = true;
                        }
                    } else {
                        const rank = this.getMyRankInTournament(tournamentData.ID);
                        tournamentData.Rank = rank;
                        tournamentData.Settled = true;
                        hasChanges = true;
                    }

                    const reward = this.getRewardByRank(tournamentData);
                    if (reward) {
                        this.rewardQueue.push({
                            item: tournamentData,
                            reward: reward
                        });
                    }
                }
            } else {
                tournamentData.Settled = true;
                tournamentData.RewardClaimed = true;
                hasChanges = true;
            }
        }

        if (this.rewardQueue.length > 0) {
            this.tryShowNextReward();
        } else if (hasChanges) {
            recorder.Save();
        }
    }

    tryShowNextReward(): void {
        const queueItem = this.rewardQueue.shift();
        
        if (!queueItem) {
            GameRecord.GetInstance().BaseRecorder.CleanMyTournamentData();
            EventManager.emit(
                `${GameLogicConfig.event_conf.module_msg}_${ModuleEventKey.WantSaveRecordToNet}`, 
                [false]
            );
            return;
        }

        let number = 0;
        number = queueItem.reward.Number ?? queueItem.reward.Num ?? 0;

        const rewardData = {
            CfgId: queueItem.reward.CfgId,
            Num: number
        };

        console.log("[Tournament] show reward", queueItem.item.Level, rewardData);

        UIManager.createPanel("game", "CommonRewardView", {
            showAnimation: true,
            setData: {
                title: I18nManager.t("Tournament Rewards"),
                rewards: [rewardData],
                cb: () => {
                    queueItem.item.RewardClaimed = true;
                    this.tryShowNextReward();
                }
            }
        });
    }

    getMyRankInTournament(tournamentId: string): number | null {
        const tournament = this.tournamentAllInfo.find(
            (t) => t.id === +tournamentId
        );
        
        const rankList = tournament?.rankList;
        
        if (!rankList || rankList.length === 0) {
            return null;
        }

        const myIndex = rankList.findIndex(
            (entry) => entry.openid === BaseDataManager.uuid
        );

        return myIndex >= 0 ? myIndex + 1 : null;
    }

    getRewardByRank(tournamentData: MyTournamentData): RewardItem | null {
        if (!tournamentData.Rank || !tournamentData.Rewards) {
            return null;
        }

        if (tournamentData.Rank <= 0 || tournamentData.Rank > tournamentData.Rewards.length) {
            return null;
        }

        return tournamentData.Rewards[tournamentData.Rank - 1];
    }
}