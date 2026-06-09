import { _decorator, Component, Node, Camera, Vec2, Vec3, v2, view, input, Input, math, v3, tween } from 'cc';
import { GameController } from './GameController';
import { ModuleEventKey } from './IGameRawData';
import { EventManager } from './Event/EventManager';
import { GameLogicConfig } from './GameLogicConfig';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

@ccclass('StageCamera')
export class StageCamera extends Component {
    @property(Node)
    arrowContainer: Node | null = null;

    @property(Camera)
    camera: Camera | null = null;

    @property
    ratio: number = 1;

    firstTouchPos: Vec2 = new Vec2();
    isScale: boolean = false;
    lastDis: number = 0;
    isInZoom: boolean = false;
    minOrthoHeight: number = 80;
    maxOrthoHeight: number = 300;
    cameraTargetPos: Vec3 = new Vec3();
    rectMinX: number = -500;
    rectMaxX: number = 500;
    rectMinY: number = -300;
    rectMaxY: number = 300;
    progress: number = 0;
    focusing: boolean = false;
    isHard: boolean = false;
    _tempVec1: Vec3 = new Vec3();
    viewHight: number | undefined;
    isWx: boolean = true;
    isSlidering: boolean = false;
    isDragging: boolean = false;
    dragStartPos: Vec2 = v2();

    onLoad(): void {
        this.isWx = SDKInstance.isWxPlatform();
        if (this.isWx) {
            this.viewHight = wx.getWindowInfo().screenHeight;
            wx.onTouchStart((event: any) => {
                this.onTouchStart(event);
            });
            wx.onTouchMove((event: any) => {
                this.onTouchMove(event);
            });
            wx.onTouchEnd((event: any) => {
                this.onTouchEnd(event);
            });
            wx.onTouchCancel((event: any) => {
                this.onTouchEnd(event);
            });
        } else {
            const visibleSize = view.getVisibleSize();
            this.viewHight = visibleSize.height;
            input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
            input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
            input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
            input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        }
        input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    onMouseWheel(event: any): void {
        const scrollY = event.getScrollY();
        if (scrollY > 0) {
            this.updateOrthoHeight(0.1);
        } else if (scrollY < 0) {
            this.updateOrthoHeight(-0.1);
        }
        const curGuideStep = GameManager.instance.curStage.curGuideStep;
        if (curGuideStep === 4 || curGuideStep === 5) {
            GameManager.instance.curStage.checkGuide(false, 5);
        }
    }

    onTouchStart(event: any): void {
        const touches = this.isWx ? event.touches : event.getAllTouches();
        if (touches.length === 1) {
            if (this.isWx) {
                this.firstTouchPos.set(touches[0].pageX, touches[0].pageY);
            } else {
                this.firstTouchPos = event.getUILocation();
            }
            this.dragStartPos.set(this.firstTouchPos.x, this.firstTouchPos.y);
            this.isDragging = false;
        } else if (touches.length === 2) {
            this.isInZoom = true;
            if (this.isWx) {
                this.lastDis = this.getTouchDis(
                    touches[0].pageX, touches[0].pageY,
                    touches[1].pageX, touches[1].pageY
                );
            } else {
                const touch1 = touches[0].getUILocation();
                const touch2 = touches[1].getUILocation();
                this.lastDis = this.getTouchDis(touch1.x, touch1.y, touch2.x, touch2.y);
            }
        }
    }

    onTouchMove(event: any): void {
        const touches = this.isWx ? event.touches : event.getAllTouches();
        if (touches.length !== 2) {
            if (!this.isInZoom && touches.length === 1 && !this.isSlidering) {
                const currentPos = this.isWx ? v2(touches[0].pageX, touches[0].pageY) : event.getUILocation();
                if (!this.isDragging) {
                    const deltaX = currentPos.x - this.dragStartPos.x;
                    const deltaY = currentPos.y - this.dragStartPos.y;
                    if (deltaX * deltaX + deltaY * deltaY < 900) {
                        return;
                    }
                    this.isDragging = true;
                    Vec2.copy(this.firstTouchPos, currentPos);
                    return;
                }
                const deltaX = currentPos.x - this.firstTouchPos.x;
                const deltaY = currentPos.y - this.firstTouchPos.y;
                const scale = 2 * this.camera.orthoHeight / this.viewHight;
                const moveX = -deltaX * scale;
                const moveY = (this.isWx ? 1 : -1) * deltaY * scale;
                Vec3.copy(this._tempVec1, this.camera.node.position);
                this._tempVec1.x += moveX;
                this._tempVec1.y += moveY;
                this.cameraTargetPos = this.clampPosition(this._tempVec1);
                this.camera.node.setPosition(this.cameraTargetPos);
                Vec2.copy(this.firstTouchPos, currentPos);
            }
        } else {
            if (this.isScale) {
                let currentDis: number;
                if (this.isWx) {
                    currentDis = this.getTouchDis(
                        touches[0].pageX, touches[0].pageY,
                        touches[1].pageX, touches[1].pageY
                    );
                } else {
                    const touch1 = touches[0].getUILocation();
                    const touch2 = touches[1].getUILocation();
                    currentDis = this.getTouchDis(touch1.x, touch1.y, touch2.x, touch2.y);
                }
                const deltaDis = currentDis - this.lastDis;
                if (Math.abs(deltaDis) < 2) {
                    return;
                }
                let orthoHeight = this.camera?.orthoHeight || 100;
                orthoHeight += deltaDis > 0 ? -3 : 3;
                orthoHeight = math.clamp(orthoHeight, this.minOrthoHeight, this.maxOrthoHeight);
                if (this.camera) {
                    this.camera.orthoHeight = orthoHeight;
                }
                const progress = (orthoHeight - this.minOrthoHeight) / (this.maxOrthoHeight - this.minOrthoHeight);
                EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateZoomSlider, 1 - progress);
                this.isInZoom = true;
                this.lastDis = currentDis;
            } else {
                if (this.isWx) {
                    this.lastDis = this.getTouchDis(
                        touches[0].pageX, touches[0].pageY,
                        touches[1].pageX, touches[1].pageY
                    );
                } else {
                    const touch1 = touches[0].getUILocation();
                    const touch2 = touches[1].getUILocation();
                    this.lastDis = this.getTouchDis(touch1.x, touch1.y, touch2.x, touch2.y);
                }
                this.isScale = true;
            }
            this.isDragging = false;
            const curGuideStep = GameManager.instance.curStage?.curGuideStep;
            if (curGuideStep === 4 || curGuideStep === 5) {
                GameManager.instance.curStage.checkGuide(false, 5);
            }
        }
    }

    onTouchEnd(event: any): void {
        this.isScale = false;
        this.isInZoom = false;
        this.isDragging = false;
        const touches = this.isWx ? event.touches : event.getAllTouches();
        if (touches.length > 0) {
            if (this.isWx) {
                this.firstTouchPos = v2(touches[0].pageX, touches[0].pageY);
            } else {
                this.firstTouchPos = touches[0].getUILocation();
            }
        }
    }

    updateOrthoHeight(delta: number): void {
        this.progress += delta;
        this.progress = math.clamp(this.progress, 0, 1);
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateZoomSlider, this.progress);
        const orthoHeight = this.minOrthoHeight + (this.maxOrthoHeight - this.minOrthoHeight) * (1 - this.progress);
        this.camera.orthoHeight = orthoHeight;
    }

    sliderUpdateOrthoHeight(value: number): void {
        this.progress = value;
        this.progress = math.clamp(this.progress, 0, 1);
        const orthoHeight = this.minOrthoHeight + (this.maxOrthoHeight - this.minOrthoHeight) * (1 - this.progress);
        this.camera.orthoHeight = orthoHeight;
    }

    update(deltaTime: number): void {
        if (this.camera && !GameController.instance.is_pause && !this.focusing) {
            const lerpPosition = this.camera.node.position.lerp(this.cameraTargetPos, 0.2);
            this.camera.node.position = lerpPosition;
        }
    }

    resetCameraLocation(): void {
        this.cameraTargetPos = Vec3.ZERO;
        this.camera.node.position = this.cameraTargetPos;
    }

    getTouchDis(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    setMoveRect(minX: number, maxX: number, minY: number, maxY: number, isHard: boolean, isInit: boolean = false): void {
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const halfWidth = (maxX - minX) / 2 * this.ratio;
        const halfHeight = (maxY - minY) / 2 * this.ratio;
        this.rectMinX = centerX - halfWidth;
        this.rectMaxX = centerX + halfWidth;
        this.rectMinY = centerY - halfHeight;
        this.rectMaxY = centerY + halfHeight;
        this.isHard = isHard;
        this.claOrthoHeight(minX, maxX, minY, maxY, isHard, isInit);
    }

    claOrthoHeight(minX: number, maxX: number, minY: number, maxY: number, isHard: boolean, isInit: boolean = false): void {
        let width = maxX - minX + 50;
        if (maxY / maxX < 2) {
            width = maxX - minX + 50;
        } else {
            width = 0.5 * (maxX - minX + (maxY - minY));
        }
        this.focusing = false;
        const visibleSize = view.getVisibleSize();
        let aspectRatio = visibleSize.width / visibleSize.height;
        if (visibleSize.width > visibleSize.height) {
            aspectRatio = visibleSize.height / visibleSize.width;
        }
        const orthoHeight = width / aspectRatio / 2;
        console.log("claOrthoHeight to: " + orthoHeight);
        this.maxOrthoHeight = orthoHeight;
        this.minOrthoHeight = isHard ? Math.max(60, orthoHeight - 0.9 * width) : Math.max(60, orthoHeight - 0.5 * width);
        if (this.camera) {
            this.camera.orthoHeight = this.minOrthoHeight + 0.35 * (this.maxOrthoHeight - this.minOrthoHeight);
        }
        this.progress = 0;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateZoomSlider, 0);
        if (isInit) {
            const platform = SDKInstance.getPlatform();
            this.cameraTargetPos = (platform === "IOS" || platform === "ANDROID") ? Vec3.ZERO : v3(0, -25);
        } else {
            this.cameraTargetPos = Vec3.ZERO;
        }
        this.progress = 0.2;
        EventManager.emit(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateZoomSlider, this.progress);
        tween(this.camera)
            .to(1, { orthoHeight: this.maxOrthoHeight })
            .to(1, { orthoHeight: this.maxOrthoHeight - 0.2 * (this.maxOrthoHeight - this.minOrthoHeight) })
            .start();
    }

    clampPosition(position: Vec3): Vec3 {
        const clampedX = Math.min(Math.max(position.x, this.rectMinX), this.rectMaxX);
        const clampedY = Math.min(Math.max(position.y, this.rectMinY), this.rectMaxY);
        this._tempVec1.set(clampedX, clampedY, position.z);
        return this._tempVec1;
    }

    async focusToTarget(target: Vec3): Promise<void> {
        if (this.camera) {
            this.focusing = true;
            const clampedPosition = this.clampPosition(new Vec3(target.x, target.y, this.camera.node.position.z));
            tween(this.camera.node)
                .to(0.25, { position: clampedPosition })
                .call(() => {
                    this.cameraTargetPos = clampedPosition;
                    this.focusing = false;
                })
                .start();
        }
    }
}