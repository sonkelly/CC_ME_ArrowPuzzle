import { Widget, Vec2, UITransform, v3, tween, SpriteFrame, Node, Sprite, Vec3 } from 'cc';
import { GameAssetManager } from './../GameAssetManager';
import { UILayerManager } from './../UILayerManager';
import { effect_component } from './../effect_component';
import { PlatformManager } from './../PlatformManager';
import { JsonClassStorage } from './../JsonClass';
import { ZanFlyEffect } from './../ZanFlyEffect';
declare const SDKInstance : any;

export class UIUtils {
    static async setIconByPath(sprite: Sprite, path: string, bundleName: string = "game"){
        if (sprite && path) {
            const spriteFrame = await GameAssetManager.loadAssetByPath(bundleName, path, SpriteFrame);
            if (sprite.isValid) {
                if (spriteFrame && sprite) {
                    sprite.spriteFrame = spriteFrame;
                }
                return spriteFrame;
            }
            return null;
        }
    }

    static updateWidgets(node: Node): void {
        const widgets = node.getComponentsInChildren(Widget);
        for (const widget of widgets) {
            if (widget.enabled) {
                widget.updateAlignment();
            }
        }
    }

    static copyNodeUITransform(source: Node, target: Node, offset: Vec2 = Vec2.ZERO): void {
        const sourceTransform = source.getComponent(UITransform);
        const targetTransform = target.getComponent(UITransform);
        targetTransform.width = sourceTransform.width + offset.x;
        targetTransform.height = sourceTransform.height + offset.y;
        targetTransform.anchorPoint = sourceTransform.anchorPoint.clone();
    }

    static setNodeLayer(node: Node, layer: number): void {
        if (node && node.isValid) {
            node.walk((child: Node) => {
                child.layer = layer;
            });
        }
    }

    static showChildsByIndex(parent: Node, index: number): void {
        if (parent && parent.children) {
            parent.children.forEach((child: Node, idx: number) => {
                child.active = idx === index;
            });
        }
    }

    static showChildsByName(parent: Node, name: string): void {
        if (parent && parent.children) {
            parent.children.forEach((child: Node) => {
                child.active = child.name === name;
            });
        }
    }

    static showChildsByIndex2(nodes: Node[], index: number): void {
        if (nodes) {
            nodes.forEach((node: Node, idx: number) => {
                node.active = idx === index;
            });
        }
    }

    static show_effect(
        target: Node,
        duration: number,
        nodeEffectName: string | null = null,
        posEffectName: string | null = null,
        callback: any = null,
        parent: Node = UILayerManager.instance.UIEffectLayer
    ): effect_component | null {
        const effectNode = effect_component.get_effect_node();
        if (!effectNode) {
            return null;
        }
        effectNode.active = true;
        const effectComponent = effectNode.getComponent(effect_component);
        effectComponent.node.parent = parent;
        effectComponent.node.setPosition(0, 0, 0);
        if (nodeEffectName) {
            effectComponent.play_by_node(target, nodeEffectName, duration, callback);
        }
        if (posEffectName) {
            effectComponent.play_by_pos(target, posEffectName, duration, callback);
        }
        return effectComponent;
    }

    static showZanFlyEffect(position: Vec3): void {
        const zanNode = ZanFlyEffect.get_node();
        if (zanNode) {
            const zanComponent = zanNode.getComponent(ZanFlyEffect);
            zanNode.parent = UILayerManager.instance.UISkyLayer;
            UIUtils.setNodeLayer(zanNode, UILayerManager.instance.UISkyLayer.layer);
            zanNode.setPosition(position);
            zanComponent.play();
        }
    }

    static getRandomNumbers(max: number, count: number): number[] {
        if (count < 1 || max < 1 || count > max) {
            throw new Error("参数错误：n必须≤M且均为正整数");
        }
        const numbers: number[] = [];
        for (let i = 1; i <= max; i++) {
            numbers.push(i);
        }
        for (let i = numbers.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = numbers[randomIndex];
            numbers[randomIndex] = numbers[i];
            numbers[i] = temp;
        }
        return numbers.slice(0, count);
    }

    static bezierTo(
        node: Node,
        duration: number,
        delay: number,
        startPos: Vec2,
        controlPos: Vec2,
        endPos: Vec2,
        opts: any = null
    ): any {
        opts = opts || Object.create(null);
        opts.onUpdate = (tween: any, ratio: number) => {
            const x = (1 - ratio) * (1 - ratio) * startPos.x + 2 * ratio * (1 - ratio) * controlPos.x + ratio * ratio * endPos.x;
            const y = (1 - ratio) * (1 - ratio) * startPos.y + 2 * ratio * (1 - ratio) * controlPos.y + ratio * ratio * endPos.y;
            node.position = v3(x, y, 0);
        };
        return tween(node).delay(delay).to(duration, {}, opts);
    }

    static setItemIcon(sprite: Sprite, iconName: string): void {
        UIUtils.setIconByPath(sprite, `texture/$icon/icon_item/${iconName}`);
    }

    static setFoodIcon(sprite: Sprite, iconName: string): void {
        UIUtils.setIconByPath(sprite, `texture/$food/${iconName}`);
    }

    static setFoodSelectedIcon(sprite: Sprite, iconName: string): void {
        UIUtils.setIconByPath(sprite, `texture/$food_select/${iconName}`);
    }

    static setFoodMergedIcon(sprite: Sprite, iconName: string): void {
        UIUtils.setIconByPath(sprite, `texture/$food_merged/${iconName}`);
    }

    static setPropIcon(sprite: Sprite, iconName: string): void {
        UIUtils.setIconByPath(sprite, `texture/$icon/icon_item/${iconName}`);
    }

    static setPlayerAvatarIcon(sprite: Sprite, avatarId: string): void {
        if (!avatarId) {
            avatarId = "1";
        }
        if (avatarId.length > 3) {
            if (SDKInstance.isTtPlatform()) {
                GameAssetManager.loadRemoteImgTT(avatarId, sprite);
            } else {
                GameAssetManager.loadRemoteImg(avatarId, sprite);
            }
        } else {
            const avatarConfig = JsonClassStorage.instance.getOneJson("AvatarConfig", "ID", avatarId);
            if (avatarConfig) {
                UIUtils.setIconByPath(sprite, `texture/$icon/avatar/${avatarConfig.AvatarName}`);
            } else {
                UIUtils.setIconByPath(sprite, "texture/$icon/avatar/1");
            }
        }
    }

    static setTransBg = (() => {
        const func = async (sprite: Sprite, bgName: string) => {
            await UIUtils.setIconByPath(sprite, `texture/$pop/gc/${bgName}`);
        };
        return func;
    })();

    static setTournamentThumbnail(sprite: Sprite, thumbnailName: string): void {
        const bundleName = PlatformManager.getLevelBundleName2();
        UIUtils.setIconByPath(sprite, `$thumbnail/${thumbnailName}`, bundleName);
    }

    static setAchievementIcon(sprite: Sprite, iconName: string): void {
        UIUtils.setIconByPath(sprite, `texture/$icon/Achievement/${iconName}`);
    }

    static setTierIcon(sprite: Sprite, iconName: string): void {
        UIUtils.setIconByPath(sprite, `texture/$icon/tier_icon/${iconName}`);
    }

    static setTierBg(sprite: Sprite, bgName: string): void {
        UIUtils.setIconByPath(sprite, `texture/$icon/tier_bg/${bgName}`);
    }
}