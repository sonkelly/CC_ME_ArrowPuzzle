import { _decorator, sys } from 'cc';

const { ccclass } = _decorator;

@ccclass('YZ_LocalStorage')
export class YZ_LocalStorage {
    public static getItem(key: string, defaultValue: any = null): any {
        const value = sys.localStorage.getItem(key);
        return value || defaultValue;
    }

    public static setItem(key: string, value: string): void {
        sys.localStorage.setItem(key, value);
    }

    public static clearItems(): void {
        sys.localStorage.clear();
    }
}