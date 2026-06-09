import { native } from "cc";
import { LogUtils } from "./LogUtils";
import { PlatformUtils } from "./PlatformUtils";
import { PayApi } from "./../PayApi";
import { PayTypeEnum } from "./../PayTypeEnum";
import { Toast } from "./../Toast";
import { ShopDataManager } from "./../Shop/ShopDataManager";

export class PayUtils {
    static token: string = "";
    static platformVersionCode: string = "";
    static openId: string = "";
    static sessionKey: string = "";
    static h5PayOrderSn: string = "";
    static iosPayOrderSn: string = "";
    static nativePayOrderSn: string = "";
    static vivoAppTransNo: string = "";
    static huaweiAppTransToken: string = "";
    static dyIosh5PayOrderSn: string = "";
    static saveAmt: number = 0;
    static payConfigAppkey: string = ""; //a5670578c22f2e408ab4eacbd1d7c0cb

    static pay(payData: any): void {
        if (PlatformUtils.isGooglePlayNative()) {
            this.googlePlayPay(payData);
        }
    }

    static googlePlayPay(payData: any): void {
        const self = this;
        const orderParams = Object.assign({}, payData.orderBO, {
            openId: this.openId,
            payType: PayTypeEnum.googlePlayApp
        });

        this.sendOrder(orderParams, (result: any) => {
            if (result !== "") {
                JSON.stringify(result);
                LogUtils.log("payInfo: ", result.payInfo);
                self.nativePayOrderSn = result.orderSn;
                native.reflection.callStaticMethod(
                    "com/cocos/game/JSBridge",
                    "pay",
                    "(Ljava/lang/String;Ljava/lang/String;)V",
                    payData.payConfig.ID.toString(),
                    result.orderSn
                );
            } else {
                if (payData.payErrorCall) {
                    payData.payErrorCall(result.orderSn);
                }
            }
        });

        /*window.NativePayComplete = (payResult: any) => {
            LogUtils.info("NativePayComplete: ", payResult);
            if (payData.paySuccessCall) {
                payData.paySuccessCall(self.nativePayOrderSn, payResult);
            }
        };

        window.NativePayFail = () => {
            LogUtils.info("NativePayFail===========");
            if (payData.payErrorCall) {
                payData.payErrorCall(self.nativePayOrderSn);
            }
        };*/
    }

    static sendOrder(orderParams: any, callback: (result: any) => void): void {
        LogUtils.log("params...........: ", JSON.stringify(orderParams));
        
        PayApi.placeAnOrder(orderParams).then((resultJsonString: string) => {
            LogUtils.log("resultJsonString...........: ", resultJsonString);
            
            if (resultJsonString) {
                const parsedResult = JSON.parse(resultJsonString);
                
                if (parsedResult.code === 200) {
                    const orderData = parsedResult.data;
                    callback(orderData);
                } else {
                    callback("");
                    LogUtils.log(parsedResult.msg);
                    SDKInstance.showToast(parsedResult.msg);
                }
            } else {
                callback("");
                SDKInstance.showToast("order fail");
                LogUtils.log("下单失败");
            }
        }).catch((error: any) => {
            callback("");
            SDKInstance.showToast("server error " + error);
            LogUtils.log("服务器异常:", error);
        });
    }

    static purchases(productId: string, callback: (productId: string) => void): void {
        if (SDKInstance.isFacebookMiniGame()) {
            console.log("[Facebook In-App Purchases] purchases:", productId);
            
            if (FBInstant.getSupportedAPIs().includes("payments.purchaseAsync")) {
                FBInstant.payments.purchaseAsync({
                    productID: productId
                }).then((purchaseResult: any) => {
                    callback(purchaseResult.productID);
                }).catch((error: any) => {
                    console.log("purchase failed", error);
                    
                    if (error.code === "CLIENT_UNSUPPORTED_OPERATION") {
                        Toast.instance.tip_div("The device does not support purchase!");
                    } else {
                        Toast.instance.tip_div("Purchase failed!");
                    }
                });
            } else {
                Toast.instance.tip_div("The device does not support purchase!");
            }
        } else {
            callback(productId);
        }
    }

    static purchasesReady(callback: () => void): void {
        /*if (SDKInstance.isFacebookMiniGame()) {
            console.log("[Facebook In-App Purchases] purchasesReady");
            FBInstant.payments.onReady(() => {
                callback();
            });
        } else {
            callback();
        }*/
        callback();
    }

    static getCatalog(callback: (catalog: any[]) => void): void {
        /*if (!SDKInstance.isFacebookMiniGame()) {
            callback([]);
            return;
        }
        
        console.log("[Facebook In-App Purchases] getCatalog");
        FBInstant.payments.getCatalogAsync().then((catalog: any[]) => {
            callback(catalog || []);
        }).catch((error: any) => {
            console.log("getCatalogAsync error", error);
        });
        */

        callback([]);
        return;
    }

    static purchasesFailOrder(): void {
        /*if (SDKInstance.isFacebookMiniGame()) {
            console.log("[Facebook In-App Purchases] purchasesFailOrder");
            
            if (FBInstant.getSupportedAPIs().includes("payments.purchaseAsync")) {
                FBInstant.payments.getPurchasesAsync().then((purchases: any[]) => {
                    if (purchases && purchases.length > 0) {
                        const productIds = purchases.map((purchase: any) => {
                            return purchase.productID;
                        });
                        ShopDataManager.instance.buyFaildOrder(productIds);
                    }
                }).catch((error: any) => {
                    console.log("getPurchasesAsync error", error);
                });
            } else {
                console.log("not support payments.purchaseAsync");
            }
        }*/
    }
}