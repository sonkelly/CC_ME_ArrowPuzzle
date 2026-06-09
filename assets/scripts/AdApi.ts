import { _decorator } from 'cc';
import { AjaxHelper } from './AjaxHelper';

export function getOssAdConfigure(url: string): Promise<any> {
    return AjaxHelper.ajaxGet({
        url: url
    });
}