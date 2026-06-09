import { _decorator, Component, Graphics, Color } from 'cc';
const { ccclass, property } = _decorator;

interface PixelData {
    x: number;
    y: number;
}

interface AnimData {
    x: number;
    y: number;
    startTime: number;
    delay: number;
}

@ccclass('PixelRenderer')
export class PixelRenderer extends Component {
    @property(Graphics)
    public graphics: Graphics | null = null;

    public pixels: PixelData[] = [];
    public anims: AnimData[] = [];
    public time: number = 0;
    public readonly PIXEL_SIZE: number = 3;
    public readonly DURATION: number = 0.1;
    public readonly MAX_SCALE: number = 1.5;

    public init(pixels: PixelData[]): void {
        this.pixels = pixels;
    }

    public playTrack(track: PixelData[], delay: number): void {
        for (let i = 0; i < track.length; i++) {
            this.anims.push({
                x: track[i].x,
                y: track[i].y,
                startTime: this.time,
                delay: i * delay
            });
        }
    }

    public update(deltaTime: number): void {
        this.time += deltaTime;
        const graphics = this.graphics;
        if (!graphics) return;

        graphics.clear();

        // Draw static pixels
        for (let i = 0; i < this.pixels.length; i++) {
            const pixel = this.pixels[i];
            graphics.roundRect(
                pixel.x - 1.5,
                pixel.y - 1.5,
                this.PIXEL_SIZE,
                this.PIXEL_SIZE,
                this.PIXEL_SIZE
            );
        }

        // Update and draw animated pixels
        for (let i = this.anims.length - 1; i >= 0; i--) {
            const anim = this.anims[i];
            const elapsed = this.time - anim.startTime - anim.delay;

            if (elapsed < 0) continue;

            let scale = 1;
            if (elapsed < this.DURATION) {
                scale = 1 + (this.MAX_SCALE - 1) * (elapsed / this.DURATION);
            } else if (elapsed < 2 * this.DURATION) {
                const progress = (elapsed - this.DURATION) / this.DURATION;
                scale = this.MAX_SCALE - (this.MAX_SCALE - 1) * progress;
            } else {
                this.anims.splice(i, 1);
                continue;
            }

            const size = this.PIXEL_SIZE * scale;
            graphics.rect(anim.x - 1.5, anim.y - 1.5, size, size);
        }

        graphics.fillColor = Color.WHITE;
        graphics.fill();
    }
}