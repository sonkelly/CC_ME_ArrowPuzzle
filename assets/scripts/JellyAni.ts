import { _decorator, Component, Vec3, Tween, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('JellyAni')
export class JellyAni extends Component {
    @property({
        tooltip: "跳跃高度"
    })
    private jumpHeight: number = 15;

    @property({
        tooltip: "是否循环播放"
    })
    private isRepeatForever: boolean = true;

    @property({
        tooltip: "加载后播放"
    })
    private playerOnLoad: boolean = false;

    private startPos: Vec3 | null = null;

    onLoad() {
        if (this.playerOnLoad) {
            this.playJellyAnimation();
        }
    }

    playJellyAnimation() {
        if (!this.node.active) {
            return;
        }

        if (!this.startPos) {
            this.startPos = this.node.position.clone();
        }

        const normalScale = new Vec3(1, 1, 1);
        const stretchScale = new Vec3(1.05, 0.95, 1);
        const squashScale = new Vec3(0.95, 1, 1);

        Tween.stopAllByTarget(this.node);

        const jumpTween = tween(this.node)
            .to(0.3, {
                position: new Vec3(this.startPos.x, this.startPos.y + this.jumpHeight, 0),
                scale: stretchScale
            }, {
                easing: "quadOut"
            })
            .to(0.4, {
                position: this.startPos,
                scale: squashScale
            }, {
                easing: "backOut"
            })
            .to(0.3, {
                scale: new Vec3(1.05, 0.95, 1)
            })
            .to(0.2, {
                scale: normalScale
            }, {
                easing: "elasticOut"
            });

        if (this.isRepeatForever) {
            tween(this.node).then(jumpTween).repeatForever().start();
        } else {
            tween(this.node).then(jumpTween).start();
        }
    }
}