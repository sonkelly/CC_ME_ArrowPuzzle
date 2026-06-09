import { _decorator, Component, Node, Prefab, Enum, instantiate } from 'cc';
import { ListItem } from './ListItem';

const { ccclass, property } = _decorator;

enum ContentMode {
    SINGLE = 0,
    MULTI = 1
}

@ccclass('List')
export class List extends Component {
    @property(Node)
    public itemNode: Node | null = null;

    @property(Prefab)
    public itemPrefab: Prefab | null = null;

    @property({ type: Enum(ContentMode) })
    public contentMode: ContentMode = ContentMode.SINGLE;

    @property(Node)
    public content: Node | null = null;

    @property([Node])
    public contents: Node[] = [];

    private static _data: any[] = [];
    private static indexOffset: number = 0;

    onLoad(): void {
        if (this.itemNode) {
            this.itemNode.removeFromParent();
        }
    }

    setData(data: any[]): void {
        List._data = data;
        this.hideAll();

        const source = this.itemNode || this.itemPrefab;
        if (source) {
            for (let i = 0; i < data.length; i++) {
                let child = this.content!.children[i];
                if (!child) {
                    child = instantiate(source);
                }

                if (this.contentMode === ContentMode.SINGLE) {
                    child.parent = this.content;
                } else {
                    child.parent = this.contents[i];
                }

                child.active = true;

                const listItem = child.getComponent(ListItem);
                listItem.setData(data[i], i + List.indexOffset);
                listItem.updateItem();
            }
        }
    }

    updateItems(): void {
        for (let i = 0; i < List._data.length; i++) {
            const child = this.content!.children[i];
            const listItem = child.getComponent(ListItem);
            listItem.updateItem();
        }
    }

    hideAll(): void {
        this.content!.children.forEach((child: Node) => {
            child.active = false;
        });
    }

    getItem(index: number): Node {
        return this.content!.children[index];
    }

    removeAll(): void {
        this.content!.removeAllChildren();
    }
}