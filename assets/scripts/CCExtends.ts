import { Node, Vec3, AudioSource, SpriteFrame, Sprite, Asset } from 'cc';

export class CCExtends {
    /**
     * Hủy tất cả các node con của một node
     * @param node Node cần hủy các node con
     */
    public static DestroyNodeAllChildren(node: Node | null): void {
        if (!node || node.children.length <= 0) {
            return;
        }
        node.destroyAllChildren();
    }

    /**
     * Thiết lập vị trí local của node
     * @param node Node cần thiết lập vị trí
     * @param position Vị trí mới
     */
    public static SetNodePosition(node: Node | null, position: Vec3): void {
        if (!node) {
            return;
        }
        if (!this.IsPositionEqual(node.position, position)) {
            node.setPosition(position.x, position.y, position.z);
        }
    }

    /**
     * Thiết lập vị trí world của node
     * @param node Node cần thiết lập vị trí
     * @param position Vị trí world mới
     */
    public static SetNodeWorldPosition(node: Node | null, position: Vec3): void {
        if (!node) {
            return;
        }
        if (!this.IsPositionEqual(node.position, position)) {
            node.setWorldPosition(position.x, position.y, position.z);
        }
    }

    /**
     * Kiểm tra hai vị trí có bằng nhau không (với sai số 0.0001)
     * @param pos1 Vị trí thứ nhất
     * @param pos2 Vị trí thứ hai
     * @returns true nếu hai vị trí bằng nhau
     */
    public static IsPositionEqual(pos1: Vec3 | null, pos2: Vec3 | null): boolean {
        if (pos1 == null || pos2 == null) {
            return false;
        }
        if (pos1 === pos2) {
            return true;
        }
        const deltaX = pos1.x - pos2.x;
        const deltaY = pos1.y - pos2.y;
        return Math.abs(deltaX) <= 1e-4 && Math.abs(deltaY) <= 1e-4;
    }

    /**
     * Thiết lập trạng thái active của node
     * @param node Node cần thiết lập
     * @param active Trạng thái active mới
     */
    public static SetNodeActive(node: Node | null, active: boolean): void {
        if (node && node.active !== active) {
            node.active = active;
        }
    }

    /**
     * Dừng phát âm thanh
     * @param audioSource AudioSource cần dừng
     */
    public static StopAudio(audioSource: AudioSource | null): void {
        if (audioSource != null && audioSource.clip != null) {
            audioSource.stop();
        }
    }

    /**
     * Giải phóng tài nguyên
     * @param asset Tài nguyên cần giải phóng
     */
    public static ReleaseAsset(asset: Asset | null): void {
        if (asset) {
            asset.decRef();
        }
    }

    /**
     * Thiết lập SpriteFrame cho Sprite
     * @param sprite Sprite cần thiết lập
     * @param spriteFrame SpriteFrame mới
     */
    public static SetSpriteFrame(sprite: Sprite | null, spriteFrame: SpriteFrame | null): void {
        if (sprite && sprite.spriteFrame !== spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }
    }
}