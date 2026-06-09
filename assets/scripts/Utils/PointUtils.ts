import { _decorator, Component, Node, Vec3, Camera, math } from 'cc';
const { ccclass, property } = _decorator;

export class PointUtils {
    /**
     * Chuyển đổi từ tọa độ thế giới sang tọa độ màn hình
     * @param camera - Camera để chiếu
     * @param worldPos - Vị trí trong thế giới
     * @returns Vec3 với x, y là tọa độ màn hình, z là khoảng cách từ camera
     */
    static worldToScreen2(camera: Camera, worldPos: Vec3): Vec3 {
        const distance = this.inverseTransformPoint(camera.node, worldPos).z;
        const screenPos = new Vec3();
        camera.worldToScreen(worldPos, screenPos);
        return new Vec3(screenPos.x, screenPos.y, distance);
    }

    /**
     * Chuyển đổi từ tọa độ màn hình sang tọa độ thế giới
     * @param camera - Camera để chiếu
     * @param screenPos - Vị trí trên màn hình (z là khoảng cách từ camera)
     * @returns Vec3 vị trí trong thế giới
     */
    static screenToWorld(camera: Camera, screenPos: Vec3): Vec3 {
        const halfFov = 0.5 * camera.fov * Math.PI / 180;
        const height = screenPos.z * Math.tan(halfFov);
        const width = height * camera.aspect;
        
        const lowerLeft = this.getLowerLeft(camera.node, screenPos.z, width, height);
        const scale = this.getScreenScale(width, height);
        
        const offset = new Vec3(-screenPos.x / scale.x, screenPos.y / scale.y, 0);
        const localPos = this.inverseTransformPoint(camera.node, lowerLeft);
        Vec3.add(localPos, localPos, offset);
        
        return this.transformPoint(camera.node, localPos);
    }

    /**
     * Tính tỷ lệ màn hình
     * @param width - Chiều rộng của frustum
     * @param height - Chiều cao của frustum
     * @returns Vec3 tỷ lệ
     */
    static getScreenScale(width: number, height: number): Vec3 {
        const scale = new Vec3();
        scale.x = (window.innerWidth || 800) / width / 2;
        scale.y = (window.innerHeight || 600) / height / 2;
        return scale;
    }

    /**
     * Tính góc dưới bên trái của frustum
     * @param node - Node của camera
     * @param distance - Khoảng cách từ camera
     * @param width - Chiều rộng của frustum
     * @param height - Chiều cao của frustum
     * @returns Vec3 vị trí góc dưới bên trái
     */
    static getLowerLeft(node: Node, distance: number, width: number, height: number): Vec3 {
        const result = new Vec3();
        
        // Tính hướng phải
        const right = new Vec3();
        node.getRight(right);
        Vec3.normalize(right, right);
        
        // Di chuyển sang phải
        const rightOffset = new Vec3(right.x * width, right.y * width, right.z * width);
        Vec3.add(node.position, rightOffset, result);
        
        // Tính hướng lên
        const up = new Vec3();
        node.getUp(up);
        Vec3.normalize(up, up);
        
        // Di chuyển xuống dưới
        const downOffset = new Vec3(up.x * height, up.y * height, up.z * height);
        Vec3.subtract(result, downOffset, result);
        
        // Tính hướng về phía trước
        const forward = new Vec3();
        node.getForward(forward);
        Vec3.normalize(forward, forward);
        
        // Di chuyển về phía trước
        const forwardOffset = new Vec3(forward.x * distance, forward.y * distance, forward.z * distance);
        Vec3.subtract(result, forwardOffset, result);
        
        return result;
    }

    /**
     * Chuyển đổi điểm từ không gian thế giới sang không gian local của node
     * @param node - Node làm gốc
     * @param worldPoint - Điểm trong không gian thế giới
     * @returns Vec3 điểm trong không gian local
     */
    static inverseTransformPoint(node: Node, worldPoint: Vec3): Vec3 {
        const right = new Vec3();
        node.getRight(right);
        
        const up = new Vec3();
        node.getUp(up);
        
        const forward = new Vec3();
        node.getForward(forward);
        
        const negForward = new Vec3(-forward.x, -forward.y, -forward.z);
        
        const x = this.projectDistance(worldPoint, node.position, right);
        const y = this.projectDistance(worldPoint, node.position, up);
        const z = this.projectDistance(worldPoint, node.position, negForward);
        
        return new Vec3(x, y, z);
    }

    /**
     * Chuyển đổi điểm từ không gian local sang không gian thế giới
     * @param node - Node làm gốc
     * @param localPoint - Điểm trong không gian local
     * @returns Vec3 điểm trong không gian thế giới
     */
    static transformPoint(node: Node, localPoint: Vec3): Vec3 {
        const result = new Vec3();
        Vec3.transformQuat(localPoint, node.rotation, result);
        Vec3.add(result, node.position, result);
        return result;
    }

    /**
     * Tính khoảng cách chiếu của một điểm lên một hướng
     * @param point - Điểm cần tính
     * @param origin - Điểm gốc
     * @param direction - Hướng chiếu
     * @returns number Khoảng cách chiếu
     */
    static projectDistance(point: Vec3, origin: Vec3, direction: Vec3): number {
        const diff = new Vec3();
        Vec3.subtract(point, origin, diff);
        
        const angle = this.angle2(diff, direction) * Math.PI / 180;
        const distance = Vec3.distance(point, origin);
        
        return distance * Math.cos(angle);
    }

    /**
     * Tính góc giữa hai vector
     * @param a - Vector thứ nhất
     * @param b - Vector thứ hai
     * @returns number Góc giữa hai vector (độ)
     */
    static angle2(a: Vec3, b: Vec3): number {
        const dotProduct = a.x * b.x + a.y * b.y + a.z * b.z;
        const magnitudeA = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
        const magnitudeB = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);
        
        let cosAngle = dotProduct / (magnitudeA * magnitudeB);
        
        // Clamp giá trị để tránh lỗi số học
        cosAngle = Math.max(-1, Math.min(1, cosAngle));
        
        return 180 * Math.acos(cosAngle) / Math.PI;
    }
}