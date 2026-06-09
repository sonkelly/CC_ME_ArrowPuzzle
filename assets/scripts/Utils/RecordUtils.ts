import { sys } from 'cc';
import { Utilsqdd } from './Utilsqdd';

export class RecordUtils {
    private static _uuidDelta: number = 0;

    static NeedEncryptSave(): boolean {
        return false;
        //return !SDKInstance.isDebug() && !SDKInstance.isIOS();
    }

    static CalcNextTimeMill(seconds: number): number {
        return Date.now() + 1000 * seconds;
    }

    static CalcNextDayMill(): number {
        const now: Date = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    }

    static CalcNextUUID(): number {
        const timestamp: number = Date.now() / 1000;
        this._uuidDelta++;
        if (this._uuidDelta > 999) {
            this._uuidDelta = 0;
        }
        return 1000 * timestamp + this._uuidDelta;
    }

    static SaveRecord(key: string, data: any): void {
        const jsonString: string = JSON.stringify(data);
        if (this.NeedEncryptSave()) {
            sys.localStorage.setItem(key, Utilsqdd.encode(jsonString));
        } else {
            sys.localStorage.setItem(key, jsonString);
        }
    }

    static LoadRecord(key: string): any | null {
        let storedData: string | null = sys.localStorage.getItem(key);
        if (storedData == null || storedData.length < 2) {
            return null;
        }
        if (this.NeedEncryptSave()) {
            storedData = Utilsqdd.decode(storedData);
        }
        return JSON.parse(storedData);
    }

    static RemoveRecord(key: string): void {
        sys.localStorage.removeItem(key);
    }
}