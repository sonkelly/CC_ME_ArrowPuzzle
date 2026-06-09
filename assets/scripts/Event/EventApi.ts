import { _decorator } from 'cc';
import { AjaxHelper } from './../AjaxHelper';

// Hàm lấy base URL dựa trên nền tảng
function getBaseUrl(): string {
    return SDKInstance.isIOS() ? "" /*https://service.szdywlkj.com*/ : "" /*https://api.quduoduodata.top*/;
}

// Định nghĩa interface cho các tham số
interface RequestParams {
    params?: Record<string, any>;
    header?: Record<string, string>;
}

interface RequestWithUrl {
    url: string;
    params?: Record<string, any>;
    header?: Record<string, string>;
}
export function adLogin(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/advEvent/login",
        query: params.params,
        header: params.header
    });
}

export function adPurchase(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/advEvent/purchase",
        query: params.params,
        header: params.header
    });
}

export function adRegister(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/advEvent/register",
        query: params.params,
        header: params.header
    });
}

export function bilibiliTracking(url: string) {
    return AjaxHelper.wxPost({
        url: url
    });
}

export function conversion(url: string, params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: url,
        query: params.params,
        header: params.header
    });
}

export function customEvent(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/event/customEvent",
        header: params.header,
        query: params.params
    });
}

export function loadEndEvent(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/eventLoad/loadEnd",
        header: params.header,
        query: params.params
    });
}

export function loadStartEvent(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/eventLoad/loadStart",
        header: params.header,
        query: params.params
    });
}

export function login(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/user/login",
        header: params.header
    });
}

export function playGameTime(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/gameTime/playGameTime",
        header: params.header,
        query: params.params
    });
}

export function register(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/user/register",
        header: params.header
    });
}

export function relevance(url: string, params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: url,
        query: params.params,
        header: params.header
    });
}

export function signEvent(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/eventSign/signIn",
        header: params.header,
        query: params.params
    });
}

export function videoEvent(params: RequestParams) {
    return AjaxHelper.ajaxGet({
        url: getBaseUrl() + "/api/eventVideo/videoRecord",
        header: params.header,
        query: params.params
    });
}

export function wxTracking(params: RequestParams) {
    return AjaxHelper.wxPost({
        url: getBaseUrl() + "/api/util/wxPointHttp",
        params: params.params,
        header: params.header
    });
}

export function xGameTracking(url: string, params: RequestParams) {
    return AjaxHelper.wxPost({
        url: url,
        params: params.params,
        header: params.header
    });
}