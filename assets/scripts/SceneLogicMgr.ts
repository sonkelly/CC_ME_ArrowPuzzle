import { _decorator, Component, Node, game } from 'cc';
const { ccclass, property } = _decorator;

enum SceneLogicStepType {
    ENTER = 0,
    ENTER_CREATE = 1,
    ENTER_END = 2,
    EXIT = 3,
    EXIT_END = 4,
    NONE = 5
}

@ccclass('SceneLogicMgr')
export class SceneLogicMgr extends Component {
    private static instance: SceneLogicMgr | null = null;
    
    private stepType: SceneLogicStepType = SceneLogicStepType.NONE;
    private onEnterEnd: (() => void) | undefined;
    private entityNum: number = 0;

    public static create(): void {
        if (SceneLogicMgr.instance == null) {
            const node = new Node('SceneLogicMgr');
            SceneLogicMgr.instance = node.addComponent(SceneLogicMgr);
            game.addPersistRootNode(node);
        }
    }

    protected lateUpdate(dt: number): void {
        if (this.stepType === SceneLogicStepType.ENTER) {
            this.stepType = SceneLogicStepType.ENTER_CREATE;
        } else if (this.stepType === SceneLogicStepType.ENTER_CREATE) {
            this.stepType = SceneLogicStepType.ENTER_END;
        } else if (this.stepType === SceneLogicStepType.ENTER_END) {
            this.stepType = SceneLogicStepType.NONE;
            if (this.onEnterEnd) {
                this.onEnterEnd();
            }
        }
    }

    public OnEnter(callback: () => void): void {
        this.stepType = SceneLogicStepType.ENTER;
        this.onEnterEnd = callback;
        this.entityNum = 0;
    }

    public OnExit(): void {
        this.stepType = SceneLogicStepType.EXIT;
    }
}