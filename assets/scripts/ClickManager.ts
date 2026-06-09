import { _decorator, Component, Node, Vec2, Vec3, input, Input, UIOpacity, tween, UITransform } from 'cc';
import { Toast } from './Toast';
import { ArrowItem } from './ArrowItem';
import { ArrowGameConfig } from './ArrowGameConfig';
import { VibrateManager } from './VibrateManager';

const { ccclass, property } = _decorator;

@ccclass('ClickManager')
export class ClickManager extends Component {
    @property(Node)
    clickNode: Node = null;

    @property(Node)
    circleNode: Node = null;

    private lastTouchStartPos: Vec2 = new Vec2();
    private isTouchMoved: boolean = false;
    private isTouching: boolean = false;
    private maxDis: number = 20;
    private touchStartPos: Vec3 = new Vec3();
    private v3Tmp2: Vec3 = new Vec3();
    private v3Tmp3: Vec3 = new Vec3();
    private curStage: any = null;
    private tmpv3: Vec3 = new Vec3();
    private scale_One: Vec3 = new Vec3(0.5, 0.5, 1);
    private scale_Two: Vec3 = new Vec3(1.3, 1.3, 1.3);
    private uiOpacity: UIOpacity = undefined;
    private _tempVec1: Vec3 = new Vec3();
    private _tempVec2: Vec3 = new Vec3();
    private _clickTween: any = null;
    private _opacityTween: any = null;
    private _isLongPressTriggered: boolean = false;
    private LONG_PRESS_TIME: number = 300;
    private _longPressTimer: any = null;

    init(stage: any): void {
        this.curStage = stage;
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.uiOpacity = this.circleNode.getComponent(UIOpacity);
        this._clickTween = tween(this.circleNode).to(0.25, {
            scale: this.scale_Two
        }, {
            easing: "sineOut"
        });
        this._opacityTween = tween(this.uiOpacity).to(0.25, {
            opacity: 30
        }, {
            easing: "sineOut"
        }).call(() => {
            this.clickNode.active = false;
        });
    }

    onDestroy(): void {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    playClickAnim(touch: any): void {
        if (this._clickTween) {
            this._clickTween.stop();
        }
        if (this._opacityTween) {
            this._opacityTween.stop();
        }
        this.uiOpacity.opacity = 100;
        this.circleNode.setScale(this.scale_One);
        this.clickNode.active = true;
        const touchPos = this.getTouchPos(touch);
        this.clickNode.setPosition(touchPos.x, touchPos.y);
        this._clickTween.start();
        this._opacityTween.start();
    }

    onTouchStart(touch: any): void {
        if (this.curStage.ready && !this.curStage.isFail) {
            Vec2.copy(this.lastTouchStartPos, touch.getLocation());
            this.isTouchMoved = false;
            this.isTouching = true;
            this._isLongPressTriggered = false;
            this._longPressTimer = setTimeout(() => {
                if (!this.isTouchMoved) {
                    this._isLongPressTriggered = true;
                    const arrowItem = this.getArrowItem1(touch);
                    if (arrowItem) {
                        this.curStage.showArrowGrid(arrowItem.arrowComp);
                        VibrateManager.instance.vibrateShort();
                    }
                }
            }, this.LONG_PRESS_TIME);
        }
    }

    onTouchMove(touch: any): void {
        if (this.curStage.ready && !this.curStage.isFail) {
            if (touch.getLocation().subtract(this.lastTouchStartPos).length() > 5) {
                this.isTouchMoved = true;
            }
            this.isTouching = false;
        }
    }

    onTouchEnd(touch: any): void {
        if (this.curStage.ready && !this.curStage.isFail) {
            if (this._longPressTimer) {
                clearTimeout(this._longPressTimer);
                this._longPressTimer = null;
            }
            if (!this.isTouchMoved && !this._isLongPressTriggered) {
                this.playClickAnim(touch);
                const arrowItem = this.getArrowItem1(touch);
                if (arrowItem) {
                    arrowItem.onTap(this.clickNode.position);
                }
            }
            this.isTouching = false;
        } else {
            if (!this.curStage.ready) {
                Toast.instance.tip_div("Level loading");
            }
        }
    }

    getArrowItem(touch: any): any {
        const camera = this.curStage.gameCamera.camera;
        const location = touch.getLocation();
        const worldPos = new Vec3();
        camera.screenToWorld(new Vec3(location.x, location.y, 0), worldPos);
        const arrowItems = this.curStage.arrowParent.getComponentsInChildren(ArrowItem).filter((item: ArrowItem) => {
            return !item.skip;
        });
        for (const arrowItem of arrowItems) {
            for (const gridItem of arrowItem.gridItems) {
                const uiTransform = gridItem.node.getComponent(UITransform);
                if (uiTransform) {
                    if (uiTransform.getBoundingBoxToWorld().contains(new Vec2(worldPos.x, worldPos.y))) {
                        return gridItem;
                    }
                }
            }
        }
        return null;
    }

    getArrowItem1(touch: any): any {
        const arrows = this.curStage.arrows.filter((arrow: any) => {
            return !arrow.skip;
        });
        let closestItem = null;
        if (arrows.length > 0) {
            this.refreshDis(arrows[0]);
            const allGridItems = arrows.flatMap((arrow: any) => {
                return arrow.gridItems;
            });
            let minDistance = this.maxDis;
            const touchPos = this.getTouchPos(touch);
            allGridItems.forEach((gridItem: any) => {
                const uiPos = this.curStage.gameCamera.camera.convertToUINode(gridItem.node.worldPosition, this.node);
                uiPos.z = 0;
                Vec3.subtract(this._tempVec2, uiPos, touchPos);
                const distance = this._tempVec2.length();
                if (distance < minDistance) {
                    minDistance = distance;
                    closestItem = gridItem;
                }
            });
        }
        return closestItem;
    }

    refreshDis(arrow: any): void {
        const gridItems = arrow.gridItems;
        const firstItem = gridItems[0];
        const secondItem = gridItems[1];
        const firstUIPos = this.curStage.gameCamera.camera.convertToUINode(firstItem.node.worldPosition, this.node);
        const secondUIPos = this.curStage.gameCamera.camera.convertToUINode(secondItem.node.worldPosition, this.node);
        Vec3.subtract(this._tempVec1, firstUIPos, secondUIPos);
        const distance = this._tempVec1.length();
        this.maxDis = distance * ArrowGameConfig.maxDis;
    }

    getTouchPos(touch: any): Vec3 {
        this.touchStartPos.set(0, 0, 0);
        touch.getUILocation(this.touchStartPos);
        const uiTransform = this.node.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.convertToNodeSpaceAR(this.touchStartPos, this.v3Tmp2);
        }
        return this.v3Tmp2;
    }
}