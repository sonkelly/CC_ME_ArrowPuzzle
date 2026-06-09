// NezpTools.ts
import {
    Camera,
    Node,
    UITransform,
    Widget,
    view,
    ResolutionPolicy,
    size,
    v3,
} from 'cc';

interface CssRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

export class NezpTools {
    static UICamera: Camera | null = null;
    static staticDomRatio: number = 1;

    static initNEZP(camera: Camera): void {
        NezpTools.UICamera = camera;
    }

    static createContainer(
        id: string,
        className: string,
        node?: Node,
        options?: any
    ): HTMLDivElement | undefined {
        const overlayContainer = document.getElementById('overlayViewContainer');
        if (!overlayContainer) return undefined;

        const container = document.createElement('div');

        if (id) container.id = id;
        if (className) container.className = className;

        if (node) {
            const cssRect = NezpTools.computeCssRect(node);
            if (cssRect) {
                container.style.top = cssRect.top + 'px';
                container.style.left = cssRect.left + 'px';
                container.style.width = cssRect.width + 'px';
                container.style.height = cssRect.height + 'px';
                container.style.border = 'none';
                container.style.outline = 'none';
            }
        }

        overlayContainer.appendChild(container);
        return container;
    }

    static computeCssRect(node: Node): CssRect {
        const result: CssRect = { top: 0, left: 0, width: 0, height: 0 };

        if (!node || node.name === '' || !node.getComponent(Widget)) {
            return result;
        }

        const canvas = document.getElementById('GameCanvas') as HTMLCanvasElement | null;
        if (!canvas) {
            console.warn('computeCssRect: 找不到 #GameCanvas 元素');
            return result;
        }

        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        const designSize = view.getDesignResolutionSize();

        let scaleX = canvasWidth / designSize.width;
        let scaleY = canvasHeight / designSize.height;

        // FIXED_HEIGHT: scale theo chiều cao, FIXED_WIDTH: scale theo chiều rộng
        const policy = view.getResolutionPolicy();
        if (policy === ResolutionPolicy.FIXED_HEIGHT) {
            scaleX = scaleY;
        } else {
            scaleY = scaleX;
        }

        const uiTransform = node.getComponent(UITransform)!;
        const nodeSize = size(uiTransform.width, uiTransform.height);
        const nodeScale = node.getScale();

        const width = nodeSize.width * nodeScale.x * scaleX;
        const height = nodeSize.height * nodeScale.y * scaleY;

        const widget = node.getComponent(Widget)!;
        const top = widget.top * scaleY;
        const left = widget.left * scaleX;

        result.width = width;
        result.height = height;
        result.left = left;
        result.top = top;

        return result;
    }

    static convertNodeToCssRect(node: Node): CssRect {
        const canvas = document.getElementById('GameCanvas') as HTMLCanvasElement | null;
        if (!canvas || !node) {
            console.warn('convertNodeToCssRect: Canvas或Node不存在');
            return { left: 0, top: 0, width: 0, height: 0 };
        }

        const designSize = view.getDesignResolutionSize();
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;

        const viewScaleX = view.getScaleX();
        const viewScaleY = view.getScaleY();

        let scaleX: number;
        let scaleY: number;

        if (viewScaleX === viewScaleY) {
            // FIXED_HEIGHT hoặc FIXED_WIDTH đồng nhất
            scaleX = scaleY = canvasHeight / designSize.height;
        } else {
            scaleX = canvasWidth / designSize.width;
            scaleY = canvasHeight / designSize.height;
        }

        const offsetX = (canvasWidth - designSize.width * scaleX) / 2;
        const offsetY = (canvasHeight - designSize.height * scaleY) / 2;

        const uiTransform = node.getComponent(UITransform)!;
        const worldPos = uiTransform.convertToWorldSpaceAR(v3(0, 0, 0));

        const halfDesignWidth = designSize.width / 2;
        const halfDesignHeight = designSize.height / 2;

        // Chuyển từ Cocos world space sang CSS space (gốc trên-trái)
        const posX = worldPos.x + halfDesignWidth;
        const posY = halfDesignHeight - worldPos.y;

        const nodeScale = node.getScale();
        const width = uiTransform.width * Math.abs(nodeScale.x) * scaleX;
        const height = uiTransform.height * Math.abs(nodeScale.y) * scaleY;

        return {
            left: posX * scaleX - width / 2 + offsetX,
            top: posY * scaleY - height / 2 + offsetY,
            width,
            height,
        };
    }

    static getCocosToCSScaleRatio(): number {
        const canvas = document.getElementById('GameCanvas') as HTMLCanvasElement | null;
        if (!canvas) {
            console.warn('getCocosToCSScaleRatio: Canvas不存在');
            return 1;
        }
        const designSize = view.getDesignResolutionSize();
        return canvas.clientHeight / designSize.height;
    }
}