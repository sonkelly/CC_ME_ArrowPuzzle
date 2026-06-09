import { PlatformEnum } from './PlatformEnum';

export class LocalConfigExample {
    public static PACKING_PLATFORM: PlatformEnum = PlatformEnum.Auto;
    public static OSS_BASE_PATH: string = "https://www.quduoduodata.top/ossfile/laya/KuPao2/";
    public static OSS_PATH_PREFIX: Record<string, string> = {
        default: "oppo_v1",
        oppo: "",
        vivo: "vivo_v1",
        weChat: "",
        touTiao: "",
        wechat: "wx_v1",
        qq: "",
        huaWei: "",
        xiaoMi: ""
    };
    public static NODE_ENV: string = "prod";
    public static VERSION_NUMBER_SUPPORT_TIPS: string = "当前客户端版本过低，无法使用该功能，请升级客户端或关闭后重启更新。";
    public static GAME_APP_KEY: string = "huochairen";
    public static QDD_PRIVACY_AGREEMENT: PrivacyAgreement = {
        agreementHtml: "https://www.quduoduodata.top/ossfile/PrivacyPolicy/qddPolicy.html",
        companyLog: "https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/companyLog/qdd.png",
        companyLogChannel: "https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/companyLog/qddChannel.png"
    };
    public static LING_MENG_PRIVACY_AGREEMENT: PrivacyAgreement = {
        agreementHtml: "https://www.quduoduodata.top/ossfile/PrivacyPolicy/lmPolicy.html",
        companyLog: "https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/companyLog/lm.png",
        companyLogChannel: "https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/companyLog/lmChannel.png"
    };
    public static DA_YANG_PRIVACY_AGREEMENT: PrivacyAgreement = {
        agreementHtml: "https://www.quduoduodata.top/ossfile/PrivacyPolicy/dyPolicy.html",
        companyLog: "https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/companyLog/dy.png",
        companyLogChannel: "https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/companyLog/dyChannel.png"
    };
    public static ANG_SHEN_PRIVACY_AGREEMENT: PrivacyAgreement = {
        agreementHtml: "https://www.quduoduodata.top/ossfile/PrivacyPolicy/asPolicy.html",
        companyLog: "https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/companyLog/as.png",
        companyLogChannel: "https://www.quduoduodata.top/ossfile/qddSDKRes/privacyAgreement/companyLog/asChannel.png"
    };
}

interface PrivacyAgreement {
    agreementHtml: string;
    companyLog: string;
    companyLogChannel: string;
}