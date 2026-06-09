import { _decorator, Component, Node, NodePool, UIOpacity, instantiate, tween, Tween } from 'cc';
import { GameAssetManager } from './GameAssetManager';
import { I18nManager, Language } from './I18nManager';
import { UIUtils } from './Utils/UIUtils';

const { ccclass, property } = _decorator;

@ccclass('ZanFlyEffect')
export class ZanFlyEffect extends Component {
    @property(UIOpacity)
    public uiOpacity: UIOpacity = null;

    @property(Node)
    public enNode: Node = null;

    @property([Node])
    public enText: Node[] = [];

    @property(Node)
    public zhNode: Node = null;

    @property([Node])
    public zhText: Node[] = [];

    private static pool: NodePool = new NodePool();
    private static index: number = 0;

    public static async init_pool(): Promise<void> {
        const prefab = await GameAssetManager.getAssetByPath("game", "prefab/$effect/zan");
        const count = 5 - ZanFlyEffect.pool.size();
        for (let i = 0; i < count; i++) {
            const node = instantiate(prefab);
            ZanFlyEffect.put_node(node);
        }
    }

    public static put_node(node: Node): void {
        node.setPosition(0, 0, 0);
        node.getComponent(UIOpacity).opacity = 255;
        Tween.stopAllByTarget(node);
        ZanFlyEffect.pool.put(node);
    }

    public static get_node(): Node {
        let node = ZanFlyEffect.pool.get();
        if (!node) {
            const prefab = GameAssetManager.getAssetByPath("game", "prefab/$effect/zan");
            node = instantiate(prefab);
        }
        return node;
    }

    public play(): void {
        const isEnglish = I18nManager.getLanguage() === Language.EN;
        
        if (isEnglish) {
            UIUtils.showChildsByIndex(this.enNode, ZanFlyEffect.index);
        } else {
            UIUtils.showChildsByIndex(this.zhNode, ZanFlyEffect.index);
        }
        
        this.enNode.active = isEnglish;
        this.zhNode.active = !isEnglish;
        
        ZanFlyEffect.index++;
        if (ZanFlyEffect.index >= this.enText.length) {
            ZanFlyEffect.index = 0;
        }
        
        tween(this.uiOpacity)
            .delay(0.5)
            .to(0.3, { opacity: 80 })
            .call(() => {
                this.rest();
                ZanFlyEffect.put_node(this.node);
            })
            .start();
        
        tween(this.node)
            .delay(0.5)
            .by(0.3, { y: 30 })
            .call(() => {
                this.rest();
                ZanFlyEffect.put_node(this.node);
            })
            .start();
    }

    public rest(): void {
        // Empty method for cleanup
    }
}