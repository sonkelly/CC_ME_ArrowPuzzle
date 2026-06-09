import { _decorator, Component, Node, macro, Layers, v3, v2, Vec2, Vec3, UIOpacity, UITransform, Size, Sprite, Label, EditBox, Color, assetManager, loader, Texture2D, SpriteFrame, error, view, VERSION, ENGINE_VERSION } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AAA_CompatibleTool')
export class AAA_CompatibleTool extends Component {
    private static _engineVersion: number = 0;

    public static get engineVersion(): number {
        if (this._engineVersion > 0) {
            return this._engineVersion;
        }
        const versionStr: string = VERSION || ENGINE_VERSION || "";
        if (!versionStr) {
            error("引擎版本API出错！");
            return 0;
        }
        const parts: number[] = versionStr.split(".").map((part: string) => parseInt(part, 10));
        const version: number = 10000 * parts[0] + 100 * parts[1] + parts[2];
        this._engineVersion = version;
        return version;
    }

    public static get viewSize(): Size {
        return view.getVisibleSize();
    }

    public static get designSize(): Size {
        return view.getDesignResolutionSize();
    }

    public static get screenRate(): number {
        const size: Size = this.viewSize;
        return size.width < size.height ? size.width / 1080 : size.height / 1080;
    }

    public static get screenWidthRate(): number {
        return view.getVisibleSize().width / view.getDesignResolutionSize().width;
    }

    public static get screenHeightRate(): number {
        return view.getVisibleSize().height / view.getDesignResolutionSize().height;
    }

    public static setNodeGroup(node: Node | null, groupName: string, walkChildren: boolean = true): void {
        if (!node || !node.isValid || !groupName) {
            return;
        }
        if (this.engineVersion >= 30000) {
            if (walkChildren) {
                node.walk((child: Node) => {
                    child.layer = 1 << Layers.nameToLayer(groupName);
                });
            } else {
                node.layer = 1 << Layers.nameToLayer(groupName);
            }
        } else {
            if (walkChildren) {
                node.walk((child: Node) => {
                    child.group = groupName;
                });
            } else {
                node.group = groupName;
            }
        }
    }

    public static setSameGroup(node: Node | null, targetNode: Node | null): void {
        if (!node || !node.isValid || !targetNode || !targetNode.isValid) {
            return;
        }
        if (this.engineVersion >= 30000) {
            node.layer = targetNode.layer;
        } else {
            node.group = targetNode.group;
        }
    }

    public static position(x: number, y: number): Vec3 | Vec2 {
        return this.engineVersion >= 20400 ? v3(x, y) : v2(x, y);
    }

    public static scale(value: number | Vec2 | Vec3): number | Vec3 {
        if (this.engineVersion >= 30000) {
            if (value instanceof Vec2 || value instanceof Vec3) {
                return v3(value.x, value.y, 1);
            }
            return v3(value as number, value as number, 1);
        } else {
            if (value instanceof Vec2 || value instanceof Vec3) {
                return value.x;
            }
            return value as number;
        }
    }

    public static scaleNum(value: number | Vec2 | Vec3): number {
        if (value instanceof Vec2 || value instanceof Vec3) {
            return value.x;
        }
        return value as number;
    }

    public static scaleMul(value: number | Vec2 | Vec3, multiplier: number): number | Vec3 {
        if (value instanceof Vec2 || value instanceof Vec3) {
            return v3(value.x, value.y, 0).multiplyScalar(multiplier);
        }
        return (value as number) * multiplier;
    }

    public static setNodeScale(node: Node | null, scaleValue: number | Vec2 | Vec3): void {
        if (!node || !node.isValid) {
            return;
        }
        if (this.engineVersion >= 30000) {
            if (scaleValue instanceof Vec2 || scaleValue instanceof Vec3) {
                node.setScale(scaleValue.x, scaleValue.y, 1);
            } else {
                node.setScale(scaleValue as number, scaleValue as number, 1);
            }
        } else {
            if (scaleValue instanceof Vec2 || scaleValue instanceof Vec3) {
                node.setScale(scaleValue.x);
            } else {
                node.setScale(scaleValue as number);
            }
        }
    }

    public static getOpacityTarget(node: Node | null): Node | UIOpacity | null {
        if (!node || !node.isValid) {
            return null;
        }
        let target: Node | UIOpacity = node;
        if (this.engineVersion >= 30000) {
            let opacityComponent: UIOpacity | null = node.getComponent(UIOpacity);
            if (!opacityComponent) {
                opacityComponent = node.addComponent(UIOpacity);
            }
            target = opacityComponent;
        }
        return target;
    }

    public static setNodeOpacity(node: Node | null, opacity: number = 255): void {
        if (!node || !node.isValid) {
            return;
        }
        if (this.engineVersion >= 30000) {
            let opacityComponent: UIOpacity | null = node.getComponent(UIOpacity);
            if (!opacityComponent) {
                opacityComponent = node.addComponent(UIOpacity);
            }
            opacityComponent.opacity = opacity;
        } else {
            node.opacity = opacity;
        }
    }

    public static getNodeOpacity(node: Node | null): number {
        let opacity: number = 255;
        if (!node || !node.isValid) {
            return opacity;
        }
        if (this.engineVersion >= 30000) {
            const opacityComponent: UIOpacity | null = node.getComponent(UIOpacity);
            if (opacityComponent) {
                opacity = opacityComponent.opacity;
            }
        } else {
            opacity = node.opacity;
        }
        return opacity;
    }

    public static setNodeSize(node: Node | null, width: number, height: number): void {
        if (!node || !node.isValid) {
            return;
        }
        if (this.engineVersion >= 30000) {
            let transform: UITransform | null = node.getComponent(UITransform);
            if (!transform) {
                transform = node.addComponent(UITransform);
            }
            transform.width = width;
            transform.height = height;
        } else {
            node.width = width;
            node.height = height;
        }
    }

    public static setNodeWidth(node: Node | null, width: number): void {
        if (!node || !node.isValid) {
            return;
        }
        if (this.engineVersion >= 30000) {
            let transform: UITransform | null = node.getComponent(UITransform);
            if (!transform) {
                transform = node.addComponent(UITransform);
            }
            transform.width = width;
        } else {
            node.width = width;
        }
    }

    public static setNodeHeight(node: Node | null, height: number): void {
        if (!node || !node.isValid) {
            return;
        }
        if (this.engineVersion >= 30000) {
            let transform: UITransform | null = node.getComponent(UITransform);
            if (!transform) {
                transform = node.addComponent(UITransform);
            }
            transform.height = height;
        } else {
            node.height = height;
        }
    }

    public static getNodeSize(node: Node | null): Size {
        const size: Size = new Size(0, 0);
        if (!node || !node.isValid) {
            return size;
        }
        if (this.engineVersion >= 30000) {
            const transform: UITransform | null = node.getComponent(UITransform);
            if (transform) {
                size.width = transform.width;
                size.height = transform.height;
            }
        } else {
            size.width = node.width;
            size.height = node.height;
        }
        return size;
    }

    public static setNodeAnchor(node: Node | null, anchorX: number, anchorY: number): void {
        if (!node || !node.isValid) {
            return;
        }
        if (this.engineVersion >= 30000) {
            let transform: UITransform | null = node.getComponent(UITransform);
            if (!transform) {
                transform = node.addComponent(UITransform);
            }
            transform.setAnchorPoint(anchorX, anchorY);
        } else {
            node.setAnchorPoint(anchorX, anchorY);
        }
    }

    public static getNodeAnchor(node: Node | null): Vec2 {
        if (!node || !node.isValid) {
            return v2(0.5, 0.5);
        }
        if (this.engineVersion >= 30000) {
            let transform: UITransform | null = node.getComponent(UITransform);
            if (!transform) {
                transform = node.addComponent(UITransform);
            }
            return transform.anchorPoint;
        }
        return node.getAnchorPoint();
    }

    public static setNodeColor(node: Node | null, color: Color | null): void {
        if (!node || !node.isValid || !color) {
            return;
        }
        if (this.engineVersion >= 30000) {
            const spriteComponent: Sprite | null = node.getComponent(Sprite);
            if (spriteComponent) {
                spriteComponent.color = color;
                return;
            }
            const labelComponent: Label | null = node.getComponent(Label);
            if (labelComponent) {
                labelComponent.color = color;
                return;
            }
            const editBoxComponent: EditBox | null = node.getComponent(EditBox);
            if (editBoxComponent && editBoxComponent.textLabel) {
                editBoxComponent.textLabel.color = color;
                return;
            }
            console.log("setNodeColor: 设置节点失败，没有包含颜色的组件！");
        } else {
            node.color = color;
        }
    }

    public static getNodeColor(node: Node | null): Color {
        const defaultColor: Color = Color.WHITE;
        if (!node || !node.isValid || !defaultColor) {
            return defaultColor;
        }
        if (this.engineVersion >= 30000) {
            const spriteComponent: Sprite | null = node.getComponent(Sprite);
            if (spriteComponent) {
                return spriteComponent.color;
            }
            const labelComponent: Label | null = node.getComponent(Label);
            if (labelComponent) {
                return labelComponent.color;
            }
            const editBoxComponent: EditBox | null = node.getComponent(EditBox);
            if (editBoxComponent && editBoxComponent.textLabel) {
                return editBoxComponent.textLabel.color;
            }
            console.log("setNodeColor: 设置节点失败，没有包含颜色的组件！");
            return defaultColor;
        } else {
            return node.color;
        }
    }

    public static LoadRes(url: string, callback?: (error: Error | null, asset?: any) => void): void {
        try {
            const extension: string = url.substring(url.lastIndexOf("."));
            if (this.engineVersion >= 30000 || this.engineVersion >= 20400) {
                if (extension !== ".jpg" && extension !== ".png" && extension !== ".jpeg") {
                    assetManager.loadRemote(url, { ext: ".jpeg" }, (err: Error | null, asset: any) => {
                        if (callback) callback(err, asset);
                    });
                    assetManager.loadRemote(url, { ext: ".jpg" }, (err: Error | null, asset: any) => {
                        if (callback) callback(err, asset);
                    });
                    assetManager.loadRemote(url, { ext: ".png" }, (err: Error | null, asset: any) => {
                        if (callback) callback(err, asset);
                    });
                } else {
                    assetManager.loadRemote(url, callback);
                }
            } else {
                if (extension !== ".jpg" && extension !== ".png" && extension !== ".jpeg") {
                    loader.load({ url: url, type: "jpeg" }, () => {}, callback);
                    loader.load({ url: url, type: "jpg" }, () => {}, callback);
                    loader.load({ url: url, type: "png" }, () => {}, callback);
                } else {
                    loader.load(url, () => {}, callback);
                }
            }
        } catch (error) {
            console.log("LoadRes: " + error);
        }
    }

    public static getRes(url: string): any {
        let result: any = null;
        try {
            result = this.engineVersion >= 30000 || this.engineVersion >= 20400 
                ? assetManager.assets.get(url) 
                : loader.getRes(url);
            return result;
        } catch (error) {
            console.log("getRes: " + error);
            return result;
        }
    }

    public static createSpriteFrame(image: HTMLImageElement | any): SpriteFrame | null {
        if (!image) {
            return null;
        }
        try {
            if (this.engineVersion >= 30000) {
                const texture: Texture2D = new Texture2D();
                texture.image = image;
                const spriteFrame: SpriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                return spriteFrame;
            }
            return new SpriteFrame(image);
        } catch (error) {
            console.log("createSpriteFrame: " + error);
            return null;
        }
    }

    public static stopEvent(event: any): void {
        if (!event) {
            return;
        }
        try {
            if (this.engineVersion >= 30000) {
                event.propagationStopped = true;
            } else {
                event.stopPropagation();
            }
        } catch (error) {
            console.log("stopEvent: " + error);
        }
    }
}

// Set macro values
macro.MAX_LABEL_CANVAS_POOL_SIZE = 100;
macro.BATCHER2D_MEM_INCREMENT = 1000;