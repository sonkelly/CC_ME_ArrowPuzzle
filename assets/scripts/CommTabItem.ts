import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CommTabItem')
export class CommTabItem extends Component {
    @property(Node)
    public node_select: Node | null = null;

    @property(Node)
    public node_unselect: Node | null = null;

    public ClickFunc: (() => void) | undefined;

    public UpdateTabShow(isSelected: boolean): void {
        if (this.node_select) {
            this.node_select.active = isSelected;
        }
        if (this.node_unselect) {
            this.node_unselect.active = !isSelected;
        }
    }

    public OnTabClick(): void {
        if (this.ClickFunc) {
            this.ClickFunc();
        }
    }
}