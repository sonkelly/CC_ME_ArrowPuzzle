import { _decorator, Component, Material, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ButtonLight')
export class ButtonLight extends Component {
    @property(Material)
    baseLightMaterial: Material | null = null;

    @property({
        tooltip: "扫光周期（秒）"
    })
    lightCycle: number = 2;

    @property({
        tooltip: "扫光相对宽度（0~1，占按钮比例）"
    })
    lightWidth: number = 0.5;

    @property({
        tooltip: "扫光强度"
    })
    lightIntensity: number = 0.8;

    private sprite: Sprite | null = null;
    private lightMat: Material | null = null;

    start() {
        this.sprite = this.getComponent(Sprite);
        if (this.sprite && this.baseLightMaterial) {
            this.lightMat = new Material();
            this.lightMat.copy(this.baseLightMaterial);
            this.sprite.materials[0] = this.lightMat;
            this.scheduleOnce(() => {
                this.updateMaterialParams();
            }, 0.1);
        }
    }

    updateMaterialParams() {
        if (this.lightMat) {
            this.lightMat.setProperty('u_lightCycle', this.lightCycle);
            this.lightMat.setProperty('u_lightWidth', this.lightWidth);
            this.lightMat.setProperty('u_lightIntensity', this.lightIntensity);
            this.sprite?.markForUpdateRenderData();
        }
    }
}