import { _decorator, Component, Node, Label, Sprite, SpriteFrame, UITransform, Vec3, tween, Tween, easing } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RecommendGameImpl')
export class RecommendGameImpl extends Component {
    @property({ type: Label })
    public gameNameLabel: Label = null;

    @property({ type: Sprite })
    public gameIconSprite: Sprite = null;

    @property({ type: Node })
    public clickArea: Node = null;

    private _gameId: string = '';
    private _gameName: string = '';
    private _gameIconUrl: string = '';
    private _isInitialized: boolean = false;

    // Static properties
    private static _instance: RecommendGameImpl = null;
    private static _gameList: Array<{ id: string; name: string; iconUrl: string }> = [];

    public static get instance(): RecommendGameImpl {
        return RecommendGameImpl._instance;
    }

    public static set instance(value: RecommendGameImpl) {
        RecommendGameImpl._instance = value;
    }

    public static get gameList(): Array<{ id: string; name: string; iconUrl: string }> {
        return RecommendGameImpl._gameList;
    }

    public static set gameList(value: Array<{ id: string; name: string; iconUrl: string }>) {
        RecommendGameImpl._gameList = value;
    }

    // Static methods
    public static getInstance(): RecommendGameImpl {
        return RecommendGameImpl._instance;
    }

    public static setInstance(instance: RecommendGameImpl): void {
        RecommendGameImpl._instance = instance;
    }

    public static addGameToList(gameData: { id: string; name: string; iconUrl: string }): void {
        RecommendGameImpl._gameList.push(gameData);
    }

    public static clearGameList(): void {
        RecommendGameImpl._gameList = [];
    }

    // Lifecycle methods
    protected onLoad(): void {
        RecommendGameImpl._instance = this;
        this._initializeComponents();
    }

    protected start(): void {
        this._setupClickHandler();
        this._playEntranceAnimation();
    }

    protected onDestroy(): void {
        if (RecommendGameImpl._instance === this) {
            RecommendGameImpl._instance = null;
        }
        this._removeClickHandler();
    }

    // Public methods
    public initializeGameData(gameId: string, gameName: string, gameIconUrl: string): void {
        this._gameId = gameId;
        this._gameName = gameName;
        this._gameIconUrl = gameIconUrl;

        this._updateUI();
        this._isInitialized = true;
    }

    public getGameId(): string {
        return this._gameId;
    }

    public getGameName(): string {
        return this._gameName;
    }

    public isInitialized(): boolean {
        return this._isInitialized;
    }

    public resetGameData(): void {
        this._gameId = '';
        this._gameName = '';
        this._gameIconUrl = '';
        this._isInitialized = false;

        this._clearUI();
    }

    // Private methods
    private _initializeComponents(): void {
        if (!this.gameNameLabel) {
            this.gameNameLabel = this.getComponentInChildren(Label);
        }

        if (!this.gameIconSprite) {
            this.gameIconSprite = this.getComponentInChildren(Sprite);
        }

        if (!this.clickArea) {
            this.clickArea = this.node;
        }
    }

    private _setupClickHandler(): void {
        if (this.clickArea) {
            this.clickArea.on(Node.EventType.TOUCH_END, this._onGameClick, this);
        }
    }

    private _removeClickHandler(): void {
        if (this.clickArea) {
            this.clickArea.off(Node.EventType.TOUCH_END, this._onGameClick, this);
        }
    }

    private _onGameClick(event: EventTouch): void {
        if (!this._isInitialized) {
            return;
        }

        this._handleGameSelection();
        this._playClickAnimation();
    }

    private _handleGameSelection(): void {
        // Handle game selection logic here
        console.log(`Game selected: ${this._gameName} (ID: ${this._gameId})`);
    }

    private _updateUI(): void {
        if (this.gameNameLabel) {
            this.gameNameLabel.string = this._gameName;
        }

        if (this.gameIconSprite && this._gameIconUrl) {
            this._loadGameIcon(this._gameIconUrl);
        }
    }

    private _clearUI(): void {
        if (this.gameNameLabel) {
            this.gameNameLabel.string = '';
        }

        if (this.gameIconSprite) {
            this.gameIconSprite.spriteFrame = null;
        }
    }

    private _loadGameIcon(iconUrl: string): void {
        // Load icon from URL or asset bundle
        // This is a placeholder for actual implementation
        console.log(`Loading game icon from: ${iconUrl}`);
    }

    private _playEntranceAnimation(): void {
        const originalScale: Vec3 = this.node.getScale().clone();
        this.node.setScale(Vec3.ZERO);

        const entranceTween: Tween<Node> = tween(this.node)
            .to(0.5, { scale: originalScale }, { easing: easing.backOut })
            .start();
    }

    private _playClickAnimation(): void {
        const originalScale: Vec3 = this.node.getScale().clone();
        const scaleDown: Vec3 = new Vec3(originalScale.x * 0.9, originalScale.y * 0.9, originalScale.z);

        const clickTween: Tween<Node> = tween(this.node)
            .to(0.1, { scale: scaleDown }, { easing: easing.smooth })
            .to(0.1, { scale: originalScale }, { easing: easing.smooth })
            .start();
    }
}