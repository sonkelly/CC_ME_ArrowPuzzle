import { BaseDataManager } from "./BaseDataManager";
import { ActivityManager } from "./ActivityManager";
import { ConfigHelper } from "./ConfigHelper";
import { GameHttp } from "./GameHttp";
import { ApiEnum } from "./IApi";

export class Api {
    static token_query: string = "";
    static token_game: string = "";
    static openId: string = "";
    static UnlockTime: number = 0;
    static requestMap: Map<string, Promise<any>> = new Map();

    static getNotice(district: string): Promise<any> {
        const noticeKey = ApiEnum.getNotice;
        if (Api.requestMap.has(noticeKey)) {
            return Api.requestMap.get(noticeKey)!;
        }

        const header = {
            uuid: Api.openId,
            gameAppkey: ConfigHelper.getGameInfo().gameAppkey
        };

        const params = {
            district: district,
            noticeType: 2
        };

        return Api.getRequest(noticeKey, header, {}, params, GameHttp.instance.apiBaseUrl);
    }

    static getRecordDomain(): string {
        let domain = ""; //https://api.quduoduodata.top/api/fgame/
        if (SDKInstance.isGooglePlayNative()) {
            domain = ""; //https://api.quduoduodata.top/api/fgame/
        } else if (SDKInstance.isIOS()) {
            domain = ""; //https://service.szdywlkj.com/api/game/
        }
        return domain;
    }

    static getPlayerRecordFromNet(openId: string): Promise<any> {
        const domain = this.getRecordDomain();
        const url = "loadArchive";

        if (Api.requestMap.has(url)) {
            return Api.requestMap.get(url)!;
        }

        const header = {
            openid: openId,
            gameAppkey: ConfigHelper.getGameInfo().gameAppkey,
            version: SDKInstance.getGameVersion()
        };

        const request = Api.getRequest(url, header, {}, null, domain);
        request.then((response: any) => {
            // Empty handler
        });

        return request;
    }

    static savePlayerRecordToNet(openId: string, data: any): Promise<any> {
        const domain = this.getRecordDomain();
        const url = "saveArchive";

        if (Api.requestMap.has(url)) {
            return Api.requestMap.get(url)!;
        }

        const header = {
            openid: openId,
            gameAppkey: ConfigHelper.getGameInfo().gameAppkey,
            version: SDKInstance.getGameVersion()
        };

        const body = data;
        const request = Api.getRequest(url, header, body, null, domain);
        request.then((response: any) => {
            // Empty handler
        });

        return request;
    }

    static getApiDomain(): string {
        let domain = "https://api.quduoduodata.top/";
        if (SDKInstance.isIOS()) {
            domain = "https://service.szdywlkj.com/";
        } else if (SDKInstance.isGooglePlayNative()) {
            domain = "https://api.quduoduodata.top/";
        }
        return domain;
    }

    static requestActivityCfg(): Promise<any> {
        const openId = BaseDataManager.uuid;
        const gameAppkey = ConfigHelper.getGameInfo().gameAppkey;
        const domain = this.getApiDomain();
        const url = "api/fgame/query/config";

        if (Api.requestMap.has(url)) {
            return Api.requestMap.get(url)!;
        }

        const header = {
            openid: openId,
            gameAppkey: gameAppkey,
            version: SDKInstance.getGameVersion(),
            requestId: new Date().getTime().toString()
        };

        const request = Api.getRequest(url, header, null, {}, domain);
        request.then((response: any) => {
            console.log("requestActivityCfg:", response);
            ActivityManager.instance.setActivityData(response.data);
        }).catch((error: any) => {
            console.error("requestActivityCfg:", error);
        });

        return request;
    }

    static reportRank(data: any): Promise<any> {
        const url = "api/fgame/reported";

        if (Api.requestMap.has(url)) {
            return Api.requestMap.get(url)!;
        }

        const header = {
            openid: BaseDataManager.uuid,
            gameAppkey: ConfigHelper.getGameInfo().gameAppkey,
            version: SDKInstance.getGameVersion(),
            requestId: Date.now().toString()
        };

        const params: any = {
            nickName: BaseDataManager.nickName,
            avatar: BaseDataManager.userAvatar,
            address: BaseDataManager.userCountry
        };

        if (data.level) {
            params.customs = data.level.toString();
        }

        if (data.title != null) {
            params.title = data.title;
        }

        if (data.contest) {
            params.batchId = data.contest.batchId;
            params.active = data.contest.score;
        }

        if (data.weekly) {
            params.weekBatchId = data.weekly.batchId;
            params.weekActive = data.weekly.score;
        }

        const request = Api.getRequest(url, header, null, params, this.getApiDomain());
        request.then((response: any) => {
            // Empty handler
        }).catch((error: any) => {
            // Empty handler
        });

        return request;
    }

    static requestRank(type: any): Promise<any> {
        /*const openId = BaseDataManager.uuid;
        const gameAppkey = ConfigHelper.getGameInfo().gameAppkey;
        const domain = this.getApiDomain();
        const url = "api/fgame/getRanking";

        if (Api.requestMap.has(url)) {
            return Api.requestMap.get(url)!;
        }

        const header = {
            openid: openId,
            gameAppkey: gameAppkey,
            version: SDKInstance.getGameVersion(),
            requestId: new Date().getTime().toString()
        };

        const params = {
            type: type
        };

        const request = Api.getRequest(url, header, null, params, domain);
        request.then((response: any) => {
            // Empty handler
        }).catch((error: any) => {
            // Empty handler
        });

        return request;*/

        //@todo data for test
        return Promise.resolve({
            "msg": "操作成功",
            "code": 200,
            "data": {
                "rankinfo": [
                    {
                        "address": "",
                        "avatarUrl": "11",
                        "level": 1029,
                        "nickname": "FIZZER",
                        "rank": 1.0,
                        "title": 17
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 922,
                        "nickname": "Betiz ",
                        "rank": 2.0,
                        "title": 17
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 767,
                        "nickname": "Player9052191",
                        "rank": 3.0,
                        "title": 15
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 632,
                        "nickname": "Player8257711",
                        "rank": 4.0,
                        "title": 14
                    },
                    {
                        "address": "",
                        "avatarUrl": "7",
                        "level": 603,
                        "nickname": "Fatefairy ",
                        "rank": 5.0,
                        "title": 14
                    },
                    {
                        "address": "",
                        "avatarUrl": "3",
                        "level": 579,
                        "nickname": "Player5809214",
                        "rank": 6.0,
                        "title": 14
                    },
                    {
                        "address": "",
                        "avatarUrl": "9",
                        "level": 519,
                        "nickname": "Player3626548",
                        "rank": 7.0,
                        "title": 13
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 509,
                        "nickname": "Angie",
                        "rank": 8.0,
                        "title": 13
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 503,
                        "nickname": "Player5550978",
                        "rank": 9.0,
                        "title": 13
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 479,
                        "nickname": "Player5337517",
                        "rank": 10.0,
                        "title": 12
                    },
                    {
                        "address": "",
                        "avatarUrl": "9",
                        "level": 440,
                        "nickname": "Player2670896",
                        "rank": 11.0,
                        "title": 12
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 439,
                        "nickname": "Player8710725",
                        "rank": 12.0,
                        "title": 12
                    },
                    {
                        "address": "",
                        "avatarUrl": "4",
                        "level": 412,
                        "nickname": "Player3240465",
                        "rank": 13.0,
                        "title": 12
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 406,
                        "nickname": "Player8378349",
                        "rank": 14.0,
                        "title": 12
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 402,
                        "nickname": "Player9911212",
                        "rank": 15.0,
                        "title": 12
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 398,
                        "nickname": "Player1984465",
                        "rank": 16.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "4",
                        "level": 389,
                        "nickname": "Player1328493",
                        "rank": 17.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "3",
                        "level": 382,
                        "nickname": "Player6875577",
                        "rank": 18.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "7",
                        "level": 378,
                        "nickname": "Player5092490",
                        "rank": 19.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "7",
                        "level": 371,
                        "nickname": "Player9579415",
                        "rank": 20.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "9",
                        "level": 363,
                        "nickname": "Player7275474",
                        "rank": 21.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "2",
                        "level": 359,
                        "nickname": "Player1441834",
                        "rank": 22.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 358,
                        "nickname": "Player2192094",
                        "rank": 23.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "3",
                        "level": 355,
                        "nickname": "Player9516382",
                        "rank": 24.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 352,
                        "nickname": "Giloka",
                        "rank": 25.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "4",
                        "level": 339,
                        "nickname": "Player4545261",
                        "rank": 26.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 331,
                        "nickname": "Player8735723",
                        "rank": 27.0,
                        "title": 11
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 329,
                        "nickname": "Player4940494",
                        "rank": 28.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "2",
                        "level": 325,
                        "nickname": "Player4485988",
                        "rank": 29.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 323,
                        "nickname": "Player4174968",
                        "rank": 30.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "4",
                        "level": 319,
                        "nickname": "Player3030791",
                        "rank": 31.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 318,
                        "nickname": "Player4552149",
                        "rank": 32.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "11",
                        "level": 317,
                        "nickname": "Player3719647",
                        "rank": 33.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 315,
                        "nickname": "Player9219634",
                        "rank": 34.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 309,
                        "nickname": "Player2961599",
                        "rank": 35.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "9",
                        "level": 306,
                        "nickname": "Player6194783",
                        "rank": 36.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 303,
                        "nickname": "Player1976997",
                        "rank": 37.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 302,
                        "nickname": "Player6252020",
                        "rank": 38.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 299,
                        "nickname": "PlayerDESIB.",
                        "rank": 39.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "9",
                        "level": 299,
                        "nickname": "Player4741093",
                        "rank": 40.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "9",
                        "level": 298,
                        "nickname": "Player1271817",
                        "rank": 41.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 292,
                        "nickname": "krondor",
                        "rank": 42.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 288,
                        "nickname": "Player4453200",
                        "rank": 43.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "11",
                        "level": 287,
                        "nickname": "Player2316405",
                        "rank": 44.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 286,
                        "nickname": "Player7664031",
                        "rank": 45.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 286,
                        "nickname": "Player5699090",
                        "rank": 46.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 282,
                        "nickname": "Player6017821",
                        "rank": 47.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "7",
                        "level": 280,
                        "nickname": "Player5695358",
                        "rank": 48.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "11",
                        "level": 279,
                        "nickname": "Player4927801",
                        "rank": 49.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "11",
                        "level": 279,
                        "nickname": "Player8997096",
                        "rank": 50.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 278,
                        "nickname": "Player9845691",
                        "rank": 51.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 273,
                        "nickname": "Player4847645",
                        "rank": 52.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "9",
                        "level": 272,
                        "nickname": "Player6941357",
                        "rank": 53.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 272,
                        "nickname": "Player2582198",
                        "rank": 54.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "3",
                        "level": 272,
                        "nickname": "Player6118679",
                        "rank": 55.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 270,
                        "nickname": "Player1659174",
                        "rank": 56.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "7",
                        "level": 270,
                        "nickname": "Player5892811",
                        "rank": 57.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 269,
                        "nickname": "Player5425181",
                        "rank": 58.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 268,
                        "nickname": "Player5798236",
                        "rank": 59.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 267,
                        "nickname": "Player2121747",
                        "rank": 60.0,
                        "title": 10
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 262,
                        "nickname": "Player8090526",
                        "rank": 61.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 262,
                        "nickname": "Player8665506",
                        "rank": 62.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 261,
                        "nickname": "Lizle",
                        "rank": 63.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 260,
                        "nickname": "Player2632688",
                        "rank": 64.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 260,
                        "nickname": "Player7623760",
                        "rank": 65.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "3",
                        "level": 259,
                        "nickname": "Player7124648",
                        "rank": 66.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 257,
                        "nickname": "Player4877787",
                        "rank": 67.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 257,
                        "nickname": "Player4186576",
                        "rank": 68.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "7",
                        "level": 255,
                        "nickname": "Player9081003",
                        "rank": 69.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 253,
                        "nickname": "Player8633915",
                        "rank": 70.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 252,
                        "nickname": "Player9444242",
                        "rank": 71.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "9",
                        "level": 248,
                        "nickname": "Player7666769",
                        "rank": 72.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 248,
                        "nickname": "Player1856981",
                        "rank": 73.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 247,
                        "nickname": "Player6225967",
                        "rank": 74.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 247,
                        "nickname": "dakota",
                        "rank": 75.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 247,
                        "nickname": "Player9296472",
                        "rank": 76.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 246,
                        "nickname": "Player7313543",
                        "rank": 77.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 246,
                        "nickname": "Player3378652",
                        "rank": 78.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 245,
                        "nickname": "Player1936041",
                        "rank": 79.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 245,
                        "nickname": "Player2820532",
                        "rank": 80.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "9",
                        "level": 245,
                        "nickname": "Player1266241",
                        "rank": 81.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 245,
                        "nickname": "Player6519121",
                        "rank": 82.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "7",
                        "level": 244,
                        "nickname": "Player1091240",
                        "rank": 83.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "11",
                        "level": 242,
                        "nickname": "Player1344731",
                        "rank": 84.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "4",
                        "level": 238,
                        "nickname": "Player9535650",
                        "rank": 85.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "9",
                        "level": 237,
                        "nickname": "Player5900759",
                        "rank": 86.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 237,
                        "nickname": "Player9439209",
                        "rank": 87.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "8",
                        "level": 235,
                        "nickname": "JRC",
                        "rank": 88.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "2",
                        "level": 225,
                        "nickname": "Player4687488",
                        "rank": 89.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 224,
                        "nickname": "Player9237080",
                        "rank": 90.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "3",
                        "level": 224,
                        "nickname": "Player4289316",
                        "rank": 91.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "4",
                        "level": 223,
                        "nickname": "Player7471922",
                        "rank": 92.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "2",
                        "level": 222,
                        "nickname": "John Fernandes",
                        "rank": 93.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "2",
                        "level": 222,
                        "nickname": "Player4649410",
                        "rank": 94.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "2",
                        "level": 218,
                        "nickname": "Player6160100",
                        "rank": 95.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "5",
                        "level": 214,
                        "nickname": "Player8949286",
                        "rank": 96.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "10",
                        "level": 211,
                        "nickname": "Carol",
                        "rank": 97.0,
                        "title": 9
                    },
                    {
                        "address": "",
                        "avatarUrl": "1",
                        "level": 210,
                        "nickname": "Player7856059",
                        "rank": 98.0,
                        "title": 8
                    },
                    {
                        "address": "",
                        "avatarUrl": "2",
                        "level": 209,
                        "nickname": "Player6394784",
                        "rank": 99.0,
                        "title": 8
                    },
                    {
                        "address": "",
                        "avatarUrl": "6",
                        "level": 208,
                        "nickname": "Player8203826",
                        "rank": 100.0,
                        "title": 8
                    }
                ],
                "myrank": {
                    "rank": 0,
                    "title": 1
                }
            }
        })
    }

    static requestActivityRank(batchId: string): Promise<any> {
        const openId = BaseDataManager.uuid;
        const gameAppkey = ConfigHelper.getGameInfo().gameAppkey;
        const domain = this.getApiDomain();
        const url = "api/fgame/query/rank";

        if (Api.requestMap.has(url)) {
            return Api.requestMap.get(url)!;
        }

        const header = {
            openid: openId,
            gameAppkey: gameAppkey,
            version: SDKInstance.getGameVersion(),
            requestId: new Date().getTime().toString()
        };

        const params = {
            batchId: batchId
        };

        const request = Api.getRequest(url, header, null, params, domain);
        request.then((response: any) => {
            // Empty handler
        }).catch((error: any) => {
            // Empty handler
        });

        return request;
    }

    static requestTournament(): Promise<any> {
        /*const openId = BaseDataManager.uuid;
        const gameAppkey = ConfigHelper.getGameInfo().gameAppkey;
        const domain = this.getApiDomain();
        const url = "api/fgame/tournament/config";

        if (Api.requestMap.has(url)) {
            return Api.requestMap.get(url)!;
        }

        const header = {
            openid: openId,
            gameAppkey: gameAppkey,
            version: SDKInstance.getGameVersion(),
            requestId: new Date().getTime().toString()
        };

        const request = Api.getRequest(url, header, null, {}, domain);
        request.then((response: any) => {
            // Empty handler
        }).catch((error: any) => {
            // Empty handler
        });

        return request;*/
        //@todo data test
        return Promise.resolve({
            "msg": "返回成功",
            "code": 200,
            "data": [
                {
                    "id": 562,
                    "title": "官方挑战赛一",
                    "contextid": null,
                    "endTime": 1777737600,
                    "payload": {
                        "level": 69,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 36150,
                            "openid": "aebff54e9f89495a8049c4496c6e7018",
                            "name": "Player7664031",
                            "ranking": 1,
                            "avatar": "5"
                        },
                        {
                            "score": 36024,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 2,
                            "avatar": "3"
                        },
                        {
                            "score": 35953,
                            "openid": "8a0657e41a5847048bc3e46894347a62",
                            "name": "Player9911212",
                            "ranking": 3,
                            "avatar": "5"
                        }
                    ],
                    "createTime": 1777651200
                },
                {
                    "id": 563,
                    "title": "官方挑战赛二",
                    "contextid": null,
                    "endTime": 1777737600,
                    "payload": {
                        "level": 70,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 38800,
                            "openid": "aebff54e9f89495a8049c4496c6e7018",
                            "name": "Player7664031",
                            "ranking": 1,
                            "avatar": "5"
                        },
                        {
                            "score": 38437,
                            "openid": "8a0657e41a5847048bc3e46894347a62",
                            "name": "Player9911212",
                            "ranking": 2,
                            "avatar": "5"
                        },
                        {
                            "score": 37867,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 3,
                            "avatar": "3"
                        }
                    ],
                    "createTime": 1777651200
                },
                {
                    "id": 564,
                    "title": "官方挑战赛三",
                    "contextid": null,
                    "endTime": 1777737600,
                    "payload": {
                        "level": 71,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 45365,
                            "openid": "8a0657e41a5847048bc3e46894347a62",
                            "name": "Player9911212",
                            "ranking": 1,
                            "avatar": "5"
                        },
                        {
                            "score": 44462,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 2,
                            "avatar": "3"
                        },
                        {
                            "score": 44250,
                            "openid": "2c88b810135f423bbd4889ff74601f4d",
                            "name": "Player4960386",
                            "ranking": 3,
                            "avatar": "4"
                        }
                    ],
                    "createTime": 1777651200
                },
                {
                    "id": 565,
                    "title": "官方挑战赛四",
                    "contextid": null,
                    "endTime": 1777737600,
                    "payload": {
                        "level": 72,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 32534,
                            "openid": "8a0657e41a5847048bc3e46894347a62",
                            "name": "Player9911212",
                            "ranking": 1,
                            "avatar": "5"
                        },
                        {
                            "score": 32374,
                            "openid": "574b86e99b104e67b81d8cf06f3c57eb",
                            "name": "Betiz ",
                            "ranking": 2,
                            "avatar": "9"
                        },
                        {
                            "score": 32214,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 3,
                            "avatar": "3"
                        }
                    ],
                    "createTime": 1777651200
                },
                {
                    "id": 578,
                    "title": "官方挑战赛一",
                    "contextid": null,
                    "endTime": 1777824000,
                    "payload": {
                        "level": 73,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 40618,
                            "openid": "189ecc2e90f540fe899cda1cbf2c5ee9",
                            "name": "Player1885093",
                            "ranking": 1,
                            "avatar": "7"
                        },
                        {
                            "score": 40467,
                            "openid": "07532d78706e44a9b370c8dd9cab9de7",
                            "name": "jorge ojeda",
                            "ranking": 2,
                            "avatar": "3"
                        },
                        {
                            "score": 40403,
                            "openid": "16753e18bde74cefaf72bd97ba567a1d",
                            "name": "Player3355033",
                            "ranking": 3,
                            "avatar": "9"
                        }
                    ],
                    "createTime": 1777737600
                },
                {
                    "id": 579,
                    "title": "官方挑战赛二",
                    "contextid": null,
                    "endTime": 1777824000,
                    "payload": {
                        "level": 74,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 40492,
                            "openid": "574b86e99b104e67b81d8cf06f3c57eb",
                            "name": "Betiz ",
                            "ranking": 1,
                            "avatar": "10"
                        },
                        {
                            "score": 39614,
                            "openid": "189ecc2e90f540fe899cda1cbf2c5ee9",
                            "name": "Player1885093",
                            "ranking": 2,
                            "avatar": "7"
                        },
                        {
                            "score": 39486,
                            "openid": "8a0657e41a5847048bc3e46894347a62",
                            "name": "Player9911212",
                            "ranking": 3,
                            "avatar": "5"
                        }
                    ],
                    "createTime": 1777737600
                },
                {
                    "id": 580,
                    "title": "官方挑战赛三",
                    "contextid": null,
                    "endTime": 1777824000,
                    "payload": {
                        "level": 75,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 16996,
                            "openid": "574b86e99b104e67b81d8cf06f3c57eb",
                            "name": "Betiz ",
                            "ranking": 1,
                            "avatar": "10"
                        },
                        {
                            "score": 16990,
                            "openid": "8a0657e41a5847048bc3e46894347a62",
                            "name": "Player9911212",
                            "ranking": 2,
                            "avatar": "5"
                        },
                        {
                            "score": 16616,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 3,
                            "avatar": "3"
                        }
                    ],
                    "createTime": 1777737600
                },
                {
                    "id": 581,
                    "title": "官方挑战赛四",
                    "contextid": null,
                    "endTime": 1777824000,
                    "payload": {
                        "level": 76,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 29651,
                            "openid": "8a0657e41a5847048bc3e46894347a62",
                            "name": "Player9911212",
                            "ranking": 1,
                            "avatar": "5"
                        },
                        {
                            "score": 29394,
                            "openid": "574b86e99b104e67b81d8cf06f3c57eb",
                            "name": "Betiz ",
                            "ranking": 2,
                            "avatar": "10"
                        },
                        {
                            "score": 28584,
                            "openid": "3a01cf57cda24bdc83c05ce3a4c7c3b8",
                            "name": "Player7905072",
                            "ranking": 3,
                            "avatar": "3"
                        }
                    ],
                    "createTime": 1777737600
                },
                {
                    "id": 595,
                    "title": "官方挑战赛一",
                    "contextid": null,
                    "endTime": 1777910400,
                    "payload": {
                        "level": 77,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 26353,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 1,
                            "avatar": "3"
                        },
                        {
                            "score": 26334,
                            "openid": "9ecdb3212c7d4d33b03aa58f19103b70",
                            "name": "louise marie ",
                            "ranking": 2,
                            "avatar": "7"
                        },
                        {
                            "score": 26061,
                            "openid": "8a0657e41a5847048bc3e46894347a62",
                            "name": "Player9911212",
                            "ranking": 3,
                            "avatar": "5"
                        }
                    ],
                    "createTime": 1777824000
                },
                {
                    "id": 596,
                    "title": "官方挑战赛二",
                    "contextid": null,
                    "endTime": 1777910400,
                    "payload": {
                        "level": 78,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 19710,
                            "openid": "574b86e99b104e67b81d8cf06f3c57eb",
                            "name": "Betiz ",
                            "ranking": 1,
                            "avatar": "10"
                        },
                        {
                            "score": 19461,
                            "openid": "9ecdb3212c7d4d33b03aa58f19103b70",
                            "name": "louise marie ",
                            "ranking": 2,
                            "avatar": "7"
                        },
                        {
                            "score": 19358,
                            "openid": "8a0657e41a5847048bc3e46894347a62",
                            "name": "Player9911212",
                            "ranking": 3,
                            "avatar": "5"
                        }
                    ],
                    "createTime": 1777824000
                },
                {
                    "id": 597,
                    "title": "官方挑战赛三",
                    "contextid": null,
                    "endTime": 1777910400,
                    "payload": {
                        "level": 79,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 34440,
                            "openid": "134788527c28400ca88790a1ccefdfb5",
                            "name": "Player2053093",
                            "ranking": 1,
                            "avatar": "8"
                        },
                        {
                            "score": 34133,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 2,
                            "avatar": "3"
                        },
                        {
                            "score": 33789,
                            "openid": "3a01cf57cda24bdc83c05ce3a4c7c3b8",
                            "name": "Player7905072",
                            "ranking": 3,
                            "avatar": "3"
                        }
                    ],
                    "createTime": 1777824000
                },
                {
                    "id": 598,
                    "title": "官方挑战赛四",
                    "contextid": null,
                    "endTime": 1777910400,
                    "payload": {
                        "level": 80,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 47036,
                            "openid": "8a0657e41a5847048bc3e46894347a62",
                            "name": "Player9911212",
                            "ranking": 1,
                            "avatar": "5"
                        },
                        {
                            "score": 46060,
                            "openid": "d6c90766dd234a9d851b8662ccb3553b",
                            "name": "LCOLZO",
                            "ranking": 2,
                            "avatar": "7"
                        },
                        {
                            "score": 45924,
                            "openid": "1cb621d97ddd49b3ab48be6844f64081",
                            "name": "Mirtilla ",
                            "ranking": 3,
                            "avatar": "8"
                        }
                    ],
                    "createTime": 1777824000
                },
                {
                    "id": 612,
                    "title": "官方挑战赛一",
                    "contextid": null,
                    "endTime": 1777996800,
                    "payload": {
                        "level": 81,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 36298,
                            "openid": "574b86e99b104e67b81d8cf06f3c57eb",
                            "name": "Betiz ",
                            "ranking": 1,
                            "avatar": "10"
                        },
                        {
                            "score": 35915,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 2,
                            "avatar": "3"
                        },
                        {
                            "score": 34897,
                            "openid": "b0e9295724b44cae835445fbf905b1fe",
                            "name": "Player6907449",
                            "ranking": 3,
                            "avatar": "5"
                        }
                    ],
                    "createTime": 1777910400
                },
                {
                    "id": 613,
                    "title": "官方挑战赛二",
                    "contextid": null,
                    "endTime": 1777996800,
                    "payload": {
                        "level": 82,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 31707,
                            "openid": "574b86e99b104e67b81d8cf06f3c57eb",
                            "name": "Betiz ",
                            "ranking": 1,
                            "avatar": "10"
                        },
                        {
                            "score": 31627,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 2,
                            "avatar": "3"
                        },
                        {
                            "score": 31594,
                            "openid": "134788527c28400ca88790a1ccefdfb5",
                            "name": "Player2053093",
                            "ranking": 3,
                            "avatar": "8"
                        }
                    ],
                    "createTime": 1777910400
                },
                {
                    "id": 614,
                    "title": "官方挑战赛三",
                    "contextid": null,
                    "endTime": 1777996800,
                    "payload": {
                        "level": 83,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 30023,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 1,
                            "avatar": "3"
                        },
                        {
                            "score": 29987,
                            "openid": "9ecdb3212c7d4d33b03aa58f19103b70",
                            "name": "louise marie ",
                            "ranking": 2,
                            "avatar": "7"
                        },
                        {
                            "score": 29718,
                            "openid": "b9cae213d66f40de92d53df1b25286aa",
                            "name": "Player8556857",
                            "ranking": 3,
                            "avatar": "3"
                        }
                    ],
                    "createTime": 1777910400
                },
                {
                    "id": 615,
                    "title": "官方挑战赛四",
                    "contextid": null,
                    "endTime": 1777996800,
                    "payload": {
                        "level": 84,
                        "official": true,
                        "rewards": [
                            {
                                "Num": 300,
                                "CfgId": 10001
                            },
                            {
                                "Num": 200,
                                "CfgId": 10001
                            },
                            {
                                "Num": 100,
                                "CfgId": 10001
                            }
                        ]
                    },
                    "rankList": [
                        {
                            "score": 23353,
                            "openid": "0913acfda58044728019c4ba4f3efe8c",
                            "name": "Player4289316",
                            "ranking": 1,
                            "avatar": "3"
                        },
                        {
                            "score": 22667,
                            "openid": "9ecdb3212c7d4d33b03aa58f19103b70",
                            "name": "louise marie ",
                            "ranking": 2,
                            "avatar": "7"
                        },
                        {
                            "score": 22646,
                            "openid": "eefa199d2aee479e8c645e4745e0040f",
                            "name": "Player4788770",
                            "ranking": 3,
                            "avatar": "2"
                        }
                    ],
                    "createTime": 1777910400
                }
            ]
        })
    }

    static requestTournamentRank(configId: string): Promise<any> {
        const openId = BaseDataManager.uuid;
        const gameAppkey = ConfigHelper.getGameInfo().gameAppkey;
        const domain = this.getApiDomain();
        const url = "api/fgame/tournament/rank";

        if (Api.requestMap.has(url)) {
            return Api.requestMap.get(url)!;
        }

        const header = {
            openid: openId,
            gameAppkey: gameAppkey,
            version: SDKInstance.getGameVersion(),
            requestId: new Date().getTime().toString()
        };

        const params = {
            configID: configId
        };

        const request = Api.getRequest(url, header, null, params, domain);
        request.then((response: any) => {
            // Empty handler
        }).catch((error: any) => {
            // Empty handler
        });

        return request;
    }

    static reportedTournament(configId: string, score: number): Promise<any> {
        const openId = BaseDataManager.uuid;
        const gameAppkey = ConfigHelper.getGameInfo().gameAppkey;
        const domain = this.getApiDomain();
        const url = "api/fgame/tournament/reported";

        if (Api.requestMap.has(url)) {
            return Api.requestMap.get(url)!;
        }

        const header = {
            openid: openId,
            gameAppkey: gameAppkey,
            version: SDKInstance.getGameVersion(),
            requestId: new Date().getTime().toString()
        };

        const params = {
            name: BaseDataManager.nickName,
            avatar: BaseDataManager.userAvatar,
            score: score,
            configID: configId
        };

        const request = Api.getRequest(url, header, null, params, domain);
        request.then((response: any) => {
            // Empty handler
        }).catch((error: any) => {
            // Empty handler
        });

        return request;
    }

    static getRequest(
        url: string,
        header: any,
        body: any,
        params: any,
        domain: string = "",
        forceRefresh: boolean = false,
        showError: boolean = true
    ): Promise<any> {
        if (!forceRefresh && Api.requestMap.has(url)) {
            return Api.requestMap.get(url)!;
        }

        const request = new Promise((resolve, reject) => {
            const requestData = {
                url: url,
                domain: domain,
                header: header,
                body: body,
                params: params
            };

            GameHttp.instance.post(requestData).then((response: string) => {
                Api.requestMap.delete(url);
                const parsedResponse = JSON.parse(response);
                resolve(parsedResponse);
            }).catch((error: any) => {
                if (showError) {
                    console.error(
                        "domain: " + domain + 
                        " url: " + url + 
                        " 请求失败 res: " + JSON.stringify(error) + 
                        "  token: " + Api.token_query + 
                        " body: " + JSON.stringify(body) + 
                        " params: " + JSON.stringify(params)
                    );
                }
                Api.requestMap.delete(url);
                reject(error);
            });
        });

        Api.requestMap.set(url, request);
        return request;
    }
}