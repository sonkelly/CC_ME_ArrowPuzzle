
export class UUIDUtils {
    private static __uuid: number = 0;

    static get uuid(): number {
        return ++this.__uuid;
    }

    static reset(): void {
        this.__uuid = 0;
    }
}