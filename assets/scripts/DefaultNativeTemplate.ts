import { view, Node, Layers, director, Button, Sprite, UITransform, Widget, Label, Color, LabelOutline, BlockInputEvents, UIOpacity, Vec2, tween, Vec3, ScrollView, Mask, MaskType, Layout, game } from 'cc';
import { LocalConfig } from './LocalConfig';
import { ConfigHelper } from './ConfigHelper';
import { EngineUtils } from './Utils/EngineUtils';
import { LoaderUtils } from './Utils/LoaderUtils';
import { LogUtils } from './Utils/LogUtils';
import { PlatformUtils } from './Utils/PlatformUtils';
import { StoreUtils, Type } from './Utils/StoreUtils';

// Các biến toàn cục cần khai báo (nếu không có định nghĩa kiểu, dùng any)
declare const Laya: any;
declare const SDKInstance: any;
declare const hbs: any;
declare const qg: any;

export class DefaultNativeTemplate {
    public static privacyAgreementNode: Node | undefined = undefined;
    public static recommendRootNode: Node | undefined = undefined;
    public static recommendRootIconNode: any | undefined = undefined; // Laya.Sprite hoặc Node
    public static itemGame: any = undefined;
    public static intervalId: number | undefined = undefined;
    public static nativeImageTexture: any = undefined;

    public static getNativeImage(): string[] {
        return [];
    }

    public static loaderImgData(): void {
        const self = this;
        if (EngineUtils.isCocos()) {
            LoaderUtils.loadResArray(this.getNativeImage(), (_: any, textures: any[]) => {
                self.nativeImageTexture = {
                    button: textures[0],
                    close: textures[1],
                    insertMask: textures[2],
                    tip: textures[3],
                    insertBg: textures[4]
                };
            });
        } else {
            const images = this.getNativeImage();
            LoaderUtils.layaLoadResArray(images, () => {
                self.nativeImageTexture = {
                    button: images[0],
                    close: images[1],
                    insertMask: images[2],
                    tip: images[3],
                    insertBg: images[4]
                };
            });
        }
    }

    public static setNodeDefaultActiveClose(data: any): void {
        if (!data) return;
        if (EngineUtils.isCocos()) {
            if (data.parentNode) {
                data.parentNode.active = false;
            }
            if (data.panelNode) {
                data.panelNode.active = false;
            }
            if (data.buttonNode) {
                if (data.buttonNode instanceof Array) {
                    for (const btn of data.buttonNode) {
                        btn.active = false;
                    }
                } else {
                    data.buttonNode.active = false;
                }
            }
        } else {
            if (data.parentNode) {
                data.parentNode.visible = false;
            }
            if (data.panelNode) {
                data.panelNode.visible = false;
            }
            if (data.buttonNode) {
                if (data.buttonNode instanceof Array) {
                    for (const btn of data.buttonNode) {
                        btn.visible = false;
                    }
                } else {
                    data.buttonNode.visible = false;
                }
            }
        }
    }

    public static createNativeAdImageUINode(adData: any, nodeData: any, callback: Function, closeCallback: Function, clickCallback: Function): void {
        if (EngineUtils.isCocos()) {
            this.createCocosNativeImage(adData, nodeData, callback, closeCallback, clickCallback);
        } else {
            this.createLayaNativeImage(adData, nodeData, callback, closeCallback, clickCallback);
        }
    }

    private static createLayaNativeImage(adData: any, nodeData: any, callback: Function, closeCallback: Function, clickCallback: Function): void {
        const self = this;
        if (this.nativeImageTexture === undefined || this.nativeImageTexture.close === undefined) return;

        const imgUrl = adData.imgUrl;
        const adId = adData.adId;
        let title = adData.title;
        let desc = adData.desc;
        const parentNode = nodeData.parentNode ? nodeData.parentNode : Laya.stage;
        const buttonNode = nodeData.buttonNode;
        const panelNode = nodeData.panelNode;
        let width = nodeData.width;
        let height = nodeData.height;

        if (parentNode.constructor.name === 'GLoader') {
            LogUtils.info('创建faui原生广告节点');
            panelNode.visible = true;
            parentNode.visible = true;
            if (buttonNode) {
                buttonNode.visible = ConfigHelper.getGameConfig().nativeClickBtnSwitch;
            }
            parentNode.asLoader.url = imgUrl;
            LogUtils.log(parentNode.url, 'ur2l');
            parentNode.onClick(self, (e: any) => {
                LogUtils.info('点击了原生广告');
                clickCallback(adId);
                e.stopPropagation();
            });
            panelNode.asCom.getChildAt(panelNode.asCom.numChildren - 1).onClick(self, (e: any) => {
                LogUtils.info('关闭原生原生');
                panelNode.visible = false;
                e.stopPropagation();
                closeCallback();
            });
            if (buttonNode) {
                buttonNode.onClick(self, (e: any) => {
                    LogUtils.info('点击了原生广告 buttonNode');
                    clickCallback(adId);
                    e.stopPropagation();
                });
            }
            callback(undefined);
            LogUtils.log('faui原生广告创建完毕');
        } else {
            LogUtils.info('创建laya原生广告节点');
            Laya.loader.load(imgUrl, Laya.Handler.create(self, (texture: any) => {
                if (!texture) {
                    LogUtils.info('nativeAdImgUrl', imgUrl);
                    return;
                }
                if (width === undefined && nodeData.parentNode) {
                    width = nodeData.parentNode.width;
                    height = nodeData.parentNode.height;
                }
                if (width === undefined || height === undefined) {
                    if (Laya.stage.width < Laya.stage.height) {
                        width = Laya.stage.width;
                        height = 0.18 * Laya.stage.width;
                    } else {
                        width = Laya.stage.width / 2;
                        height = 0.18 * width;
                    }
                }

                const imageNode = new Laya.Sprite();
                imageNode.graphics.clear();
                imageNode.graphics.drawTexture(texture, 0, 0, width, height);
                imageNode.visible = true;
                imageNode.size(width, height);
                imageNode.zOrder = 29999;
                imageNode.name = 'imageNode';
                parentNode.addChild(imageNode);

                if (buttonNode) {
                    if (buttonNode instanceof Array) {
                        for (const btn of buttonNode) {
                            if (!btn.hasListener(Laya.Event.CLICK)) {
                                btn.on('click', self, (e: any) => {
                                    LogUtils.info('点击了原生原生');
                                    clickCallback(adId);
                                    e.stopPropagation();
                                });
                            }
                            btn.active = ConfigHelper.getGameConfig().nativeClickBtnSwitch;
                            btn.visible = ConfigHelper.getGameConfig().nativeClickBtnSwitch;
                        }
                    } else {
                        if (!buttonNode.hasListener(Laya.Event.CLICK)) {
                            buttonNode.on('click', self, (e: any) => {
                                LogUtils.info('点击了原生原生');
                                clickCallback(adId);
                                e.stopPropagation();
                            });
                        }
                        buttonNode.active = ConfigHelper.getGameConfig().nativeClickBtnSwitch;
                        buttonNode.visible = ConfigHelper.getGameConfig().nativeClickBtnSwitch;
                    }
                }

                if (panelNode) {
                    panelNode.visible = true;
                    panelNode.active = true;
                    if (!panelNode.hasListener(Laya.Event.CLICK)) {
                        panelNode.on('click', self, (e: any) => {
                            LogUtils.info('点击了原生原生');
                            clickCallback(adId);
                            e.stopPropagation();
                        });
                    }
                }

                if (parentNode) {
                    parentNode.visible = true;
                    parentNode.active = true;
                }

                imageNode.on('click', self, (e: any) => {
                    LogUtils.info('点击了原生原生');
                    clickCallback(adId);
                    e.stopPropagation();
                });

                const tipNode = new Laya.Sprite();
                tipNode.name = 'tipNode';
                imageNode.addChild(tipNode);
                tipNode.loadImage(self.nativeImageTexture.tip);
                tipNode.width = 50;
                tipNode.height = 25;
                tipNode.x = imageNode.width - tipNode.width;

                const closeNode = new Laya.Sprite();
                closeNode.name = 'closeNode';
                imageNode.addChild(closeNode);
                closeNode.loadImage(self.nativeImageTexture.close);
                closeNode.width = 28;
                closeNode.height = 28;
                closeNode.on('click', self, (e: any) => {
                    LogUtils.info('点击了原生广告关闭按钮');
                    imageNode.removeSelf();
                    e.stopPropagation();
                    if (panelNode) {
                        panelNode.visible = false;
                        panelNode.active = false;
                    }
                    closeCallback();
                });

                if (PlatformUtils.isHuaWeiPlatform() || PlatformUtils.isDebug()) {
                    if (title) title = title.substring(0, 6);
                    if (desc) desc = desc.substring(0, 6);
                    const titleLabel = new Laya.Text();
                    titleLabel.name = 'titleLabel';
                    titleLabel.text = title;
                    titleLabel.fontSize = 20;
                    titleLabel.align = 'center';
                    titleLabel.x = (imageNode.width - titleLabel.width) / 2;
                    titleLabel.y = titleLabel.height / 1.4;
                    imageNode.addChild(titleLabel);

                    const scoreLabel = new Laya.Text();
                    scoreLabel.name = 'scoreLabel';
                    scoreLabel.text = desc;
                    scoreLabel.fontSize = 20;
                    scoreLabel.y = 0.8 * imageNode.height;
                    scoreLabel.x = scoreLabel.width / 2;
                    imageNode.addChild(scoreLabel);
                }

                callback(imageNode);
                LogUtils.log('laya原生广告创建完毕');
            }), Laya.Handler.create(self, () => {}), Laya.Loader.IMAGE, 1, false, 'res', true);
        }
    }

    private static createCocosNativeImage(adData: any, nodeData: any, callback: Function, closeCallback: Function, clickCallback: Function): void {
        const self = this;
        if (this.nativeImageTexture === undefined || this.nativeImageTexture.close === undefined) return;

        const imgUrl = adData.imgUrl;
        const parentNode = nodeData.parentNode;
        const buttonNode = nodeData.buttonNode;
        const panelNode = nodeData.panelNode;
        const adId = adData.adId;
        let title = adData.title;
        let desc = adData.desc;

        if (title && title.length >= 6) title = title.substring(0, 6);
        if (desc && desc.length >= 6) desc = desc.substring(0, 6);

        LoaderUtils.loadImg(imgUrl, (err: any, spriteFrame: any) => {
            let width: number, height: number;
            if (nodeData.width && nodeData.height) {
                width = nodeData.width;
                height = nodeData.height;
            } else if (parentNode) {
                width = parentNode.width;
                height = parentNode.height;
            } else if (view.getVisibleSize().width < view.getVisibleSize().height) {
                width = view.getVisibleSize().width;
                height = 0.18 * view.getVisibleSize().width;
            } else {
                width = view.getVisibleSize().width / 2;
                height = 0.18 * width;
            }

            const bigImage = new Node('bigImage');
            bigImage.layer = Layers.Enum.UI_2D;
            if (parentNode) {
                parentNode.addChild(bigImage);
            } else {
                director.getScene()?.getChildByName('Canvas')?.addChild(bigImage);
            }

            if (buttonNode) {
                if (buttonNode instanceof Array) {
                    for (const btn of buttonNode) {
                        btn.addComponent(Button);
                        btn.on('click', () => {
                            LogUtils.info('点击了原生广告');
                            clickCallback(adId);
                        });
                        btn.active = ConfigHelper.getGameConfig().nativeClickBtnSwitch;
                    }
                } else {
                    buttonNode.addComponent(Button);
                    buttonNode.on('click', () => {
                        LogUtils.info('点击了原生广告');
                        clickCallback(adId);
                    });
                    buttonNode.active = ConfigHelper.getGameConfig().nativeClickBtnSwitch;
                }
            }

            if (panelNode) {
                panelNode.addComponent(Button);
                panelNode.on('click', () => {
                    LogUtils.info('点击了原生广告');
                    clickCallback(adId);
                });
                panelNode.active = true;
            }

            bigImage.addComponent(Sprite);
            bigImage.getComponent(Sprite)!.spriteFrame = spriteFrame;
            bigImage.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            bigImage.setSiblingIndex(29998);
            bigImage.getComponent(UITransform)!.width = width;
            bigImage.getComponent(UITransform)!.height = height;
            bigImage.addComponent(Widget);
            bigImage.getComponent(Widget)!.isAlignHorizontalCenter = true;
            bigImage.getComponent(Widget)!.isAlignBottom = true;
            bigImage.getComponent(Widget)!.bottom = 0;
            bigImage.addComponent(Button);
            bigImage.on('click', () => {
                LogUtils.info('击了广告本身');
                clickCallback(adData.adId);
            });

            const btnClose = new Node('BtnClose');
            btnClose.layer = Layers.Enum.UI_2D;
            btnClose.parent = bigImage;
            btnClose.addComponent(Sprite);
            btnClose.getComponent(Sprite)!.spriteFrame = self.nativeImageTexture.close;
            btnClose.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            btnClose.getComponent(UITransform)!.width = 28;
            btnClose.getComponent(UITransform)!.height = 28;
            btnClose.setPosition(
                -bigImage.getComponent(UITransform)!.width / 2 + btnClose.getComponent(UITransform)!.width / 2,
                bigImage.getComponent(UITransform)!.height / 2 - btnClose.getComponent(UITransform)!.height / 2
            );
            btnClose.addComponent(Button);
            btnClose.on('click', () => {
                LogUtils.info('击了关闭原生广告');
                bigImage.active = false;
                if (parentNode) parentNode.active = false;
                if (buttonNode) buttonNode.active = false;
                if (panelNode) panelNode.active = false;
                closeCallback();
            });

            const adLogo = new Node('adLogo');
            adLogo.layer = Layers.Enum.UI_2D;
            adLogo.parent = bigImage;
            adLogo.addComponent(Label);
            adLogo.getComponent(Label)!.fontSize = 20;
            adLogo.getComponent(Label)!.color = new Color(255, 255, 255);
            adLogo.getComponent(Label)!.string = '广 告';
            adLogo.addComponent(LabelOutline);
            adLogo.getComponent(LabelOutline)!.color = new Color(0, 0, 0, 255);
            adLogo.getComponent(LabelOutline)!.width = 2;
            adLogo.getComponent(UITransform)!.width = 50;
            adLogo.getComponent(UITransform)!.height = 25;
            adLogo.setPosition(
                width / 2 - 0.5 * adLogo.getComponent(UITransform)!.width,
                -height / 2 + 10
            );

            self.addTitle(bigImage, title, desc);
            if (parentNode) parentNode.active = true;
            callback(bigImage);
        });
    }

    public static createNativeIntertAdUINode(adData: any, nodeData: any, callback: Function, closeCallback: Function, clickCallback: Function): void {
        LogUtils.info('使用默认 插屏 来创建节点', 'createNativeIntertAdUINode');
        if (EngineUtils.isCocos()) {
            this.createCocosNativeInsert(adData, nodeData, callback, closeCallback, clickCallback);
        } else {
            this.createLayaNativeInsert(adData, nodeData, callback, closeCallback, clickCallback);
        }
    }

    private static createLayaNativeInsert(adData: any, nodeData: any, callback: Function, closeCallback: Function, clickCallback: Function): void {
        const self = this;
        LogUtils.info('createLayaNativeInsert=================');
        if (this.nativeImageTexture === undefined || this.nativeImageTexture.close === undefined) return;

        const adId = adData.adId;
        let title = adData.title;
        let desc = adData.desc;
        const imgUrl = adData.imgUrl;
        const stageWidth = Laya.stage.width;
        const stageHeight = Laya.stage.height;

        if (title && title.length >= 6) title = title.substring(0, 6);
        if (desc && desc.length >= 6) desc = desc.substring(0, 6);

        Laya.loader.load(imgUrl, Laya.Handler.create(self, (texture: any) => {
            if (!texture) {
                LogUtils.error('nativeAdImgUrl', imgUrl, '加载失败');
                return;
            }

            const insertNode = new Laya.Sprite();
            if (PlatformUtils.isHuaWeiPlatform()) {
                // Huawei specific layout (original code)
                insertNode.name = 'insertNode';
                insertNode.zOrder = 30000;
                insertNode.width = stageWidth;
                insertNode.height = stageHeight;
                Laya.stage.addChild(insertNode);
                insertNode.on('click', self, () => {});

                const mask = new Laya.Sprite();
                mask.name = 'nativeInterMask';
                insertNode.addChild(mask);
                mask.loadImage(self.nativeImageTexture.insertMask);
                mask.width = stageWidth;
                mask.height = stageHeight;
                mask.alpha = 0.6;
                mask.zOrder = 30001;

                const bg = new Laya.Sprite();
                bg.name = 'nativeInsertBg';
                insertNode.addChild(bg);
                bg.loadImage(self.nativeImageTexture.insertBg);
                if (stageWidth < stageHeight) {
                    bg.width = 460;
                    bg.height = 520;
                } else {
                    bg.width = 375;
                    bg.height = 395;
                }
                bg.x = (stageWidth - bg.width) / 2;
                bg.y = (stageHeight - bg.height) / 2 + 0.01 * bg.height;
                bg.zOrder = 30002;
                bg.on('click', self, (e: any) => {
                    e.stopPropagation();
                    LogUtils.info('广告被点击了');
                    clickCallback(adId);
                });

                const bigImage = new Laya.Sprite();
                bigImage.graphics.clear();
                const bw = 0.93 * bg.width;
                const bh = bw / 1280 * 720;
                bigImage.graphics.drawTexture(texture, 0, 0, bw, bh);
                bigImage.size(bw, bh);
                bigImage.visible = true;
                bigImage.x = (bg.width - bigImage.width) / 2;
                bigImage.y = stageWidth < stageHeight ? 0.8 * bigImage.height : bigImage.height / 2;
                bigImage.zOrder = 3003;
                bigImage.name = 'bigImage';
                bg.addChild(bigImage);

                const button = new Laya.Sprite();
                bg.addChild(button);
                button.loadImage(self.nativeImageTexture.button);
                button.width = 130;
                button.height = 50;
                button.x = bg.width - 0.66 * button.width;
                button.y = bg.height - button.height;
                button.pivotX = button.width / 2;
                button.pivotY = button.height / 2;
                button.zOrder = 3004;
                button.on('click', self, (e: any) => {
                    e.stopPropagation();
                    LogUtils.info('广告按钮被点击了');
                    clickCallback(adId);
                });

                const closeNode = new Laya.Sprite();
                closeNode.name = 'closeNode';
                closeNode.active = false;
                closeNode.visible = false;
                bg.addChild(closeNode);
                closeNode.loadImage(self.nativeImageTexture.close);
                closeNode.width = 28;
                closeNode.height = 28;
                closeNode.x = bg.width - closeNode.width - 20;
                closeNode.y = closeNode.height;
                closeNode.zOrder = 3004;
                closeNode.on('click', self, (e: any) => {
                    insertNode.removeSelf();
                    e.stopPropagation();
                    closeCallback();
                });
                setTimeout(() => {
                    closeNode.active = true;
                    closeNode.visible = true;
                }, 1000 * ConfigHelper.getGameConfig().nativeInsertCloseBtnDelayTime);

                const titleLabel = new Laya.Text();
                bg.addChild(titleLabel);
                titleLabel.color = '#000000';
                titleLabel.text = title;
                titleLabel.fontSize = 30;
                titleLabel.align = 'center';
                titleLabel.wordWrap = true;
                titleLabel.width = 0.8 * bg.width;
                titleLabel.height = 0.4 * bg.width;
                titleLabel.x = (bg.width - titleLabel.width) / 2;
                titleLabel.y = 0.09 * bg.height;
                titleLabel.zOrder = 3006;

                if (PlatformUtils.isHuaWeiPlatform() || PlatformUtils.isDebug()) {
                    const sourceLabel = new Laya.Text();
                    sourceLabel.name = 'sourceLabel';
                    sourceLabel.text = desc + ' Ad';
                    sourceLabel.fontSize = 20;
                    bg.addChild(sourceLabel);
                    sourceLabel.y = 0.88 * bg.height;
                    sourceLabel.x = 40;
                }
            } else {
                // Non-Huawei layout (original code)
                insertNode.name = 'insertNode';
                insertNode.zOrder = 30000;
                insertNode.width = stageWidth;
                insertNode.height = stageHeight;
                Laya.stage.addChild(insertNode);
                insertNode.on('click', self, () => {});

                const mask = new Laya.Sprite();
                mask.name = 'nativeInterMask';
                insertNode.addChild(mask);
                mask.loadImage(self.nativeImageTexture.insertMask);
                mask.width = stageWidth;
                mask.height = stageHeight;
                mask.alpha = 0.6;
                mask.zOrder = 30001;

                const bg = new Laya.Sprite();
                bg.name = 'nativeInsertBg';
                insertNode.addChild(bg);
                bg.loadImage(self.nativeImageTexture.insertBg);
                if (stageWidth < stageHeight) {
                    bg.width = 0.85 * stageWidth;
                    bg.height = bg.height;
                } else {
                    bg.width = 375;
                    bg.height = 395;
                }
                bg.x = (stageWidth - bg.width) / 2;
                bg.y = (stageHeight - bg.height) / 2 + 0.01 * bg.height;
                bg.zOrder = 30002;
                bg.on('click', self, (e: any) => {
                    e.stopPropagation();
                    LogUtils.info('广告被点击了');
                    clickCallback(adId);
                });

                const bigImage = new Laya.Sprite();
                bigImage.graphics.clear();
                const bw = 0.93 * bg.width;
                const bh = bw / 1280 * 720;
                bigImage.graphics.drawTexture(texture, 0, 0, bw, bh);
                bigImage.size(bw, bh);
                bigImage.visible = true;
                bigImage.x = (bg.width - bigImage.width) / 2;
                bigImage.y = stageWidth < stageHeight ? bigImage.height : bigImage.height / 2;
                bigImage.zOrder = 3003;
                bigImage.name = 'bigImage';
                bg.addChild(bigImage);

                const button = new Laya.Sprite();
                bg.addChild(button);
                button.loadImage(self.nativeImageTexture.button);
                if (stageWidth < stageHeight) {
                    button.width = 0.6 * bg.width;
                    button.height = 0.3 * button.width;
                } else {
                    button.width = 0.5 * bg.width;
                    button.height = 0.13 * bg.height;
                }
                button.x = bg.width / 2;
                button.y = stageWidth < stageHeight ? 0.8 * bg.height : 0.85 * bg.height;
                button.pivotX = button.width / 2;
                button.pivotY = button.height / 2;
                button.zOrder = 3004;
                button.on('click', self, (e: any) => {
                    e.stopPropagation();
                    LogUtils.info('广告按钮被点击了');
                    clickCallback(adId);
                });

                // Scale animation for button
                (function animate() {
                    Laya.Tween.to(button, { scaleX: 1.2, scaleY: 1.2 }, 150, undefined, Laya.Handler.create(self, () => {
                        Laya.Tween.to(button, { scaleX: 1, scaleY: 1 }, 150, undefined, Laya.Handler.create(self, () => {
                            animate();
                        }));
                    }));
                })();

                const closeNode = new Laya.Sprite();
                closeNode.name = 'closeNode';
                closeNode.active = false;
                closeNode.visible = false;
                bigImage.addChild(closeNode);
                closeNode.loadImage(self.nativeImageTexture.close);
                closeNode.width = 28;
                closeNode.height = 28;
                closeNode.x = bigImage.width - closeNode.width - 40;
                closeNode.y = -closeNode.height / 2;
                closeNode.zOrder = 3004;
                closeNode.on('click', self, (e: any) => {
                    insertNode.removeSelf();
                    e.stopPropagation();
                    closeCallback();
                });
                setTimeout(() => {
                    closeNode.active = true;
                    closeNode.visible = true;
                }, 1000 * ConfigHelper.getGameConfig().nativeInsertCloseBtnDelayTime);

                const titleLabel = new Laya.Text();
                bg.addChild(titleLabel);
                titleLabel.color = '#000000';
                titleLabel.text = title;
                titleLabel.fontSize = 40;
                titleLabel.align = 'center';
                titleLabel.width = 0.8 * bg.width;
                titleLabel.height = 0.2 * bg.width;
                titleLabel.x = (bg.width - titleLabel.width) / 2;
                titleLabel.y = 0.09 * bg.height;
                titleLabel.zOrder = 3006;
            }

            callback(insertNode);
        }), Laya.Handler.create(self, () => {}), Laya.Loader.IMAGE, 1, false, 'res', true);
    }

    private static createCocosNativeInsert(adData: any, nodeData: any, callback: Function, closeCallback: Function, clickCallback: Function): void {
        const self = this;
        if (this.nativeImageTexture === undefined || this.nativeImageTexture.close === undefined) return;

        const adId = adData.adId;
        let title = adData.title;
        let desc = adData.desc;
        const imgUrl = adData.imgUrl;
        const parentNode = nodeData.parentNode;
        const visibleWidth = view.getVisibleSize().width;
        const visibleHeight = view.getVisibleSize().height;

        if (title && title.length >= 6) title = title.substring(0, 6);
        if (desc && desc.length >= 6) desc = desc.substring(0, 6);

        if (imgUrl === undefined) {
            LogUtils.info('nativeAdImgUrl', imgUrl);
            return;
        }

        const insertNode = new Node();
        insertNode.addComponent(UITransform);
        insertNode.layer = Layers.Enum.UI_2D;

        if (PlatformUtils.isHuaWeiPlatform()) {
            // Huawei specific layout (Cocos)
            insertNode.name = 'insertNode';
            insertNode.setSiblingIndex(30000);
            insertNode.getComponent(UITransform)!.width = view.getVisibleSize().width;
            insertNode.getComponent(UITransform)!.height = view.getVisibleSize().height;
            insertNode.addComponent(BlockInputEvents);

            const mask = new Node();
            mask.layer = Layers.Enum.UI_2D;
            mask.addComponent(UIOpacity);
            mask.addComponent(UITransform);
            insertNode.addChild(mask);
            mask.name = 'nativeInterMask';
            mask.addComponent(Sprite);
            mask.getComponent(Sprite)!.spriteFrame = this.nativeImageTexture.insertMask;
            mask.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            mask.getComponent(UITransform)!.width = 3000;
            mask.getComponent(UITransform)!.height = 3000;
            mask.setSiblingIndex(30001);
            mask.getComponent(UIOpacity)!.opacity = 153;

            const bg = new Node();
            bg.addComponent(UITransform);
            bg.layer = Layers.Enum.UI_2D;
            insertNode.addChild(bg);
            bg.addComponent(Sprite);
            bg.getComponent(Sprite)!.spriteFrame = this.nativeImageTexture.insertBg;
            bg.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            bg.name = 'nativeInsertBg';
            if (visibleWidth < visibleHeight) {
                bg.getComponent(UITransform)!.width = 460;
                bg.getComponent(UITransform)!.height = 520;
            } else {
                bg.getComponent(UITransform)!.width = 0.35 * visibleWidth;
                bg.getComponent(UITransform)!.height = 0.75 * visibleHeight;
            }
            bg.setPosition(0, 0.01 * -bg.getComponent(UITransform)!.height);
            bg.setSiblingIndex(30002);
            bg.addComponent(Button);
            bg.on('click', () => {
                LogUtils.info('广告被点击了');
                clickCallback(adId);
            });

            const bigImage = new Node();
            bigImage.addComponent(UITransform);
            bigImage.layer = Layers.Enum.UI_2D;
            bigImage.name = 'bigImage';
            bg.addChild(bigImage);
            LoaderUtils.loadImg(imgUrl, (err: any, spriteFrame: any) => {
                bigImage.addComponent(Sprite);
                bigImage.getComponent(Sprite)!.spriteFrame = spriteFrame;
                bigImage.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                bigImage.getComponent(UITransform)!.width = 0.93 * bg.getComponent(UITransform)!.width;
                bigImage.getComponent(UITransform)!.height = (0.93 * bg.getComponent(UITransform)!.width / 1280) * 720;
                bigImage.setPosition(0, -40);
                bigImage.setSiblingIndex(30003);

                const closeNode = new Node();
                closeNode.addComponent(UITransform);
                closeNode.layer = Layers.Enum.UI_2D;
                bg.addChild(closeNode);
                closeNode.name = 'nativeInsertClose';
                closeNode.addComponent(Sprite);
                closeNode.getComponent(Sprite)!.spriteFrame = self.nativeImageTexture.close;
                closeNode.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                closeNode.getComponent(UITransform)!.width = 28;
                closeNode.getComponent(UITransform)!.height = 28;
                LogUtils.info('nativeInsertBg.width / 2', bg.getComponent(UITransform)!.width / 2);
                closeNode.setPosition(
                    bg.getComponent(UITransform)!.width / 2 - 1.2 * closeNode.getComponent(UITransform)!.width,
                    bg.getComponent(UITransform)!.height / 2 - 1.2 * closeNode.getComponent(UITransform)!.height
                );
                closeNode.setSiblingIndex(30004);
                closeNode.active = false;
                closeNode.addComponent(Button);
                closeNode.on('click', () => {
                    LogUtils.info('关闭插屏');
                    insertNode.removeFromParent();
                    closeCallback();
                });
                setTimeout(() => {
                    closeNode.active = true;
                }, 1000 * ConfigHelper.getGameConfig().nativeInsertCloseBtnDelayTime);

                const adTips = new Node('AdTips');
                bg.addChild(adTips);
                adTips.addComponent(UITransform);
                adTips.addComponent(Sprite);
                adTips.layer = Layers.Enum.UI_2D;
                adTips.getComponent(Sprite)!.spriteFrame = self.nativeImageTexture.tip;
                adTips.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                adTips.getComponent(UITransform)!.width = 40;
                adTips.getComponent(UITransform)!.height = 18;
                adTips.setSiblingIndex(30005);

                const tipX = 0.93 * bg.getComponent(UITransform)!.width * 0.5 - 0.5 * adTips.getComponent(UITransform)!.width;
                const tipY = -40 - (0.93 * bg.getComponent(UITransform)!.width / 1280) * 720 * 0.5 + 0.5 * adTips.getComponent(UITransform)!.height;
                adTips.setPosition(tipX, tipY);
            });

            const button = new Node();
            button.addComponent(UITransform);
            button.layer = Layers.Enum.UI_2D;
            bg.addChild(button);
            button.name = 'nativeInsertButton';
            button.setSiblingIndex(30004);
            button.addComponent(Sprite);
            button.getComponent(Sprite)!.spriteFrame = this.nativeImageTexture.button;
            button.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;

            let buttonY = 0;
            if (visibleWidth < visibleHeight) {
                button.getComponent(UITransform)!.width = 130;
                button.getComponent(UITransform)!.height = 50;
                buttonY = 0.5 * -bg.getComponent(UITransform)!.height + 1.1 * button.getComponent(UITransform)!.height;
            } else {
                button.getComponent(UITransform)!.width = 0.5 * bg.getComponent(UITransform)!.width;
                button.getComponent(UITransform)!.height = 0.13 * bg.getComponent(UITransform)!.height;
                buttonY = -bg.getComponent(UITransform)!.height / 4 + button.getComponent(UITransform)!.height;
            }
            const buttonX = 0.5 * bg.getComponent(UITransform)!.width - 0.66 * button.getComponent(UITransform)!.width;
            button.setPosition(buttonX, buttonY);
            button.addComponent(Button);
            button.on('click', () => {
                LogUtils.info('广告按钮被点击了');
                clickCallback(adId);
            });

            const titleLabel = new Node();
            titleLabel.addComponent(UITransform);
            titleLabel.layer = Layers.Enum.UI_2D;
            bg.addChild(titleLabel);
            titleLabel.name = 'titleLabel';
            titleLabel.addComponent(Label);
            titleLabel.getComponent(Label)!.fontSize = 30;
            titleLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
            titleLabel.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
            titleLabel.getComponent(Label)!.color = new Color(99, 96, 96);
            titleLabel.getComponent(Label)!.string = title;
            titleLabel.getComponent(Label)!.enableWrapText = true;

            let titleY = 0;
            if (visibleWidth < visibleHeight) {
                titleY = bg.getComponent(UITransform)!.height / 3;
            } else {
                titleY = bg.getComponent(UITransform)!.height / 2.8;
            }
            titleLabel.setPosition(0, titleY);

            if (PlatformUtils.isHuaWeiPlatform() || PlatformUtils.isDebug()) {
                const descLabel = new Node('nativeAdDesc');
                bg.addChild(descLabel);
                descLabel.layer = Layers.Enum.UI_2D;
                descLabel.addComponent(Label);
                descLabel.getComponent(Label)!.overflow = Label.Overflow.RESIZE_HEIGHT;
                descLabel.getComponent(Label)!.string = desc + ' Ad';
                descLabel.getComponent(Label)!.lineHeight = 25;
                descLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
                descLabel.getComponent(Label)!.color = new Color(0, 0, 0);
                descLabel.getComponent(Label)!.fontSize = 25;
                descLabel.getComponent(UITransform)!.width = 100;
                descLabel.getComponent(UITransform)!.height = 30;
                descLabel.getComponent(UITransform)!.setAnchorPoint(new Vec2(0, 0.5));
                descLabel.setPosition(
                    0.5 * -bg.getComponent(UITransform)!.width + 45,
                    0.5 * -bg.getComponent(UITransform)!.height + 1.3 * descLabel.getComponent(UITransform)!.height
                );
            }
        } else {
            // Non-Huawei layout
            insertNode.name = 'insertNode';
            insertNode.setSiblingIndex(30000);
            insertNode.getComponent(UITransform)!.width = view.getVisibleSize().width;
            insertNode.getComponent(UITransform)!.height = view.getVisibleSize().height;
            insertNode.addComponent(BlockInputEvents);

            const mask = new Node();
            mask.addComponent(UIOpacity);
            mask.addComponent(UITransform);
            insertNode.addChild(mask);
            mask.layer = Layers.Enum.UI_2D;
            mask.name = 'nativeInterMask';
            mask.addComponent(Sprite);
            mask.getComponent(Sprite)!.spriteFrame = this.nativeImageTexture.insertMask;
            mask.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            mask.getComponent(UITransform)!.width = 3000;
            mask.getComponent(UITransform)!.height = 3000;
            mask.setSiblingIndex(30001);
            mask.getComponent(UIOpacity)!.opacity = 153;

            const bg = new Node();
            bg.addComponent(UITransform);
            bg.layer = Layers.Enum.UI_2D;
            insertNode.addChild(bg);
            bg.addComponent(Sprite);
            bg.getComponent(Sprite)!.spriteFrame = this.nativeImageTexture.insertBg;
            bg.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            bg.name = 'nativeInsertBg';
            if (visibleWidth < visibleHeight) {
                bg.getComponent(UITransform)!.width = 0.85 * visibleWidth;
                bg.getComponent(UITransform)!.height = bg.getComponent(UITransform)!.height;
            } else {
                bg.getComponent(UITransform)!.width = 0.35 * visibleWidth;
                bg.getComponent(UITransform)!.height = 0.75 * visibleHeight;
            }
            bg.setPosition(0, 0.01 * -bg.getComponent(UITransform)!.height);
            bg.setSiblingIndex(30002);
            bg.addComponent(Button);
            bg.on('click', () => {
                LogUtils.info('广告被点击了');
                clickCallback(adId);
            });

            const bigImage = new Node();
            bigImage.addComponent(UITransform);
            bigImage.layer = Layers.Enum.UI_2D;
            bigImage.name = 'bigImage';
            bg.addChild(bigImage);
            LoaderUtils.loadImg(imgUrl, (err: any, spriteFrame: any) => {
                bigImage.addComponent(Sprite);
                bigImage.getComponent(Sprite)!.spriteFrame = spriteFrame;
                bigImage.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                bigImage.getComponent(UITransform)!.width = 0.93 * bg.getComponent(UITransform)!.width;
                bigImage.getComponent(UITransform)!.height = (0.93 * bg.getComponent(UITransform)!.width / 1280) * 720;
                bigImage.setPosition(0, 0);
                bigImage.setSiblingIndex(30003);

                const closeNode = new Node();
                closeNode.addComponent(UITransform);
                closeNode.layer = Layers.Enum.UI_2D;
                bigImage.addChild(closeNode);
                closeNode.name = 'nativeInsertClose';
                closeNode.addComponent(Sprite);
                closeNode.getComponent(Sprite)!.spriteFrame = self.nativeImageTexture.close;
                closeNode.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                closeNode.getComponent(UITransform)!.width = 28;
                closeNode.getComponent(UITransform)!.height = 28;
                LogUtils.info('bigImage.width / 2', bigImage.getComponent(UITransform)!.width / 2);
                closeNode.setPosition(
                    bigImage.getComponent(UITransform)!.width / 2 - 2 * closeNode.getComponent(UITransform)!.width,
                    bigImage.getComponent(UITransform)!.height / 2
                );
                closeNode.setSiblingIndex(30004);
                closeNode.active = false;
                closeNode.addComponent(Button);
                closeNode.on('click', () => {
                    LogUtils.info('关闭插屏');
                    insertNode.removeFromParent();
                    closeCallback();
                });
                setTimeout(() => {
                    closeNode.active = true;
                }, 1000 * ConfigHelper.getGameConfig().nativeInsertCloseBtnDelayTime);
            });

            const button = new Node();
            button.addComponent(UITransform);
            button.layer = Layers.Enum.UI_2D;
            bg.addChild(button);
            button.name = 'nativeInsertButton';
            button.setSiblingIndex(30004);
            button.addComponent(Sprite);
            button.getComponent(Sprite)!.spriteFrame = this.nativeImageTexture.button;
            button.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;

            let buttonY = 0;
            if (visibleWidth < visibleHeight) {
                button.getComponent(UITransform)!.width = 0.6 * bg.getComponent(UITransform)!.width;
                button.getComponent(UITransform)!.height = 0.3 * button.getComponent(UITransform)!.width;
                buttonY = -bg.getComponent(UITransform)!.height / 4 - button.getComponent(UITransform)!.height / 2;
            } else {
                button.getComponent(UITransform)!.width = 0.5 * bg.getComponent(UITransform)!.width;
                button.getComponent(UITransform)!.height = 0.13 * bg.getComponent(UITransform)!.height;
                buttonY = -bg.getComponent(UITransform)!.height / 4 - button.getComponent(UITransform)!.height;
            }
            button.setPosition(0, buttonY);
            button.addComponent(Button);
            button.on('click', () => {
                LogUtils.info('广告按钮被点击了');
                clickCallback(adId);
            });

            // Scale animation for button
            tween(button)
                .sequence(
                    tween(button).to(0.15, { scale: new Vec3(1.2, 1.2, 1) }),
                    tween(button).to(0.15, { scale: new Vec3(1, 1, 1) })
                )
                .repeatForever()
                .start();

            const titleLabel = new Node();
            titleLabel.addComponent(UITransform);
            titleLabel.layer = Layers.Enum.UI_2D;
            bg.addChild(titleLabel);
            titleLabel.name = 'titleLabel';
            titleLabel.addComponent(Label);
            titleLabel.getComponent(Label)!.fontSize = 40;
            titleLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
            titleLabel.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
            titleLabel.getComponent(Label)!.color = new Color(99, 96, 96);
            titleLabel.getComponent(Label)!.string = title;

            let titleY = 0;
            if (visibleWidth < visibleHeight) {
                titleY = bg.getComponent(UITransform)!.height / 3;
            } else {
                titleY = bg.getComponent(UITransform)!.height / 2.8;
            }
            titleLabel.setPosition(0, titleY);
        }

        if (parentNode) {
            parentNode.addChild(insertNode);
        } else {
            director.getScene()?.getChildByName('Canvas')?.addChild(insertNode);
        }
        callback(insertNode);
    }

    public static createPrivacyAgreement(successCallback?: Function, parentNode?: Node): void {
        const showPolicy = StoreUtils.getInstance().get(StoreUtils.showPolicy, Type.Boolean, true);
        LogUtils.info('隐私政策状态, showPolicy:', showPolicy);
        if (showPolicy === false || this.privacyAgreementNode) {
            if (successCallback) successCallback(true);
            return;
        }

        let companyLog = LocalConfig.DA_YANG_PRIVACY_AGREEMENT.companyLog;
        let agreementHtml = LocalConfig.DA_YANG_PRIVACY_AGREEMENT.agreementHtml;
        if (SDKInstance.isVivoPlatform()) {
            companyLog = LocalConfig.DA_YANG_PRIVACY_AGREEMENT.companyLog;
            agreementHtml = LocalConfig.DA_YANG_PRIVACY_AGREEMENT.agreementHtml;
        }

        const images = [
            companyLog,
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/privacyAgreementBtn.png',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/agree.png',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/cancel.png',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/userBtn.png'
        ];
        const oppoImages = [
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/oppo/p1.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/oppo/p2.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/oppo/p3.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/oppo/p4.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/oppo/p5.jpg'
        ];

        if (EngineUtils.isCocos()) {
            this.createPrivacyAgreementCocos(images, agreementHtml, oppoImages, successCallback, parentNode);
        } else {
            this.createPrivacyAgreementLaya(images, agreementHtml, oppoImages, successCallback);
        }
    }

    public static showPrivacyPolicyDetails(parentNode?: Node): void {
        LogUtils.info('showPrivacyPolicyDetails ===');
        let agreementHtml = LocalConfig.DA_YANG_PRIVACY_AGREEMENT.agreementHtml;
        if (SDKInstance.isVivoPlatform()) {
            agreementHtml = LocalConfig.DA_YANG_PRIVACY_AGREEMENT.agreementHtml;
        }

        let imageUrls = [
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p1.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p2.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p3.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p4.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p5.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p6.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p7.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p8.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p9.jpg'
        ];

        if (SDKInstance.isVivoPlatform()) {
            imageUrls = [
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p1.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p2.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p3.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p4.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p5.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p6.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p7.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p8.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/p9.jpg'
            ];
        } else if (SDKInstance.isKsPlatform()) {
            imageUrls = [
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/ksp1.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/ksp2.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/ksp3.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/ksp4.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/ksp5.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/ksp6.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/ksp7.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/ksp8.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/ksp9.jpg'
            ];
        } else if (SDKInstance.isQQGameH5()) {
            imageUrls = [
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/p1.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/p2.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/p3.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/p4.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/p5.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/p6.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/p7.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/p8.jpg',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/p9.jpg'
            ];
        }

        if (PlatformUtils.isHuaWeiPlatform()) {
            hbs.openDeeplink({ uri: agreementHtml });
        } else if (EngineUtils.isCocos()) {
            const parent = parentNode;
            LoaderUtils.loadResArray(
                [
                    'https://www.quduoduodata.top/ossfile/PrivacyPolicy/bgWhite.png',
                    'https://www.quduoduodata.top/ossfile/qddSDKRes/native/close.png'
                ],
                (err: any, textures: any[]) => {
                    const policyDetailsNode = new Node('policyDetailsNode');
                    if (parent) {
                        parent.addChild(policyDetailsNode);
                    } else {
                        director.getScene()?.getChildByName('Canvas')?.addChild(policyDetailsNode);
                    }
                    policyDetailsNode.setSiblingIndex(31111);
                    policyDetailsNode.addComponent(UITransform);
                    policyDetailsNode.layer = Layers.Enum.UI_2D;
                    policyDetailsNode.addComponent(Sprite);
                    policyDetailsNode.getComponent(Sprite)!.spriteFrame = textures[0];
                    policyDetailsNode.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                    policyDetailsNode.getComponent(UITransform)!.width = view.getVisibleSize().width;
                    policyDetailsNode.getComponent(UITransform)!.height = view.getVisibleSize().height;
                    policyDetailsNode.addComponent(BlockInputEvents);

                    const titleLabel = new Node();
                    titleLabel.addComponent(UITransform);
                    titleLabel.layer = Layers.Enum.UI_2D;
                    policyDetailsNode.addChild(titleLabel);
                    titleLabel.name = 'titleLabel';
                    titleLabel.addComponent(Label);
                    titleLabel.getComponent(Label)!.fontSize = 40;
                    titleLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
                    titleLabel.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
                    titleLabel.getComponent(Label)!.color = new Color(99, 96, 96);
                    titleLabel.getComponent(Label)!.string = '隐私政策';
                    titleLabel.addComponent(Widget);
                    titleLabel.getComponent(Widget)!.isAlignTop = true;
                    titleLabel.getComponent(Widget)!.top = 30;

                    const btnClose = new Node('bynClose');
                    btnClose.addComponent(UITransform);
                    policyDetailsNode.addChild(btnClose);
                    btnClose.layer = Layers.Enum.UI_2D;
                    btnClose.addComponent(Sprite);
                    btnClose.getComponent(Sprite)!.spriteFrame = textures[1];
                    btnClose.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                    btnClose.getComponent(UITransform)!.width = 60;
                    btnClose.getComponent(UITransform)!.height = 60;
                    btnClose.addComponent(Widget);
                    btnClose.getComponent(Widget)!.isAlignTop = true;
                    btnClose.getComponent(Widget)!.top = 80;
                    btnClose.getComponent(Widget)!.isAlignLeft = true;
                    btnClose.getComponent(Widget)!.left = 120;
                    btnClose.addComponent(Button);
                    btnClose.on('click', () => {
                        policyDetailsNode.removeFromParent();
                    });

                    const scrollNode = new Node('scrollNode');
                    policyDetailsNode.addChild(scrollNode);
                    scrollNode.layer = Layers.Enum.UI_2D;
                    scrollNode.addComponent(UITransform);
                    scrollNode.addComponent(Widget);
                    scrollNode.getComponent(Widget)!.isAlignTop = true;
                    scrollNode.getComponent(Widget)!.top = 140;
                    scrollNode.getComponent(Widget)!.isAlignBottom = true;
                    scrollNode.getComponent(Widget)!.bottom = 0;
                    scrollNode.getComponent(Widget)!.isAlignRight = true;
                    scrollNode.getComponent(Widget)!.right = 0;
                    scrollNode.getComponent(Widget)!.isAlignLeft = true;
                    scrollNode.getComponent(Widget)!.left = 0;
                    scrollNode.addComponent(ScrollView);

                    const viewNode = new Node('view');
                    scrollNode.addChild(viewNode);
                    viewNode.layer = Layers.Enum.UI_2D;
                    viewNode.addComponent(UITransform);
                    viewNode.addComponent(Widget);
                    viewNode.getComponent(Widget)!.isAlignTop = true;
                    viewNode.getComponent(Widget)!.top = 0;
                    viewNode.getComponent(Widget)!.isAlignBottom = true;
                    viewNode.getComponent(Widget)!.bottom = 0;
                    viewNode.getComponent(Widget)!.isAlignRight = true;
                    viewNode.getComponent(Widget)!.right = 0;
                    viewNode.getComponent(Widget)!.isAlignLeft = true;
                    viewNode.getComponent(Widget)!.left = 0;
                    viewNode.addComponent(Mask);
                    viewNode.getComponent(Mask)!.type = MaskType.GRAPHICS_RECT;

                    const content = new Node('content');
                    viewNode.addChild(content);
                    setTimeout(() => {
                        content.layer = Layers.Enum.UI_2D;
                        content.addComponent(UITransform);
                        content.getComponent(UITransform)!.anchorY = 1;
                        content.addComponent(Widget);
                        content.getComponent(Widget)!.isAlignRight = true;
                        content.getComponent(Widget)!.right = 0;
                        content.getComponent(Widget)!.isAlignLeft = true;
                        content.getComponent(Widget)!.left = 0;
                        content.addComponent(Layout);
                        content.getComponent(Layout)!.type = Layout.Type.VERTICAL;
                        content.getComponent(Layout)!.resizeMode = Layout.ResizeMode.CONTAINER;
                        content.getComponent(Layout)!.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
                        scrollNode.getComponent(ScrollView)!.content = content;
                        scrollNode.getComponent(ScrollView)!.vertical = true;
                        scrollNode.getComponent(ScrollView)!.horizontal = false;
                        scrollNode.getComponent(ScrollView)!.inertia = true;
                        scrollNode.getComponent(ScrollView)!.brake = 0.75;
                        scrollNode.getComponent(ScrollView)!.elastic = true;
                        scrollNode.getComponent(ScrollView)!.bounceDuration = 0.23;

                        LoaderUtils.loadResArray(imageUrls, (err: any, imgTextures: any[]) => {
                            for (let i = 0; i < imgTextures.length; i++) {
                                const page = new Node('p' + (i + 1));
                                page.layer = Layers.Enum.UI_2D;
                                page.parent = content;
                                page.addComponent(UITransform);
                                page.addComponent(Sprite);
                                page.getComponent(Sprite)!.spriteFrame = imgTextures[i];
                                page.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                                page.getComponent(UITransform)!.width = 960;
                                page.getComponent(UITransform)!.height = 1666;
                            }
                        });
                    }, 100);
                }
            );
        } else {
            // Laya implementation
            const bg = new Laya.Image();
            bg.size(Laya.stage.width, Laya.stage.height);
            Laya.stage.addChild(bg);

            const panel = new Laya.Panel();
            panel.size(Laya.stage.width, Laya.stage.height);
            panel.vScrollBarSkin = '';
            bg.addChild(panel);

            const closeBtn = new Laya.Image();
            closeBtn.skin = 'https://file.quduoduodata.top/ossfile/qddSDKRes/native/close.png';
            closeBtn.pos(Laya.stage.width - 80, 30);
            bg.addChild(closeBtn);
            closeBtn.on(Laya.Event.CLICK, this, () => {
                bg.destroy();
            });

            for (let i = 0; i < imageUrls.length; i++) {
                const img = new Laya.Image();
                img.skin = imageUrls[i];
                img.size(640, 1136);
                panel.addChild(img);
                img.pos(0, 1136 * i);
            }
        }
    }

    private static createPrivacyAgreementCocos(images: string[], agreementHtml: string, oppoImages: string[], successCallback?: Function, parentNode?: Node): void {
        const self = this;
        const parent = parentNode;
        LoaderUtils.loadResArray(images, (err: any, textures: any[]) => {
            const privacyAgreementNode = new Node('privacyAgreementNode');
            self.privacyAgreementNode = privacyAgreementNode;
            privacyAgreementNode.layer = Layers.Enum.UI_2D;
            privacyAgreementNode.addComponent(UITransform);
            if (parent) {
                parent.addChild(privacyAgreementNode);
            } else {
                director.getScene()?.getChildByName('Canvas')?.addChild(privacyAgreementNode);
            }

            if (view.getVisibleSize().width < view.getVisibleSize().height) {
                privacyAgreementNode.scale = new Vec3(
                    view.getDesignResolutionSize().width / 1080,
                    view.getDesignResolutionSize().width / 1080,
                    1
                );
            } else {
                privacyAgreementNode.scale = new Vec3(
                    view.getDesignResolutionSize().height / 1080,
                    view.getDesignResolutionSize().height / 1080,
                    1
                );
            }
            privacyAgreementNode.layer = Layers.Enum.UI_2D;
            privacyAgreementNode.setSiblingIndex(30000);

            const main = new Node('main');
            main.layer = Layers.Enum.UI_2D;
            privacyAgreementNode.addChild(main);
            main.addComponent(UITransform);
            main.addComponent(Sprite);
            main.getComponent(Sprite)!.spriteFrame = textures[0];
            main.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;

            const privacyAgreementBtn = new Node('privacyAgreementBtn');
            main.addChild(privacyAgreementBtn);
            privacyAgreementBtn.addComponent(UITransform);
            privacyAgreementBtn.layer = Layers.Enum.UI_2D;
            privacyAgreementBtn.addComponent(Sprite);
            privacyAgreementBtn.getComponent(Sprite)!.spriteFrame = textures[1];
            privacyAgreementBtn.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            privacyAgreementBtn.addComponent(Widget);
            privacyAgreementBtn.getComponent(Widget)!.isAlignRight = true;
            privacyAgreementBtn.getComponent(Widget)!.isAlignBottom = true;
            privacyAgreementBtn.getComponent(Widget)!.right = 236;
            privacyAgreementBtn.getComponent(Widget)!.bottom = 207;
            privacyAgreementBtn.on(Node.EventType.TOUCH_END, () => {
                LogUtils.info('用户点击了隐私政策');
                self.showPrivacyPolicyDetails(privacyAgreementNode.parent);
            });

            if (PlatformUtils.isQQPlatform()) {
                const userBtn = new Node('userBtn');
                main.addChild(userBtn);
                userBtn.addComponent(UITransform);
                userBtn.layer = Layers.Enum.UI_2D;
                userBtn.addComponent(Sprite);
                userBtn.getComponent(Sprite)!.spriteFrame = textures[4];
                userBtn.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                userBtn.addComponent(Widget);
                userBtn.getComponent(Widget)!.isAlignRight = true;
                userBtn.getComponent(Widget)!.isAlignBottom = true;
                userBtn.getComponent(Widget)!.right = 230 - userBtn.getComponent(UITransform)!.width;
                userBtn.getComponent(Widget)!.bottom = 207;
                userBtn.on(Node.EventType.TOUCH_END, () => {
                    LogUtils.info('用户点击了用户协议');
                    self.showUserPolicyDetails(privacyAgreementNode.parent);
                });
            }

            const agree = new Node('agree');
            main.addChild(agree);
            agree.addComponent(UITransform);
            agree.layer = Layers.Enum.UI_2D;
            agree.addComponent(Sprite);
            agree.getComponent(Sprite)!.spriteFrame = textures[2];
            agree.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            agree.addComponent(Widget);
            agree.getComponent(Widget)!.isAlignRight = true;
            agree.getComponent(Widget)!.right = 23;
            agree.getComponent(Widget)!.isAlignBottom = true;
            agree.getComponent(Widget)!.bottom = 30.5;

            const close = new Node('close');
            close.addComponent(UITransform);
            close.layer = Layers.Enum.UI_2D;
            main.addChild(close);
            close.addComponent(Sprite);
            close.getComponent(Sprite)!.spriteFrame = textures[3];
            close.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            close.addComponent(Widget);
            close.getComponent(Widget)!.isAlignLeft = true;
            close.getComponent(Widget)!.left = 24.5;
            close.getComponent(Widget)!.isAlignBottom = true;
            close.getComponent(Widget)!.bottom = 30.5;

            agree.on(Node.EventType.TOUCH_END, () => {
                self.privacyAgreementNode?.removeFromParent();
                self.privacyAgreementNode = undefined;
                StoreUtils.getInstance().set(StoreUtils.showPolicy, Type.Boolean, false);
                if (successCallback) successCallback(true);
            });

            close.on(Node.EventType.TOUCH_END, () => {
                self.privacyAgreementNode?.removeFromParent();
                self.privacyAgreementNode = undefined;
                if (successCallback) successCallback(false);
                game.end();
            });
        });
    }

    private static createPrivacyAgreementLaya(images: string[], agreementHtml: string, oppoImages: string[], successCallback?: Function): void {
        const self = this;
        LoaderUtils.layaLoadResArray(images, (textures: any[]) => {
            const stageWidth = Laya.stage.width;
            const stageHeight = Laya.stage.height;
            const stage = Laya.stage;

            const root = new Laya.Sprite();
            self.privacyAgreementNode = root;
            root.name = 'privacyRootNode';
            root.width = stageWidth;
            root.height = stageHeight;
            root.on('click', self, (e: any) => {
                e.stopPropagation();
            });

            const main = new Laya.Sprite();
            root.addChild(main);
            main.name = 'mainNode';
            main.loadImage(images[0]);
            if (stage.height > stage.width) {
                main.width = 0.8 * stageWidth;
                main.height = 1.1 * main.width;
            } else {
                main.scaleX = 0.6;
                main.scaleY = 0.6;
            }
            main.x = 0.5 * stageWidth - 0.3 * main.width;
            main.y = 0.5 * stageHeight - 0.3 * main.height;

            const privacyBtn = new Laya.Sprite();
            main.addChild(privacyBtn);
            privacyBtn.name = 'privacyAgreementBtn';
            privacyBtn.loadImage(images[1]);
            privacyBtn.width = 100;
            privacyBtn.height = 25;
            privacyBtn.scaleX = 1.2;
            privacyBtn.scaleY = 1.2;
            privacyBtn.y = 0.74 * main.height;
            privacyBtn.x = 0.56 * main.width;
            privacyBtn.on('click', self, (e: any) => {
                self.showPrivacyPolicyDetails();
                e.stopPropagation();
            });

            const agreeNode = new Laya.Sprite();
            agreeNode.name = 'agreeNode';
            main.addChild(agreeNode);
            agreeNode.loadImage(images[2]);
            agreeNode.width = 0.4 * main.width;
            agreeNode.height = 0.43 * agreeNode.width;
            agreeNode.y = main.height - agreeNode.height - 0.2 * agreeNode.height;
            agreeNode.x = main.width - agreeNode.width - 0.1 * agreeNode.width;
            agreeNode.on('click', self, (e: any) => {
                self.privacyAgreementNode?.removeSelf();
                self.privacyAgreementNode = undefined;
                StoreUtils.getInstance().set(StoreUtils.showPolicy, Type.Boolean, false);
                if (successCallback) successCallback(true);
                e.stopPropagation();
            });

            const closeNode = new Laya.Sprite();
            closeNode.name = 'closeNode';
            main.addChild(closeNode);
            closeNode.loadImage(images[3]);
            closeNode.width = 0.4 * main.width;
            closeNode.height = 0.43 * closeNode.width;
            closeNode.y = main.height - closeNode.height - 0.2 * closeNode.height;
            closeNode.x = 0.1 * closeNode.width;
            closeNode.on('click', self, (e: any) => {
                self.privacyAgreementNode?.removeSelf();
                self.privacyAgreementNode = undefined;
                if (successCallback) successCallback(false);
                qg.exitApplication({
                    success: () => { console.log('exitApplication success'); },
                    fail: () => { console.log('exitApplication fail'); },
                    complete: () => { console.log('exitApplication complete'); }
                });
                e.stopPropagation();
            });

            stage.addChild(root);
        });
    }

    public static addTitle(node: Node, title: string, desc: string): void {
        if (title) title = title.substring(0, 6);
        if (desc) desc = desc.substring(0, 6);
        if (PlatformUtils.isHuaWeiPlatform() || PlatformUtils.isDebug()) {
            LogUtils.info('华为平台追加标题和来源');
            const titleLabel = new Node('nativeAdTitle');
            node.addChild(titleLabel);
            titleLabel.layer = Layers.Enum.UI_2D;
            titleLabel.addComponent(UITransform);
            titleLabel.addComponent(Label);
            titleLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
            titleLabel.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
            titleLabel.getComponent(Label)!.overflow = Label.Overflow.SHRINK;
            titleLabel.getComponent(Label)!.color = new Color(0, 0, 0);
            titleLabel.getComponent(UITransform)!.width = 0.8 * node.getComponent(UITransform)!.width;
            titleLabel.getComponent(UITransform)!.height = 30;
            titleLabel.setPosition(
                0,
                node.getComponent(UITransform)!.height / 2 - titleLabel.getComponent(UITransform)!.height / 2 - 0.05 * titleLabel.getComponent(UITransform)!.height
            );
            titleLabel.getComponent(Label)!.fontSize = 25;
            titleLabel.getComponent(Label)!.string = title;
            titleLabel.getComponent(Label)!.lineHeight = titleLabel.getComponent(Label)!.fontSize;

            const descLabel = new Node('nativeAdDesc');
            descLabel.layer = Layers.Enum.UI_2D;
            node.addChild(descLabel);
            descLabel.addComponent(UITransform);
            descLabel.addComponent(Label);
            descLabel.getComponent(Label)!.overflow = Label.Overflow.RESIZE_HEIGHT;
            descLabel.getComponent(Label)!.string = desc;
            descLabel.getComponent(Label)!.lineHeight = 20;
            descLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
            descLabel.getComponent(Label)!.color = new Color(0, 0, 0);
            descLabel.getComponent(Label)!.fontSize = 20;
            descLabel.getComponent(UITransform)!.width = 200;
            descLabel.getComponent(UITransform)!.height = 30;
            descLabel.setPosition(
                -node.getComponent(UITransform)!.width / 2 + descLabel.getComponent(UITransform)!.width / 2,
                -node.getComponent(UITransform)!.height / 2 + descLabel.getComponent(UITransform)!.height / 2
            );
        }
    }

    public static createRecommendList(params: any): void {
        LogUtils.info('createRecommendList===');
        if (this.recommendRootNode) {
            if (params.resultCallback) params.resultCallback(false);
            return;
        }

        if (ConfigHelper.getRecommendGameList().length === 0) {
            if (params.resultCallback) params.resultCallback(false);
            LogUtils.log('ConfigHelper.getRecommendGameList()', ConfigHelper.getRecommendGameList());
            return;
        }

        const imageUrls = [
            'https://www.quduoduodata.top/ossfile/qddSDKRes/native/interMask.png',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/recommend/recommendBg.png',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/recommend/recommendButton.png',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/native/close.png',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/native/ad/image.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/recommend/recommendFrame.png'
        ];

        let gameList = ConfigHelper.getRecommendGameList();
        gameList.sort(() => 0.5 - Math.random());
        const slicedList = gameList.slice(0, 9);
        LogUtils.info('recommendGameList........', slicedList);

        const grid: any[][] = [];
        for (let i = 0; i < slicedList.length; i += 3) {
            grid.push(slicedList.slice(i, i + 3));
        }

        if (EngineUtils.isCocos()) {
            this.createRecommendListCocos(params, imageUrls, grid);
        } else {
            this.createRecommendListLaya(params, imageUrls, grid);
        }
    }

    private static createRecommendListCocos(params: any, imageUrls: string[], grid: any[][]): void {
        const self = this;
        const parentNode = params.parentNode;
        const visibleWidth = view.getVisibleSize().width;
        const visibleHeight = view.getVisibleSize().height + 320;

        const root = new Node();
        root.addComponent(UITransform);
        this.recommendRootNode = root;
        root.name = 'recommendRootNode';
        root.getComponent(UITransform)!.width = visibleWidth;
        root.getComponent(UITransform)!.height = visibleHeight;
        root.addComponent(BlockInputEvents);

        const closeRoot = () => {
            self.recommendRootNode = undefined;
            root.removeFromParent();
            if (params.closeCallback) params.closeCallback();
        };

        LoaderUtils.loadResArray(imageUrls, (err: any, textures: any[]) => {
            const mask = new Node();
            mask.addComponent(UITransform);
            mask.addComponent(UIOpacity);
            mask.name = 'maskNode';
            mask.addComponent(Sprite);
            mask.getComponent(Sprite)!.spriteFrame = textures[0];
            mask.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            mask.getComponent(UITransform)!.width = 3000;
            mask.getComponent(UITransform)!.height = 3000;
            mask.getComponent(UIOpacity)!.opacity = 102;
            mask.parent = root;

            const listWidth = 0.8 * visibleWidth;
            const listHeight = 1.3 * listWidth;
            const listNode = new Node();
            listNode.addComponent(UITransform);
            listNode.addComponent(UIOpacity);
            listNode.name = 'gameListNode';
            listNode.addComponent(Sprite);
            listNode.getComponent(Sprite)!.spriteFrame = textures[1];
            listNode.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            listNode.getComponent(UITransform)!.width = listWidth;
            listNode.getComponent(UITransform)!.height = listHeight;
            listNode.getComponent(UIOpacity)!.opacity = 255;
            listNode.parent = root;

            const cellWidth = listWidth / 4;
            const cellHeight = listHeight / 4;
            const spacingX = cellWidth / 4;
            const spacingY = cellHeight / 4;
            const startX = -listWidth / 2 + cellWidth / 2;
            const startY = listHeight / 2 - cellHeight / 2;

            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const gameData = grid[row][col];
                    const itemNode = new Node('gameItemNode');
                    itemNode.getComponent(UITransform)!.width = cellWidth;
                    itemNode.getComponent(UITransform)!.height = cellHeight;
                    itemNode.setPosition(
                        startX + row * cellWidth + (row + 1) * spacingX,
                        startY - col * cellHeight - (col + 1) * spacingY
                    );
                    itemNode.addComponent(Button);
                    itemNode.on('click', () => {
                        closeRoot();
                        LogUtils.info('已选中，跳转其他小游戏');
                        if (params.toGameCallback) params.toGameCallback(gameData);
                    });

                    const gameImgNode = new Node('gameImgNode');
                    LoaderUtils.loadImg(gameData.gameIcon, (err: any, sf: any) => {
                        gameImgNode.addComponent(Sprite);
                        gameImgNode.getComponent(Sprite)!.spriteFrame = sf;
                        gameImgNode.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                        gameImgNode.getComponent(UITransform)!.width = cellWidth;
                        gameImgNode.getComponent(UITransform)!.height = cellWidth;
                        gameImgNode.parent = itemNode;

                        let gameName = gameData.gameName;
                        if (gameName && gameName.length > 5) {
                            gameName = gameName.substring(0, 5) + '...';
                        }
                        const labelNode = new Node('gameLabelNode');
                        labelNode.addComponent(Label);
                        labelNode.getComponent(Label)!.string = gameName || '';
                        labelNode.getComponent(Label)!.fontSize = 24;
                        labelNode.parent = itemNode;
                        labelNode.setPosition(0, gameImgNode.getComponent(UITransform)!.height / 2 - 30);
                    });
                    itemNode.parent = listNode;
                }
            }

            const closeNode = new Node('closeNode');
            closeNode.addComponent(Sprite);
            closeNode.getComponent(Sprite)!.spriteFrame = textures[3];
            closeNode.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            closeNode.parent = root;
            closeNode.setPosition(
                listNode.getComponent(UITransform)!.width / 2 - closeNode.getComponent(UITransform)!.width / 1.5,
                listNode.getComponent(UITransform)!.height / 2 - closeNode.getComponent(UITransform)!.height / 1.5
            );
            closeNode.addComponent(Button);
            closeNode.on('click', () => { closeRoot(); });

            const buttonNode = new Node('buttionNode');
            buttonNode.addComponent(Sprite);
            buttonNode.getComponent(Sprite)!.spriteFrame = textures[2];
            buttonNode.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
            buttonNode.getComponent(UITransform)!.width = 0.6 * listNode.getComponent(UITransform)!.width;
            buttonNode.getComponent(UITransform)!.height = 0.33 * buttonNode.getComponent(UITransform)!.width;
            buttonNode.parent = root;
            const buttonY = -listNode.getComponent(UITransform)!.height / 2 - buttonNode.getComponent(UITransform)!.height / 2 - buttonNode.getComponent(UITransform)!.height / 3;
            buttonNode.setPosition(0, buttonY);
            buttonNode.addComponent(Button);
            buttonNode.on('click', () => {
                let selected: any = undefined;
                const maxRow = grid.length - 1;
                while (grid.length > 0 && selected === undefined) {
                    const randomRow = Math.floor(Math.random() * maxRow);
                    const randomCol = Math.floor(Math.random() * 2);
                    selected = grid[randomRow][randomCol];
                }
                closeRoot();
                LogUtils.info('已随机选中，跳转其他小游戏');
                if (params.toGameCallback) params.toGameCallback(selected);
            });

            if (parentNode) {
                parentNode.addChild(root);
            } else {
                director.getScene()?.getChildByName('Canvas')?.addChild(root);
            }
            if (params.resultCallback) params.resultCallback(true);
        });
    }

    private static createRecommendListLaya(params: any, imageUrls: string[], grid: any[][]): void {
        const self = this;
        const stageWidth = Laya.stage.width;
        const stageHeight = Laya.stage.height;
        const parentNode = params.parentNode !== undefined ? params.parentNode : Laya.stage;

        const root = new Laya.Sprite();
        root.name = 'recommendRootNode';
        root.width = stageWidth;
        root.height = stageHeight;
        parentNode.addChild(root);
        root.on('click', this, (e: any) => { e.stopPropagation(); });

        const closeRoot = () => {
            self.recommendRootNode = undefined;
            root.removeSelf();
            if (params.closeCallback) params.closeCallback();
        };

        LoaderUtils.layaLoadResArray(imageUrls, (textures: any[]) => {
            const mask = new Laya.Sprite();
            mask.name = 'maskNode';
            mask.loadImage(imageUrls[0]);
            mask.width = stageWidth;
            mask.height = stageHeight;
            mask.alpha = 0.6;
            root.addChild(mask);

            const listWidth = 0.8 * stageWidth;
            const listHeight = 1.3 * listWidth;
            const listNode = new Laya.Sprite();
            listNode.name = 'gameListNode';
            listNode.loadImage(imageUrls[1]);
            listNode.width = listWidth;
            listNode.height = listHeight;
            listNode.x = (root.width - listNode.width) / 2;
            listNode.y = (root.height - listNode.height) / 2;
            root.addChild(listNode);

            const cellWidth = listWidth / 4;
            const cellHeight = listHeight / 4;
            const spacingX = cellWidth / 4;
            const spacingY = cellHeight / 4;

            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const gameData = grid[row][col];
                    const item = new Laya.Sprite();
                    item.width = cellWidth;
                    item.height = cellHeight;
                    item.x = row * cellWidth + (row + 1) * spacingX;
                    item.y = col * cellHeight + (col + 1) * spacingY;
                    item.on('click', self, (e: any) => {
                        closeRoot();
                        LogUtils.info('已选中，跳转其他小游戏');
                        if (params.toGameCallback) params.toGameCallback(gameData);
                    });

                    Laya.loader.load(gameData.gameIcon, Laya.Handler.create(self, (texture: any) => {
                        if (texture) {
                            const img = new Laya.Sprite();
                            img.graphics.drawTexture(texture, 0, 0, cellWidth, cellWidth);
                            img.size(cellWidth, cellWidth);
                            item.addChild(img);

                            let gameName = gameData.gameName;
                            if (gameName && gameName.length > 5) {
                                gameName = gameName.substring(0, 5) + '...';
                            }
                            const label = new Laya.Text();
                            label.name = 'gameLabelNode';
                            label.text = gameName || '';
                            label.fontSize = 25;
                            label.color = '#ffffff';
                            label.align = 'center';
                            label.y = item.height - label.height;
                            item.addChild(label);
                        }
                    }), Laya.Handler.create(self, () => {}), Laya.Loader.IMAGE, 1, false, 'res', true);

                    listNode.addChild(item);
                }
            }

            const closeNode = new Laya.Sprite();
            closeNode.loadImage(imageUrls[3]);
            listNode.addChild(closeNode);
            closeNode.x = listNode.width - closeNode.width;
            closeNode.on('click', self, (e: any) => {
                closeRoot();
                e.stopPropagation();
            });

            const buttonNode = new Laya.Sprite();
            buttonNode.loadImage(imageUrls[2]);
            buttonNode.width = 0.6 * listNode.width;
            buttonNode.height = 0.33 * buttonNode.width;
            listNode.addChild(buttonNode);
            buttonNode.x = (listNode.width - buttonNode.width) / 2;
            buttonNode.y = listNode.height + buttonNode.height / 3;
            buttonNode.on('click', self, (e: any) => {
                let selected: any = undefined;
                const maxRow = grid.length - 1;
                while (grid.length > 0 && selected === undefined) {
                    const randomRow = Math.floor(Math.random() * maxRow);
                    const randomCol = Math.floor(Math.random() * 2);
                    selected = grid[randomRow][randomCol];
                }
                closeRoot();
                LogUtils.info('已随机选中，跳转其他小游戏');
                if (params.toGameCallback) params.toGameCallback(selected);
                e.stopPropagation();
            });

            if (params.resultCallback) params.resultCallback(true);
        });
    }

    public static createRecommendIcon(params: any): void {
        if (ConfigHelper.getRecommendGameList().length !== 0) {
            let gameList = ConfigHelper.getRecommendGameList();
            gameList.sort(() => 0.5 - Math.random());
            LogUtils.log('iconlist', gameList);
            if (EngineUtils.isCocos()) {
                this.createRecommendIconCocos(params, gameList);
            } else {
                this.createRecommendIconLaya(params, gameList);
            }
        } else {
            LogUtils.log('ConfigHelper.getRecommendGameList()', ConfigHelper.getRecommendGameList());
        }
    }

    private static createRecommendIconLaya(params: any, gameList: any[]): void {
        const self = this;
        const top = params.top !== undefined ? params.top : 0;
        const left = params.left !== undefined ? params.left : 0;
        const refreshTime = params.refreshTime !== undefined ? params.refreshTime : 5;
        const parentNode = params.parentNode !== undefined ? params.parentNode : Laya.stage;

        if (this.recommendRootIconNode) {
            this.recommendRootIconNode.removeSelf();
        }
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        const iconRoot = new Laya.Sprite();
        iconRoot.name = 'recommendRootIconNode';
        iconRoot.width = 80;
        iconRoot.height = 100;
        iconRoot.x = left;
        iconRoot.y = top;
        iconRoot.zOrder = 1e26;
        parentNode.addChild(iconRoot);
        this.recommendRootIconNode = iconRoot;

        iconRoot.on('click', this, (e: any) => {
            LogUtils.info('点击了互推icon');
            if (self.itemGame && params.toGameCallback) {
                params.toGameCallback(self.itemGame);
            }
            e.stopPropagation();
        });

        let borderNode: any = null;
        let labelNode: any = null;
        const refresh = () => {
            if (borderNode) borderNode.removeSelf();
            if (labelNode) labelNode.removeSelf();

            const gameData = gameList[Math.floor(Math.random() * gameList.length)];
            self.itemGame = gameData;
            LogUtils.info('item..............', JSON.stringify(gameData));

            borderNode = new Laya.Image();
            borderNode.name = 'gameImgBorderNode';
            borderNode.skin = 'https://www.quduoduodata.top/ossfile/qddSDKRes/recommend/recommendFrame.png';
            borderNode.width = 85;
            borderNode.height = 85;

            const imgNode = new Laya.Image();
            imgNode.name = 'gameImgNode';
            imgNode.skin = gameData.gameIcon;
            imgNode.bottom = 3;
            imgNode.left = 3;
            imgNode.top = 3;
            imgNode.right = 3;
            borderNode.addChild(imgNode);
            iconRoot.addChild(borderNode);

            let gameName = gameData.gameName;
            if (gameName && gameName.length > 5) {
                gameName = gameName.substring(0, 5) + '...';
            }
            labelNode = new Laya.Text();
            labelNode.name = 'gameLabelNode';
            labelNode.text = gameName || '';
            labelNode.fontSize = 18;
            labelNode.width = borderNode.width;
            labelNode.height = 20;
            labelNode.align = 'center';
            labelNode.color = '#000000';
            labelNode.y = borderNode.height + 5;
            iconRoot.addChild(labelNode);
        };

        if (!borderNode) refresh();
        this.intervalId = setInterval(() => {
            refresh();
        }, 1000 * refreshTime);
    }

    private static createRecommendIconCocos(params: any, gameList: any[]): void {
        // Cocos implementation for recommend icon - empty in original code
    }

    public static showLoginTips(successCallback?: Function, parentNode?: Node): void {
        const self = this;
        LogUtils.info('取消登录时弹出提示框');
        const imageUrls = [
            'https://www.quduoduodata.top/ossfile/qddSDKRes/mask.png',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/bgw.png'
        ];
        const parent = parentNode;

        if (EngineUtils.isCocos()) {
            LoaderUtils.loadResArray(imageUrls, (err: any, textures: any[]) => {
                const reLoginNode = new Node('reLogin');
                if (parent) {
                    parent.addChild(reLoginNode);
                } else {
                    director.getScene()?.getChildByName('Canvas')?.addChild(reLoginNode);
                }
                reLoginNode.layer = Layers.Enum.UI_2D;
                reLoginNode.setSiblingIndex(30000);
                reLoginNode.addComponent(BlockInputEvents);
                reLoginNode.addComponent(UITransform);
                reLoginNode.addComponent(Sprite);
                reLoginNode.getComponent(Sprite)!.spriteFrame = textures[0];
                reLoginNode.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                reLoginNode.getComponent(UITransform)!.width = 1000;
                reLoginNode.getComponent(UITransform)!.height = 1600;

                const bg = new Node('bg');
                bg.layer = Layers.Enum.UI_2D;
                bg.addComponent(Sprite);
                bg.addComponent(UITransform);
                bg.getComponent(Sprite)!.spriteFrame = textures[1];
                bg.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                bg.getComponent(UITransform)!.width = 400;
                bg.getComponent(UITransform)!.height = 250;
                reLoginNode.addChild(bg);

                const line = new Node('line');
                line.layer = Layers.Enum.UI_2D;
                line.addComponent(Sprite);
                line.addComponent(UITransform);
                line.getComponent(Sprite)!.spriteFrame = textures[0];
                line.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                line.getComponent(UITransform)!.width = 400;
                line.getComponent(UITransform)!.height = 1;
                line.setPosition(0, -75);
                bg.addChild(line);

                const line1 = new Node('line1');
                line1.layer = Layers.Enum.UI_2D;
                line1.addComponent(UITransform);
                line1.addComponent(Sprite);
                line1.getComponent(Sprite)!.spriteFrame = textures[0];
                line1.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                line1.getComponent(UITransform)!.width = 1;
                line1.getComponent(UITransform)!.height = 50;
                line1.setPosition(0, -100);
                bg.addChild(line1);

                const titleLabel = new Node('titleLabel');
                bg.addChild(titleLabel);
                titleLabel.layer = Layers.Enum.UI_2D;
                titleLabel.addComponent(UITransform);
                titleLabel.addComponent(Label);
                titleLabel.getComponent(Label)!.fontSize = 30;
                titleLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
                titleLabel.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
                titleLabel.getComponent(Label)!.color = Color.BLACK;
                titleLabel.getComponent(Label)!.string = '提示';
                titleLabel.getComponent(Label)!.enableWrapText = true;
                titleLabel.getComponent(UITransform)!.setAnchorPoint(0, 1);
                titleLabel.setPosition(-160, 85);

                const descLabel = new Node('descLabel');
                bg.addChild(descLabel);
                descLabel.layer = Layers.Enum.UI_2D;
                descLabel.addComponent(UITransform);
                descLabel.addComponent(Label);
                descLabel.getComponent(Label)!.fontSize = 20;
                descLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
                descLabel.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
                descLabel.getComponent(Label)!.color = Color.BLACK;
                descLabel.getComponent(Label)!.string = '登录失败,请重新登录.';
                descLabel.getComponent(Label)!.enableWrapText = true;
                descLabel.getComponent(UITransform)!.setAnchorPoint(0, 1);
                descLabel.setPosition(-160, 25);

                const exitText = new Node('exitText');
                bg.addChild(exitText);
                exitText.layer = Layers.Enum.UI_2D;
                exitText.addComponent(UITransform);
                exitText.addComponent(Label);
                exitText.getComponent(Label)!.fontSize = 20;
                exitText.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
                exitText.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
                exitText.getComponent(Label)!.color = Color.BLACK;
                exitText.getComponent(Label)!.string = '退出游戏';
                exitText.getComponent(Label)!.enableWrapText = true;
                exitText.getComponent(UITransform)!.width = 200;
                exitText.getComponent(UITransform)!.height = 50;
                exitText.setPosition(-100, -100);

                const loginText = new Node('loginText');
                loginText.layer = Layers.Enum.UI_2D;
                loginText.addComponent(UITransform);
                bg.addChild(loginText);
                loginText.addComponent(Label);
                loginText.getComponent(Label)!.fontSize = 20;
                loginText.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
                loginText.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
                loginText.getComponent(Label)!.color = new Color(51, 253, 58);
                loginText.getComponent(Label)!.string = '重新登录';
                loginText.getComponent(Label)!.enableWrapText = true;
                loginText.getComponent(UITransform)!.width = 200;
                loginText.getComponent(UITransform)!.height = 50;
                loginText.setPosition(100, -100);

                const exitBtn = new Node('exitBtn');
                bg.addChild(exitBtn);
                exitBtn.layer = Layers.Enum.UI_2D;
                exitBtn.addComponent(UITransform);
                exitBtn.addComponent(Button);
                exitBtn.getComponent(UITransform)!.width = 200;
                exitBtn.getComponent(UITransform)!.height = 50;
                exitBtn.setPosition(-100, -100);

                const loginBtn = new Node('loginBtn');
                loginBtn.layer = Layers.Enum.UI_2D;
                loginBtn.addComponent(UITransform);
                bg.addChild(loginBtn);
                loginBtn.addComponent(Button);
                loginBtn.getComponent(UITransform)!.width = 200;
                loginBtn.getComponent(UITransform)!.height = 50;
                loginBtn.setPosition(100, -100);

                exitBtn.on('click', () => {
                    console.log('退出游戏');
                    game.end();
                });

                loginBtn.on('click', () => {
                    console.log('重新登录');
                    if (successCallback) successCallback(true);
                    reLoginNode.removeFromParent();
                });
            });
        } else {
            LoaderUtils.layaLoadResArray(imageUrls, (textures: any[]) => {
                const mask = new Laya.Image();
                mask.loadImage(imageUrls[0]);
                Laya.stage.addChild(mask);
                mask.zOrder = 29999;
                mask.width = Laya.stage.width;
                mask.height = 1.5 * Laya.stage.height;
                mask.centerX = 0;
                mask.centerY = 0;
                mask.on(Laya.Event.CLICK, self, () => {});

                const bg = new Laya.Image();
                bg.loadImage(imageUrls[1]);
                mask.addChild(bg);
                bg.width = 400;
                bg.height = 250;
                bg.centerX = 0;
                bg.centerY = 0;

                const line = new Laya.Image();
                line.loadImage(imageUrls[0]);
                bg.addChild(line);
                line.width = 400;
                line.height = 1;
                line.y = 200;

                const line1 = new Laya.Image();
                line1.loadImage(imageUrls[0]);
                bg.addChild(line1);
                line1.width = 1;
                line1.height = 50;
                line1.y = 200;
                line1.x = 200;

                const titleText = new Laya.Text();
                bg.addChild(titleText);
                titleText.x = 40;
                titleText.y = 40;
                titleText.text = '提示';
                titleText.bold = true;
                titleText.fontSize = 30;
                titleText.color = '#000000';

                const descText = new Laya.Text();
                bg.addChild(descText);
                descText.x = 40;
                descText.y = 100;
                descText.text = '登录失败,请重新登录.';
                descText.fontSize = 20;
                descText.color = '#000000';

                const exitText = new Laya.Text();
                bg.addChild(exitText);
                exitText.width = 200;
                exitText.height = 50;
                exitText.x = 0;
                exitText.y = 200;
                exitText.text = '退出游戏';
                exitText.fontSize = 20;
                exitText.bold = true;
                exitText.color = '#000000';
                exitText.align = 'center';
                exitText.valign = 'middle';

                const loginText = new Laya.Text();
                bg.addChild(loginText);
                loginText.width = 200;
                loginText.height = 50;
                loginText.x = 200;
                loginText.y = 200;
                loginText.text = '重新登录';
                loginText.bold = true;
                loginText.fontSize = 20;
                loginText.color = '#000000';
                loginText.align = 'center';
                loginText.valign = 'middle';

                const exitBtn = new Laya.Image();
                bg.addChild(exitBtn);
                exitBtn.width = 200;
                exitBtn.height = 50;
                exitBtn.y = 200;
                exitBtn.x = 0;

                const loginBtn = new Laya.Image();
                bg.addChild(loginBtn);
                loginBtn.width = 200;
                loginBtn.height = 50;
                loginBtn.y = 200;
                loginBtn.x = 200;

                exitBtn.on(Laya.Event.CLICK, self, () => {
                    console.log('退出游戏');
                    qg.exitApplication({
                        success: () => {},
                        fail: () => {},
                        complete: () => {}
                    });
                });

                loginBtn.on(Laya.Event.CLICK, self, () => {
                    console.log('重新登录');
                    if (successCallback) successCallback(true);
                    mask.removeSelf();
                });
            });
        }
    }

    public static showUserPolicyDetails(parentNode?: Node): void {
        LogUtils.info('showUserPolicyDetails ===');
        let imageUrls = [
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/u1.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/u2.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/u3.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/u4.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/u5.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/u6.jpg',
            'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/dy/u7.jpg'
        ];

        if (SDKInstance.isQQGameH5()) {
            imageUrls = [
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u1.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u2.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u3.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u4.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u5.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u6.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u7.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u8.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u9.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u10.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u11.png',
                'https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/company/qdd/u12.png'
            ];
        }

        if (EngineUtils.isCocos()) {
            const parent = parentNode;
            LoaderUtils.loadResArray(
                [
                    'https://www.quduoduodata.top/ossfile/PrivacyPolicy/bgWhite.png',
                    'https://www.quduoduodata.top/ossfile/qddSDKRes/native/close.png'
                ],
                (err: any, textures: any[]) => {
                    const policyDetailsNode = new Node('policyDetailsNode');
                    if (parent) {
                        parent.addChild(policyDetailsNode);
                    } else {
                        director.getScene()?.getChildByName('Canvas')?.addChild(policyDetailsNode);
                    }
                    policyDetailsNode.setSiblingIndex(31111);
                    policyDetailsNode.addComponent(UITransform);
                    policyDetailsNode.layer = Layers.Enum.UI_2D;
                    policyDetailsNode.addComponent(Sprite);
                    policyDetailsNode.getComponent(Sprite)!.spriteFrame = textures[0];
                    policyDetailsNode.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                    policyDetailsNode.getComponent(UITransform)!.width = view.getVisibleSize().width;
                    policyDetailsNode.getComponent(UITransform)!.height = view.getVisibleSize().height;
                    policyDetailsNode.addComponent(BlockInputEvents);

                    const titleLabel = new Node();
                    titleLabel.addComponent(UITransform);
                    titleLabel.layer = Layers.Enum.UI_2D;
                    policyDetailsNode.addChild(titleLabel);
                    titleLabel.name = 'titleLabel';
                    titleLabel.addComponent(Label);
                    titleLabel.getComponent(Label)!.fontSize = 40;
                    titleLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.CENTER;
                    titleLabel.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
                    titleLabel.getComponent(Label)!.color = new Color(99, 96, 96);
                    titleLabel.getComponent(Label)!.string = '用户协议';
                    titleLabel.addComponent(Widget);
                    titleLabel.getComponent(Widget)!.isAlignTop = true;
                    titleLabel.getComponent(Widget)!.top = 30;

                    const btnClose = new Node('bynClose');
                    btnClose.addComponent(UITransform);
                    policyDetailsNode.addChild(btnClose);
                    btnClose.layer = Layers.Enum.UI_2D;
                    btnClose.addComponent(Sprite);
                    btnClose.getComponent(Sprite)!.spriteFrame = textures[1];
                    btnClose.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                    btnClose.getComponent(UITransform)!.width = 40;
                    btnClose.getComponent(UITransform)!.height = 40;
                    btnClose.addComponent(Widget);
                    btnClose.getComponent(Widget)!.isAlignTop = true;
                    btnClose.getComponent(Widget)!.top = 40;
                    btnClose.getComponent(Widget)!.isAlignRight = true;
                    btnClose.getComponent(Widget)!.right = 440;
                    btnClose.addComponent(Button);
                    btnClose.on('click', () => {
                        policyDetailsNode.removeFromParent();
                    });

                    const scrollNode = new Node('scrollNode');
                    policyDetailsNode.addChild(scrollNode);
                    scrollNode.layer = Layers.Enum.UI_2D;
                    scrollNode.addComponent(UITransform);
                    scrollNode.addComponent(Widget);
                    scrollNode.getComponent(Widget)!.isAlignTop = true;
                    scrollNode.getComponent(Widget)!.top = 110;
                    scrollNode.getComponent(Widget)!.isAlignBottom = true;
                    scrollNode.getComponent(Widget)!.bottom = 0;
                    scrollNode.getComponent(Widget)!.isAlignRight = true;
                    scrollNode.getComponent(Widget)!.right = 0;
                    scrollNode.getComponent(Widget)!.isAlignLeft = true;
                    scrollNode.getComponent(Widget)!.left = 0;
                    scrollNode.addComponent(ScrollView);

                    const viewNode = new Node('view');
                    scrollNode.addChild(viewNode);
                    viewNode.layer = Layers.Enum.UI_2D;
                    viewNode.addComponent(UITransform);
                    viewNode.addComponent(Widget);
                    viewNode.getComponent(Widget)!.isAlignTop = true;
                    viewNode.getComponent(Widget)!.top = 0;
                    viewNode.getComponent(Widget)!.isAlignBottom = true;
                    viewNode.getComponent(Widget)!.bottom = 0;
                    viewNode.getComponent(Widget)!.isAlignRight = true;
                    viewNode.getComponent(Widget)!.right = 0;
                    viewNode.getComponent(Widget)!.isAlignLeft = true;
                    viewNode.getComponent(Widget)!.left = 0;
                    viewNode.addComponent(Mask);
                    viewNode.getComponent(Mask)!.type = Mask.Type.RECT;

                    const content = new Node('content');
                    viewNode.addChild(content);
                    setTimeout(() => {
                        content.layer = Layers.Enum.UI_2D;
                        content.addComponent(UITransform);
                        content.getComponent(UITransform)!.anchorY = 1;
                        content.addComponent(Widget);
                        content.getComponent(Widget)!.isAlignRight = true;
                        content.getComponent(Widget)!.right = 0;
                        content.getComponent(Widget)!.isAlignLeft = true;
                        content.getComponent(Widget)!.left = 0;
                        content.addComponent(Layout);
                        content.getComponent(Layout)!.type = Layout.Type.VERTICAL;
                        content.getComponent(Layout)!.resizeMode = Layout.ResizeMode.CONTAINER;
                        content.getComponent(Layout)!.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
                        scrollNode.getComponent(ScrollView)!.content = content;
                        scrollNode.getComponent(ScrollView)!.vertical = true;
                        scrollNode.getComponent(ScrollView)!.horizontal = false;
                        scrollNode.getComponent(ScrollView)!.inertia = true;
                        scrollNode.getComponent(ScrollView)!.brake = 0.75;
                        scrollNode.getComponent(ScrollView)!.elastic = true;
                        scrollNode.getComponent(ScrollView)!.bounceDuration = 0.23;

                        LoaderUtils.loadResArray(imageUrls, (err: any, imgTextures: any[]) => {
                            for (let i = 0; i < imgTextures.length; i++) {
                                const page = new Node('p' + (i + 1));
                                page.layer = Layers.Enum.UI_2D;
                                page.parent = content;
                                page.addComponent(UITransform);
                                page.addComponent(Sprite);
                                page.getComponent(Sprite)!.spriteFrame = imgTextures[i];
                                page.getComponent(Sprite)!.sizeMode = Sprite.SizeMode.CUSTOM;
                                page.addComponent(Widget);
                                page.getComponent(Widget)!.isAlignRight = true;
                                page.getComponent(Widget)!.right = 0;
                                page.getComponent(Widget)!.isAlignLeft = true;
                                page.getComponent(Widget)!.left = 0;
                            }
                        });
                    }, 100);
                }
            );
        } else {
            const bg = new Laya.Image();
            bg.size(Laya.stage.width, Laya.stage.height);
            Laya.stage.addChild(bg);

            const panel = new Laya.Panel();
            panel.size(Laya.stage.width, Laya.stage.height);
            panel.vScrollBarSkin = '';
            bg.addChild(panel);

            const closeBtn = new Laya.Image();
            closeBtn.skin = 'https://file.quduoduodata.top/ossfile/qddSDKRes/native/close.png';
            closeBtn.pos(Laya.stage.width - 80, 30);
            bg.addChild(closeBtn);
            closeBtn.on(Laya.Event.CLICK, this, () => {
                bg.destroy();
            });

            for (let i = 0; i < imageUrls.length; i++) {
                const img = new Laya.Image();
                img.skin = imageUrls[i];
                img.size(640, 1136);
                panel.addChild(img);
                img.pos(0, 1136 * i);
            }
        }
    }
}