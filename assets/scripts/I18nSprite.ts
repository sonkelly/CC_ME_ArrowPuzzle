import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { GameAssetManager } from './GameAssetManager';
import { I18nManager } from './I18nManager';

const { ccclass, property } = _decorator;

@ccclass('I18nSprite')
export class I18nSprite extends Component {
    @property
    public key: string = '';

    @property
    public bundle: string = '';

    public start(): void {
        this.loadSprite();
    }

    private async loadSprite(): Promise<void> {
        const sprite = this.getComponent(Sprite);
        if (sprite) {
            const language = I18nManager.getLanguage();
            const path = `texture/$pop/i18n/${language}/${this.key}`;
            const bundleName = this.bundle === '' ? 'game' : this.bundle;
            const spriteFrame = await GameAssetManager.loadAssetByPath(bundleName, path, SpriteFrame);
            sprite.spriteFrame = spriteFrame;
        }
    }
}