import { _decorator, Component, Label, Node } from 'cc';
import { DayState } from './GlobalEnum';

const { ccclass, property } = _decorator;

@ccclass('DayItem')
export class DayItem extends Component {
    @property(Label)
    public dayLabel: Label = null!;

    @property(Node)
    public todayRing: Node = null!;

    @property(Node)
    public selected: Node = null!;

    public day: number = 0;
    public state: DayState | undefined = undefined;
    public dayOutMonth: boolean = false;

    public init(day: number, state: DayState, dayOutMonth: boolean, todayDates: number[], callback: (day: number, state: DayState) => void): void {
        this.day = day;
        this.state = state;
        this.dayOutMonth = dayOutMonth;

        if (this.dayOutMonth) {
            this.dayLabel.node.active = false;
            this.todayRing.active = false;
            this.selected.active = false;
            return;
        }

        this.selected.active = state === DayState.Today;
        this.todayRing.active = this.state === DayState.Today;
        this.dayLabel.node.active = true;
        this.dayLabel.string = day.toString();

        if (state === DayState.Today) {
            this.dayLabel.color.fromHEX(todayDates.includes(day) ? "#808082" : "#FFFFFF");
        } else {
            this.dayLabel.color.fromHEX(state === DayState.Done ? "#808082" : "#FFFFFF");
        }

        this.node.off(Node.EventType.TOUCH_END);
        if (this.canClick()) {
            this.node.on(Node.EventType.TOUCH_END, () => {
                callback(this.day, this.state!);
            });
        }
    }

    public setSelect(isSelected: boolean): void {
        if (!this.dayOutMonth) {
            this.selected.active = isSelected;
        }
    }

    public canClick(): boolean {
        return !this.dayOutMonth && (this.state === DayState.Today || this.state === DayState.Missed);
    }
}