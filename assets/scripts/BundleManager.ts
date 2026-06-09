import { assetManager, resources } from 'cc';

export class BundleManager {
    private _bundles: { [key: string]: any } = {};
    private _load_list: { [key: string]: Promise<any> | null } = {};
    private static _instance: BundleManager | null = null;

    constructor() {
        this._bundles = {};
        this._load_list = {};
        this._bundles['resources'] = resources;
    }

    public static get instance(): BundleManager {
        if (!BundleManager._instance) {
            BundleManager._instance = new BundleManager();
        }
        return BundleManager._instance;
    }

    public loadBundle(bundleName: string, callback?: (progress: number) => void): Promise<any> | undefined {
        if (this._load_list[bundleName]) {
            if (callback) {
                callback(1);
            }
            return this._load_list[bundleName];
        }

        this._load_list[bundleName] = new Promise((resolve, reject) => {
            if (this._bundles[bundleName]) {
                resolve(this._bundles[bundleName]);
                this._load_list[bundleName] = null;
                console.log(`加载bundle ${bundleName} 包体完成 ， 时间:  0`);
                if (callback) {
                    callback(1);
                }
                return;
            }

            const startTime = Date.now();
            assetManager.loadBundle(bundleName, (error: Error | null, bundle: any) => {
                if (error) {
                    reject(error);
                    this._load_list[bundleName] = null;
                } else {
                    if (callback) {
                        callback(1);
                    }
                    const endTime = Date.now();
                    console.log(`加载bundle ${bundleName} 包体完成 ， 时间:   ${endTime - startTime}`);
                    this._bundles[bundleName] = bundle;
                    resolve(this._bundles[bundleName]);
                    this._load_list[bundleName] = null;
                }
            });
        });

        return this._load_list[bundleName];
    }

    public getBundle(bundleName: string): any | undefined {
        if (this._bundles[bundleName]) {
            return this._bundles[bundleName];
        }
        console.warn('没有该bundle', bundleName);
        return undefined;
    }

    public releaseBundle(bundleName: string): void {
        const bundle = this._bundles[bundleName];
        if (bundle) {
            bundle.releaseAll();
            this._bundles[bundleName] = null;
            console.log(`[BundleManager] 已释放 Bundle: ${bundleName}`);
        }
    }

    public removeBundle(bundleName: string): void {
        const bundle = assetManager.getBundle(bundleName);
        if (bundle) {
            bundle.releaseAll();
            assetManager.removeBundle(bundle);
        }

        const cacheManager = assetManager.cacheManager;
        if (cacheManager) {
            cacheManager.clearCache(bundleName);
        }

        this._bundles[bundleName] = null;
        this._load_list[bundleName] = null;
        console.log(`[BundleManager] 已彻底释放 Bundle: ${bundleName}`);
    }
}