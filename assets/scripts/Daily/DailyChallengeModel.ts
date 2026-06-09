import { GameRecord } from "./../GameRecord";

export class DailyChallengeModel {
    static load(year: number, month: number): { year: number; month: number; finishedDays: number[] } {
        const challengeData = GameRecord.GetInstance().BaseRecorder.Data.ChallengeData;
        
        if (challengeData && challengeData.year === year && challengeData.month === month) {
            return challengeData;
        }
        
        const newChallengeData = {
            year: year,
            month: month,
            finishedDays: []
        };
        
        GameRecord.GetInstance().BaseRecorder.SaveChallengeData(newChallengeData);
        return newChallengeData;
    }

    static markFinished(day: number): void {
        const challengeData = GameRecord.GetInstance().BaseRecorder.Data.ChallengeData;
        
        if (challengeData && !challengeData.finishedDays.includes(day)) {
            challengeData.finishedDays.push(day);
            GameRecord.GetInstance().BaseRecorder.SaveChallengeData(challengeData);
        }
    }
}