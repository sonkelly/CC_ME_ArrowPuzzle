import { _decorator, Component, UITransform, view, ResolutionPolicy } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AdaptUI')
export class AdaptUI extends Component {
    start() {
        const designResolution = view.getDesignResolutionSize();
        const frameSize = view.getFrameSize();
        
        let frameWidth = frameSize.width;
        let frameHeight = frameSize.height;
        let designWidth = designResolution.width;
        let designHeight = designResolution.height;
        
        let targetWidth = frameWidth;
        let targetHeight = frameHeight;
        
        if (frameWidth / frameHeight > designWidth / designHeight) {
            // 是否优先将设计分辨率高度撑满视图高度
            targetHeight = designHeight;
            targetWidth = targetHeight * frameWidth / frameHeight;
        } else {
            // 是否优先将设计分辨率宽度撑满视图宽度
            targetWidth = designWidth;
            targetHeight = frameHeight / frameWidth * targetWidth;
        }
        
        view.setDesignResolutionSize(targetWidth, targetHeight, ResolutionPolicy.FIXED_WIDTH);
        
        const uiTransform = this.node.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.width = targetWidth;
            uiTransform.height = targetHeight;
        }
        
        console.log("AdaptUI:", this.node.name, targetWidth, targetHeight);
    }
}