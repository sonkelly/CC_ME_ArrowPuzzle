import { assetManager, ImageAsset } from 'cc';

export class ImageToBase64 {
    static async getImageNativeUrl(level: number): Promise<string | null> {
        return new Promise((resolve) => {
            const thumbnailPath = `$thumbnail/Level_${level}`;
            assetManager.loadBundle('level', (error: Error | null, bundle: any) => {
                if (error) {
                    console.warn(`加载level bundle失败：${error.message}`);
                    resolve(null);
                    return;
                }
                bundle.load(thumbnailPath, ImageAsset, (loadError: Error | null, imageAsset: any) => {
                    if (loadError) {
                        console.warn(`加载图片失败：${loadError.message}`);
                        resolve(null);
                        return;
                    }
                    const nativeUrl = imageAsset.nativeUrl;
                    resolve(nativeUrl);
                });
            });
        });
    }

    static loadImageToBase64(url: string): Promise<string | null> {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const reader = new FileReader();
                    reader.onload = (event: ProgressEvent<FileReader>) => {
                        const result = event.target?.result as string;
                        resolve(result);
                    };
                    reader.onerror = () => {
                        console.warn('FileReader读取图片失败');
                        resolve(null);
                    };
                    reader.readAsDataURL(xhr.response);
                } else {
                    console.warn(`加载图片失败，状态码：${xhr.status}`);
                    resolve(null);
                }
            };
            xhr.onerror = () => {
                console.warn('图片请求失败：网络/路径错误');
                resolve(null);
            };
            xhr.send();
        });
    }

    static async convertLevelImageToBase64(level: number): Promise<string> {
        try {
            const nativeUrl = await this.getImageNativeUrl(level);
            if (!nativeUrl) {
                console.warn(`关卡${level}获取图片URL失败，返回空`);
                return '';
            }
            const base64Data = await this.loadImageToBase64(nativeUrl);
            if (!base64Data) {
                console.warn(`关卡${level}图片转Base64失败，返回空`);
                return '';
            }
            return base64Data;
        } catch (error) {
            console.error(`转换${level}图片时发生未预期错误：`, error);
            return '';
        }
    }
}