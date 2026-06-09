import { _decorator } from 'cc';
import { ConfigHelper } from './ConfigHelper';

export class GameLogicConfig {
    public static GameTag: string = "qdd_Arrow";
    public static game_setting: { language: string } = {
        language: "cn"
    };
    public static safe_size_conf: { top: number; bottom: number; left: number; right_top: { wx: number; default: number } } = {
        top: 44,
        bottom: 0,
        left: 0,
        right_top: {
            wx: 75,
            default: 0
        }
    };
    public static configVersion: string = "1.0.11";
    public static miniGameVersion: string = "1.0.11";
    public static miniIosGameVersion: string = "1.0.11";
    public static game_version: string = "1.0.11";
    public static level_version: number = 1;
    public static fbgame_version: string = "1.0.4";
    public static event_conf: { ws_msg: string; raw_data: string; change_raw_data: string; module_msg: string } = {
        ws_msg: "ws_msg",
        raw_data: "raw_data",
        change_raw_data: "change_raw_data",
        module_msg: "module_msg"
    };
    public static net_conf: { http_log_open: boolean; ws_open_log: boolean } = {
        http_log_open: true,
        ws_open_log: true
    };
    public static preload_pop_list: { main: string[]; dungeon: string[] } = {
        main: ["GameWinView", "GameWinViewWX"],
        dungeon: []
    };

    public static get configSource(): string {
        return ConfigHelper.getGameConfig().configSource || "local";
    }
}