import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ListItem')
export class ListItem extends Component {
    private _data: any = undefined;
    private _index: number = undefined;

    public setData(data: any, index: number): void {
        this._data = data;
        this._index = index;
    }

    public reuse(): void {
        // Override in subclass if needed
    }

    public unuse(): void {
        // Override in subclass if needed
    }

    public updateItem(): void {
        // Override in subclass if needed
    }
}