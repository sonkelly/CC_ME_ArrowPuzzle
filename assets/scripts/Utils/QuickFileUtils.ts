import { _decorator } from "cc";
import { LocalConfig } from "./../LocalConfig";
import { LogUtils } from "./LogUtils";
import { PlatformUtils } from "./PlatformUtils";

export class QuickFileUtils {
    private static fs: any = undefined;
    private static localRootFilePath: string = undefined;

    static getFileSystemManager(): any {
        if (!this.fs) {
            this.fs = PlatformUtils.getApiName().getFileSystemManager();
        }
        return this.fs;
    }

    static getLocalRootFilePath(): string {
        if (!this.localRootFilePath) {
            if (PlatformUtils.isVivoPlatform()) {
                this.localRootFilePath = "internal://files/";
            } else {
                this.localRootFilePath = PlatformUtils.getApiName().env.USER_DATA_PATH + "/";
            }
        }
        return this.localRootFilePath;
    }

    static getResources(filePath: string, callback: Function, isDownload: boolean = false): void {
        if (PlatformUtils.isQuickGame()) {
            const ossPath = this.getFileOssPath(filePath);
            this.access(filePath, () => {
                callback(this.getLocalRootFilePath() + filePath);
            }, () => {
                if (isDownload) {
                    this.downloadFile(ossPath, (tempFilePath: string) => {
                        this.saveFile(tempFilePath, "filePath", (savedFilePath: string) => {
                            callback(this.getLocalRootFilePath() + savedFilePath);
                        }, () => {
                            callback(this.getLocalRootFilePath() + filePath);
                        });
                    }, () => {
                        LogUtils.warn("下载游戏资源，请检查路径是否正确fileUlr:", ossPath);
                        callback(ossPath);
                    });
                } else {
                    callback(ossPath);
                }
            });
            callback(ossPath);
        } else {
            callback(filePath);
        }
    }

    static getResourcesList(
        filePaths: string[],
        callback: (results: string[]) => void,
        isDownload: boolean = false
    ): void {
        if (filePaths.length === 0) {
            callback([]);
            return;
        }

        let completedCount = 0;
        const results: string[] = new Array(filePaths.length);

        filePaths.forEach((filePath, index) => {
            this.getResources(filePath, (path: string) => {
                results[index] = path;
                completedCount++;
                if (completedCount === filePaths.length) {
                    callback(results);
                }
            }, isDownload);
        });
    }
    
    static getFileOssPathList(filePaths: string[]): string[] {
        return filePaths.map(filePath => this.getFileOssPath(filePath));
    }

    static getFileOssPath(filePath: string): string {
        if (!PlatformUtils.isQuickGame()) {
            return filePath;
        }
        let prefix = "";
        if (PlatformUtils.isTtPlatform()) {
            prefix = LocalConfig.OSS_PATH_PREFIX.touTiao;
        } else if (PlatformUtils.isQQPlatform()) {
            prefix = LocalConfig.OSS_PATH_PREFIX.qq;
        } else if (PlatformUtils.isOppoPlatform()) {
            prefix = LocalConfig.OSS_PATH_PREFIX.oppo;
        } else if (PlatformUtils.isVivoPlatform()) {
            prefix = LocalConfig.OSS_PATH_PREFIX.vivo;
        } else if (PlatformUtils.isWxPlatform()) {
            prefix = LocalConfig.OSS_PATH_PREFIX.weChat;
        }
        if (prefix === "") {
            prefix = LocalConfig.OSS_PATH_PREFIX.default;
        }
        return LocalConfig.OSS_BASE_PATH + prefix;
    }

    static downloadFile(url: string, successCallback: Function, failCallback?: Function, completeCallback?: Function, header: any = {}): void {
        if (!PlatformUtils.isQuickGame()) {
            if (failCallback) failCallback();
            if (completeCallback) completeCallback();
            return;
        }
        PlatformUtils.getApiName().downloadFile({
            url: url,
            header: header,
            success: (res: any) => {
                successCallback(res.tempFilePath);
            },
            fail: () => {
                LogUtils.warn("downloadFile fail, 请检查ulr是否正确: url", url);
                if (failCallback) failCallback();
            },
            complete: () => {
                if (completeCallback) completeCallback();
            }
        });
    }

    static saveFile(tempFilePath: string, targetPath: string, successCallback: Function, failCallback?: Function, completeCallback?: Function): void {
        if (!PlatformUtils.isQuickGame()) {
            if (failCallback) failCallback();
            if (completeCallback) completeCallback();
            return;
        }

        const saveOperation = () => {
            if (PlatformUtils.isVivoPlatform()) {
                PlatformUtils.getApiName().copyFile({
                    srcUri: tempFilePath,
                    dstUri: this.localRootFilePath + targetPath,
                    success: (res: any) => {
                        console.log("copy success: " + res);
                    },
                    fail: (error: any, code: number) => {
                        console.log("handling fail, code = " + code);
                    },
                    complete: () => {
                        if (completeCallback) completeCallback();
                    }
                });
            } else {
                this.getFileSystemManager().saveFile({
                    tempFilePath: tempFilePath,
                    filePath: this.localRootFilePath + targetPath,
                    success: (res: any) => {
                        successCallback(res.savedFilePath);
                    },
                    fail: (error: any) => {
                        LogUtils.warn("saveFile fail", JSON.stringify(error));
                        if (failCallback) failCallback();
                    },
                    complete: () => {
                        if (completeCallback) completeCallback();
                    }
                });
            }
        };

        if (PlatformUtils.isTtPlatform() || PlatformUtils.isQQPlatform() || PlatformUtils.isWxPlatform()) {
            this.mkdirs(targetPath, () => {
                saveOperation();
            });
        } else {
            saveOperation();
        }
    }

    static access(filePath: string, successCallback: Function, failCallback?: Function, completeCallback?: Function): void {
        if (!PlatformUtils.isQuickGame()) {
            successCallback();
            if (completeCallback) completeCallback();
            return;
        }

        if (PlatformUtils.isVivoPlatform()) {
            const result = PlatformUtils.getApiName().accessFile({
                uri: this.localRootFilePath + filePath
            });
            if (result === "true") {
                successCallback();
            } else {
                if (failCallback) failCallback();
            }
            if (completeCallback) completeCallback();
        } else {
            this.getFileSystemManager().access({
                path: this.localRootFilePath + filePath,
                success: (res: any) => {
                    successCallback();
                },
                fail: (error: any) => {
                    LogUtils.warn("access fail", JSON.stringify(error));
                    if (failCallback) failCallback();
                },
                complete: () => {
                    if (completeCallback) completeCallback();
                }
            });
        }
    }

    static mkdirs(dirPath: string, successCallback: Function, failCallback?: Function, completeCallback?: Function): void {
        const dirs = this.getFullDir(dirPath);
        if (dirs.length === 0) {
            successCallback();
            if (completeCallback) completeCallback();
            return;
        }

        let completedCount = 0;
        const totalDirs = dirs.length;

        for (let i = 0; i < totalDirs; i++) {
            const currentDir = dirs[i];
            this.mkdir(currentDir, () => {
                completedCount++;
            }, () => {
                // fail callback - do nothing
            }, () => {
                if (i === totalDirs - 1) {
                    if (completedCount === totalDirs) {
                        successCallback();
                    } else {
                        if (failCallback) failCallback();
                    }
                    if (completeCallback) completeCallback();
                }
            });
        }
    }

    static mkdir(dirPath: string, successCallback: Function, failCallback?: Function, completeCallback?: Function): void {
        this.access(dirPath, () => {
            successCallback();
            if (completeCallback) completeCallback();
        }, () => {
            this.getFileSystemManager().mkdir({
                dirPath: this.getLocalRootFilePath() + dirPath,
                success: (res: any) => {
                    if (res) {
                        LogUtils.info("mkdir success====", JSON.stringify(res));
                    }
                    successCallback();
                },
                fail: (error: any) => {
                    if (error) {
                        LogUtils.warn("mkdir fail====", JSON.stringify(error));
                    }
                    if (failCallback) failCallback();
                },
                complete: () => {
                    LogUtils.info("mkdir complete====");
                    if (completeCallback) completeCallback();
                }
            });
        });
    }

    static getFullDir(filePath: string): string[] {
        const parts = filePath.split("/");
        const dirs: string[] = [];
        let currentPath = "";
        for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath + parts[i] + "/";
            dirs.push(currentPath);
        }
        return dirs;
    }
}