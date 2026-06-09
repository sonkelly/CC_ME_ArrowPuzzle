import { _decorator, Node, Prefab, Widget, instantiate, tween, view, UITransform } from "cc";
import { ModuleEventKey } from "./IGameRawData";
import { BaseDataManager } from "./BaseDataManager";
import { RankDataManager } from "./RankDataManager";
import { GameRecord } from "./GameRecord";
import { VirtualScrollView } from "./VScrollView";
import { Global } from "./Global";
import { AudioUtils } from "./Utils/AudioUtils";
import { CCExtends } from "./CCExtends";
import { NezpTools } from "./NezpTools";
import { Utilsqdd } from "./Utils/Utilsqdd";
import { EventManager } from "./Event/EventManager";
import { GameLogicConfig } from "./GameLogicConfig";
import { TabContainer } from "./TabContainer";
import { FriendRankItem } from "./FriendRankItem";
import { MainNavMenu } from "./MainNavMenu";
import { RankItem } from "./RankItem";
import { ActivityType } from "./GlobalEnum";
import { DnSdkManager } from "./DnSdkManager";

const { ccclass, property } = _decorator;

enum LeaderboardType {
    Global = 0,
    Friends = 1,
    Weekly = 2,
    Daily = 3
}

@ccclass('LeaderboardMenu')
export class LeaderboardMenu extends MainNavMenu {
    @property(Node)
    title: Node = null;

    @property(TabContainer)
    topTab: TabContainer = null;

    @property(TabContainer)
    topTabWx: TabContainer = null;

    @property(VirtualScrollView)
    rankList: VirtualScrollView = null;

    @property(VirtualScrollView)
    friendsRankList: VirtualScrollView = null;

    @property(RankItem)
    myRankItem: RankItem = null;

    @property(Node)
    wait_round: Node = null;

    @property(Node)
    referGlobalNode: Node = null;

    @property(Node)
    content: Node = null;

    @property(Prefab)
    rankPre: Prefab = null;

    @property(Node)
    referFriendNode: Node = null;

    @property(Node)
    friendsContent: Node = null;

    @property(Prefab)
    friendRankPre: Prefab = null;

    @property(VirtualScrollView)
    weeklyRankList: VirtualScrollView = null;

    @property(VirtualScrollView)
    dailyRankList: VirtualScrollView = null;

    @property(Node)
    btnInvite: Node = null;

    private nezpRankListContainer: any[] = [];
    private nezpMyData: any = {};
    private nezpMyDataView: any = null;
    private globalIframeReferNode: Node | null = null;
    private nezpGlobalData: { players: any[] } = { players: [] };
    private nezpGlobalView: any = null;
    private friendsIframeReferNode: Node | null = null;
    private nezpFriendsData: { players: any[] } = { players: [] };
    private nezpFriendsView: any = null;
    private _selectType: LeaderboardType = LeaderboardType.Global;
    private globalList: any[] = [];
    private friendsList: any[] = [];
    private isShow: boolean = false;
    private isInitGolbal: boolean = false;
    private isInitFriends: boolean = false;
    private canUpdateIframe: boolean = false;
    private isInitWeekly: boolean = false;
    private isInitDaily: boolean = false;
    private myFriendRanking: number = 99;
    private myGlobalRanking: number | null = null;
    private myWeeklyRanking: number | null = null;
    private myDailyRanking: number | null = null;
    private myGlobalScore: number | null = null;
    private myWeeklyScore: number | null = null;
    private myDailyScore: number | null = null;

    constructor() {
        super();
    }

    onDestroy() {
        super.onDestroy();
        this.hideZero();
        EventManager.offAll(this);
    }

    onLoad() {
        EventManager.on(GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.ShowOrHideOverlayView, this.tempShowOrHideOverlayView, this);
        this.scheduleOnce(() => {
            this.title.setPosition(0, SDKInstance.isFacebookMiniGame() ? 0 : -78);
            if (SDKInstance.isWxPlatform() || SDKInstance.isDebug() || SDKInstance.isGooglePlayNative()) {
                this.rankList.node.getComponent(Widget).top = 348;
            }
            if (SDKInstance.isGooglePlayNative()) {
                this.rankList.node.getComponent(Widget).bottom = 505;
                this.weeklyRankList.node.getComponent(Widget).bottom = 505;
                this.dailyRankList.node.getComponent(Widget).bottom = 505;
                this.myRankItem.node.getComponent(Widget).bottom = 311;
            } else {
                this.rankList.node.getComponent(Widget).bottom = 712;
                this.weeklyRankList.node.getComponent(Widget).bottom = 712;
                this.dailyRankList.node.getComponent(Widget).bottom = 712;
                this.myRankItem.node.getComponent(Widget).bottom = 526;
            }
        });
    }

    async OnShow() {
        DnSdkManager.instance.sdk?.track("RANKLIST_ENTER", {});
        this.isShow = true;
        this.canUpdateIframe = false;
        this.btnInvite.active = !SDKInstance.isGooglePlayNative();
        if (SDKInstance.isFacebookMiniGame()) {
            this.topTab.node.on(TabContainer.Event.TAB_CHANGE, this.onTypeChange, this);
            this.topTab.setIndex(this._selectType, false);
            this.topTab.node.parent.active = true;
            this.topTabWx.node.parent.active = false;
        } else {
            this.topTabWx.node.on(TabContainer.Event.TAB_CHANGE, this.onTypeChange, this);
            this.topTabWx.setIndex(this._selectType, false);
            this.topTab.node.parent.active = false;
            this.topTabWx.node.parent.active = true;
        }
        this.rankList.node.active = false;
        this.friendsRankList.node.active = false;
        this.content.parent.parent.active = false;
        this.friendsContent.parent.parent.active = false;
        this.myRankItem.node.active = false;
        if (SDKInstance.isWxPlatform()) {
            SDKInstance.getUserInfo({
                resultCallback: (err: any, userInfo: any) => {
                    if (err) {
                        GameRecord.GetInstance().BaseRecorder.saveUserInfo(userInfo);
                        this.updateRankData();
                    }
                }
            });
        }
        this.scheduleOnce(() => {
            if (!SDKInstance.isWxPlatform()) {
                this.updateRankData();
            }
        }, 0.1);
    }

    async onTypeChange(type: number) {
        this._selectType = type;
        this.canUpdateIframe = false;
        if (this.nezpMyDataView) {
            Global.NEZPRankMyData.style.display = "block";
        }
        switch (this._selectType) {
            case LeaderboardType.Global:
                if (this.nezpGlobalView) {
                    Global.NEZPRankGlobal.style.display = "block";
                    this.content.parent.parent.active = true;
                } else {
                    this.rankList.node.active = true;
                }
                if (Global.NEZPRankFriend) {
                    Global.NEZPRankFriend.style.display = "none";
                }
                this.friendsRankList.node.active = false;
                this.friendsContent.parent.parent.active = false;
                this.weeklyRankList.node.active = false;
                this.dailyRankList.node.active = false;
                this.canUpdateIframe = true;
                this.updateMyRanking();
                break;
            case LeaderboardType.Friends:
                if (this.isInitFriends) {
                    if (this.nezpFriendsView) {
                        Global.NEZPRankFriend.style.display = "block";
                        this.friendsContent.parent.parent.active = true;
                    } else {
                        this.friendsRankList.node.active = true;
                    }
                    if (this.nezpGlobalView) {
                        Global.NEZPRankGlobal.style.display = "none";
                    }
                    this.rankList.node.active = false;
                    this.content.parent.parent.active = false;
                    this.canUpdateIframe = true;
                    this.updateMyRanking();
                } else {
                    await this.updateRankData();
                }
                break;
            case LeaderboardType.Weekly:
                if (this.isInitWeekly) {
                    this.rankList.node.active = false;
                    this.dailyRankList.node.active = false;
                    this.weeklyRankList.node.active = true;
                    this.canUpdateIframe = true;
                    this.updateMyRanking();
                } else {
                    await this.updateRankData();
                }
                break;
            case LeaderboardType.Daily:
                if (this.isInitDaily) {
                    this.rankList.node.active = false;
                    this.dailyRankList.node.active = true;
                    this.weeklyRankList.node.active = false;
                    this.canUpdateIframe = true;
                    this.updateMyRanking();
                } else {
                    await this.updateRankData();
                }
                break;
        }
    }

    async updateRankData() {
        switch (this._selectType) {
            case LeaderboardType.Global:
                this.friendsRankList.node.active = false;
                this.weeklyRankList.node.active = false;
                this.dailyRankList.node.active = false;
                this.wait_round.active = true;
                this.wait_round.active = true;
                try {
                    const data = await RankDataManager.instance.fetchRankingList(0, 100);
                    console.log("排行榜数据:", data);
                    if (data.myRanking) {
                        this.myGlobalRanking = data.myRanking;
                    }
                    this.renderGlobalList(data.userInfos);
                    this.wait_round.active = false;
                } catch (err: any) {
                    this.wait_round.active = false;
                    console.warn("获取排行榜失败:", err.code, err.message);
                }
                break;
            case LeaderboardType.Friends:
                this.rankList.node.active = false;
                this.wait_round.active = true;
                if (SDKInstance.isFacebookMiniGame()) {
                    try {
                        const connectedPlayers = await FBInstant.player.getConnectedPlayersAsync();
                        console.log("[getConnectedPlayersAsync]: 获取FB好友列表成功");
                        const userIds: string[] = [];
                        for (let i = 0; i < connectedPlayers.length; i++) {
                            const id = connectedPlayers[i].getID();
                            if (typeof id === 'object' && id !== null && 'id' in id) {
                                userIds.push(id.id);
                            } else {
                                userIds.push(id);
                            }
                        }
                        userIds.push(BaseDataManager.uuid);
                        console.log("connectedPlayers:", userIds);
                        try {
                            const friendsData = await RankDataManager.instance.getUserList(userIds);
                            console.log("好友榜数据:", friendsData);
                            this.wait_round.active = false;
                            this.renderFriendsList(friendsData);
                        } catch (err) {
                            this.wait_round.active = false;
                            console.warn("获取好友榜数据失败:", err);
                        }
                    } catch (err) {
                        this.wait_round.active = false;
                        console.warn("[getConnectedPlayersAsync]: 获取FB好友列表失败: ", err);
                    }
                } else {
                    const mockData: any[] = [];
                    for (let i = 0; i < 3; i++) {
                        mockData.push({
                            userId: i === 1 ? BaseDataManager.uuid : "" + i,
                            archive: {
                                nickname: "Player_" + (i + 1),
                                avatar: Utilsqdd.randomTwoNum(1, 11).toString(),
                                score: 10 - i
                            }
                        });
                    }
                    this.renderFriendsList(mockData);
                    this.wait_round.active = false;
                }
                break;
            case LeaderboardType.Weekly:
                this.rankList.node.active = false;
                this.dailyRankList.node.active = false;
                this.wait_round.active = true;
                try {
                    const data = await RankDataManager.instance.fetchActivityRankingList(ActivityType.WEEKLY_RANK);
                    console.log("周排行榜数据:", data);
                    if (data.myRanking) {
                        this.myWeeklyRanking = data.myRanking;
                    }
                    this.renderWeeklyList(data.userInfos);
                    this.wait_round.active = false;
                } catch (err: any) {
                    this.wait_round.active = false;
                    console.warn("获取周排行榜失败:", err.code, err.message);
                }
                break;
            case LeaderboardType.Daily:
                this.weeklyRankList.node.active = false;
                this.rankList.node.active = false;
                this.wait_round.active = true;
                try {
                    const data = await RankDataManager.instance.fetchActivityRankingList(ActivityType.DAILY_RANK);
                    console.log("日排行榜数据:", data);
                    if (data.myRanking) {
                        this.myDailyRanking = data.myRanking;
                    }
                    this.renderDailyList(data.userInfos);
                    this.wait_round.active = false;
                } catch (err: any) {
                    this.wait_round.active = false;
                    console.warn("获取日排行榜失败:", err.code, err.message);
                }
                break;
        }
    }

    renderGlobalList(data: any[]) {
        if (data && data.length > 0) {
            this.myRankItem.node.active = true;
            this.isInitGolbal = true;
            this.globalList = data;
            this.renderGobalVirtual(data, true);
            if (Global.NEZPRankFriend) {
                Global.NEZPRankFriend.style.display = "none";
            }
            this.friendsRankList.node.active = false;
            this.friendsContent.parent.parent.active = false;
        }
    }

    renderGobalVirtual(data: any[], useVirtual: boolean = false) {
        this.rankList.node.active = true;
        this.content.parent.parent.active = false;
        this.rankList.renderItemFn = (itemNode: Node, index: number) => {
            const rankItem = itemNode.getComponent(RankItem);
            let isMyRanking = false;
            if (SDKInstance.isFacebookMiniGame()) {
                isMyRanking = data[index].userId === BaseDataManager.uuid;
            } else {
                isMyRanking = data[index].extendsInfo.rank === this.myGlobalRanking;
            }
            if (isMyRanking) {
                this.myGlobalScore = data[index]?.scores[0];
            }
            rankItem.init(data[index], index + 1, isMyRanking, false);
        };
        this.rankList.refreshList(data);
        if (useVirtual) {
            this.renderMyData(data, false);
        }
    }

    renderGobalScrollView(data: any[]) {
        this.rankList.node.active = false;
        this.content.parent.parent.active = true;
        CCExtends.DestroyNodeAllChildren(this.content);
        for (let i = 0; i < data.length; i++) {
            const itemNode = instantiate(this.rankPre);
            itemNode.parent = this.content;
            const rankItem = itemNode.getComponent(RankItem);
            rankItem.init(data[i], i + 1, data[i].userId === BaseDataManager.uuid, true);
            let userId = data[i].userId;
            if (userId.length < 17) {
                userId = "";
            }
            this.setNEZPItemData(1, itemNode, i, userId, data[i].extendsInfo.nickname, i === data.length - 1);
            rankItem.waitNode.active = true;
            tween(rankItem.waitNode).by(1, { angle: 360 }).repeatForever().start();
        }
        this.renderMyData(data, true);
    }

    renderMyData(data: any[], useOverlay: boolean) {
        if (useOverlay) {
            this.scheduleOnce(() => {
                this.renderMyDataOverlayView();
            }, 0.1);
        }
        if (SDKInstance.isFacebookMiniGame()) {
            const myIndex = data.findIndex((item: any) => item.userId === BaseDataManager.uuid);
            if (myIndex > -1) {
                this.myRankItem.init(data[myIndex], myIndex + 1, true, useOverlay);
                this.myGlobalRanking = myIndex + 1;
            } else {
                const recorder = GameRecord.GetInstance().BaseRecorder;
                const level = recorder.Data.CurLevel - 1;
                const tier = recorder.Data.TierData ? recorder.Data.TierData.tier : 0;
                const myData = {
                    userId: BaseDataManager.uuid,
                    scores: [level],
                    extendsInfo: {
                        nickname: BaseDataManager.nickName,
                        avatar: BaseDataManager.userAvatar,
                        title: tier
                    }
                };
                this.myRankItem.init(myData, "100+", true, useOverlay);
                this.myGlobalRanking = "100+";
            }
        } else if (this.myGlobalRanking) {
            const myRankData = data.find((item: any) => item.extendsInfo.rank === this.myGlobalRanking);
            if (myRankData) {
                this.myRankItem.init(myRankData, this.myGlobalRanking, true, useOverlay);
            } else {
                const recorder = GameRecord.GetInstance().BaseRecorder;
                const level = recorder.Data.CurLevel - 1;
                const tier = recorder.Data.TierData ? recorder.Data.TierData.tier : 0;
                const myData = {
                    userId: BaseDataManager.uuid,
                    scores: [level],
                    extendsInfo: {
                        nickname: BaseDataManager.nickName,
                        avatar: BaseDataManager.userAvatar,
                        title: tier
                    }
                };
                this.myRankItem.init(myData, "100+", true, useOverlay);
            }
        } else {
            const recorder = GameRecord.GetInstance().BaseRecorder;
            const level = recorder.Data.CurLevel - 1;
            const tier = recorder.Data.TierData ? recorder.Data.TierData.tier : 0;
            const myData = {
                userId: BaseDataManager.uuid,
                scores: [level],
                extendsInfo: {
                    nickname: BaseDataManager.nickName,
                    avatar: BaseDataManager.userAvatar,
                    title: tier
                }
            };
            this.myRankItem.init(myData, "100+", true, useOverlay);
            this.myGlobalRanking = "100+";
        }
    }

    updateMyRanking() {
        const recorder = GameRecord.GetInstance().BaseRecorder;
        const tier = recorder.Data.TierData ? recorder.Data.TierData.tier : 0;
        switch (this._selectType) {
            case LeaderboardType.Global:
                this.myRankItem.updateMyRanking(this.myGlobalRanking, this.myGlobalScore, tier);
                break;
            case LeaderboardType.Friends:
                this.myRankItem.updateMyRanking(this.myFriendRanking, null, tier);
                break;
            case LeaderboardType.Weekly:
                this.myRankItem.updateMyRanking(this.myWeeklyRanking, this.myWeeklyScore, tier);
                break;
            case LeaderboardType.Daily:
                this.myRankItem.updateMyRanking(this.myDailyRanking, this.myDailyScore, tier);
                break;
        }
    }

    renderFriendsList(data: any[]) {
        if (data && data.length > 0) {
            this.isInitFriends = true;
            this.renderFriendsVirtual(data);
            if (Global.NEZPRankGlobal) {
                Global.NEZPRankGlobal.style.display = "none";
            }
            this.rankList.node.active = false;
            this.content.parent.parent.active = false;
        }
    }

    renderFriendsVirtual(data: any[]) {
        this.friendsRankList.node.active = true;
        this.friendsContent.parent.parent.active = false;
        this.friendsRankList.renderItemFn = (itemNode: Node, index: number) => {
            const friendItem = itemNode.getComponent(FriendRankItem);
            friendItem.init(data[index], index + 1, data[index].userId === BaseDataManager.uuid, false);
            if (data[index].userId === BaseDataManager.uuid) {
                this.myFriendRanking = index + 1;
                this.updateMyRanking();
            }
        };
        this.friendsRankList.refreshList(data);
    }

    renderFriendsScrollView(data: any[]) {
        this.friendsRankList.node.active = false;
        this.friendsContent.parent.parent.active = true;
        CCExtends.DestroyNodeAllChildren(this.friendsContent);
        for (let i = 0; i < data.length; i++) {
            const itemNode = instantiate(this.friendRankPre);
            itemNode.parent = this.friendsContent;
            const friendItem = itemNode.getComponent(FriendRankItem);
            friendItem.init(data[i], i + 1, data[i].userId === BaseDataManager.uuid, true);
            if (data[i].userId === BaseDataManager.uuid) {
                this.myFriendRanking = i + 1;
                this.updateMyRanking();
            }
            let userId = data[i].userId;
            if (userId.length < 17) {
                userId = "";
            }
            this.setNEZPItemData(2, itemNode, i, userId, data[i].archive.nickname, i === data.length - 1);
            friendItem.waitNode.active = true;
            tween(friendItem.waitNode).by(1, { angle: 360 }).repeatForever().start();
        }
    }

    renderWeeklyList(data: any[]) {
        if (data && data.length > 0) {
            this.myRankItem.node.active = true;
            this.isInitWeekly = true;
            this.weeklyRankList.node.active = true;
            this.weeklyRankList.renderItemFn = (itemNode: Node, index: number) => {
                const rankItem = itemNode.getComponent(RankItem);
                const isMyRanking = data[index].extendsInfo.rank === this.myWeeklyRanking;
                if (isMyRanking) {
                    this.myWeeklyScore = data[index]?.scores[0];
                    this.updateMyRanking();
                }
                rankItem.init(data[index], index + 1, isMyRanking, false);
            };
            this.weeklyRankList.refreshList(data);
        }
    }

    renderDailyList(data: any[]) {
        if (data && data.length > 0) {
            this.myRankItem.node.active = true;
            this.isInitDaily = true;
            this.dailyRankList.node.active = true;
            this.dailyRankList.renderItemFn = (itemNode: Node, index: number) => {
                const rankItem = itemNode.getComponent(RankItem);
                const isMyRanking = data[index].extendsInfo.rank === this.myDailyRanking;
                if (isMyRanking) {
                    this.myDailyScore = data[index]?.scores[0];
                    this.updateMyRanking();
                }
                rankItem.init(data[index], index + 1, isMyRanking, false);
            };
            this.dailyRankList.refreshList(data);
        }
    }

    OnEvent(event: any) {}

    OnHide() {
        this.hideZero();
        this.isShow = false;
        this._selectType = LeaderboardType.Global;
        this.isInitFriends = false;
        this.isInitWeekly = false;
        this.isInitDaily = false;
        this.nezpGlobalData = { players: [] };
        this.nezpFriendsData = { players: [] };
        this.topTab.node.off(TabContainer.Event.TAB_CHANGE, this.onTypeChange, this);
        this.topTabWx.node.off(TabContainer.Event.TAB_CHANGE, this.onTypeChange, this);
    }

    onInviteClick() {
        AudioUtils.btn_click_sound();
        SDKInstance.invite();
    }

    initNEZPContainer() {
        if (SDKInstance.isFacebookMiniGame() && this.nezpRankListContainer.length === 0) {
            console.log("initNEZPContainer=======");
            this.nezpRankListContainer = [
                { id: "NEZPRankGlobal", element: Global.NEZPRankGlobal, referNode: this.referGlobalNode },
                { id: "NEZPRankFriend", element: Global.NEZPRankFriend, referNode: this.referFriendNode },
                { id: "NEZPRankMyData", element: Global.NEZPRankMyData, referNode: this.myRankItem.node }
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
                    const position = container.referNode.parent.getComponent(UITransform).convertToWorldSpaceAR(container.referNode.position);
                    position.y = visibleSize.height - position.y;
                    const offset = {
                        left: (position.x - container.referNode.getComponent(UITransform).width / 2) * NezpTools.staticDomRatio,
                        top: (position.y - container.referNode.getComponent(UITransform).height / 2) * NezpTools.staticDomRatio
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
            this.nezpMyData = {};
            this.nezpGlobalData = { players: [] };
            this.nezpFriendsData = { players: [] };
        }
    }

    syncContainerToGameConfig(id: string, element: any) {
        switch (id) {
            case "NEZPRankGlobal":
                Global.NEZPRankGlobal = element;
                break;
            case "NEZPRankFriend":
                Global.NEZPRankFriend = element;
                break;
            case "NEZPRankMyData":
                Global.NEZPRankMyData = element;
                break;
        }
    }

    renderMyDataOverlayView() {
        if (!SDKInstance.isFacebookMiniGame() || !this.isShow) return;
        console.log("renderMyDataOverlayView ======");
        const uuid = BaseDataManager.uuid;
        const boxHeight = this.nezpMyData.boxHeight;
        const boxHeight2 = this.nezpMyData.boxHeight;
        const imgWidth = this.nezpMyData.imgWidth;
        const imgHeight = this.nezpMyData.imgHeight;
        const imgLeft = this.nezpMyData.imgLeft;
        const imgTop = this.nezpMyData.imgTop;
        const nameWidth = this.nezpMyData.nameWidth;
        const nameHeight = this.nezpMyData.nameHeight;
        const nameLeft = this.nezpMyData.nameLeft;
        const nameTop = this.nezpMyData.nameTop;
        const fontSize = this.nezpMyData.fontSize;
        let xmlString = `
            <View>
                <View onTapEvent="SendGift_${uuid}" style="width: ${boxHeight}px;height: ${boxHeight2}px;box-sizing: border-box;position: relative;">
                    <Image src="{{FBInstant.players[${uuid}].photo}}"  style="position: absolute;left: ${imgLeft}px;top: ${imgTop}px; width: ${imgWidth}px; height: ${imgHeight}px;" className="profilePicture" />
                    <Text content="{{FBInstant.players[${uuid}].name}}" style="width: ${nameWidth}px;height: ${nameHeight}px;position: absolute;left: ${nameLeft}px;top: ${nameTop}px;font-size: ${fontSize}px;line-height: ${nameHeight}px;margin: 0px; color: rgb(255, 255, 255);white-space: nowrap;overflow: hidden;text-overflow: ellipsis;" className="playerName"/>
                </View>
            </View>
        `;
        if (uuid.length < 17 || uuid === "25415163034850301") {
            xmlString = `
                <View>
                    <View onTapEvent="SendGift_${uuid}" style="width: ${boxHeight}px;height: ${boxHeight2}px;box-sizing: border-box;position: relative;">
                        <Image src="default.png"  style="position: absolute;left: ${imgLeft}px;top: ${imgTop}px; width: ${imgWidth}px; height: ${imgHeight}px;" className="profilePicture" />
                        <Text content="${BaseDataManager.nickName}" style="width: ${nameWidth}px;height: ${nameHeight}px;position: absolute;left: ${nameLeft}px;top: ${nameTop}px;font-size: ${fontSize}px;line-height: ${nameHeight}px;margin: 0px; color: rgb(255, 255, 255);white-space: nowrap;overflow: hidden;text-overflow: ellipsis;" className="playerName"/>
                    </View>
                </View>
            `;
        }
        const visibleSize = view.getVisibleSize();
        if (this.nezpMyDataView) {
            if (this.nezpMyDataView && this.isShow) {
                Global.NEZPRankMyData.style.display = "block";
            }
            this.myRankItem.waitNode.active = false;
            return;
        }
        this.myRankItem.waitNode.active = true;
        tween(this.myRankItem.waitNode).by(1, { angle: 360 }).repeatForever().start();
        FBInstant.overlayViews.createOverlayViewWithXMLStringAsync(xmlString, Global.NEZPRankMyData, "", "overlayViews.css", this.nezpMyData, "")
            .then((view: any) => {
                this.nezpMyDataView = view;
                console.log("创建nezpMyDataView成功");
                if (this.nezpMyDataView) {
                    const iframeElement = this.nezpMyDataView.iframeElement;
                    if (iframeElement) {
                        iframeElement.style.width = "100%";
                        iframeElement.style.height = this.nezpMyData.boxHeight + "px";
                        iframeElement.style.position = "absolute";
                        iframeElement.style.left = "0px";
                        iframeElement.style.top = "0px";
                        iframeElement.style.pointerEvents = "none";
                        iframeElement.style.border = "none";
                        iframeElement.style.outline = "none";
                        if (this.nezpMyDataView && this.isShow) {
                            Global.NEZPRankMyData.style.display = "block";
                            this.nezpMyDataView.showAsync();
                            const myPosition = this.myRankItem.node.parent.getComponent(UITransform).convertToWorldSpaceAR(this.myRankItem.node.position);
                            myPosition.y = visibleSize.height - myPosition.y;
                            const offset = {
                                left: (myPosition.x - this.myRankItem.node.getComponent(UITransform).width / 2) * NezpTools.staticDomRatio,
                                top: (myPosition.y - this.myRankItem.node.getComponent(UITransform).height / 2) * NezpTools.staticDomRatio
                            };
                            Global.NEZPRankMyData.style.left = offset.left + "px";
                            Global.NEZPRankMyData.style.top = offset.top + "px";
                        }
                        this.myRankItem.waitNode.active = false;
                    }
                }
            })
            .catch((err: any) => {
                this.renderMyData(this.globalList, true);
                this.myRankItem.waitNode.active = false;
                console.error("创建nezpMyDataView失败：", err);
            });
    }

    setNEZPItemData(type: number, itemNode: Node, index: number, playerId: string, playerName: string, isLast: boolean) {
        if (!SDKInstance.isFacebookMiniGame()) return;
        const data = {
            playerID: playerId,
            playerName: playerName,
            boxWidth: 968 * NezpTools.staticDomRatio,
            boxHeight: 169 * NezpTools.staticDomRatio,
            boxMarginBottom: 30 * NezpTools.staticDomRatio,
            imgWidth: 136 * NezpTools.staticDomRatio,
            imgHeight: 136 * NezpTools.staticDomRatio,
            imgLeft: 137 * NezpTools.staticDomRatio,
            imgTop: 16 * NezpTools.staticDomRatio,
            nameWidth: 405 * NezpTools.staticDomRatio,
            nameHeight: 80 * NezpTools.staticDomRatio,
            nameLeft: 305 * NezpTools.staticDomRatio,
            nameTop: 45 * NezpTools.staticDomRatio,
            fontSize: 50 * NezpTools.staticDomRatio
        };
        if (type === 1) {
            this.nezpGlobalData.players.push(data);
            if (index === 0) {
                this.globalIframeReferNode = itemNode;
            }
            if (isLast) {
                this.scheduleOnce(() => {
                    console.log("this.nezpGlobalData >>> ", this.nezpGlobalData);
                    this.renderGlobalOverlayView();
                }, 0.1);
            }
        } else if (type === 2) {
            this.nezpFriendsData.players.push(data);
            if (index === 0) {
                this.friendsIframeReferNode = itemNode;
            }
            if (isLast) {
                this.scheduleOnce(() => {
                    console.log("this.nezpFriendsData >>> ", this.nezpFriendsData);
                    this.renederFriendsOverlayView();
                }, 0.1);
            }
        }
    }

    renderGlobalOverlayView() {
        if (this.nezpGlobalData.players.length === 0 || !this.isShow) return;
        this.nezpGlobalData.players.slice(0, 100).forEach((player: any) => {
            player.playerID;
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
            player.playerName;
        });
        console.log("renderGlobalOverlayView>>> ");
        if (this.nezpGlobalView) {
            console.log("nezpGlobalView updateAsync OverlayView start ");
            Global.NEZPRankGlobal.querySelectorAll("iframe").forEach((iframe: any) => iframe.remove());
        }
        console.log("创建global overlayview视图start");
        FBInstant.overlayViews.createOverlayViewAsync("rankIframe.xml", Global.NEZPRankGlobal, "", "overlayViews.css", this.nezpGlobalData)
            .then((view: any) => {
                this.nezpGlobalView = view;
                if (this.nezpGlobalView) {
                    const iframeElement = this.nezpGlobalView.iframeElement;
                    iframeElement.style.width = "10000px";
                    iframeElement.style.height = "20000px";
                    iframeElement.style.position = "absolute";
                    iframeElement.style.pointerEvents = "none";
                    iframeElement.style.border = "none";
                    iframeElement.style.outline = "none";
                    iframeElement.style.background = "transparent";
                }
                this.scheduleOnce(() => {
                    if (Global.NEZPRankGlobal && this.isShow) {
                        Global.NEZPRankGlobal.style.display = "block";
                    }
                    if (this.isShow && this.nezpGlobalView) {
                        this.nezpGlobalView.showAsync();
                    }
                    this.canUpdateIframe = true;
                    this.content.children.forEach((child: Node) => {
                        const rankItem = child.getComponent(RankItem);
                        if (rankItem.waitNode && rankItem.waitNode.isValid) {
                            rankItem.waitNode.active = false;
                        }
                    });
                }, 0.5);
            })
            .catch((err: any) => {
                console.error("创建global overlayview视图失败：", err);
                this.renderGobalVirtual(this.globalList, false);
                this.content.children.forEach((child: Node) => {
                    const rankItem = child.getComponent(RankItem);
                    if (rankItem.waitNode && rankItem.waitNode.isValid) {
                        rankItem.waitNode.active = false;
                    }
                });
            });
    }

    renederFriendsOverlayView() {
        if (this.nezpFriendsData.players.length === 0 || !this.isShow) return;
        const boxHeight = this.nezpMyData.boxHeight;
        const boxHeight2 = this.nezpMyData.boxHeight;
        const imgWidth = this.nezpMyData.imgWidth;
        const imgHeight = this.nezpMyData.imgHeight;
        const imgLeft = this.nezpMyData.imgLeft;
        const imgTop = this.nezpMyData.imgTop;
        const nameWidth = this.nezpMyData.nameWidth;
        const nameHeight = this.nezpMyData.nameHeight;
        const nameLeft = this.nezpMyData.nameLeft;
        const nameTop = this.nezpMyData.nameTop;
        const fontSize = this.nezpMyData.fontSize;
        let xmlString = "";
        this.nezpFriendsData.players.slice(0, 100).forEach((player: any) => {
            const playerId = player.playerID;
            if (playerId.length < 17 || playerId === "25415163034850301") {
                xmlString += `<View onTapEvent="SendGift_${playerId}" style="width: ${boxHeight}px;height: ${boxHeight2}px;box-sizing: border-box;margin-bottom: ${player.boxMarginBottom}px;position: relative;">
                    <Image src="default.png"  style="position: absolute;left: ${imgLeft}px;top: ${imgTop}px; width: ${imgWidth}px; height: ${imgHeight}px;" className="profilePicture" />
                    <Text content="${player.playerName}" style="width: ${nameWidth}px;height: ${nameHeight}px;position: absolute;left: ${nameLeft}px;top: ${nameTop}px;font-size: ${fontSize}px;line-height: ${nameHeight}px;margin: 0px; color: rgb(255, 255, 255);white-space: nowrap;overflow: hidden;text-overflow: ellipsis;" className="playerName"/></View>`;
            } else {
                xmlString += `<View onTapEvent="SendGift_${playerId}" style="width: ${boxHeight}px;height: ${boxHeight2}px;box-sizing: border-box;margin-bottom: ${player.boxMarginBottom}px;position: relative;">
                    <Image src="{{FBInstant.players[${playerId}].photo}}"  style="position: absolute;left: ${imgLeft}px;top: ${imgTop}px; width: ${imgWidth}px; height: ${imgHeight}px;" className="profilePicture" />
                    <Text content="{{FBInstant.players[${playerId}].name}}" style="width: ${nameWidth}px;height: ${nameHeight}px;position: absolute;left: ${nameLeft}px;top: ${nameTop}px;font-size: ${fontSize}px;line-height: ${nameHeight}px;margin: 0px; color: rgb(255, 255, 255);white-space: nowrap;overflow: hidden;text-overflow: ellipsis;" className="playerName"/></View>`;
            }
        });
        const fullXml = "<View>" + xmlString + "</View>";
        if (this.nezpFriendsView) {
            console.log("nezpFriendsView updateAsync OverlayView start ");
            Global.NEZPRankFriend.querySelectorAll("iframe").forEach((iframe: any) => iframe.remove());
        }
        console.log("创建friends overlayview视图start");
        FBInstant.overlayViews.createOverlayViewWithXMLStringAsync(fullXml, Global.NEZPRankFriend, "", "overlayViews.css", this.nezpFriendsData)
            .then((view: any) => {
                this.nezpFriendsView = view;
                console.log("创建friends overlayview视图成功");
                if (this.nezpFriendsView) {
                    const iframeElement = this.nezpFriendsView.iframeElement;
                    iframeElement.style.width = "10000px";
                    iframeElement.style.height = "20000px";
                    iframeElement.style.position = "absolute";
                    iframeElement.style.pointerEvents = "none";
                    iframeElement.style.border = "none";
                    iframeElement.style.outline = "none";
                    iframeElement.style.background = "transparent";
                }
                this.scheduleOnce(() => {
                    if (Global.NEZPRankFriend && this.isShow) {
                        Global.NEZPRankFriend.style.display = "block";
                    }
                    if (this.isShow && this.nezpFriendsView) {
                        this.nezpFriendsView.showAsync();
                    }
                    this.canUpdateIframe = true;
                    this.friendsContent.children.forEach((child: Node) => {
                        const friendItem = child.getComponent(FriendRankItem);
                        if (friendItem.waitNode && friendItem.waitNode.isValid) {
                            friendItem.waitNode.active = false;
                        }
                    });
                }, 0.5);
            })
            .catch((err: any) => {
                console.error("创建friends overlayview视图失败：", err);
                this.friendsContent.children.forEach((child: Node) => {
                    const friendItem = child.getComponent(FriendRankItem);
                    if (friendItem.waitNode && friendItem.waitNode.isValid) {
                        friendItem.waitNode.active = false;
                    }
                });
                this.renderFriendsVirtual(this.friendsList);
            });
    }

    updateIframeSite() {
        if (!this.canUpdateIframe) return;
        if (this.globalIframeReferNode && this.nezpGlobalView) {
            const position = this.globalIframeReferNode.parent.getComponent(UITransform).convertToWorldSpaceAR(this.globalIframeReferNode.position);
            const offsetY = (view.getVisibleSize().height - position.y) * NezpTools.staticDomRatio - Number(Global.NEZPRankGlobal.style.top.replace("px", "")) - 0.5 * this.nezpMyData.boxHeight;
            if (this.nezpGlobalView.iframeElement) {
                this.nezpGlobalView.iframeElement.style.position = "absolute";
                this.nezpGlobalView.iframeElement.style.left = "0px";
                this.nezpGlobalView.iframeElement.style.top = "0px";
                this.nezpGlobalView.iframeElement.style.willChange = "transform";
                this.nezpGlobalView.iframeElement.style.transform = `translate3d(0, ${offsetY}px, 0)`;
            }
        }
        if (this.friendsIframeReferNode && this.nezpFriendsView) {
            const position = this.friendsIframeReferNode.parent.getComponent(UITransform).convertToWorldSpaceAR(this.friendsIframeReferNode.position);
            const offsetY = (view.getVisibleSize().height - position.y) * NezpTools.staticDomRatio - Number(Global.NEZPRankFriend.style.top.replace("px", "")) - 0.5 * this.nezpMyData.boxHeight;
            if (this.nezpFriendsView.iframeElement) {
                this.nezpFriendsView.iframeElement.style.position = "absolute";
                this.nezpFriendsView.iframeElement.style.left = "0px";
                this.nezpFriendsView.iframeElement.style.top = "0px";
                this.nezpFriendsView.iframeElement.style.willChange = "transform";
                this.nezpFriendsView.iframeElement.style.transform = `translate3d(0, ${offsetY}px, 0)`;
            }
        }
    }

    lateUpdate() {}

    hideZero() {}

    tempShowOrHideOverlayView(event: any) {}
}