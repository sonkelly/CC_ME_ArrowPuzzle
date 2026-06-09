import { _decorator, Component } from 'cc';
import { PlatformUtils } from './Utils/PlatformUtils';

export class AjaxHelper {
    public static eventComainName: string = ""; //https://api.quduoduodata.top
    public static iosHost: string = ""; //https://service.szdywlkj.coms

    public static ajaxGet(options: { url: string, query?: any, header?: any }): Promise<string> {
        const self = this;
        const { url, query, header } = options;

        if (SDKInstance.isIOS()) {
            this.eventComainName = this.iosHost;
        }

        return new Promise<string>((resolve, reject) => {
            if (!url) {
                reject("");
                return;
            }

            if (SDKInstance.isIOS()) {
                reject("");
                return;
            }

            if (url.substring(0, 28) === self.eventComainName) {
                if (PlatformUtils.isGooglePlayNative()) {
                    reject("");
                    return;
                }
                if (PlatformUtils.isHuaWeiAbroadNative()) {
                    reject("");
                    return;
                }
            }

            const requestUrl = self.splicingUrl(url, query);
            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        resolve(xhr.responseText);
                    } else {
                        resolve(xhr.responseText);
                    }
                }
            };

            xhr.ontimeout = () => {
                reject("");
            };

            xhr.onerror = (error: any) => {
                reject(error);
            };

            xhr.timeout = 5000;
            xhr.open("GET", requestUrl, true);
            xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
            self.setHeader(xhr, header);
            xhr.send();
        });
    }

    public static ajaxPost(options: { url: string, params?: any, header?: any }): Promise<string> {
        const self = this;
        const { url, params, header } = options;

        if (SDKInstance.isIOS()) {
            this.eventComainName = this.iosHost;
        }

        return new Promise<string>((resolve, reject) => {
            if (!url) {
                reject("");
                return;
            }

            if (url.substring(0, 28) === self.eventComainName) {
                if (PlatformUtils.isGooglePlayNative()) {
                    reject("");
                    return;
                }
                if (PlatformUtils.isHuaWeiAbroadNative()) {
                    reject("");
                    return;
                }
            }

            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        resolve(xhr.responseText);
                    } else {
                        resolve(xhr.responseText);
                    }
                }
            };

            xhr.ontimeout = () => {
                reject("");
            };

            xhr.onerror = (error: any) => {
                reject("");
            };

            xhr.timeout = 5000;
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            self.setHeader(xhr, header);
            xhr.send(JSON.stringify(params));
        });
    }

    public static splicingUrl(url: string, query?: any): string {
        if (!query) {
            return url;
        }

        let queryString = "";
        Object.keys(query).forEach((key) => {
            queryString += key + "=" + encodeURIComponent(query[key]) + "&";
        });

        if (queryString !== "") {
            queryString = queryString.substr(0, queryString.lastIndexOf("&"));
            url = url + "?" + queryString;
        }

        return url;
    }

    public static setHeader(xhr: XMLHttpRequest, header?: any): void {
        if (!header) {
            return;
        }

        Object.keys(header).forEach((key) => {
            xhr.setRequestHeader(key, header[key]);
        });
    }

    public static wxPost(options: { url: string, params?: any, header?: any }): Promise<string> {
        const self = this;
        const { url, params, header } = options;

        return new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        resolve(xhr.responseText);
                    } else {
                        reject("");
                    }
                }
            };

            xhr.ontimeout = () => {
                reject("");
            };

            xhr.onerror = (error: any) => {
                reject("");
            };

            xhr.timeout = 5000;
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("cache-control", "no-cache");
            self.setHeader(xhr, header);
            xhr.send(JSON.stringify(params));
        });
    }
}