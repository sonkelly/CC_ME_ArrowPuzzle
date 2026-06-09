import { _decorator } from 'cc';
import { AjaxHelper } from './AjaxHelper';
import { LogUtils } from './Utils/LogUtils';

function getBaseUrl(): string {
    return SDKInstance.isIOS() ? "" : ""; //https://pay.szdywlkj.com  https://qddzf.quduoduodata.top
}

export function exchangeCode(params: { header: any, params: any }): Promise<any> {
    LogUtils.info("iosym: ", getBaseUrl());
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/app/exchangeCode/exchange",
        header: params.header,
        query: params.params
    });
}