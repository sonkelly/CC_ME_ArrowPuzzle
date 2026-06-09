import { assetManager, SpriteFrame, Texture2D, resources } from 'cc';
import { LogUtils } from './LogUtils';

export class LoaderUtils {
    static loadImg(urlPath: string, callback: (error: Error | null, spriteFrame: SpriteFrame | null) => void): void {
        if (!urlPath) {
            return;
        }

        const isHttpUrl = urlPath.substr(0, 4).toLowerCase() === 'http';
        
        if (isHttpUrl) {
            assetManager.loadRemote(urlPath, (error: Error | null, texture: Texture2D | null) => {
                if (error) {
                    LogUtils.warn("图片无法加载, urlPath:", urlPath);
                }
                
                const spriteFrame = new SpriteFrame();
                const newTexture = new Texture2D();
                newTexture.image = texture;
                spriteFrame.texture = newTexture;
                
                callback(error, spriteFrame);
            });
        } else {
            resources.load(urlPath, SpriteFrame, (error: Error | null, spriteFrame: SpriteFrame | null) => {
                if (error) {
                    LogUtils.warn("图片无法加载, urlPath:", urlPath);
                }
                
                callback(error, spriteFrame);
            });
        }
    }

    static loadResArray(urlPaths: string[], callback: (hasError: boolean, spriteFrames: SpriteFrame[]) => void): void {
        const self = this;
        const spriteFrames: SpriteFrame[] = [];
        let loadedCount = 0;

        for (let index = 0; index < urlPaths.length; index++) {
            const currentIndex = index;
            
            self.loadImg(urlPaths[currentIndex], (error: Error | null, spriteFrame: SpriteFrame | null) => {
                loadedCount++;
                spriteFrames[currentIndex] = spriteFrame;
                
                if (loadedCount >= urlPaths.length) {
                    callback(false, spriteFrames);
                }
            });
        }
    }

    static layaLoadResArray(urlPaths: string[], callback: (result: any) => void): void {
        Laya.loader.load(urlPaths, Laya.Handler.create(this, (result: any) => {
            callback(result);
        }));
    }
}