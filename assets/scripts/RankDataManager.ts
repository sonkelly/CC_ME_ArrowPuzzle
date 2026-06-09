import { RankType, ActivityType } from "./GlobalEnum";
import { ActivityManager } from "./ActivityManager";
import { Api } from "./Api";
import { GameRecord } from "./GameRecord";
import { BaseDataManager } from "./BaseDataManager";
import { TournamentDataManager } from "./Tournament/TournamentDataManager";

interface UserInfo {
    userId: string;
    scores: number[];
    extendsInfo: {
        avatar: string;
        nickname: string;
        rank?: number;
        title: number;
    };
}

interface RankingListResponse {
    userInfos: UserInfo[];
    myRanking?: number;
}

interface FineBoostClient {
    fetchRankingList(params: any): Promise<any>;
    commitRankingScore(params: any): Promise<any>;
    updateUserInfo(params: any): Promise<any>;
    getUserList(params: any): Promise<any>;
}

interface FineBoostRanking {
    new(config: any): FineBoostClient;
}

export class RankDataManager {
    private _client: FineBoostClient | undefined;
    private _rankingId: string = "MainLevel1";
    private static _instance: RankDataManager;

    public static get instance(): RankDataManager {
        if (!RankDataManager._instance) {
            RankDataManager._instance = new RankDataManager();
        }
        return RankDataManager._instance;
    }

    private fineBoostReady(): boolean {
        if (typeof window === "undefined" || !window.FINEBOOST) {
            console.warn("[Ranking] FINEBOOST not ready");
            return false;
        }
        return true;
    }

    public async createClient(): Promise<void> {
        if (SDKInstance.isFacebookMiniGame()) {
            if (this.fineBoostReady()) {
                const config = {
                    isInland: false,
                    bundleId: "com.arrows.FB",
                    userId: BaseDataManager.uuid,
                    userGeo: BaseDataManager.userCountry,
                    timeout: 60000,
                    debug: false
                };
                const Ranking: FineBoostRanking = window.FINEBOOST.Ranking;
                this._client = new Ranking(config);
            }
        } else {
            await Api.requestActivityCfg();
        }
    }

    public async fetchRankingList(start: number = 0, end: number = 100): Promise<RankingListResponse | undefined> {
        if (!this._client) {
            try {
                const response = await Api.requestRank(RankType.WORLD);
                if (response.code !== 200) {
                    return Promise.reject({
                        code: response.code,
                        message: response.message || "fetchRankingList failed"
                    });
                }

                const userInfos: UserInfo[] = [];
                const rankInfo = response.data.rankinfo;
                const myRanking = response.data.myrank.rank;

                rankInfo.forEach((item: any) => {
                    userInfos.push({
                        userId: "",
                        scores: [item.level],
                        extendsInfo: {
                            avatar: item.avatarUrl,
                            nickname: item.nickname,
                            rank: item.rank,
                            title: item.title ?? 0
                        }
                    });
                });

                return {
                    userInfos: userInfos,
                    myRanking: myRanking
                };
            } catch (error) {
                console.error("[fetchRankingList error]", error);
                return undefined;
            }
        }

        const params = {
            rankingId: this._rankingId,
            start: start,
            end: end
        };

        try {
            const response = await this._client.fetchRankingList(params);
            if (response.code !== 200) {
                return Promise.reject({
                    code: response.code,
                    message: response.message || "fetchRankingList failed"
                });
            }

            console.log("fetchRankingList:", response.data.userInfos);

            const userIndex = response.data.userInfos.findIndex((user: any) => user.userId === BaseDataManager.uuid);
            if (userIndex > -1) {
                console.log("fetchRankingList 我在榜上");
                return {
                    userInfos: response.data.userInfos || []
                };
            }

            const baseRecorder = GameRecord.GetInstance().BaseRecorder;
            const currentLevel = baseRecorder.Data.CurLevel - 1;
            const myUserInfo: UserInfo = {
                userId: BaseDataManager.uuid,
                scores: [currentLevel],
                extendsInfo: {
                    nickname: BaseDataManager.nickName,
                    avatar: BaseDataManager.userAvatar,
                    title: baseRecorder.Data.TierData ? baseRecorder.Data.TierData.tier : 0
                }
            };

            let rankPosition = 0;
            response.data.userInfos.forEach((user: any) => {
                const userScore = user.scores?.[0] || 0;
                if (userScore > currentLevel) {
                    rankPosition++;
                }
            });

            const myRank = rankPosition + 1;
            console.log("fetchRankingList 我的排名:", myRank);

            if (myRank <= 100) {
                console.log("fetchRankingList 插入我的排名");
                response.data.userInfos.push(myUserInfo);
                response.data.userInfos.sort((a: any, b: any) => {
                    const scoreA = a.scores?.[0] || 0;
                    const scoreB = b.scores?.[0] || 0;
                    return scoreB - scoreA;
                });

                this.commitRankingScore([currentLevel], {
                    nickname: BaseDataManager.nickName,
                    avatar: BaseDataManager.userAvatar,
                    title: baseRecorder.Data.TierData ? baseRecorder.Data.TierData.tier : 0
                }).then(() => {
                    console.log("成绩重新提交成功");
                }).catch((error) => {
                    console.warn("成绩重新提交失败:", error.code, error.message);
                });
            }

            return {
                userInfos: response.data.userInfos || []
            };
        } catch (error) {
            console.error("[fetchRankingList error]", error);
            return undefined;
        }
    }

    public async fetchActivityRankingList(activityType: ActivityType): Promise<RankingListResponse> {
        const activityData = ActivityManager.instance.getActivityDataByType(activityType);
        if (!activityData) {
            return {
                userInfos: [],
                myRanking: 0
            };
        }

        try {
            const response = await Api.requestActivityRank(activityData.batchId);
            if (response.code !== 200) {
                return Promise.reject({
                    code: response.code,
                    message: response.message || "fetchActivityRankingList failed"
                });
            }

            const userInfos: UserInfo[] = [];
            const topList = response.data.topList;
            const myRanking = response.data.myrank.rank;

            topList.forEach((item: any) => {
                userInfos.push({
                    userId: item.openid,
                    scores: [item.activ],
                    extendsInfo: {
                        avatar: item.avatarUrl,
                        nickname: item.nickname,
                        rank: item.ranking,
                        title: item.title ?? 0
                    }
                });
            });

            return {
                userInfos: userInfos,
                myRanking: myRanking
            };
        } catch (error) {
            console.error("[fetchRankingList error]", error);
            return {
                userInfos: [],
                myRanking: 0
            };
        }
    }

    public async commitRankingScore(scores: number[], extendsInfo: any, isOverwrite: boolean = false): Promise<void> {
        if (!this._client) {
            const params: any = {
                level: scores[0],
                title: extendsInfo.title
            };

            const weeklyActivity = ActivityManager.instance.getActivityDataByType(ActivityType.WEEKLY_RANK);
            if (weeklyActivity) {
                params.weekly = {
                    batchId: weeklyActivity.batchId,
                    score: 1
                };
            }

            const dailyActivity = ActivityManager.instance.getActivityDataByType(ActivityType.DAILY_RANK);
            if (dailyActivity) {
                params.contest = {
                    batchId: dailyActivity.batchId,
                    score: 1
                };
            }

            //await Api.reportRank(params);
            //@todo save rank here
            return;
        }

        const params = {
            rankingId: this._rankingId,
            score: scores,
            isOverwrite: isOverwrite,
            extendsInfo: extendsInfo
        };

        try {
            const response = await this._client.commitRankingScore(params);
            if (response.code !== 200) {
                return Promise.reject({
                    code: response.code,
                    message: response.message || "commitRankingScore failed"
                });
            }
        } catch (error) {
            console.error("[commitRankingScore error]", error);
        }
    }

    public async updateUserInfo(score: number, title: number): Promise<void> {
        const client = TournamentDataManager.instance.getClient();
        if (!client) {
            return Promise.reject({
                code: 0,
                message: "[Ranking] FINEBOOST not ready"
            });
        }

        const params = {
            archive: {
                nickname: BaseDataManager.nickName,
                avatar: BaseDataManager.userAvatar,
                score: score,
                title: title
            }
        };

        try {
            const response = await client.updateUserInfo(params);
            if (response.code !== 200) {
                return Promise.reject({
                    code: response.code,
                    message: response.message || "updateUserInfo failed"
                });
            }
        } catch (error) {
            console.error("[updateUserInfo error]", error);
        }
    }

    public async getUserList(userId: string): Promise<any[]> {
        const client = TournamentDataManager.instance.getClient();
        if (!client) {
            return Promise.reject({
                code: 0,
                message: "[Ranking] FINEBOOST not ready"
            });
        }

        const params = {
            userId: userId,
            archiveKey: ["nickname", "avatar", "score", "title"]
        };

        console.log("[fetchFriendRankingList params]: ", params);

        try {
            const response = await client.getUserList(params);
            if (response.code !== 200) {
                return Promise.reject({
                    code: response.code,
                    message: response.message || "fetchFriendRankingList failed"
                });
            }

            console.log("fetchFriendRankingList:", response.data.userList);

            const userIndex = response.data.userList.findIndex((user: any) => user.userId === BaseDataManager.uuid);
            if (userIndex < 0) {
                console.log("fetchFriendRankingList 我不在榜上");
                const baseRecorder = GameRecord.GetInstance().BaseRecorder;
                const currentLevel = baseRecorder.Data.CurLevel - 1;
                const title = baseRecorder.Data.TierData ? baseRecorder.Data.TierData.tier : 0;

                response.data.userList.push({
                    userId: BaseDataManager.uuid,
                    archive: {
                        nickname: BaseDataManager.nickName,
                        avatar: BaseDataManager.userAvatar,
                        score: currentLevel,
                        title: title
                    }
                });

                this.updateUserInfo(currentLevel, title).then(() => {
                    console.log("重新上报用户信息成功");
                }).catch((error) => {
                    console.warn("重新上报用户信息失败:", error);
                });
            }

            return this.sortRankList(response.data.userList);
        } catch (error) {
            console.error("[fetchFriendRankingList error]", error);
            return [];
        }
    }

    public sortRankList(userList: any[]): any[] {
        if (!userList || userList.length === 0) {
            return [];
        }

        return [...userList].sort((a, b) => {
            const scoreA = Number(a.archive.score) || 0;
            const scoreB = Number(b.archive.score) || 0;

            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            const archiveTimeA = Number(a.archiveTime ?? 0) || 0;
            const archiveTimeB = Number(b.archiveTime ?? 0) || 0;
            const hasTimeA = archiveTimeA > 0;
            const hasTimeB = archiveTimeB > 0;

            if (hasTimeA && hasTimeB) {
                return archiveTimeB - archiveTimeA;
            } else if (hasTimeA && !hasTimeB) {
                return -1;
            } else if (!hasTimeA && hasTimeB) {
                return 1;
            }
            return 0;
        });
    }
}