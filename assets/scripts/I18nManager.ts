import { assetManager, JsonAsset } from 'cc';

enum Language {
    EN = "en",
    ZH = "zh"
}

class I18nManager {
    private static _lang: string | undefined;
    private static _data: Record<string, string> = {};

    static async init (lang: string){
        this._lang = lang;
        if (lang !== Language.EN) {
            return new Promise<void>((resolve) => {
                assetManager.resources.load(`i18n/${lang}`, JsonAsset, (err: Error | null, asset: JsonAsset | null) => {
                    if (!err && asset) {
                        this._data = asset.json as Record<string, string>;
                    }
                    resolve();
                });
            });
        }
    }

    static getLanguage(): string | undefined {
        return this._lang;
    }

    static t(key: string, ...args: any[]): string {
        let result = this._lang === Language.EN ? key : (this._data[key] || key);
        if (args.length > 0) {
            result = result.replace(/\{(\d+)\}/g, (match: string, index: number) => {
                return args[index] !== undefined ? args[index] : match;
            });
        }
        return result;
    }
}

export { I18nManager, Language };