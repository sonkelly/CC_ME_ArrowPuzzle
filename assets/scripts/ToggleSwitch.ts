import { _decorator, Component, Node, SpriteFrame, Enum, Vec2, Sprite, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

export enum ToggleState {
    On = 0,
    Off = 1
}

@ccclass('ToggleSwitch')
export class ToggleSwitch extends Component {
    @property({
        type: Node,
        displayName: "开关圆"
    })
    switchKnob: Node | null = null;

    @property({
        type: Node,
        displayName: "背景条"
    })
    background: Node | null = null;

    @property({
        type: SpriteFrame,
        displayName: "开启背景"
    })
    onBgSpriteFrame: SpriteFrame | null = null;

    @property({
        type: Node,
        displayName: "开启文本"
    })
    lbOn: Node | null = null;

    @property({
        type: SpriteFrame,
        displayName: "关闭背景"
    })
    offBgSpriteFrame: SpriteFrame | null = null;

    @property({
        type: Node,
        displayName: "关闭文本"
    })
    lbOff: Node | null = null;

    @property({
        type: Enum(ToggleState),
        displayName: "初始状态"
    })
    initialState: ToggleState = ToggleState.On;

    @property
    disSize: number = 75;

    currentState: ToggleState = ToggleState.On;
    onPosition: Vec2 = new Vec2(0, 0);
    offPosition: Vec2 = new Vec2(0, 0);
    onCallback: (() => void) | null = null;
    offCallback: (() => void) | null = null;

    onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnded, this);
    }

    onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnded, this);
    }

    updateVisuals(animate: boolean = true): void {
        this.updateBackground();
        this.updateKnobPosition(animate);
    }

    updateBackground(): void {
        const sprite = this.background?.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = this.currentState === ToggleState.On ? this.onBgSpriteFrame : this.offBgSpriteFrame;
        }
    }

    updateKnobPosition(animate: boolean = true): void {
        const targetPosition = this.currentState === ToggleState.On ? new Vec2(this.disSize, 0) : new Vec2(-this.disSize, 0);
        
        this.lbOn.active = this.currentState === ToggleState.Off;
        this.lbOff.active = this.currentState === ToggleState.On;

        if (animate) {
            tween(this.switchKnob)
                .to(0.2, { position: v3(targetPosition.x, targetPosition.y) })
                .start();
        } else {
            this.switchKnob?.setPosition(v3(targetPosition.x, targetPosition.y));
        }
    }

    onTouchEnded(): void {
        this.currentState = this.currentState === ToggleState.On ? ToggleState.Off : ToggleState.On;
        this.updateVisuals();

        if (this.currentState === ToggleState.On && this.onCallback) {
            this.onCallback();
        } else if (this.offCallback) {
            this.offCallback();
        }
    }

    setOnCallback(callback: () => void): void {
        this.onCallback = callback;
    }

    setOffCallback(callback: () => void): void {
        this.offCallback = callback;
    }

    getState(): ToggleState {
        return this.currentState;
    }

    setState(state: ToggleState): void {
        this.currentState = state;
        this.updateVisuals(false);
    }
}