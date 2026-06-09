import { _decorator, Component } from 'cc';
import { AjaxHelper } from './AjaxHelper';
import { LogUtils } from './Utils/LogUtils';

const PAY_URL = "https://qddzf.quduoduodata.top";
const IOS_PAY_URL = "https://pay.szdywlkj.com";

export class PayApi {
    static deliveryNotice(query: any): Promise<any> {
        let url = PAY_URL;
        if (SDKInstance.isIOS()) {
            url = IOS_PAY_URL;
            LogUtils.info("iosym: ", url);
        }
        return AjaxHelper.ajaxGet({
            url: url + "/app/cp/notify/deliveryNotice",
            query: query
        });
    }

    static placeAnOrder(params: any): Promise<any> {
        let url = PAY_URL;
        if (SDKInstance.isIOS()) {
            url = IOS_PAY_URL;
            LogUtils.info("iosym: ", url);
        }
        return AjaxHelper.ajaxPost({
            url: url + "/app/order/placeAnOrder",
            params: params
        });
    }

    static qqCodeToSession(query: any): Promise<any> {
        return AjaxHelper.ajaxGet({
            url: PAY_URL + "/app/qqQuick/codeToSession",
            query: query
        });
    }

    static queryOrderInfo(query: any): Promise<any> {
        let url = PAY_URL;
        if (SDKInstance.isIOS()) {
            url = IOS_PAY_URL;
            LogUtils.info("iosym: ", url);
        }
        return AjaxHelper.ajaxGet({
            url: url + "/app/order/queryOrderInfo",
            query: query
        });
    }

    static touTiaoCodeToSession(query: any): Promise<any> {
        return AjaxHelper.ajaxGet({
            url: PAY_URL + "/app/ttQuick/codeToSession",
            query: query
        });
    }

    static weChatCodeToSession(query: any): Promise<any> {
        return AjaxHelper.ajaxGet({
            url: PAY_URL + "/app/weChatQuick/codeToSession",
            query: query
        });
    }

    static weChatQuickGetBalance(query: any): Promise<any> {
        return AjaxHelper.ajaxGet({
            url: PAY_URL + "/app/weChatQuick/getBalance",
            query: query
        });
    }

    static weChatQuickPay(query: any): Promise<any> {
        return AjaxHelper.ajaxGet({
            url: PAY_URL + "/app/weChatQuick/pay2",
            query: query
        });
    }

    static weChatQuickRecharge(query: any): Promise<any> {
        return AjaxHelper.ajaxGet({
            url: PAY_URL + "/app/weChatQuick/recharge",
            query: query
        });
    }
}