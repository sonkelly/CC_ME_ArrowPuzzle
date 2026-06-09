
export class MathUtils {
    public static Random(min: number, max: number): number {
        return min + Math.floor(Math.random() * (max - min));
    }
}