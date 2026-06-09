import { _decorator, Component, Node, Vec2, Vec3, Rect, UITransform, Input, Tween, Sprite } from 'cc';
const { ccclass, property } = _decorator;

function getBoundingBoxWorld(uit: UITransform, node: Node, outRect: Rect): Rect {
    const width = uit.width;
    const height = uit.height;
    outRect.set(-uit.anchorX * width, -uit.anchorY * height, width, height);
    outRect.transformMat4(node.worldMatrix);
    return outRect;
}

@ccclass('UIButton')
export class UIButton extends Component {
    @property({
        tooltip: "是否有交互效果"
    })
    b_interaction: boolean = true;

    @property({
        tooltip: "是否阻止事件冒泡到父节点"
    })
    b_stopPropagation: boolean = true;

    @property({
        tooltip: "交互时缩放动画的目标值",
        range: [0.7, 1, 0.01]
    })
    scaleTarget: number = 0.96;

    @property({
        tooltip: "交互时缩放动画的持续时间（毫秒）",
        range: [20, 300, 10]
    })
    duration: number = 60;

    @property({
        tooltip: "是否播放音效"
    })
    b_audioEffectWhenClick: boolean = false;

    @property({
        tooltip: "触摸防抖间隔（毫秒）- 防止误触",
        range: [50, 500, 10]
    })
    debounceTouchInterval: number = 50;

    @property({
        tooltip: "点击回调防抖间隔（毫秒）- 防止重复触发回调/网络请求",
        range: [200, 2000, 50]
    })
    clickCallbackInterval: number = 250;

    @property({
        tooltip: "移动阈值（像素）- 超过此距离视为滑动而非点击",
        range: [5, 50, 1]
    })
    movementThreshold: number = 10;

    private node_target: Node | null = null;
    private _lastTouchStartTime: number = 0;
    private _lastTouchEndTime: number = 0;
    private _currentTouchStartTime: number = 0;
    private _lastClickCallbackTime: number = 0;
    private _touchMoveValid: boolean = false;
    private _touchStartPos: Vec2 = new Vec2();
    private _touchMovedBeyondThreshold: boolean = false;
    private _registed: boolean = false;
    private _initScale: Vec3 = new Vec3(1, 1, 1);
    private _uit: UITransform | null = null;
    private _tmpVec2: Vec2 = new Vec2();
    private _cbMouseStarted: ((button: UIButton, event: any) => void) | null = null;
    private _cbMouseMoved: ((button: UIButton, event: any) => void) | null = null;
    private _cbClicked: ((button: UIButton, event: any) => Promise<void> | void) | null = null;
    private _cbStarted: ((button: UIButton, event: any) => void) | null = null;
    private _cbMoved: ((button: UIButton, event: any) => void) | null = null;
    private _cbEnded: ((button: UIButton, event: any) => void) | null = null;
    private _cbCanceled: ((button: UIButton, event: any) => void) | null = null;
    private _tmpTouchMoveRect: Rect = new Rect();

    onLoad(): void {
        this._uit = this.node.getComponent(UITransform);
        if (this._uit) {
            this.node_target = this.node;
            if (this.node_target) {
                this.node_target.getScale(this._initScale);
            }
            this._adjustScaleTarget();
        } else {
            console.error("UIButton: onLoad, node " + this.node.name + " does not have UITransform component");
        }
    }

    onEnable(): void {
        this.registerEventListeners();
    }

    onDisable(): void {
        this.unregisterEventListeners();
    }

    registerEventListeners(): void {
        if (!this._registed) {
            this._registed = true;
            this.node.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
            this.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        }
    }

    unregisterEventListeners(): void {
        if (this._registed) {
            this._registed = false;
            this.node.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
            this.node.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        }
    }

    onMouseStart(event: any): void {
        if (this.b_stopPropagation) {
            event.propagationStopped = true;
        }
        if (this._cbMouseStarted) {
            this._cbMouseStarted(this, event);
        }
    }

    onMouseMove(event: any): void {
        if (this.b_stopPropagation) {
            event.propagationStopped = true;
        }
        if (this._cbMouseMoved) {
            this._cbMouseMoved(this, event);
        }
    }

    onTouchStart(event: any): void {
        if (this.b_stopPropagation) {
            event.propagationStopped = true;
        }
        if (this.node_target) {
            this._animatePressDown(this.node_target);
        }
        if (this.debounceTouchStartValid()) {
            this._currentTouchStartTime = Date.now();
            this._touchMoveValid = true;
            this._touchMovedBeyondThreshold = false;
            event.getUILocation(this._touchStartPos);
            if (this._cbStarted) {
                this._cbStarted(this, event);
            }
        }
    }

    onTouchMove(event: any): void {
        if (!this._touchMovedBeyondThreshold) {
            const currentPos = event.getUILocation(this._tmpVec2);
            if (Vec2.distance(this._touchStartPos, currentPos) > this.movementThreshold) {
                this._touchMovedBeyondThreshold = true;
            }
        }
        if (this._uit) {
            const currentPos = event.getUILocation(this._tmpVec2);
            getBoundingBoxWorld(this._uit, this.node, this._tmpTouchMoveRect);
            if (this._touchMoveValid && !this._tmpTouchMoveRect.contains(currentPos)) {
                this._touchMoveValid = false;
                this._animateRelease(this.node_target);
                if (this._cbCanceled) {
                    this._cbCanceled(this, event);
                }
                return;
            }
        }
        if (this._cbMoved) {
            this._cbMoved(this, event);
        }
    }

    onTouchEnd = async (event: any): Promise<void> => {
        if (this.b_stopPropagation) {
            event.propagationStopped = true;
        }
        if (this.node_target) {
            this._animateRelease(this.node_target);
        }
        if (this._cbEnded) {
            this._cbEnded(this, event);
        }
        if (this.clickSureValid() && this.clickCallbackValid()) {
            if (this._cbClicked) {
                await this._cbClicked(this, event);
            }
            this._lastClickCallbackTime = Date.now();
        }
    };

    onTouchCancel(event: any): void {
        if (this.b_stopPropagation) {
            event.propagationStopped = true;
        }
        if (this._cbCanceled) {
            this._cbCanceled(this, event);
        }
        if (this.node_target) {
            this._animateRelease(this.node_target);
        }
    }

    debounceTouchStartValid(): boolean {
        const now = Date.now();
        if (now - this._lastTouchStartTime < this.debounceTouchInterval) {
            return false;
        }
        this._lastTouchStartTime = now;
        return true;
    }

    clickSureValid(): boolean {
        return !!this._touchMoveValid && !this._touchMovedBeyondThreshold;
    }

    clickCallbackValid(): boolean {
        return !(Date.now() - this._lastClickCallbackTime < this.clickCallbackInterval);
    }

    private _adjustScaleTarget(): void {
        const uit = this.node.getComponent(UITransform);
        const width = uit ? uit.width : undefined;
        if (width && (Math.abs(this._initScale.x - this._initScale.x * this.scaleTarget) * width < 16 && this._initScale.x !== 0)) {
            const sign = this.scaleTarget < 1 ? -1 : 1;
            this.scaleTarget = (this._initScale.x * width + 16 * sign) / (this._initScale.x * width);
        }
    }

    private _animatePressDown(target: Node): void {
        if (target && this.b_interaction) {
            target.setScale(
                this._initScale.x * this.scaleTarget,
                this._initScale.y * this.scaleTarget,
                this._initScale.z
            );
        }
    }

    private _animateRelease(target: Node | null): void {
        if (target && this.b_interaction) {
            if (target.scale.x !== this._initScale.x || target.scale.y !== this._initScale.y) {
                Tween.stopAllByTarget(target);
                target.setScale(this._initScale.x, this._initScale.y, this._initScale.z);
            }
        }
    }

    onClicked(callback: ((button: UIButton, event: any) => Promise<void> | void) | null): void {
        if (this._cbClicked) {
            this._cbClicked = null;
        }
        this._cbClicked = callback;
    }

    onMouseStarted(callback: ((button: UIButton, event: any) => void) | null): void {
        if (this._cbMouseStarted) {
            this._cbMouseStarted = null;
        }
        this._cbMouseStarted = callback;
    }

    onMouseMoved(callback: ((button: UIButton, event: any) => void) | null): void {
        if (this._cbMouseMoved) {
            this._cbMouseMoved = null;
        }
        this._cbMouseMoved = callback;
    }

    onStarted(callback: ((button: UIButton, event: any) => void) | null): void {
        if (this._cbStarted) {
            this._cbStarted = null;
        }
        this._cbStarted = callback;
    }

    onMoved(callback: ((button: UIButton, event: any) => void) | null): void {
        if (this._cbMoved) {
            this._cbMoved = null;
        }
        this._cbMoved = callback;
    }

    onEnded(callback: ((button: UIButton, event: any) => void) | null): void {
        if (this._cbEnded) {
            this._cbEnded = null;
        }
        this._cbEnded = callback;
    }

    onCanceled(callback: ((button: UIButton, event: any) => void) | null): void {
        if (this._cbCanceled) {
            this._cbCanceled = null;
        }
        this._cbCanceled = callback;
    }

    enableClick(enabled: boolean): void {
        if (enabled) {
            this.registerEventListeners();
        } else {
            this.unregisterEventListeners();
        }
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.grayscale = !enabled;
        }
        this._animateRelease(this.node_target);
    }

    enableClickVisual(enabled: boolean): void {
        const sprite = this.node.getComponent(Sprite);
        if (sprite) {
            sprite.grayscale = !enabled;
        }
        this._animateRelease(this.node_target);
    }

    enableClickAction(enabled: boolean): void {
        if (enabled) {
            this.registerEventListeners();
        } else {
            this.unregisterEventListeners();
        }
    }

    static onClicked(buttonOrNode: UIButton | Node, callback: ((button: UIButton, event: any) => Promise<void> | void) | null): UIButton | null {
        if (buttonOrNode instanceof UIButton) {
            buttonOrNode.onClicked(callback);
            return buttonOrNode;
        }
        if (buttonOrNode instanceof Node) {
            let button = buttonOrNode.getComponent(UIButton);
            if (!button) {
                button = buttonOrNode.addComponent(UIButton);
            }
            button.onClicked(callback);
            return button;
        }
        console.error("UIButton: onClicked, buttonOrNode is null / type not match ");
        return null;
    }

    static onMouseStarted(buttonOrNode: UIButton | Node, callback: ((button: UIButton, event: any) => void) | null): void {
        if (buttonOrNode instanceof UIButton) {
            buttonOrNode.onMouseStarted(callback);
        } else if (buttonOrNode instanceof Node) {
            const button = buttonOrNode.getComponent(UIButton);
            if (button) {
                button.onMouseStarted(callback);
            } else {
                console.warn("UIButton: onMouseStarted, node " + buttonOrNode.name + " does not have UIButton component");
            }
        } else {
            console.warn("UIButton: onMouseStarted, invalid parameter type");
        }
    }

    static onMouseMoved(buttonOrNode: UIButton | Node, callback: ((button: UIButton, event: any) => void) | null): void {
        if (buttonOrNode instanceof UIButton) {
            buttonOrNode.onMouseMoved(callback);
        } else if (buttonOrNode instanceof Node) {
            const button = buttonOrNode.getComponent(UIButton);
            if (button) {
                button.onMouseMoved(callback);
            } else {
                console.warn("UIButton: onMouseMoved, node " + buttonOrNode.name + " does not have UIButton component");
            }
        } else {
            console.warn("UIButton: onMouseMoved, invalid parameter type");
        }
    }

    static onStarted(buttonOrNode: UIButton | Node, callback: ((button: UIButton, event: any) => void) | null): void {
        if (buttonOrNode instanceof UIButton) {
            buttonOrNode.onStarted(callback);
        } else if (buttonOrNode instanceof Node) {
            const button = buttonOrNode.getComponent(UIButton);
            if (button) {
                button.onStarted(callback);
            } else {
                console.warn("UIButton: onStarted, node " + buttonOrNode.name + " does not have UIButton component");
            }
        } else {
            console.warn("UIButton: onStarted, invalid parameter type");
        }
    }

    static onMoved(buttonOrNode: UIButton | Node, callback: ((button: UIButton, event: any) => void) | null): void {
        if (buttonOrNode instanceof UIButton) {
            buttonOrNode.onMoved(callback);
        } else if (buttonOrNode instanceof Node) {
            const button = buttonOrNode.getComponent(UIButton);
            if (button) {
                button.onMoved(callback);
            } else {
                console.warn("UIButton: onMoved, node " + buttonOrNode.name + " does not have UIButton component");
            }
        } else {
            console.warn("UIButton: onMoved, invalid parameter type");
        }
    }

    static onEnded(buttonOrNode: UIButton | Node, callback: ((button: UIButton, event: any) => void) | null): void {
        if (buttonOrNode instanceof UIButton) {
            buttonOrNode.onEnded(callback);
        } else if (buttonOrNode instanceof Node) {
            const button = buttonOrNode.getComponent(UIButton);
            if (button) {
                button.onEnded(callback);
            } else {
                console.warn("UIButton: onEnded, node " + buttonOrNode.name + " does not have UIButton component");
            }
        } else {
            console.warn("UIButton: onEnded, invalid parameter type");
        }
    }

    static onCanceled(buttonOrNode: UIButton | Node, callback: ((button: UIButton, event: any) => void) | null): void {
        if (buttonOrNode instanceof UIButton) {
            buttonOrNode.onCanceled(callback);
        } else if (buttonOrNode instanceof Node) {
            const button = buttonOrNode.getComponent(UIButton);
            if (button) {
                button.onCanceled(callback);
            } else {
                console.warn("UIButton: onCanceled, node " + buttonOrNode.name + " does not have UIButton component");
            }
        } else {
            console.warn("UIButton: onCanceled, invalid parameter type");
        }
    }

    static enableClick(buttonOrNode: UIButton | Node, enabled: boolean): void {
        if (buttonOrNode instanceof UIButton) {
            buttonOrNode.enableClick(enabled);
        } else if (buttonOrNode instanceof Node) {
            const button = buttonOrNode.getComponent(UIButton);
            if (button) {
                button.enableClick(enabled);
            } else {
                console.warn("UIButton: enableClick, node " + buttonOrNode.name + " does not have UIButton component");
            }
        } else {
            console.warn("UIButton: enableClick, invalid parameter type");
        }
    }
}