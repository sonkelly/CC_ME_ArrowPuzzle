import { _decorator, Component } from 'cc';
import { GameType } from './GlobalEnum';
import { DirectPlayUtil } from './DirectPlayUtil';

const { ccclass, property } = _decorator;

@ccclass('LevelDataManager')
export class LevelDataManager extends Component {
    private static _instance: LevelDataManager | undefined = undefined;

    public static get instance(): LevelDataManager {
        if (!LevelDataManager._instance) {
            LevelDataManager._instance = new LevelDataManager();
        }
        return LevelDataManager._instance;
    }

    public onManagerInit(): void {
        // Initialization logic if needed
    }

    public getLevelJsonName(levelId: number, gameType: GameType, param3?: any): string {
        let levelName = `$level_gen/Level_${levelId}`;

        switch (gameType) {
            case GameType.MainLevel:
            case GameType.Pvp:
                levelName = DirectPlayUtil.isDirectPlay && DirectPlayUtil.isNewUser 
                    ? `$level_gen/Zhiwan_${levelId}` 
                    : `$level_gen/Level_${levelId}`;
                break;
            case GameType.Challenge:
                const currentDate = new Date();
                levelName = `$Level/Level_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}_${levelId}`;
                break;
            case GameType.Tournament:
                levelName = `$level_gen/Level_${levelId}`;
                break;
        }

        return levelName;
    }
}