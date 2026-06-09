import { GameLogicConfig } from "./GameLogicConfig";
import { ShareImage } from "./ShareData";
import { ImageToBase64 } from "./ImageToBase64";
import { JsonClassStorage } from "./JsonClass";
import { Utilsqdd } from "./Utils/Utilsqdd";
import { EventManager } from "./Event/EventManager";
import { ModuleEventKey } from "./IGameRawData";
import { BaseDataManager } from "./BaseDataManager";

export class FB1vs1DataManager {
    private static _instance: FB1vs1DataManager;
    private diff4LevelIds: number[] = [];
    private _EntryPointData: any;

    public static get instance(): FB1vs1DataManager {
        if (!this._instance) {
            this._instance = new FB1vs1DataManager();
        }
        return this._instance;
    }

    public createClient(): void {
        /*if (SDKInstance.isFacebookMiniGame()) {
            const difficultyProfile = JsonClassStorage.instance.getTableJson("DifficultyProfile").json;
            this.diff4LevelIds = difficultyProfile
                .filter((item: any) => item.difficulty === 4 || item.difficulty === 5)
                .map((item: any) => item.level);
        }*/
    }

    public getEntryPointData(): void {
        /*if (SDKInstance.isFacebookMiniGame()) {
            this._EntryPointData = FBInstant.getEntryPointData();
            console.log("[FB1vs1DataManager] getEntryPointData :", this._EntryPointData);
            if (this._EntryPointData && this._EntryPointData.type && this._EntryPointData.type === "1vs1") {
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.PlayTPvp, this._EntryPointData.level);
            }
        }*/
    }

    public get1vs1Data(): any {
        return this._EntryPointData;
    }

    public chooseAsync(): void {
        /*if (SDKInstance.isFacebookMiniGame()) {
            console.log("[FB1vs1DataManager] chooseAsync context: ", FBInstant.context.getID());
            FBInstant.context.chooseAsync()
                .then(async () =>{
                    console.log("[FB1vs1DataManager] chooseAsync succ");
                    const level = this.levelRandomUtil();
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.PlayTPvp, level);
                })
                .catch((error: any) => {
                    console.log("[FB1vs1DataManager] chooseAsync fail: ", error);
                });
        }*/
    }

    public async updateAsync(level: number, score: number, isContinue: boolean) {
        /*if (SDKInstance.isFacebookMiniGame()) {
            const contextId = FBInstant.context.getID();
            console.log("[FB1vs1DataManager] updateAsync: ", contextId);

            const data = {
                avatar: BaseDataManager.userAvatar,
                contextId: contextId,
                level: level,
                score: score,
                name: BaseDataManager.nickName,
                playerId: BaseDataManager.uuid,
                type: "1vs1"
            };

            const image = (await ImageToBase64.convertLevelImageToBase64(level)) || ShareImage;
            const text = score > 0 ? "I scored " + score + " points👋, your turn!" : "I just finished playing, it's your turn.";
            const cta = score > 0 ? "CHALLENGE!" : "TRY IT";

            FBInstant.updateAsync({
                action: "CUSTOM",
                cta: cta,
                image: image,
                text: text,
                data: data,
                template: "play_turn",
                strategy: "IMMEDIATE",
                notification: "PUSH"
            })
            .then(() => {
                console.log("[FB1vs1DataManager] updateAsync succ");
                if (isContinue) {
                    this._EntryPointData = null;
                    EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.PlayTPvp, level);
                } else {
                    this.backToSoloContext();
                }
            })
            .catch((error: any) => {
                console.log("[FB1vs1DataManager] updateAsync fail: ", error);
            });
        }*/
    };

    public async getOpponentPlayerId() {
        /*if (SDKInstance.isFacebookMiniGame()) {
            const participants = await FBInstant.context.getParticipantsAsync();
            const playerId = BaseDataManager.uuid;
            const opponentId = participants.find((id: string) => id !== playerId) || "";
            console.log("[FB1vs1DataManager] opponentPlayerId: ", opponentId);
        }*/
    };

    public backToSoloContext(): void {
        /*if (SDKInstance.isFacebookMiniGame()) {
            const currentContextId = FBInstant.context.getID();
            console.log("[FB1vs1DataManager] switchAsync SOLO start1:", currentContextId);
            
            if (currentContextId !== null && currentContextId !== "null" && currentContextId !== "SOLO") {
                console.log("[FB1vs1DataManager] switchAsync SOLO start");
                FBInstant.context.switchAsync("SOLO", true)
                    .then(() => {
                        console.log("[FB1vs1DataManager] switchAsync SOLO succ");
                    })
                    .catch((error: any) => {
                        console.log("[FB1vs1DataManager] switchAsync SOLO error", error);
                    });
            }
        }*/
    }

    public levelRandomUtil(): number {
        if (this.diff4LevelIds.length <= 0) {
            return Utilsqdd.randomTwoNum(10, 1000);
        }
        
        const randomIndex = Math.floor(Math.random() * this.diff4LevelIds.length);
        const selectedLevel = this.diff4LevelIds[randomIndex];
        console.log("随机选中的关卡ID：", selectedLevel);
        return selectedLevel;
    }
}