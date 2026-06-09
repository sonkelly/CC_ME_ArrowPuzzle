import { _decorator, Component } from "cc";
import { Global } from "./Global";
import { JsonClassStorage } from "./JsonClass";
import { MathUtils } from "./Utils/MathUtils";
import { Utilsqdd } from "./Utils/Utilsqdd";
import { BaseDataManager } from "./BaseDataManager";
import { DataRecorder } from "./DataRecorder";
import { RecordUtils } from "./Utils/RecordUtils";

export class IBaseData {
    Gold: number = 0;
    CurLevel: number = 1;
    PlayerNickName: string = "";
    PlayerAvatar: string = "";
    PurchasedNoAds: boolean = false;

    HeartData: IHeartData = {} as IHeartData;
    ChallengeData: IChallengeData = {} as IChallengeData;
    MyTournamentData: ITournamentData[] = [];

    ClaimedCollectReward: boolean = false;
    pendingRescue: boolean = false;
    rescueLevel: number = 0;

    TierData: ITierData = {} as ITierData;

    FreeReviveNum: number = 0;
}

class IHeartData {
    CurrentHearts: number = 0;
    LastTimestamp: number = 0;
    InfiniteTimestamp: number = 0;
}

interface IChallengeData {
    year: number;
    month: number;
    finishedDays: number[];
}

interface ITournamentData {
    ID: string;
    BestScore: number;
    CreateTime: number;
    EndTime: number;
    ContextID: string;
    Level: number;
    Official: boolean;
    Rewards: any[];
    Settled: boolean;
    RewardClaimed: boolean;
    Rank: number;
}

interface ITierData {
    tier: number;
    progress: number;
}

export class BaseDataRecorder extends DataRecorder {
    public Data: IBaseData = new IBaseData();
    public MaxHeart: number = 5;

    public RecordName(): string {
        return "baseRecord";
    }

    public GetData(): IBaseData {
        return this.Data;
    }

    public SetData(data: IBaseData): void {
        this.Data = data;
        const config = JsonClassStorage.instance.getOneJson("BaseConfig", "ID", 1);
        this.MaxHeart = config.MaxHeart;
        if (Utilsqdd.isNil(this.Data.HeartData)) {
            this.Data.HeartData = new IHeartData();
            this.Data.HeartData.CurrentHearts = config.MaxHeart;
        }
        BaseDataManager.nickName = this.Data.PlayerNickName;
        BaseDataManager.userAvatar = this.Data.PlayerAvatar.toString();
        if (Utilsqdd.isNil(this.Data.MyTournamentData)) {
            this.Data.MyTournamentData = [];
        }
        this.CleanMyTournamentData();
    }

    public Reset(): void {
        this.Data.CurLevel = 1;
        if (Global.isForeignGame()) {
            this.Data.PlayerNickName = "Player" + MathUtils.Random(1000000, 9999999);
        } else {
            this.Data.PlayerNickName = "游客" + MathUtils.Random(1000000, 9999999);
        }
        this.Data.PlayerAvatar = Utilsqdd.randomTwoNum(1, 11).toString();
        this.Data.Gold = 0;
        this.Data.PurchasedNoAds = false;
        BaseDataManager.nickName = this.Data.PlayerNickName;
        BaseDataManager.userAvatar = this.Data.PlayerAvatar.toString();
        this.Data.HeartData = new IHeartData();
        const config = JsonClassStorage.instance.getOneJson("BaseConfig", "ID", 1);
        this.Data.HeartData.CurrentHearts = config.MaxHeart;
        this.MaxHeart = config.MaxHeart;
        this.Data.MyTournamentData = [];
        this.Data.pendingRescue = false;
        this.Data.rescueLevel = 1;
        this.Data.TierData = {
            tier: 0,
            progress: 0
        };
        this.Data.FreeReviveNum = 0;
    }

    public OnNewDay(): void {
        // Empty implementation
    }

    public GetCacheName(): string {
        return RecordUtils.NeedEncryptSave() ? "e36329db-b71d-432e-873d-2bc8a12b37de" : "_BASE_";
    }

    public resetData(): void {
        this.Data.CurLevel = 1;
        this.Data.PlayerAvatar = "1";
        this.Save();
    }

    public LevelPass(maxLevel: number): void {
        this.Data.CurLevel++;
        if (this.Data.CurLevel > maxLevel) {
            this.Data.CurLevel = maxLevel;
        }
        this.Save();
    }

    public PendingRescue(isPending: boolean, level: number): void {
        this.Data.pendingRescue = isPending;
        this.Data.rescueLevel = level;
        this.Save();
    }

    public OnRescueComplete(): void {
        this.Data.pendingRescue = false;
        this.Save();
    }

    public SkipToLevel(level: number): void {
        this.Data.CurLevel = level;
        this.Data.pendingRescue = false;
        this.Save();
    }

    public ModifyPlayerName(name: string): void {
        this.Data.PlayerNickName = name;
        BaseDataManager.nickName = name;
        this.Save();
    }

    public ModifyPlayerAvatar(avatar: string): void {
        this.Data.PlayerAvatar = avatar.toString();
        BaseDataManager.userAvatar = avatar.toString();
        this.Save();
    }

    public RefresGold(gold: number): void {
        this.Data.Gold = gold;
        if (this.Data.Gold < 0) {
            this.Data.Gold = 0;
        }
        this.Save();
    }

    public AddGold(amount: number): void {
        this.Data.Gold += amount;
        this.Save();
    }

    public ConsumeGold(amount: number): void {
        if (amount < 0) return;
        this.Data.Gold -= amount;
        if (this.Data.Gold < 0) {
            this.Data.Gold = 0;
        }
        this.Save();
    }

    public AddHeart(amount: number): void {
        this.Data.HeartData.CurrentHearts += amount;
        if (this.Data.HeartData.CurrentHearts > this.MaxHeart) {
            this.Data.HeartData.CurrentHearts = this.MaxHeart;
        }
        this.Save();
    }

    public ConsumeHeart(): void {
        if (this.Data.HeartData.CurrentHearts <= 0) return;
        this.Data.HeartData.CurrentHearts -= 1;
        this.Save();
    }

    public isHeartFull(): boolean {
        return this.Data.HeartData.CurrentHearts >= this.MaxHeart;
    }

    public SetHeartInfiniteTime(timestamp: number): void {
        this.Data.HeartData.InfiniteTimestamp = timestamp;
        this.Save();
    }

    public isHeartInInfinite(): boolean {
        const now = Date.now();
        return !!(this.Data.HeartData.InfiniteTimestamp && this.Data.HeartData.InfiniteTimestamp > now);
    }

    public SaveChallengeData(data: IChallengeData): void {
        this.Data.ChallengeData = data;
        this.Save();
    }

    public CleanMyTournamentData(): void {
        const currentTime = Math.floor(Date.now() / 1000);
        const oldLength = this.Data.MyTournamentData.length;
        this.Data.MyTournamentData = this.Data.MyTournamentData.filter((tournament: ITournamentData) => {
            return tournament.EndTime > currentTime || 
                   (currentTime - tournament.EndTime <= 86400 || 
                    !(!(tournament.Official && tournament.Rewards.length > 0) || tournament.RewardClaimed));
        });
        console.log("[Tournament] cleanMyTournamentData " + oldLength + " -> " + this.Data.MyTournamentData.length);
        this.Save();
    }

    public JoinTournament(tournamentData: ITournamentData): boolean {
        const exists = this.Data.MyTournamentData.find((t: ITournamentData) => t.ID === tournamentData.ID);
        if (exists) {
            return false;
        }
        this.Data.MyTournamentData.push(tournamentData);
        this.Save();
        return true;
    }

    public UpdateTournamentBestScore(tournamentID: string, score: number): void {
        if (!tournamentID) {
            console.warn("[Tournament] UpdateTournamentBestScore invalid tournamentID");
            return;
        }
        const tournament = this.Data.MyTournamentData.find((t: ITournamentData) => t.ID === tournamentID);
        if (tournament) {
            if (score >= tournament.BestScore) {
                tournament.BestScore = score;
                this.Save();
            }
        } else {
            console.warn("[Tournament] UpdateTournamentBestScore not found, maybe not joined:", tournamentID);
        }
    }

    public BuyTheNosAds(): void {
        this.Data.PurchasedNoAds = true;
        SDKInstance.hideBannerAd();
        this.Save();
    }

    public RefresNoAds(hasNoAds: boolean): void {
        this.Data.PurchasedNoAds = hasNoAds;
        this.Save();
    }

    public saveUserInfo(userInfo: { nickName?: string; avatarUrl?: string }): void {
        this.Data.PlayerNickName = userInfo?.nickName || this.Data.PlayerNickName;
        this.Data.PlayerAvatar = userInfo?.avatarUrl || this.Data.PlayerAvatar;
        BaseDataManager.nickName = this.Data.PlayerNickName;
        BaseDataManager.userAvatar = this.Data.PlayerAvatar.toString();
        this.Save();
    }

    public ClaimCollectReward(): void {
        this.Data.ClaimedCollectReward = true;
        this.Save();
    }

    public OnFreeRevive(): void {
        if (Utilsqdd.isNil(this.Data.FreeReviveNum)) {
            this.Data.FreeReviveNum = 1;
        } else {
            this.Data.FreeReviveNum++;
        }
        this.Save();
    }
}