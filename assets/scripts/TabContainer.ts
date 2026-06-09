import { _decorator, Component, Node } from 'cc';
import { CommTabItem } from './CommTabItem';

const { ccclass, property } = _decorator;

@ccclass('TabContainer')
export class TabContainer extends Component {
    public static Event = {
        TAB_CHANGE: "tab-change"
    };

    private _items: CommTabItem[] = [];
    private _selectIndex: number = -1;

    public get items(): CommTabItem[] {
        return this._items;
    }

    public onLoad(): void {
        const children = this.node.children;
        for (let i = 0; i < children.length; i++) {
            const tabItem = children[i].getComponent(CommTabItem);
            if (tabItem) {
                this._items.push(tabItem);
                tabItem.ClickFunc = () => {
                    this.onItemClick(i);
                };
            }
        }
    }

    public getItem(index: number): CommTabItem | null {
        return this._items[index] || null;
    }

    public getSelectItem(): CommTabItem | null {
        if (this._selectIndex >= 0 && this._selectIndex < this._items.length) {
            return this._items[this._selectIndex];
        }
        return null;
    }

    public onItemClick(index: number, emitEvent: boolean = true): void {
        const oldIndex = this._selectIndex;
        if (this._selectIndex !== index) {
            this._selectIndex = index;
            for (let i = 0; i < this._items.length; i++) {
                this._items[i].UpdateTabShow(i === index);
            }
            if (emitEvent) {
                this.node.emit(TabContainer.Event.TAB_CHANGE, index, oldIndex);
            }
        }
    }

    public getIndex(): number {
        return this._selectIndex;
    }

    public setIndex(index: number, emitEvent: boolean = true): void {
        this.onItemClick(index, emitEvent);
    }
}