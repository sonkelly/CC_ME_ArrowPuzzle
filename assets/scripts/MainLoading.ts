import { _decorator, Prefab } from 'cc';
import { GameAssetManager } from './GameAssetManager';
import { GameLogicConfig } from './GameLogicConfig';
import { effect_component } from './effect_component';
import { BaseLoading } from './BaseLoading';

const { ccclass } = _decorator;

@ccclass('MainLoading')
export class MainLoading extends BaseLoading {
    private static _ins: MainLoading | null = null;

    public static get ins(): MainLoading {
        if (!this._ins) {
            this._ins = new MainLoading();
        }
        return this._ins;
    }

    public preload(): void {
        GameLogicConfig.preload_pop_list.main.forEach((item: string) => {
            GameAssetManager.loadAsset("game", item, Prefab);
        });
    }

    public async load_all_res(): Promise<void> {
        const promises: Promise<any>[] = [];
        promises.push(this.load_effect_prefab());
        promises.push(effect_component.init_pool());
        await Promise.all(promises);
    }

    public async load_effect_prefab(): Promise<Prefab | null> {
        return GameAssetManager.loadAssetByPath("game", "prefab/$effect/effect_component", Prefab);
    }
}