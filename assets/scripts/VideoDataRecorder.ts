import { JsonClassStorage } from "./JsonClass";
import { Utilsqdd } from "./Utils/Utilsqdd";
import { DataRecorder } from "./DataRecorder";
import { RecordUtils } from "./Utils/RecordUtils";

interface IVideoViewingInfo {
    Id: number;
    NextTimeMill: number;
    TodayNum: number;
    HistoryNum: number;
    TodayClickNum: number;
}

interface IVideoData {
    ArrVideoInfo: IVideoViewingInfo[];
    ArrShareInfo: IVideoShareInfo[];
}

interface IVideoShareInfo {
    Id: number;
    TodayNum: number;
    HistoryNum: number;
}

export class VideoDataRecorder extends DataRecorder {
    public Data: IVideoData = new (class implements IVideoData {
        ArrVideoInfo: IVideoViewingInfo[] = [];
        ArrShareInfo: IVideoShareInfo[] = [];
    })();

    public RecordName(): string {
        return "videoRecord";
    }

    public GetData(): IVideoData {
        return this.Data;
    }

    public SetData(data: IVideoData): void {
        this.Data = data;
        if (!this.Data.ArrVideoInfo || this.Data.ArrVideoInfo.length < 1) {
            this.resetVideoInfo();
        }
        if (!this.Data.ArrShareInfo || this.Data.ArrShareInfo.length < 1) {
            this.Data.ArrShareInfo = [];
            this.resetShareInfo();
        }
    }

    public Reset(): void {
        this.resetVideoInfo();
        if (!this.Data.ArrShareInfo || this.Data.ArrShareInfo.length < 1) {
            this.Data.ArrShareInfo = [];
            this.resetShareInfo();
        }
    }

    public OnUpdate(): void {
        const now = Date.now();
        let needSave = false;
        for (let i = 0; i < this.Data.ArrVideoInfo.length; i++) {
            const videoInfo = this.Data.ArrVideoInfo[i];
            if (videoInfo.NextTimeMill >= 1 && now > videoInfo.NextTimeMill) {
                videoInfo.NextTimeMill = 0;
                needSave = true;
            }
        }
        if (needSave) {
            this.Save();
        }
    }

    public OnNewDay(): void {
        for (let i = 0; i < this.Data.ArrVideoInfo.length; i++) {
            const videoInfo = this.Data.ArrVideoInfo[i];
            videoInfo.TodayNum = 0;
            videoInfo.TodayClickNum = 0;
        }
        for (let i = 0; i < this.Data.ArrShareInfo.length; i++) {
            this.Data.ArrShareInfo[i].TodayNum = 0;
        }
        this.Save();
    }

    public GetCacheName(): string {
        return RecordUtils.NeedEncryptSave() ? "a00e4d8d-b4f4-4979-aa13-bd3f3c9a8ff8" : "_VIDEO_";
    }

    public ResetVideoTime(videoId: number): void {
        const config = JsonClassStorage.instance.getOneJson("VideoConfig", "Id", videoId);
        if (config != null) {
            const videoInfo = this.GetVideoInfo(videoId);
            if (videoInfo != null) {
                if (config.WaitTime > 0) {
                    videoInfo.NextTimeMill = RecordUtils.CalcNextTimeMill(config.WaitTime);
                }
                videoInfo.TodayNum++;
                videoInfo.HistoryNum++;
                this.Save();
            }
        }
    }

    public UpdateVideoClickNum(videoId: number): void {
        const videoInfo = this.GetVideoInfo(videoId);
        if (videoInfo != null) {
            if (Utilsqdd.isNil(videoInfo.TodayClickNum)) {
                videoInfo.TodayClickNum = 0;
            }
            videoInfo.TodayClickNum++;
            this.Save();
        }
    }

    public AllVideoTimeEnd(): void {
        for (let i = 0; i < this.Data.ArrVideoInfo.length; i++) {
            this.Data.ArrVideoInfo[i].NextTimeMill = 0;
        }
        this.Save();
    }

    public GetVideoInfo(videoId: number): IVideoViewingInfo | undefined {
        return this.Data.ArrVideoInfo.find((info) => info.Id === videoId);
    }

    private resetVideoInfo(): void {
        this.Data.ArrVideoInfo = [];
        for (let i = 0; i < 3; i++) {
            const videoInfo: IVideoViewingInfo = {
                Id: i + 1,
                NextTimeMill: 0,
                TodayNum: 0,
                HistoryNum: 0,
                TodayClickNum: 0
            };
            this.Data.ArrVideoInfo.push(videoInfo);
        }

        const configs = JsonClassStorage.instance.getTableJson("VideoConfig").json;
        for (let i = 0; i < configs.length; i++) {
            const config = configs[i];
            for (let j = 0; j < this.Data.ArrVideoInfo.length; j++) {
                const videoInfo = this.Data.ArrVideoInfo[j];
                if (videoInfo.Id === config.Id) {
                    videoInfo.NextTimeMill = 0;
                    videoInfo.TodayNum = 0;
                    videoInfo.TodayClickNum = 0;
                    videoInfo.HistoryNum = 0;
                    break;
                }
            }
        }
    }

    public newVideoInfo(videoId: number): IVideoViewingInfo {
        const videoInfo: IVideoViewingInfo = {
            Id: videoId,
            NextTimeMill: 0,
            TodayNum: 0,
            TodayClickNum: 0,
            HistoryNum: 0
        };
        this.Data.ArrVideoInfo.push(videoInfo);
        this.Save();
        return videoInfo;
    }

    public ResetVideoShare(videoId: number): void {
        const config = JsonClassStorage.instance.getOneJson("VideoConfig", "Id", videoId);
        if (config != null) {
            const shareInfo = this.GetShareInfo(videoId);
            if (shareInfo != null) {
                shareInfo.TodayNum++;
                shareInfo.HistoryNum++;
                this.Save();
            }
        }
    }

    public GetShareInfo(videoId: number): IVideoShareInfo | undefined {
        return this.Data.ArrShareInfo.find((info) => info.Id === videoId);
    }

    private resetShareInfo(): void {
        // Empty implementation
    }

    public newShareInfo(videoId: number): IVideoShareInfo {
        const shareInfo: IVideoShareInfo = {
            Id: videoId,
            TodayNum: 0,
            HistoryNum: 0
        };
        this.Data.ArrShareInfo.push(shareInfo);
        this.Save();
        return shareInfo;
    }
}