import { _decorator, Component, Prefab, instantiate, Node } from 'cc';
import { Queue } from './Queue';
import { UIManager } from './UIManager';

const { ccclass, property } = _decorator;

@ccclass('LoadingView')
export class LoadingView extends Component {
    private static index: number = 0;
    private static loadNode: Node | null = null;
    private static queue: Queue = new Queue();

    public static showOrHide(show: boolean): void {
        const self = this;
        self.queue.push(() => {
            return new Promise<void>(async (resolve) => {
                if (show) {
                    await self.showLoading();
                    resolve();
                } else {
                    await self.hideLoading();
                    resolve();
                }
            });
        });
    }

    public static async showLoading(): Promise<void> {
        const self = this;
        LoadingView.index++;

        if (LoadingView.loadNode && LoadingView.loadNode.isValid) {
            LoadingView.loadNode.setSiblingIndex(999);
        } else {
            const prefab: Prefab = await UIManager.loadAsset("core", "LoadingView", Prefab);
            const node: Node = instantiate(prefab);
            node.parent = UIManager.default_parent;
            node.layer = node.parent.layer;
            LoadingView.loadNode = node;
        }

        let timeoutDuration: number = 20;
        if (SDKInstance.isFourThreeNineNinePlatform()) {
            timeoutDuration = 5;
        }

        setTimeout(() => {
            if (!SDKInstance.isTwoThreeThreeNative() && !SDKInstance.isHuaWeiNative()) {
                self.hideLoading();
            }
        }, timeoutDuration * 1000);
    }

    public static hideLoading(): void {
        LoadingView.index--;
        if (LoadingView.index <= 0) {
            if (LoadingView.loadNode && LoadingView.loadNode.isValid) {
                LoadingView.loadNode.destroy();
            }
            LoadingView.loadNode = null;
        }
    }
}