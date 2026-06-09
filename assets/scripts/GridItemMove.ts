import { _decorator, Component, SpriteFrame, Sprite, Vec3, Color, tween } from 'cc';
import { ArrowGameConfig } from './ArrowGameConfig';
import { GameManager } from './GameManager';
import { GridType, ItemColor } from './GridItem';
import { CCExtends } from './CCExtends';

const { ccclass, property } = _decorator;

@ccclass('GridItemMove')
export class GridItemMove extends Component {
    @property(SpriteFrame)
    normalSpriteFrame: SpriteFrame | null = null;

    @property(SpriteFrame)
    cornerSpriteFrame: SpriteFrame | null = null;

    @property(Sprite)
    sprite: Sprite | null = null;

    @property(Vec3)
    initAngle: Vec3 = new Vec3(0, 0, 0);

    gridType: GridType = GridType.None;
    curSegmentIndex: number = 0;
    currentPos: Vec3 = new Vec3();
    curAngle: Vec3 = new Vec3();
    normalColor: Color = ArrowGameConfig.COLOR_NORMAL;
    spTween1: any = undefined;
    spTween2: any = undefined;
    segmentLinePos: Vec3[] | undefined = undefined;
    initIndex: number | undefined = undefined;
    initPos: Vec3 = new Vec3();
    curPoint: Vec3 | undefined = undefined;
    nextPoint: Vec3 | undefined = undefined;
    spHintTw: any = undefined;
    tmpAngle: Vec3 = new Vec3();
    isConnor: boolean = false;
    _isCornerShowing: boolean = false;
    _colorType: number | undefined = undefined;
    _isError: boolean | undefined = undefined;
    _tempVec3: Vec3 = new Vec3();
    _tempVec3_1: Vec3 = new Vec3();
    _tempEuler: Vec3 = new Vec3();

    init(colorType: number, isError: boolean = false, isCorner: boolean = false): void {
        this._colorType = colorType;
        this._isError = isError;
        this.normalColor = isError
            ? (GameManager.instance.curSkin === 0 ? ArrowGameConfig.COLOR_ERROR1 : ArrowGameConfig.COLOR_ERROR2)
            : (GameManager.instance.curSkin === 0 ? ArrowGameConfig.arrowColors[colorType - 1] : ArrowGameConfig.COLOR_SINGLE);
        this.applyCornerSprite(isCorner);
        this.sprite!.color = this.normalColor;
        if (this.spTween1) this.spTween1.stop();
        if (this.spTween2) this.spTween2.stop();
        if (this.spHintTw) this.spHintTw.stop();
        this.isConnor = isCorner;
    }

    resetColor(): void {
        this.normalColor = this._isError
            ? (GameManager.instance.curSkin === 0 ? ArrowGameConfig.COLOR_ERROR1 : ArrowGameConfig.COLOR_ERROR2)
            : (GameManager.instance.curSkin === 0 ? ArrowGameConfig.arrowColors[this._colorType! - 1] : ArrowGameConfig.COLOR_SINGLE);
        this.sprite!.color = this.normalColor;
    }

    initPosition(segmentLinePos: Vec3[], segmentIndex: number, gridType: GridType, pos: Vec3, isTailEnd : boolean, isCorner: boolean = false, calcAngle: boolean = false): void {
        this.curSegmentIndex = segmentIndex;
        this.segmentLinePos = segmentLinePos;
        this.initIndex = segmentIndex;
        this.gridType = gridType;
        this.isConnor = isCorner;
        Vec3.copy(this.currentPos, pos);
        this.node.setPosition(pos);
        Vec3.copy(this.initPos, pos);
        if (calcAngle) {
            this.getAngle(this.curSegmentIndex, this.curSegmentIndex + 1, true);
        }
    }

    updateMove(dt: number): void {
        Vec3.copy(this._tempVec3, this.currentPos);
        const prevPos = this._tempVec3;

        this.nextPoint = this.segmentLinePos![this.curSegmentIndex + 1];
        this.curPoint = this.segmentLinePos![this.curSegmentIndex];

        if (this.curSegmentIndex + 1 >= this.segmentLinePos!.length) {
            this.updateEndPosByDir();
        } else {
            const moveResult = this.moveStraight(this.curSegmentIndex, this.currentPos, ArrowGameConfig.moveLen);
            const newIndex = moveResult[0];
            const newPos = moveResult[1];

            this.applyCornerSprite(false);
            this.currentPos = newPos;

            if (this.curSegmentIndex !== newIndex && newIndex < this.segmentLinePos!.length - 1) {
                const passedPoint = this.segmentLinePos![newIndex];
                if (this.passedPoint(prevPos, this.currentPos, passedPoint)) {
                    this.applyCornerSprite(true);
                }
            }
            this.curSegmentIndex = newIndex;
        }
        CCExtends.SetNodePosition(this.node, this.currentPos);
    }

    passedPoint(prevPos: Vec3, currentPos: Vec3, point: Vec3): boolean {
        return (prevPos.x !== point.x || prevPos.y !== point.y) &&
            (prevPos.x === currentPos.x
                ? (prevPos.y <= point.y && currentPos.y >= point.y) || (prevPos.y >= point.y && currentPos.y <= point.y)
                : prevPos.y === currentPos.y && ((prevPos.x <= point.x && currentPos.x >= point.x) || (prevPos.x >= point.x && currentPos.x <= point.x)));
    }

    passedPoint1(prevPos: Vec3, currentPos: Vec3, point: Vec3): boolean {
        return (prevPos.x !== point.x || prevPos.y !== point.y) &&
            (prevPos.x === currentPos.x
                ? (prevPos.y >= point.y && currentPos.y <= point.y) || (prevPos.y <= point.y && currentPos.y >= point.y)
                : prevPos.y === currentPos.y && ((prevPos.x >= point.x && currentPos.x <= point.x) || (prevPos.x <= point.x && currentPos.x >= point.x)));
    }

    applyCornerSprite(showCorner: boolean, force: boolean = false): void {
        if (this.sprite && (force || this._isCornerShowing !== showCorner)) {
            this._isCornerShowing = showCorner;
            if (showCorner && this.cornerSpriteFrame) {
                CCExtends.SetSpriteFrame(this.sprite, this.cornerSpriteFrame);
            } else {
                CCExtends.SetSpriteFrame(this.sprite, this.normalSpriteFrame);
            }
        }
    }

    resetCorner(): void {
        this.applyCornerSprite(this.isConnor);
    }

    moveStraight(startIndex: number, startPos: Vec3, moveLen: number): [number, Vec3] {
        let currentIndex = startIndex;
        Vec3.copy(this._tempVec3_1, startPos);
        const tempPos = this._tempVec3_1;
        let continueMoving = true;

        for (let i = startIndex; i < this.segmentLinePos!.length - 1; i++) {
            const currentPoint = this.segmentLinePos![i];
            currentIndex = i;
            const nextPoint = this.segmentLinePos![i + 1];
            continueMoving = false;

            const isVertical = Math.abs(currentPoint.x - nextPoint.x) < 0.01;
            const isHorizontal = Math.abs(currentPoint.y - nextPoint.y) < 0.01;

            if (isVertical) {
                if (nextPoint.y > currentPoint.y) {
                    tempPos.y += moveLen;
                    if (tempPos.y === nextPoint.y) {
                        tempPos.y = nextPoint.y;
                        currentIndex++;
                    } else if (tempPos.y > nextPoint.y) {
                        moveLen = tempPos.y - nextPoint.y;
                        tempPos.y = nextPoint.y;
                        continueMoving = true;
                    }
                } else {
                    tempPos.y -= moveLen;
                    if (tempPos.y === nextPoint.y) {
                        tempPos.y = nextPoint.y;
                        currentIndex++;
                    } else if (tempPos.y < nextPoint.y) {
                        moveLen = nextPoint.y - tempPos.y;
                        tempPos.y = nextPoint.y;
                        continueMoving = true;
                    }
                }
            } else if (isHorizontal) {
                if (nextPoint.x > currentPoint.x) {
                    tempPos.x += moveLen;
                    if (tempPos.x === nextPoint.x) {
                        tempPos.x = nextPoint.x;
                        currentIndex++;
                    } else if (tempPos.x > nextPoint.x) {
                        moveLen = tempPos.x - nextPoint.x;
                        tempPos.x = nextPoint.x;
                        continueMoving = true;
                    }
                } else {
                    tempPos.x -= moveLen;
                    if (tempPos.x === nextPoint.x) {
                        tempPos.x = nextPoint.x;
                        currentIndex++;
                    } else if (tempPos.x < nextPoint.x) {
                        moveLen = nextPoint.x - tempPos.x;
                        tempPos.x = nextPoint.x;
                        continueMoving = true;
                    }
                }
            }

            if (!continueMoving) break;
        }

        if (continueMoving) {
            currentIndex++;
            this.updateEndPosByDir(tempPos, moveLen);
        }

        return [currentIndex, tempPos];
    }

    updateMoveBack(): void {
        Vec3.copy(this._tempVec3, this.currentPos);
        const prevPos = this._tempVec3;

        this.curPoint = this.segmentLinePos![this.curSegmentIndex];
        this.nextPoint = this.segmentLinePos![this.curSegmentIndex - 1];

        if (this.curSegmentIndex - 1 < 0) {
            this.resetPos();
        } else {
            if (this.curPoint.x === this.nextPoint.x || this.curPoint.y === this.nextPoint.y) {
                const moveResult = this.moveBackStraight(this.curSegmentIndex, this.currentPos, 2);
                const newIndex = moveResult[0];
                const newPos = moveResult[1];

                this.applyCornerSprite(false);
                this.currentPos = newPos;

                if (newIndex > 0 && this.curSegmentIndex !== newIndex) {
                    const passedPoint = this.segmentLinePos![newIndex];
                    if (this.passedPoint1(prevPos, this.currentPos, passedPoint)) {
                        this.applyCornerSprite(true);
                    }
                }
                this.curSegmentIndex = newIndex;
            }
            this.node.setPosition(this.currentPos);
        }
    }

    moveBackStraight(startIndex: number, startPos: Vec3, moveLen: number): [number, Vec3] {
        let currentIndex = startIndex;
        Vec3.copy(this._tempVec3_1, startPos);
        const tempPos = this._tempVec3_1;
        let continueMoving = true;

        for (let i = startIndex; i > 0; i--) {
            const currentPoint = this.segmentLinePos![i];
            currentIndex = i;
            const prevPoint = this.segmentLinePos![i - 1];
            continueMoving = false;

            const isVertical = Math.abs(currentPoint.x - prevPoint.x) < 0.01;
            const isHorizontal = Math.abs(currentPoint.y - prevPoint.y) < 0.01;

            if (isVertical) {
                if (prevPoint.y > currentPoint.y) {
                    tempPos.y += moveLen;
                    if (tempPos.y === prevPoint.y) {
                        tempPos.y = prevPoint.y;
                        currentIndex--;
                    } else if (tempPos.y > prevPoint.y) {
                        moveLen = tempPos.y - prevPoint.y;
                        tempPos.y = prevPoint.y;
                        continueMoving = true;
                    }
                } else {
                    tempPos.y -= moveLen;
                    if (tempPos.y === prevPoint.y) {
                        tempPos.y = prevPoint.y;
                        currentIndex--;
                    } else if (tempPos.y < prevPoint.y) {
                        moveLen = prevPoint.y - tempPos.y;
                        tempPos.y = prevPoint.y;
                        continueMoving = true;
                    }
                }
            } else if (isHorizontal) {
                if (prevPoint.x > currentPoint.x) {
                    tempPos.x += moveLen;
                    if (tempPos.x === prevPoint.x) {
                        tempPos.x = prevPoint.x;
                        currentIndex--;
                    } else if (tempPos.x > prevPoint.x) {
                        moveLen = tempPos.x - prevPoint.x;
                        tempPos.x = prevPoint.x;
                        continueMoving = true;
                    }
                } else {
                    tempPos.x -= moveLen;
                    if (tempPos.x === prevPoint.x) {
                        tempPos.x = prevPoint.x;
                        currentIndex--;
                    } else if (tempPos.x < prevPoint.x) {
                        moveLen = prevPoint.x - tempPos.x;
                        tempPos.x = prevPoint.x;
                        continueMoving = true;
                    }
                }
            }

            if (!continueMoving) break;
        }

        if (continueMoving) {
            currentIndex--;
            Vec3.copy(tempPos, this.segmentLinePos![0]);
        }

        return [currentIndex, tempPos];
    }

    resetPos(): void {
        this.curSegmentIndex = this.initIndex!;
        Vec3.copy(this.currentPos, this.initPos);
        this.node.setPosition(this.initPos);
    }

    getAngle(fromIndex: number, toIndex: number, isCorner: boolean): void {
        if (toIndex >= this.segmentLinePos.length) {
            switch (this.gridType) {
                case GridType.Down:
                    this.curAngle.z = 180;
                    break;
                case GridType.Up:
                    this.curAngle.z = 0;
                    break;
                case GridType.Left:
                    this.curAngle.z = 90;
                    break;
                case GridType.Right:
                    this.curAngle.z = 270;
                    break;
            }
            Vec3.copy(this._tempEuler, this.curAngle);
            this.node.eulerAngles = this._tempEuler;
        } else if (this.segmentLinePos[fromIndex + 1] && this.segmentLinePos[fromIndex - 1]) {
            const rotation = this.getCornerRotation(fromIndex);
            this.tmpAngle.set(0, 0, rotation);
            this.node.eulerAngles = this.tmpAngle;
        } else {
            const currentPoint = this.segmentLinePos![fromIndex];
            Vec3.subtract(this._tempVec3, this.segmentLinePos![toIndex], currentPoint);
            const direction = this._tempVec3;
            const angle = 180 * Math.atan2(direction.y, direction.x) / Math.PI;
            this.curAngle.z = angle + 180;
            this._tempEuler.set(
                this.curAngle.x + this.initAngle.x,
                this.curAngle.y + this.initAngle.y,
                this.curAngle.z + this.initAngle.z
            );
            this.node.eulerAngles = this._tempEuler;
        }
    }

    getCornerRotation(index: number): number {
        const prevPoint = this.segmentLinePos![index - 1];
        const currentPoint = this.segmentLinePos![index];
        const nextPoint = this.segmentLinePos![index + 1];

        const dx1 = Math.sign(currentPoint.x - prevPoint.x);
        const dy1 = Math.sign(currentPoint.y - prevPoint.y);
        const dx2 = Math.sign(nextPoint.x - currentPoint.x);
        const dy2 = Math.sign(nextPoint.y - currentPoint.y);

        if (dx1 === 0 && dy1 === -1 && dx2 === -1 && dy2 === 0) return 0;
        if (dx1 === 0 && dy1 === -1 && dx2 === 1 && dy2 === 0) return 270;
        if (dx1 === 0 && dy1 === 1 && dx2 === -1 && dy2 === 0) return 90;
        if ((dx1 === 0 && dy1 === 1 && dx2 === 1 && dy2 === 0) ||
            (dx1 === -1 && dy1 === 0 && dx2 === 0 && dy2 === -1)) return 180;
        if (dx1 === -1 && dy1 === 0 && dx2 === 0 && dy2 === 1) return 270;
        if (dx1 === 1 && dy1 === 0 && dx2 === 0 && dy2 === -1) return 90;
        return 0;
    }

    errorHighlight(color: ItemColor | string, loop: boolean = false, duration: number = 0.5): void {
        if (this.sprite) {
            if (!loop && color !== ItemColor.Error1 && color !== ItemColor.Error2) {
                this.normalColor = new Color().fromHEX(color as string);
                this._isError = true;
            }
            if (this.spTween1) this.spTween1.stop();
            if (this.spTween2) this.spTween2.stop();

            this.spTween1 = tween(this.sprite)
                .to(duration, { color: new Color().fromHEX(color as string) }, { easing: 'sineInOut' })
                .call(() => {
                    if (loop) {
                        this.spTween2 = tween(this.sprite)
                            .to(duration, { color: this.normalColor }, { easing: 'sineInOut' })
                            .start();
                    }
                })
                .start();
        }
    }

    hintLight(color: string, duration: number = 0.5): void {
        if (this.sprite) {
            if (this.spHintTw) this.spHintTw.stop();
            this.spHintTw = tween(this.sprite)
                .sequence(
                    tween().to(duration, { color: new Color().fromHEX(color) }, { easing: 'sineInOut' }),
                    tween().to(duration, { color: this.normalColor }, { easing: 'sineInOut' })
                )
                .repeatForever()
                .start();
        }
    }

    stopHintLight(): void {
        if (this.spHintTw) {
            this.spHintTw.stop();
            this.spHintTw = null;
        }
        if (this.sprite) {
            this.sprite.color = this.normalColor;
        }
    }

    updateEndPosByDir(pos?: Vec3, moveLen?: number): void {
        const targetPos = pos || this.currentPos;
        const len = moveLen || ArrowGameConfig.moveLen;

        switch (this.gridType) {
            case GridType.Down:
                targetPos.y -= len;
                break;
            case GridType.Up:
                targetPos.y += len;
                break;
            case GridType.Left:
                targetPos.x -= len;
                break;
            case GridType.Right:
                targetPos.x += len;
                break;
        }

        if (!pos) {
            this.currentPos = targetPos;
        }
    }
}