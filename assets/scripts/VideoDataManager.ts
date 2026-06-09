import { _decorator } from 'cc';
import { GameRecord } from './GameRecord';

export class VideoDataManager {
    public static GetVideoInfo(id: number): any {
        const videoInfo = GameRecord.GetInstance().VideoRecorder.Data.ArrVideoInfo.find((info: any) => {
            return info.Id === id;
        });
        return videoInfo || GameRecord.GetInstance().VideoRecorder.newVideoInfo(id);
    }

    public static GetShareInfo(id: number): any {
        const shareInfo = GameRecord.GetInstance().VideoRecorder.Data.ArrShareInfo.find((info: any) => {
            return info.Id === id;
        });
        return shareInfo || GameRecord.GetInstance().VideoRecorder.newShareInfo(id);
    }
}