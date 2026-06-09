import { _decorator, Component, Prefab, Vec3, UITransform } from 'cc';
import { ArrowGameConfig } from './ArrowGameConfig';
import { GameController } from './GameController';
import { AudioManager } from './AudioManager';
import { PoolManager } from './PoolManager';
import { VibrateManager } from './VibrateManager';
import { GameManager } from './GameManager';
import { ItemColor } from './GridItem';
import { GridItemMove } from './GridItemMove';

const { ccclass, property } = _decorator;

const DIRECTION_OFFSETS = [
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
];

interface PathStopResult {
    wantMove: boolean;
    stopGridItem: any | null;
    stopMove: boolean;
}

interface SegmentData {
    startPos: Vec3;
    endPos: Vec3;
    segIndex: number;
    segCount: number;
    pathIndex: number;
    isLastSegment: boolean;
    isTail: boolean;
    isTailEnd: boolean;
    dis: number;
}

@ccclass('ArrowItem')
export class ArrowItem extends Component {
    @property(Prefab)
    bodyPrefab: Prefab | null = null;

    @property(Prefab)
    headPrefab: Prefab | null = null;

    @property(Prefab)
    tailPrefab: Prefab | null = null;

    @property(Prefab)
    tailEndPrefab: Prefab | null = null;

    indices: any[] = [];
    gridItems: any[] = [];
    colorType: number = 1;
    itemMoves: GridItemMove[] = [];
    private _isRemoved: boolean = false;
    private _isMoving: boolean = false;
    isMovingReturn: boolean = false;
    private _isError: boolean = false;
    skip: boolean = false;
    stopMove: boolean = false;
    isCleared: boolean = false;
    stopPosition: Vec3 | null = null;
    segmentLinePos: Vec3[] = [];
    posX: number = 0;
    posY: number = 0;
    myDirX: number = 0;
    myDirY: number = 0;
    arrowDir: number = 0;
    arrowId: number = 0;
    tmp: Vec3 = new Vec3();
    headPos: Vec3 = new Vec3();
    isHinting: boolean = false;
    private _curStage: any = null;
    private _tempVec3: Vec3 = new Vec3();

    get isRemoved(): boolean {
        return this._isRemoved;
    }

    set isRemoved(value: boolean) {
        this._isRemoved = value;
        if (value) {
            this._curStage.removeArrow(this.arrowId, this.gridItems, this.arrowDir);
            this._curStage.hintManager.onArrowRemoved(this);
        }
    }

    get isMoving(): boolean {
        return this._isMoving;
    }

    set isMoving(value: boolean) {
        this._isMoving = value;
    }

    get isError(): boolean {
        return this._isError;
    }

    set isError(value: boolean) {
        this._isError = value;
    }

    init(): void {
        this.isRemoved = false;
        this.isCleared = false;
        this.isMovingReturn = false;
        this.isMoving = false;
        this.stopMove = false;
        this.isHinting = false;
        this.skip = false;
        this.stopPosition = null;
        this._curStage = GameManager.instance.curStage;
    }

    prepareMoveData(): void {
        this.segmentLinePos.length = 0;
        for (let i = this.gridItems.length - 1; i >= 0; i--) {
            this.segmentLinePos.push(this.gridItems[i].node.position);
        }

        for (let i = 0; i < this.segmentLinePos.length - 2;) {
            const current = this.segmentLinePos[i];
            const next = this.segmentLinePos[i + 1];
            const afterNext = this.segmentLinePos[i + 2];

            if ((current.x === next.x && next.x === afterNext.x) || 
                (current.y === next.y && next.y === afterNext.y)) {
                this.segmentLinePos.splice(i + 1, 1);
            } else {
                i++;
            }
        }
    }

    createBodySegment(segmentData: SegmentData): void {
        const { startPos, endPos, segIndex, segCount, pathIndex, isLastSegment, isTail, isTailEnd, dis } = segmentData;
        let prefabToUse = this.bodyPrefab;
        let isFirstSegment = false;

        if (isLastSegment) {
            prefabToUse = this.headPrefab;
        } else if (isTailEnd) {
            prefabToUse = this.tailEndPrefab;
        } else if (isTail) {
            prefabToUse = this.tailPrefab;
        } else {
            isFirstSegment = segIndex === 0;
        }

        const bodyNode = PoolManager.instance.getBodyNodeFromCacheOrPool(prefabToUse);
        bodyNode.setParent(this.node.parent);

        if (dis > 0) {
            if (this.myDirX === 0) {
                bodyNode.getComponent(UITransform).height = dis;
                bodyNode.getComponent(UITransform).width = 3;
            } else {
                bodyNode.getComponent(UITransform).width = dis;
                bodyNode.getComponent(UITransform).height = 3;
            }
        } else if (isLastSegment) {
            bodyNode.getComponent(UITransform).width = 8.2;
            bodyNode.getComponent(UITransform).height = 6.2;
        } else {
            bodyNode.getComponent(UITransform).width = 3;
            bodyNode.getComponent(UITransform).height = 3;
        }

        const interpolationFactor = segIndex / segCount;
        const posX = startPos.x + (endPos.x - startPos.x) * interpolationFactor;
        const posY = startPos.y + (endPos.y - startPos.y) * interpolationFactor;
        bodyNode.setPosition(posX, posY);

        const gridItemMove = bodyNode.getComponent(GridItemMove);
        this.itemMoves.push(gridItemMove);

        let finalPosX = startPos.x + (endPos.x - startPos.x) * (segIndex / segCount);
        let finalPosY = startPos.y + (endPos.y - startPos.y) * (segIndex / segCount);

        if (dis > 0) {
            finalPosX = startPos.x + 0.5 * (endPos.x - startPos.x);
            finalPosY = startPos.y + 0.5 * (endPos.y - startPos.y);
        }

        this.tmp.set(finalPosX, finalPosY, startPos.z);

        if (isLastSegment) {
            gridItemMove.initPosition(this.segmentLinePos, pathIndex + 1, this.gridItems[0].gridType, this.tmp, isTailEnd, isFirstSegment, true);
        } else {
            gridItemMove.initPosition(this.segmentLinePos, pathIndex, this.gridItems[0].gridType, this.tmp, isTailEnd, isFirstSegment, isTailEnd);
        }

        if (isLastSegment) {
            this.headPos.set(bodyNode.position);
        }

        gridItemMove.init(this.colorType, this._isError, isFirstSegment);
        bodyNode.setScale(1, 1, 1);
    }

    moveArrow(gridItem: any, zanPos: number): void {
        if (!this.node.active || GameController.instance.is_pause) return;
        if (this.gridItems.indexOf(gridItem) === -1) return;

        const arrayGrid = this._curStage.arrayGrid;
        this.stopPosition = null;

        const pathResult = this.isPathStop(arrayGrid);
        const wantMove = pathResult.wantMove;
        const stopGridItem = pathResult.stopGridItem;
        const shouldStopMove = pathResult.stopMove;

        this.stopMove = shouldStopMove;
        this.isMovingReturn = false;
        this.stopHintAnim();

        if (wantMove) {
            this._curStage.zanPos = zanPos;
            /*if (!SDKInstance.isFacebookMiniGame()) {
                VibrateManager.instance.vibrateShort();
            }*/
            this.isRemoved = true;
            this.isMoving = true;
            this.skip = true;
            this._curStage.curArrowProgress++;
            this._curStage.playRemoveSound();
        } else {
            if (!this.isError) {
                this.isError = true;
                this._curStage.loseHp(1, this.arrowId);
            }
            VibrateManager.instance.vibrateShort();
            AudioManager.instance.load_and_play_effect("error", false, "game");
            GameManager.instance.comboCount = 0;
            this._curStage.soundIdx = 1;
            this._curStage.soundOP = 1;
            GameManager.instance.onPlayerAction();

            if (stopGridItem) {
                this.stopPosition = stopGridItem.node.position;
            }

            this.isMoving = true;
            const errorColor = GameManager.instance.curSkin === 0 ? ItemColor.Error1 : ItemColor.Error2;
            this.errorHighlight(errorColor);
        }
    }

    isPathStop(arrayGrid: any[][]): PathStopResult {
        const dirOffset = DIRECTION_OFFSETS[this.arrowDir];
        const dx = dirOffset.dx;
        const dy = dirOffset.dy;
        let currentX = this.posX;
        let currentY = this.posY;

        while (!GameController.instance.is_pause) {
            currentX += dx;
            currentY += dy;

            if (currentY < 0 || currentY >= arrayGrid[0].length || 
                currentX < 0 || currentX >= arrayGrid.length) {
                return {
                    wantMove: true,
                    stopGridItem: null,
                    stopMove: false
                };
            }

            const gridItem = arrayGrid[currentX][currentY];
            if (gridItem) {
                const isAdjacent = (currentX - this.posX === dx) || (currentY - this.posY === dy);
                const errorColor = GameManager.instance.curSkin === 0 ? ItemColor.Error1 : ItemColor.Error2;
                gridItem.arrowComp.errorHighlight(errorColor, true);
                return {
                    wantMove: false,
                    stopGridItem: gridItem,
                    stopMove: isAdjacent
                };
            }
        }

        return {
            wantMove: true,
            stopGridItem: null,
            stopMove: false
        };
    }

    update(deltaTime: number): void {
        if ((!this.isMoving && !this.isMovingReturn) || GameController.instance.is_pause) return;

        if (this.isMoving) {
            const moveCount = this.itemMoves.length;
            for (let i = 0; i < moveCount; i++) {
                this.itemMoves[i].updateMove(this.stopMove);
            }

            if (this.stopPosition) {
                const lastMove = this.itemMoves[this.itemMoves.length - 1];
                const lastPosition = lastMove.node.position;
                Vec3.subtract(this._tempVec3, this.stopPosition, lastPosition);

                if (this._tempVec3.length() < ArrowGameConfig.moveLen) {
                    this.isMoving = false;
                    this.isMovingReturn = true;

                    if (this._curStage.isFail) {
                        GameController.instance.is_pause = true;
                    }

                    for (let i = 0; i < moveCount; i++) {
                        const move = this.itemMoves[i];
                        if (move.curSegmentIndex + 1 < this.segmentLinePos.length) {
                            move.curSegmentIndex++;
                        }
                    }
                }
            } else {
                const firstMove = this.itemMoves[0];
                const worldPos = firstMove.node.worldPosition;
                if (worldPos.x < 0 || worldPos.x > this._curStage.viewWidth || 
                    worldPos.y > this._curStage.viewHeight || worldPos.y < 0) {
                    this.isMoving = false;
                    this.node.active = false;
                    this.clear();
                }
            }
        } else if (this.isMovingReturn) {
            const moveCount = this.itemMoves.length;
            for (let i = 0; i < moveCount; i++) {
                this.itemMoves[i].updateMoveBack();
            }

            const firstMove = this.itemMoves[0];
            const firstPosition = firstMove.node.position;
            Vec3.subtract(this._tempVec3, firstMove.initPos, firstPosition);

            if (this._tempVec3.length() < ArrowGameConfig.moveLen) {
                for (let i = 0; i < moveCount; i++) {
                    const move = this.itemMoves[i];
                    move.resetCorner();
                    move.resetPos();
                }
                this.isMovingReturn = false;
                this._curStage.delayCheckFail();
            }
        }
    }

    errorHighlight(color: ItemColor, force: boolean = false, duration: number = 0.5): void {
        if ((color === ItemColor.Error1 || color === ItemColor.Error2) && this.isError && force) return;

        for (let i = 0; i < this.itemMoves.length; i++) {
            this.itemMoves[i].errorHighlight(color, force, duration);
        }
    }

    onDisable(): void {
        this.stopPosition = null;
        this.isError = false;
        this.isMoving = false;
        this.stopMove = false;
        this.isRemoved = false;
        this.unscheduleAllCallbacks();
        this.stopHintAnim();
    }

    clear(forceRecycle: boolean = false): void {
        if (this.isCleared) return;

        this.unscheduleAllCallbacks();
        this.isRemoved = false;
        this.isCleared = true;
        this.stopPosition = null;
        this.isMoving = false;
        this.stopMove = false;
        this.isError = false;

        for (let i = 0; i < this.itemMoves.length; i++) {
            if (forceRecycle) {
                PoolManager.instance.recycle(this.itemMoves[i].node);
            } else {
                PoolManager.instance.put(this.itemMoves[i].node);
            }
        }
        this.itemMoves = [];

        for (let i = 0; i < this.gridItems.length; i++) {
            const gridItem = this.gridItems[i];
            PoolManager.instance.put(gridItem.node);
        }
        this.gridItems = [];
    }

    canMoveOut(): boolean {
        if (this.isRemoved || this.isMoving || this.skip) return false;

        let currentX = this.posX;
        let currentY = this.posY;
        const dirOffset = DIRECTION_OFFSETS[this.arrowDir];
        const dx = dirOffset.dx;
        const dy = dirOffset.dy;

        while (true) {
            currentX += dx;
            currentY += dy;

            if (!this._curStage.isInRange(currentX, currentY)) return true;
            if (this._curStage.arrayGrid[currentX][currentY]) return false;
        }
    }

    getDirOffset(): { dx: number; dy: number } {
        return DIRECTION_OFFSETS[this.arrowDir];
    }

    playHintAnim(): void {
        if (this.isHinting) return;

        this.isHinting = true;
        const hintColor = GameManager.instance.curSkin === 0 ? ItemColor.White : ItemColor.Error2;
        for (let i = 0; i < this.itemMoves.length; i++) {
            this.itemMoves[i].hintLight(hintColor, 0.5);
        }
    }

    stopHintAnim(): void {
        if (!this.isHinting) return;

        this.isHinting = false;
        for (let i = 0; i < this.itemMoves.length; i++) {
            this.itemMoves[i].stopHintLight();
        }
    }

    resetColor(): void {
        const moveCount = this.itemMoves.length;
        for (let i = 0; i < moveCount; i++) {
            this.itemMoves[i].resetColor();
        }
    }
}