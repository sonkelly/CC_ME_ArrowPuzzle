import { ResultCode } from "./IApi";

export class GameHttp {
    private static _instance: GameHttp;
    public xhr: XMLHttpRequest = new XMLHttpRequest();

    public static get instance(): GameHttp {
        if (!GameHttp._instance) {
            GameHttp._instance = new GameHttp();
        }
        return GameHttp._instance;
    }

    public get baseUrl(): string {
        return SDKInstance.isWxPlatform() 
            ? "https://payservice.quduoduodata.top/login/" 
            : "https://jh3dn.quduoduodata.top/login/";
    }

    public get apiBaseUrl(): string {
        return "https://api.quduoduodata.top";
    }

    public get qddzfBaseUrl(): string {
        return "https://qddzf.quduoduodata.top";
    }

    public post(request: { url: string; body?: any; header?: Record<string, string>; domain?: string; params?: Record<string, string> }): Promise<any> | null {
        if (!request || !request.url) {
            return null;
        }

        let url = request.url;
        const body = request.body;
        const header = request.header;
        const domain = request.domain;
        const params = request.params;

        return new Promise((resolve, reject) => {
            url = domain === "" ? this.baseUrl + url : domain + url;
            url = this.splicingUrl(url, params);

            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    let parsedData: any = null;
                    try {
                        parsedData = JSON.parse(xhr.responseText);
                    } catch (error) {
                        console.log("请求异常: " + JSON.stringify(request));
                        reject(parsedData);
                        return;
                    }

                    const responseText = xhr.responseText;
                    if (xhr.status >= 200 && xhr.status < 400 && request.url === "loadArchive" && 
                        (parsedData.Code === ResultCode.Success || parsedData.code === 200 || parsedData.code === 500)) {
                        resolve(responseText);
                    } else if (xhr.status >= 200 && xhr.status < 400 && 
                        (parsedData.Code === ResultCode.Success || parsedData.code === 200)) {
                        this.tipError(responseText);
                        resolve(responseText);
                    } else {
                        this.tipError(responseText);
                        reject(parsedData);
                    }
                }
            };

            xhr.ontimeout = () => {
                console.error("服务器请求超时");
                reject("");
            };

            xhr.onerror = (event) => {
                console.error("服务器请求异常");
                reject("");
            };

            xhr.timeout = 5000;
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            this.setHeader(xhr, header);
            xhr.send(JSON.stringify(body));
        });
    }

    private setHeader(xhr: XMLHttpRequest, header?: Record<string, string>): void {
        if (header) {
            Object.keys(header).forEach((key) => {
                xhr.setRequestHeader(key, header[key]);
            });
        }
    }

    private splicingUrl(url: string, params?: Record<string, string>): string {
        if (params) {
            let paramString = "";
            Object.keys(params).forEach((key) => {
                paramString += key + "=" + encodeURIComponent(params[key]) + "&";
            });
            if (paramString !== "") {
                paramString = paramString.substr(0, paramString.lastIndexOf("&"));
                url = url + "?" + paramString;
            }
        }
        return url;
    }

    private async tipError(responseText: string): Promise<void> {
        try {
            const parsedData = JSON.parse(responseText);
            if (parsedData.Code === ResultCode.Success) {
                return;
            }
            if (parsedData.code === 200) {
                return;
            }
            console.error("服务器请求异常");
        } catch (error) {
            console.log("服务端返回请求字符串异常: " + error);
        }
    }
}