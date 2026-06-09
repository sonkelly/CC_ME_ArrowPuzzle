import { _decorator, Component, Sprite, SpriteFrame, Node, Enum, math } from 'cc';
const { ccclass, property } = _decorator;

enum OverflowMode {
    CLAMP = 0,
    CYCLE = 1
}

enum BackgroundMode {
    SpriteFrame = 0,
    Node = 1
}

@ccclass('SpriteBackground')
export class SpriteBackground extends Component {
    @property({
        type: Enum(BackgroundMode)
    })
    mode: BackgroundMode = BackgroundMode.SpriteFrame;

    @property({
        type: Enum(OverflowMode)
    })
    overflow: OverflowMode = OverflowMode.CLAMP;

    @property(Sprite)
    bg: Sprite | null = null;

    @property([SpriteFrame])
    sfs: SpriteFrame[] = [];

    @property([Node])
    nds: Node[] = [];

    updateBackground(index: number): void {
        const count = this.mode === BackgroundMode.Node ? this.nds.length : this.sfs.length;
        
        if (index >= count) {
            if (this.overflow === OverflowMode.CLAMP) {
                index = math.clamp(index, 0, count - 1);
            } else if (this.overflow === OverflowMode.CYCLE) {
                index %= count;
            }
        }

        if (this.mode === BackgroundMode.Node) {
            for (let i = 0; i < this.nds.length; i++) {
                this.nds[i].active = i === index;
            }
        } else {
            this.bg!.spriteFrame = this.sfs[index];
        }
    }
}