export class NumberUtls {
    public static luckDraw(probability: number): boolean {
        return Math.floor(100 * Math.random()) <= probability;
    }

    public static randomWord(length: number = 32): string {
        const chars: string[] = [
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
            "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
            "u", "v", "w", "x", "y", "z"
        ];
        let result: string = "";
        for (let i: number = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    public static generateId(length: number = 32): string {
        (new Date).getTime();
        return this.randomWord(length - 13);
    }
}