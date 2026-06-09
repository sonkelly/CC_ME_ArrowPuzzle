import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BaseDataManager')
export class BaseDataManager {
    public static uuid: string = "12345";
    public static nickName: string = "";
    public static userAvatar: string = "1";
    public static userCountry: string = "RU";
    public static isNewUser: boolean = false;
}