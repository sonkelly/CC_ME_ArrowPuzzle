import { JsonAsset } from 'cc';
import { AssetUrlManager } from './AssetUrlManager';
import { GameAssetManager } from './GameAssetManager';
import { GameLogicConfig } from './GameLogicConfig';

class JsonClass {
    private static _instance: JsonClass | undefined;

    public static get instance(): JsonClass {
        if (!JsonClass._instance) {
            JsonClass._instance = new JsonClass();
        }
        return JsonClass._instance;
    }

    public getTableJson(tableName: string): Promise<any> {
        if (GameLogicConfig.configSource === 'local') {
            return AssetUrlManager.core.get(tableName);
        } else {
            return GameAssetManager.remoteConfig.get(tableName);
        }
    }

    public async getOneJson(tableName: string, key: string | null = null, value: any = null): Promise<any> {
        if (JsonClassCache.isMapJson(tableName, key)) {
            return JsonClassCache.getOneJson(tableName, key, value);
        }

        const tableJson = await this.getTableJson(tableName);
        for (const rowId in tableJson.json) {
            if (tableJson.json[rowId][key] === value) {
                return tableJson.json[rowId];
            }
        }

        console.warn('没有这个数据信息', tableName, key, value);
        return null;
    }

    public async getAllRowsByValue(tableName: string, keys: string[] = [], values: any[] = null): Promise<any[]> {
        const cachedResult = JsonClassCache.getAllRowsByValue(tableName, keys, values);
        if (cachedResult !== null) {
            return cachedResult;
        }

        const tableJson = await this.getTableJson(tableName);
        const result: any[] = [];

        for (const rowId in tableJson.json) {
            let isMatch = true;
            keys.forEach((key, index) => {
                if (tableJson.json[rowId][key] !== values[index]) {
                    isMatch = false;
                }
            });

            if (isMatch) {
                result.push(tableJson.json[rowId]);
            }
        }

        return result;
    }

    public async getOneJsonArr(tableName: string, keys: string[] = [], values: any[] = []): Promise<any> {
        const tableJson = await this.getTableJson(tableName);

        if (keys.length !== values.length) {
            console.error('key:' + keys + '，val:' + values + '长度不匹配');
            return;
        }

        for (const rowId in tableJson.json) {
            const row = tableJson.json[rowId];
            const matchedIndices: boolean[] = [];

            for (let i = 0; i < keys.length; i++) {
                if (row[keys[i]] === values[i]) {
                    matchedIndices.push(true);
                    if (keys.length === matchedIndices.length) {
                        return row;
                    }
                }
            }
        }

        console.warn('没有找到该信息', keys, values);
    }
}

class JsonClassStorage {
    private static _instance: JsonClassStorage | undefined;
    private _tableIndex: { [tableName: string]: { [key: string]: any } } | undefined;

    public static get instance(): JsonClassStorage {
        if (!JsonClassStorage._instance) {
            JsonClassStorage._instance = new JsonClassStorage();
        }
        return JsonClassStorage._instance;
    }

    public init_storage(data: any): void {
        if (this._tableIndex) {
            return;
        }

        this._tableIndex = {};
        const tableIndexJson = JsonClass.instance.getTableJson('TableIndex');
        const tableIndexData = tableIndexJson?.json;

        if (tableIndexData) {
            for (let i = 0; i < tableIndexData.length; i++) {
                const tableName = tableIndexData[i].name;
                const indexKey = tableIndexData[i].index;
                const tableData = JsonClass.instance.getTableJson(tableName).json;
                const indexedData: { [key: string]: any } = {};

                for (let j = 0; j < tableData.length; j++) {
                    indexedData[tableData[j][indexKey]] = tableData[j];
                }

                this._tableIndex[tableName] = indexedData;
            }
        }
    }

    public getTableJson(tableName: string): any {
        if (GameLogicConfig.configSource === 'local') {
            return AssetUrlManager.core.get(tableName);
        } else {
            return GameAssetManager.remoteConfig.get(tableName);
        }
    }

    public getOneJson(tableName: string, key: string | null = null, value: any = null): any {
        if (JsonClassCache.isMapJson(tableName, key)) {
            return JsonClassCache.getOneJson(tableName, key, value);
        }

        const tableJson = this.getTableJson(tableName);
        if (!tableJson) {
            console.warn('缓存没有这个数据信息', tableName);
            return null;
        }

        for (const rowId in tableJson.json) {
            if (tableJson.json[rowId][key] === value) {
                return tableJson.json[rowId];
            }
        }

        console.warn('没有这个数据信息', tableName, key, value);
        return null;
    }

    public getAllRowsByValue(tableName: string, keys: string[] = [], values: any[] = null): any[] {
        const cachedResult = JsonClassCache.getAllRowsByValue(tableName, keys, values);
        if (cachedResult !== null) {
            return cachedResult;
        }

        const tableJson = this.getTableJson(tableName);
        if (!tableJson) {
            console.warn('缓存没有这个数据信息', tableName);
            return [];
        }

        const result: any[] = [];
        for (const rowId in tableJson.json) {
            let isMatch = true;
            keys.forEach((key, index) => {
                if (tableJson.json[rowId][key] !== values[index]) {
                    isMatch = false;
                }
            });

            if (isMatch) {
                result.push(tableJson.json[rowId]);
            }
        }

        return result;
    }

    public getOneJsonArr(tableName: string, keys: string[] = [], values: any[] = []): any {
        const tableJson = this.getTableJson(tableName);
        if (!tableJson) {
            console.warn('缓存没有这个数据信息', tableName);
            return null;
        }

        if (keys.length !== values.length) {
            console.error('key:' + keys + '，val:' + values + '长度不匹配');
            return null;
        }

        for (const rowId in tableJson.json) {
            const row = tableJson.json[rowId];
            const matchedIndices: boolean[] = [];

            for (let i = 0; i < keys.length; i++) {
                if (row[keys[i]] === values[i]) {
                    matchedIndices.push(true);
                    if (keys.length === matchedIndices.length) {
                        return row;
                    }
                }
            }
        }

        console.warn('没有找到该信息', keys, values);
        return null;
    }

    public getConfig(tableName: string, key: string): any {
        return this._tableIndex?.[tableName]?.[key] || null;
    }

    public getConfigs(tableName: string): any[] {
        return this.getTableJson(tableName)?.json || [];
    }
}

class JsonLoadder {
    public static loading_result: Promise<void> | null = null;

    public static load(successCallback?: () => void, errorCallback?: (error: any) => void): Promise<void> {
        if (JsonLoadder.loading_result) {
            return JsonLoadder.loading_result;
        }

        if (GameLogicConfig.configSource === 'local') {
            JsonLoadder.loading_result = GameAssetManager.loadConfDir()
                .then((data) => {
                    JsonClassStorage.instance.init_storage(data);
                    successCallback?.();
                    JsonLoadder.loading_result = null;
                })
                .catch((error) => {
                    errorCallback?.(error);
                    JsonLoadder.loading_result = null;
                });
        } else {
            JsonLoadder.loading_result = GameAssetManager.loadRemoteConfDir()
                .then((data) => {
                    JsonClassStorage.instance.init_storage(data);
                    successCallback?.();
                    JsonLoadder.loading_result = null;
                })
                .catch((error) => {
                    errorCallback?.(error);
                    JsonLoadder.loading_result = null;
                });
        }

        return JsonLoadder.loading_result;
    }
}

class JsonClassCache {
    public static getOneJson(tableName: string, key: string, value: any): any {
        return null;
    }

    public static isMapJson(tableName: string, key: string | null = null): boolean {
        return tableName === 'ItemData' && key === 'ID' || false;
    }

    public static getAllRowsByValue(tableName: string, keys: string[], values: any[]): any[] | null {
        return null;
    }
}

export { JsonClass, JsonClassStorage, JsonLoadder, JsonClassCache };