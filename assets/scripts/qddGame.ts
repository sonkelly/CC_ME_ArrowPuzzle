import { GameManager } from "./GameManager";
import { UIUtils } from "./Utils/UIUtils";
import { Utilsqdd } from "./Utils/Utilsqdd";
import { GmUtils } from "./Utils/GmUtils";

// Khai báo class qddGame
class qddGame {
    static Utilsqdd: typeof Utilsqdd = Utilsqdd;
    static UIUtils: typeof UIUtils = UIUtils;
    static GmUtils: typeof GmUtils = GmUtils;
    static GameManager: typeof GameManager = GameManager;
}

// Gán vào window để có thể truy cập global
(window as any).qddGame = qddGame;

export { qddGame };