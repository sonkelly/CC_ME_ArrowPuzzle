import { _decorator, Component, Node, game } from 'cc';
import { GameLogicConfig } from './GameLogicConfig';
import { ConfigHelper } from './ConfigHelper';
import { EventManager } from './Event/EventManager';
import { ModuleEventKey } from './IGameRawData';
import { BagDataRecorder } from './BagDataRecorder';
import { BaseDataRecorder } from './BaseDataRecorder';
import { RecordUtils } from './Utils/RecordUtils';
import { VideoDataRecorder } from './VideoDataRecorder';
import { DailyTaskRecorder } from './Daily/DailyTaskRecorder';
import { DailyRewardsRecorder } from './Daily/DailyRewardsRecorder';
import { ShopDataRecorder } from './Shop/ShopDataRecorder';
import { AchievementRecorder } from './Achievement/AchievementRecorder';
declare const SDKInstance : any;

const { ccclass, property } = _decorator;

class IGameData {
    public Version: string;
    public PlayDay: number;
    public SaveTimeMill: number;
    public NewDayMill: number;
    public LastLoginDate: string;
    public LevelVersion: string;
}

class NetRecordData {
    public GameData: IGameData;
    public BaseData: any;
    public BagData: any;
    public VideoData: any;
    public DailyTaskData: any;
    public DailyRewardsData: any;
    public ShopData: any;
    public AchievementData: any;
}

@ccclass('GameRecord')
export class GameRecord extends Component {
    private static _instance: GameRecord = null;
    private static _RECORD_VERSION: string = "v1.006";
    private static _AUTO_SAVE_STRIDE: number = 120;

    public Data: IGameData = new IGameData();
    public BaseRecorder: BaseDataRecorder = new BaseDataRecorder();
    public BagRecorder: BagDataRecorder = new BagDataRecorder();
    public VideoRecorder: VideoDataRecorder = new VideoDataRecorder();
    public DailyTaskRecorder: DailyTaskRecorder = new DailyTaskRecorder();
    public DailyRewardsRecorder: DailyRewardsRecorder = new DailyRewardsRecorder();
    public ShopDataRecorder: ShopDataRecorder = new ShopDataRecorder();
    public AchievementRecorder: AchievementRecorder = new AchievementRecorder();
    public arrRecorder: any[];
    public isRecordInit: boolean = false;
    public isRecordLoad: boolean = false;
    public nextUpdateTime: number = 0;
    public recordUid: string = "";
    public isRecordChange: boolean = false;
    public nextAutoSaveTime: number = 0;
    public recorderNetKeys: string[] = [];

    public static GetInstance(): GameRecord {
        return this._instance;
    }

    public static Create(uid: string): void {
        if (this._instance == null) {
            const node = new Node();
            this._instance = node.addComponent(GameRecord);
            game.addPersistRootNode(node);
            this._instance.recordUid = uid;
            this._instance.init();
        }
    }

    public init(): void {
        if (!this.isRecordInit) {
            this.arrRecorder = [];
            this.arrRecorder.push(this.BagRecorder);
            this.arrRecorder.push(this.VideoRecorder);
            this.arrRecorder.push(this.BaseRecorder);
            this.arrRecorder.push(this.DailyTaskRecorder);
            this.arrRecorder.push(this.DailyRewardsRecorder);
            this.arrRecorder.push(this.ShopDataRecorder);
            this.arrRecorder.push(this.AchievementRecorder);

            this.recorderNetKeys.push("GameData");
            this.recorderNetKeys.push("BaseData");
            this.recorderNetKeys.push("BagData");
            this.recorderNetKeys.push("VideoData");
            this.recorderNetKeys.push("DailyTaskData");
            this.recorderNetKeys.push("DailyRewardsData");
            this.recorderNetKeys.push("AchievementData");

            this.isRecordInit = true;
        }
    }

    public update(deltaTime: number): void {
        if (this.isRecordLoad) {
            this.nextAutoSaveTime -= deltaTime;
            this.nextUpdateTime -= deltaTime;

            if (this.nextUpdateTime <= 0) {
                if (Date.now() >= this.Data.NewDayMill) {
                    this.Data.NewDayMill = RecordUtils.CalcNextDayMill();
                    this.Data.PlayDay++;
                    RecordUtils.SaveRecord(this.getCacheName(), this.Data);
                    console.log("进入新一天 ", this.Data.PlayDay);

                    for (let i = 0; i < this.arrRecorder.length; i++) {
                        this.arrRecorder[i].TurnNewDay();
                    }
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.NewDayEnd);
                } else {
                    this.nextUpdateTime = 1;
                    for (let i = 0; i < this.arrRecorder.length; i++) {
                        this.arrRecorder[i].Update();
                    }

                    if (this.isRecordChange && this.nextAutoSaveTime <= 0) {
                        this.isRecordChange = false;
                        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet, [false]);
                    }
                }
            }
        }
    }

    public resetRecordChange(): void {
        this.isRecordChange = false;
        this.nextAutoSaveTime = 0;
    }

    public FlagRecordChange(): void {
        this.isRecordChange = true;
        if (this.nextAutoSaveTime <= 0) {
            if (SDKInstance.isFacebookMiniGame() || SDKInstance.isGooglePlayNative()) {
                this.nextAutoSaveTime = GameRecord._AUTO_SAVE_STRIDE;
            } else {
                this.nextAutoSaveTime = ConfigHelper.getGameConfig().uploadDataInterval;
            }
        }
        this.ResetSaveTimeMill();
    }

    public TurnNewDay(): void {
        this.Data.NewDayMill = 0;
    }

    public ResetAll(): void {
        this.Data.Version = GameRecord._RECORD_VERSION;
        this.Data.SaveTimeMill = Date.now();
        this.Data.NewDayMill = RecordUtils.CalcNextDayMill();
        this.Data.PlayDay = 1;

        for (let i = 0; i < this.arrRecorder.length; i++) {
            this.arrRecorder[i].Reset();
        }
    }

    public ResetAllAndSave(): void {
        this.Data.Version = GameRecord._RECORD_VERSION;
        this.Data.SaveTimeMill = Date.now();
        this.Data.NewDayMill = RecordUtils.CalcNextDayMill();
        this.Data.PlayDay = 1;

        for (let i = 0; i < this.arrRecorder.length; i++) {
            this.arrRecorder[i].Reset();
            this.arrRecorder[i].Save();
        }
    }

    public ResetSaveTimeMill(): void {
        this.Data.SaveTimeMill = Date.now();
        RecordUtils.SaveRecord(this.getCacheName(), this.Data);
    }

    public GetNetGameData(data: any): IGameData {
        if (data == null || data.GameData == null) {
            return null;
        }
        return data.GameData;
    }

    public InitByNetRecord(data: any, isDirectData: boolean = false): boolean {
        let parsedData: NetRecordData;

        if (isDirectData) {
            if (data == null) {
                return;
            }
            parsedData = data;
        } else {
            if (data == null || data.data == null) {
                return;
            }
            parsedData = JSON.parse(data.data);
            if (parsedData == null || parsedData.GameData == null) {
                return;
            }
        }

        this.Data = parsedData.GameData;
        this.BaseRecorder.SetData(parsedData.BaseData);
        this.BagRecorder.SetData(parsedData.BagData);
        this.VideoRecorder.SetData(parsedData.VideoData);
        this.DailyTaskRecorder.SetData(parsedData.DailyTaskData);
        this.DailyRewardsRecorder.SetData(parsedData.DailyRewardsData);
        this.ShopDataRecorder.SetData(parsedData.ShopData);
        this.AchievementRecorder.SetData(parsedData.AchievementData);

        this.isRecordLoad = true;
        return true;
    }

    public LoadGameData(): IGameData {
        const data = RecordUtils.LoadRecord(this.getCacheName());
        if (data == null || data.Version !== GameRecord._RECORD_VERSION) {
            return null;
        }
        return data;
    }

    public LoadRecordLoad(data: IGameData): void {
        this.Data = data;
        for (let i = 0; i < this.arrRecorder.length; i++) {
            this.arrRecorder[i].Load();
        }
        this.isRecordLoad = true;
    }

    public SaveAllToCache(): void {
        RecordUtils.SaveRecord(this.getCacheName(), this.Data);
        for (let i = 0; i < this.arrRecorder.length; i++) {
            this.arrRecorder[i].Save();
        }
        this.isRecordLoad = true;
    }

    public CollectNetSaveInfo(): NetRecordData {
        const netData = new NetRecordData();
        netData.GameData = this.Data;
        netData.BaseData = this.BaseRecorder.Data;
        netData.BagData = this.BagRecorder.Data;
        netData.VideoData = this.VideoRecorder.Data;
        netData.DailyTaskData = this.DailyTaskRecorder.Data;
        netData.DailyRewardsData = this.DailyRewardsRecorder.Data;
        netData.ShopData = this.ShopDataRecorder.Data;
        netData.AchievementData = this.AchievementRecorder.Data;
        return netData;
    }

    public ClearCache(): void {
        RecordUtils.RemoveRecord(this.getCacheName());
    }

    public SaveLevelVersion(version: string): void {
        this.Data.LevelVersion = version;
        RecordUtils.SaveRecord(this.getCacheName(), this.Data);
    }

    public SaveLoginDate(date: string): void {
        this.Data.LastLoginDate = date;
        RecordUtils.SaveRecord(this.getCacheName(), this.Data);
    }

    private getCacheName(): string {
        if (RecordUtils.NeedEncryptSave()) {
            return "6162a1c5-d47e-4380-b601-fee6721f0b3f" + this.recordUid;
        }
        return "__GAME__";
    }
}