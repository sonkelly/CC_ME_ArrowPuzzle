import { _decorator, Node, Prefab, Widget, view, UITransform, instantiate } from "cc";
import { EventManager } from "./../Event/EventManager";
import { MainNavMenu } from "./../MainNavMenu";
import { AudioUtils } from "./../Utils/AudioUtils";
import { VirtualScrollView } from "./../VScrollView";
import { TabContainer } from "./../TabContainer";
import { TournamentDataManager } from "./../Tournament/TournamentDataManager";
import { TournamentItem } from "./../Tournament/TournamentItem";
import { ModuleEventKey } from "./../IGameRawData";
import { GameLogicConfig } from "./../GameLogicConfig";
import { Global } from "./../Global";
import { NezpTools } from "./../NezpTools";
import { CCExtends } from "./../CCExtends";
import { GameRecord } from "./../GameRecord";
import { TournamentWxMgr } from "./../Tournament/TournamentWxMgr";

const { ccclass, property } = _decorator;

enum TournamentTabType {
    All = 0,
    MyJoined = 1
}

@ccclass("TournamentMenu")
export class TournamentMenu extends MainNavMenu {
    @property(Node)
    title: Node = null;

    @property(TabContainer)
    topTab: TabContainer = null;

    @property(VirtualScrollView)
    tournamentList: VirtualScrollView = null;

    @property(VirtualScrollView)
    myTournamentList: VirtualScrollView = null;

    @property(Node)
    btnCreate: Node = null;

    @property(Node)
    jiangbei: Node = null;

    @property(Node)
    wait_round: Node = null;

    @property(Node)
    referAllNode: Node = null;

    @property(Node)
    allContent: Node = null;

    @property(Prefab)
    itemPre: Prefab = null;

    @property(Node)
    referMyNode: Node = null;

    @property(Node)
    myContent: Node = null;

    private _selectType: TournamentTabType = TournamentTabType.All;
    private nezpRankListContainer: any[] = [];
    private allIframeReferNode: Node = null;
    private nezpAllData: { players: any[] } = { players: [] };
    private nezpAllView: any = null;
    private myIframeReferNode: Node = null;
    private nezpMyData: { players: any[] } = { players: [] };
    private nezpMyView: any = null;
    private boxHeight: number = 578 * NezpTools.staticDomRatio * 0.5;
    private isShow: boolean = false;
    private allList: any[] = [];
    private myList: any[] = [];
    private canUpdateIframe: boolean = false;
    private isInitMyTour: boolean = false;

    onDestroy(): void {
        super.onDestroy();
        EventManager.offAll(this);
    }

    onLoad(): void {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.UpdateTournament, this.OnUpdateTournament, this);
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, this.tempShowOrHideOverlayView, this);

        this.scheduleOnce(() => {
            this.title.setPosition(0, SDKInstance.isFacebookMiniGame() ? 0 : -78);
            if (SDKInstance.isWxPlatform() || SDKInstance.isGooglePlayNative() || SDKInstance.isDebug()) {
                this.topTab.node.parent.getComponent(Widget).top = 218;
                this.tournamentList.node.getComponent(Widget).top = 350;
                this.myTournamentList.node.getComponent(Widget).top = 350;
            }
        });
    }

    async OnShow(): Promise<void> {
        this.isShow = true;
        this.canUpdateIframe = false;
        this.topTab.node.on(TabContainer.Event.TAB_CHANGE, this.onTypeChange, this);
        this.topTab.setIndex(this._selectType, false);

        if (SDKInstance.isWxPlatform()) {
            SDKInstance.getUserInfo({
                resultCallback: (success: boolean, userInfo: any) => {
                    if (success) {
                        GameRecord.GetInstance().BaseRecorder.saveUserInfo(userInfo);
                        this.scheduleOnce(() => {
                            this.OnUpdateTournament(true);
                            TournamentWxMgr.instance.CheckTournamentSettlement();
                        }, 0.1);
                    }
                }
            });
        } else {
            this.scheduleOnce(() => {
                this.OnUpdateTournament(true);
                if (SDKInstance.isFacebookMiniGame()) {
                    TournamentDataManager.instance.CheckTournamentSettlement();
                } else {
                    TournamentWxMgr.instance.CheckTournamentSettlement();
                }
            }, 0.1);
        }
    }

    OnEvent(event: any): void {
        // Empty implementation
    }

    OnHide(): void {
        this.topTab.node.off(TabContainer.Event.TAB_CHANGE, this.onTypeChange, this);
        this.isShow = false;
        this.isInitMyTour = false;
        this._selectType = TournamentTabType.All;
        this.hideZero();
        this.nezpAllData = { players: [] };
        this.nezpMyData = { players: [] };
    }

    initNEZPContainer(): void {
        if (SDKInstance.isFacebookMiniGame() && this.nezpRankListContainer.length === 0) {
            console.log("initNEZPContainer=======");
            this.nezpRankListContainer = [
                {
                    id: "NEZPAllTour",
                    element: Global.NEZPAllTour,
                    referNode: this.referAllNode
                },
                {
                    id: "NEZPMyTour",
                    element: Global.NEZPMyTour,
                    referNode: this.referMyNode
                }
            ];

            const visibleSize = view.getVisibleSize();
            this.nezpRankListContainer.forEach((container: any) => {
                if (container.element) {
                    console.log("重置已有容器========");
                    container.element.querySelectorAll("iframe").forEach((iframe: any) => iframe.remove());
                } else {
                    container.element = NezpTools.createContainer(container.id, "publicContainer", container.referNode);
                    if (!container.element) return;

                    console.log("创建新容器=====");
                    const worldPos = container.referNode.parent.getComponent(UITransform).convertToWorldSpaceAR(container.referNode.position);
                    worldPos.y = visibleSize.height - worldPos.y;

                    const offset = {
                        left: (worldPos.x - container.referNode.getComponent(UITransform).width / 2) * NezpTools.staticDomRatio,
                        top: (worldPos.y - container.referNode.getComponent(UITransform).height / 2) * NezpTools.staticDomRatio
                    };

                    container.element.style.width = NezpTools.staticDomRatio * container.referNode.getComponent(UITransform).width + "px";
                    container.element.style.height = NezpTools.staticDomRatio * container.referNode.getComponent(UITransform).height + "px";
                    container.element.style.position = "absolute";
                    container.element.style.left = offset.left + "px";
                    container.element.style.top = offset.top + "px";
                    container.element.style.display = "none";
                    container.element.style.pointerEvents = "none";
                    container.element.style.border = "none";
                    container.element.style.outline = "none";
                    container.element.style.overflow = "hidden";

                    this.syncContainerToGameConfig(container.id, container.element);
                }
            });

            this.nezpAllData = { players: [] };
            this.nezpMyData = { players: [] };
        }
    }

    syncContainerToGameConfig(id: string, element: any): void {
        switch (id) {
            case "NEZPAllTour":
                Global.NEZPAllTour = element;
                break;
            case "NEZPMyTour":
                Global.NEZPMyTour = element;
                break;
        }
    }

    async OnUpdateTournament(forceUpdate?: boolean): Promise<void> {
        console.log("OnUpdateTournament==========");
        this.updateTourData();
    }

    async onTypeChange(tabType: TournamentTabType): Promise<void> {
        this._selectType = tabType;
        this.canUpdateIframe = false;
        this.jiangbei.active = false;

        switch (this._selectType) {
            case TournamentTabType.All:
                if (this.nezpAllView) {
                    Global.NEZPAllTour.style.display = "block";
                    this.allContent.parent.parent.active = true;
                } else {
                    this.tournamentList.node.active = true;
                }
                if (Global.NEZPMyTour) {
                    Global.NEZPMyTour.style.display = "none";
                }
                this.myTournamentList.node.active = false;
                this.myContent.parent.parent.active = false;
                this.canUpdateIframe = true;
                break;

            case TournamentTabType.MyJoined:
                if (this.isInitMyTour) {
                    if (this.nezpMyView) {
                        Global.NEZPMyTour.style.display = "block";
                        this.myContent.parent.parent.active = true;
                    } else {
                        this.myTournamentList.node.active = true;
                    }
                    if (Global.NEZPAllTour) {
                        Global.NEZPAllTour.style.display = "none";
                    }
                    this.tournamentList.node.active = false;
                    this.allContent.parent.parent.active = false;
                    this.canUpdateIframe = true;
                } else {
                    this.updateTourData();
                }
                break;
        }
    }

    async updateTourData(): Promise<void> {
        this.canUpdateIframe = false;
        this.wait_round.active = true;
        this.isInitMyTour = false;

        if (!SDKInstance.isFacebookMiniGame()) {
            await TournamentWxMgr.instance.loadTournamentData(true);
        }

        this.nezpAllData = { players: [] };
        this.nezpMyData = { players: [] };

        switch (this._selectType) {
            case TournamentTabType.All: {
                this.myTournamentList.node.active = false;
                this.btnCreate.active = false;
                this.wait_round.active = true;
                if (Global.NEZPMyTour) {
                    Global.NEZPMyTour.style.display = "none";
                }

                const tournamentList = SDKInstance.isFacebookMiniGame()
                    ? await TournamentDataManager.instance.getTournamentListWithRank()
                    : TournamentWxMgr.instance.getTournamentListWithRank();

                console.log("Tournament list:", tournamentList);
                this.wait_round.active = false;
                this.renderAllList(tournamentList);
                break;
            }

            case TournamentTabType.MyJoined: {
                this.wait_round.active = true;
                await TournamentDataManager.instance.loadTournamentData(true);
                this.wait_round.active = false;

                if (Global.NEZPAllTour) {
                    Global.NEZPAllTour.style.display = "none";
                }
                this.tournamentList.node.active = false;

                const myTournamentList = SDKInstance.isFacebookMiniGame()
                    ? TournamentDataManager.instance.getMyTournamentList()
                    : TournamentWxMgr.instance.getMyTournamentList();

                console.log("my Tournament list:", myTournamentList);
                this.renderMyList(myTournamentList);
                break;
            }
        }
    }

    renderAllList(tournamentList: any[]): void {
        console.log("[TournamentMenu] renderAllList");
        this.allList = tournamentList;
        this.renderAllVirtual(tournamentList);
        if (Global.NEZPAllTour) {
            Global.NEZPAllTour.style.display = "none";
        }
        this.myTournamentList.node.active = false;
        this.myContent.parent.parent.active = false;
    }

    renderAllVirtual(tournamentList: any[]): void {
        console.log("[TournamentMenu] renderAllVirtual");
        this.tournamentList.node.active = true;
        this.allContent.parent.parent.active = false;

        if (tournamentList?.length > 0) {
            console.log("TournamentList Render");
            this.tournamentList.renderItemFn = (itemNode: Node, index: number) => {
                itemNode.getComponent(TournamentItem).init(tournamentList[index], false, false);
            };
            this.jiangbei.active = false;
            this.tournamentList.refreshList(tournamentList);
            this.tournamentList.node.active = true;
        } else {
            this.tournamentList.node.active = false;
            this.jiangbei.active = true;
        }
    }

    renderAllScrollView(tournamentList: any[]): void {
        console.log("[TournamentMenu] renderAllScrollView");
        this.tournamentList.node.active = false;
        this.allContent.parent.parent.active = true;
        CCExtends.DestroyNodeAllChildren(this.allContent);

        for (let i = 0; i < tournamentList.length; i++) {
            const itemNode = instantiate(this.itemPre);
            itemNode.parent = this.allContent;
            const tournamentItem = itemNode.getComponent(TournamentItem);
            tournamentItem.init(tournamentList[i], false, true);

            const playerIds: string[] = [];
            const playerNames: string[] = [];
            for (let j = 0; j < 3; j++) {
                const rankData = tournamentList[i].rankList?.[j];
                if (rankData) {
                    const uid = rankData.uid;
                    const name = rankData.name;
                    playerNames.push(name);
                    if (uid.length < 17 || uid === "25415163034850301") {
                        playerIds.push("");
                    } else {
                        playerIds.push(uid);
                    }
                } else {
                    playerIds.push("");
                    playerNames.push("");
                }
            }

            this.setNEZPItemData(1, itemNode, i, playerIds, playerNames, i === tournamentList.length - 1);
            tournamentItem.showWaitNode();
        }
    }

    async renderAllOverlayView(): Promise<void> {
        if (this.nezpAllData.players.length === 0 || !this.isShow) return;

        this.nezpAllData.players.slice(0, 30).forEach((player: any) => {
            // Access properties to ensure they exist
            player.playerID;
            player.playerName;
            player.boxWidth;
            player.boxHeight;
            player.boxMarginBottom;
            player.playerID;
            player.imgLeft;
            player.imgTop;
            player.imgWidth;
            player.imgHeight;
            player.playerID;
            player.nameWidth;
            player.nameHeight;
            player.nameLeft;
            player.nameTop;
            player.fontSize;
            player.nameHeight;
            player.rankHeight;
            player.rankWidth;
            player.rankMarginBottom;
            player.playerID2;
            player.playerID3;
            player.playerName2;
            player.playerName3;
        });

        console.log("renderAllOverlayView>>> ");
        if (this.nezpAllView) {
            Global.NEZPAllTour.querySelectorAll("iframe").forEach((iframe: any) => iframe.remove());
        }

        console.log("创建all overlayview视图start");
        try {
            const overlayView = await FBInstant.overlayViews.createOverlayViewAsync(
                "tourIframe.xml",
                Global.NEZPAllTour,
                "",
                "overlayViews.css",
                this.nezpAllData
            );

            this.nezpAllView = overlayView;
            console.log("创建all overlayview视图成功");

            if (this.nezpAllView) {
                const iframeElement = this.nezpAllView.iframeElement;
                iframeElement.style.width = "10000px";
                iframeElement.style.height = "20000px";
                iframeElement.style.position = "absolute";
                iframeElement.style.pointerEvents = "none";
                iframeElement.style.border = "none";
                iframeElement.style.outline = "none";
                iframeElement.style.background = "transparent";
            }

            this.scheduleOnce(() => {
                if (Global.NEZPAllTour && this.isShow) {
                    Global.NEZPAllTour.style.display = "block";
                }
                if (this.isShow && this.nezpAllView) {
                    this.nezpAllView.showAsync();
                }
                this.canUpdateIframe = true;
                this.allContent.children.forEach((child: Node) => {
                    child.getComponent(TournamentItem).hideWaitNode();
                });
            }, 0.5);
        } catch (error) {
            console.error("创建all overlayview视图失败：", error);
            this.renderAllVirtual(this.allList);
        }
    }

    renderMyList(myTournamentList: any[]): void {
        console.log("[TournamentMenu] renderMyList");
        this.myList = myTournamentList;
        this.isInitMyTour = true;
        this.renderMyVirtual(myTournamentList);
        if (Global.NEZPMyTour) {
            Global.NEZPMyTour.style.display = "none";
        }
        this.tournamentList.node.active = false;
        this.allContent.parent.parent.active = false;
    }

    renderMyVirtual(myTournamentList: any[]): void {
        console.log("[TournamentMenu] renderMyVirtual");
        this.myTournamentList.node.active = true;
        this.myContent.parent.parent.active = false;

        if (myTournamentList && myTournamentList.length !== 0) {
            this.btnCreate.active = false;
            this.jiangbei.active = false;
            this.myTournamentList.renderItemFn = (itemNode: Node, index: number) => {
                itemNode.getComponent(TournamentItem).init(myTournamentList[index], true, false);
            };
            this.myTournamentList.refreshList(myTournamentList);
            this.myTournamentList.node.active = true;
        } else {
            this.myTournamentList.node.active = false;
            this.btnCreate.active = true;
            this.jiangbei.active = true;
        }
    }

    renderMyScrollView(myTournamentList: any[]): void {
        console.log("[TournamentMenu] renderMyScrollView");
        this.myTournamentList.node.active = false;
        this.myContent.parent.parent.active = true;
        CCExtends.DestroyNodeAllChildren(this.myContent);

        for (let i = 0; i < myTournamentList.length; i++) {
            const itemNode = instantiate(this.itemPre);
            itemNode.parent = this.myContent;
            const tournamentItem = itemNode.getComponent(TournamentItem);
            tournamentItem.init(myTournamentList[i], true, true);
            console.log("rankList:", myTournamentList[i].rankList);

            const playerIds: string[] = [];
            const playerNames: string[] = [];
            for (let j = 0; j < 3; j++) {
                const rankData = myTournamentList[i].rankList?.[j];
                if (rankData) {
                    const uid = rankData.uid;
                    const name = rankData.name;
                    playerNames.push(name);
                    if (uid.length < 17 || uid === "25415163034850301") {
                        playerIds.push("");
                    } else {
                        playerIds.push(uid);
                    }
                } else {
                    playerIds.push("");
                    playerNames.push("");
                }
            }

            this.setNEZPItemData(2, itemNode, i, playerIds, playerNames, i === myTournamentList.length - 1);
            tournamentItem.showWaitNode();
        }
    }

    async renederMyOverlayView(): Promise<void> {
        if (this.nezpMyData.players.length === 0 || !this.isShow) return;

        this.nezpMyData.players.slice(0, 30).forEach((player: any) => {
            // Access properties to ensure they exist
            player.playerID;
            player.playerName;
            player.boxWidth;
            player.boxHeight;
            player.boxMarginBottom;
            player.playerID;
            player.imgLeft;
            player.imgTop;
            player.imgWidth;
            player.imgHeight;
            player.playerID;
            player.nameWidth;
            player.nameHeight;
            player.nameLeft;
            player.nameTop;
            player.fontSize;
            player.nameHeight;
            player.rankHeight;
            player.rankWidth;
            player.rankMarginBottom;
            player.playerID2;
            player.playerID3;
            player.playerName2;
            player.playerName3;
        });

        console.log("renderMyOverlayView>>> ");
        if (this.nezpMyView) {
            console.log("nezpMyView updateAsync OverlayView start ");
            Global.NEZPMyTour.querySelectorAll("iframe").forEach((iframe: any) => iframe.remove());
        }

        console.log("创建my overlayview视图start");
        try {
            const overlayView = await FBInstant.overlayViews.createOverlayViewAsync(
                "tourIframe.xml",
                Global.NEZPMyTour,
                "",
                "overlayViews.css",
                this.nezpMyData
            );

            this.nezpMyView = overlayView;
            console.log("创建my overlayview视图成功");

            if (this.nezpMyView) {
                const iframeElement = this.nezpMyView.iframeElement;
                iframeElement.style.width = "10000px";
                iframeElement.style.height = "20000px";
                iframeElement.style.position = "absolute";
                iframeElement.style.pointerEvents = "none";
                iframeElement.style.border = "none";
                iframeElement.style.outline = "none";
                iframeElement.style.background = "transparent";
            }

            this.scheduleOnce(() => {
                if (Global.NEZPMyTour && this.isShow) {
                    Global.NEZPMyTour.style.display = "block";
                }
                if (this.isShow && this.nezpMyView) {
                    this.nezpMyView.showAsync();
                }
                this.canUpdateIframe = true;
                this.myContent.children.forEach((child: Node) => {
                    child.getComponent(TournamentItem).hideWaitNode();
                });
            }, 0.5);
        } catch (error) {
            console.error("创建my overlayview视图失败：", error);
            this.renderMyVirtual(this.myList);
        }
    }

    setNEZPItemData(type: number, itemNode: Node, index: number, playerIds: string[], playerNames: string[], isLast: boolean): void {
        if (!SDKInstance.isFacebookMiniGame()) return;

        const playerData = {
            playerID: playerIds[0],
            playerName: playerNames[0],
            boxWidth: 984 * NezpTools.staticDomRatio,
            boxHeight: 578 * NezpTools.staticDomRatio,
            boxMarginBottom: 30 * NezpTools.staticDomRatio,
            rankWidth: 540 * NezpTools.staticDomRatio,
            rankHeight: 109 * NezpTools.staticDomRatio,
            rankMarginBottom: 25 * NezpTools.staticDomRatio,
            imgWidth: 110 * NezpTools.staticDomRatio,
            imgHeight: 110 * NezpTools.staticDomRatio,
            imgLeft: 412.5 * NezpTools.staticDomRatio,
            imgTop: 31 * NezpTools.staticDomRatio,
            nameWidth: 250 * NezpTools.staticDomRatio,
            nameHeight: 50 * NezpTools.staticDomRatio,
            nameLeft: 602 * NezpTools.staticDomRatio,
            nameTop: 32 * NezpTools.staticDomRatio,
            fontSize: 35 * NezpTools.staticDomRatio,
            playerID2: playerIds[1],
            playerID3: playerIds[2],
            playerName2: playerNames[1],
            playerName3: playerNames[2]
        };

        if (type === 1) {
            this.nezpAllData.players.push(playerData);
            if (index === 0) {
                this.allIframeReferNode = itemNode;
            }
            if (isLast) {
                this.scheduleOnce(() => {
                    console.log("this.nezpAllData >>> ", this.nezpAllData);
                    this.renderAllOverlayView();
                }, 0.1);
            }
        } else if (type === 2) {
            this.nezpMyData.players.push(playerData);
            if (index === 0) {
                this.myIframeReferNode = itemNode;
            }
            if (isLast) {
                this.scheduleOnce(() => {
                    console.log("this.nezpMyData >>> ", this.nezpMyData);
                    this.renederMyOverlayView();
                }, 0.1);
            }
        }
    }

    updateIframeSite(): void {
        if (!this.canUpdateIframe) return;

        if (this.allIframeReferNode && this.nezpAllView) {
            const worldPos = this.allIframeReferNode.parent.getComponent(UITransform).convertToWorldSpaceAR(this.allIframeReferNode.position);
            const offsetY = (view.getVisibleSize().height - worldPos.y) * NezpTools.staticDomRatio
                - Number(Global.NEZPAllTour.style.top.replace("px", ""))
                - this.boxHeight;

            if (this.nezpAllView.iframeElement) {
                this.nezpAllView.iframeElement.style.position = "absolute";
                this.nezpAllView.iframeElement.style.left = "0px";
                this.nezpAllView.iframeElement.style.top = "0px";
                this.nezpAllView.iframeElement.style.willChange = "transform";
                this.nezpAllView.iframeElement.style.transform = `translate3d(0, ${offsetY}px, 0)`;
            }
        }

        if (this.myIframeReferNode && this.nezpMyView) {
            const worldPos = this.myIframeReferNode.parent.getComponent(UITransform).convertToWorldSpaceAR(this.myIframeReferNode.position);
            const offsetY = (view.getVisibleSize().height - worldPos.y) * NezpTools.staticDomRatio
                - Number(Global.NEZPMyTour.style.top.replace("px", ""))
                - this.boxHeight;

            if (this.nezpMyView.iframeElement) {
                this.nezpMyView.iframeElement.style.position = "absolute";
                this.nezpMyView.iframeElement.style.left = "0px";
                this.nezpMyView.iframeElement.style.top = "0px";
                this.nezpMyView.iframeElement.style.willChange = "transform";
                this.nezpMyView.iframeElement.style.transform = `translate3d(0, ${offsetY}px, 0)`;
            }
        }
    }

    lateUpdate(): void {
        // Empty implementation
    }

    async onCreateClick(): Promise<void> {
        AudioUtils.btn_click_sound();
        await TournamentDataManager.instance.createTournament(100);
    }

    hideZero(): void {
        // Empty implementation
    }

    tempShowOrHideOverlayView(data: any): void {
        // Empty implementation
    }
}