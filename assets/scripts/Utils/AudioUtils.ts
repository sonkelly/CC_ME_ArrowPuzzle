import { director } from "cc";
import { AudioManager } from "./../AudioManager";
import { SceneNameEnum } from "./../GlobalEnum";

export class AudioUtils {
    public static btn_click_sound(): void {
        AudioManager.instance.load_and_play_effect("button_click", false, "core");
    }

    public static btn_open_sound(): void {
        // Empty function
    }

    public static btn_close_sound(): void {
        AudioManager.instance.load_and_play_effect("button_click", false, "core");
    }

    public static drop_ani_sound(): void {
        AudioManager.instance.load_and_play_effect("reveiceItem", false, "game");
    }

    public static game_win(): void {
        if (SDKInstance.isFacebookMiniGame()) {
            AudioManager.instance.load_and_play_effect("win", false, "game");
        } else {
            AudioManager.instance.load_and_play_effect("win1", false, "game");
        }
    }

    public static game_fail(): void {
        AudioManager.instance.load_and_play_effect("fail", false, "game");
    }

    public static play_scene_bgm(): void {
        let bgmName: string = "";
        let bundleName: string = "game";

        switch (director.getScene().name) {
            case SceneNameEnum.MainScene:
            case SceneNameEnum.GameScene:
                bundleName = "game";
                bgmName = "BGM_01";
                break;
        }

        AudioManager.instance.load_and_play_bgm(bgmName, true, bundleName);
    }

    public static play_bgm(bgmName: string): void {
        AudioManager.instance.load_and_play_bgm(bgmName, true, "game");
    }
}