import { _decorator, Node } from 'cc';
import { BasePanel } from './../BasePanel';
import { UIManager } from './../UIManager';
import { AudioUtils } from './../Utils/AudioUtils';
import { VirtualScrollView } from './../VScrollView';
import { TournamentWxMgr } from './../Tournament/TournamentWxMgr';
import { ToutFullRankItem } from './../Tournament/ToutFullRankItem';
import { BaseDataManager } from './../BaseDataManager';

const { ccclass, property } = _decorator;

@ccclass('TournamentFullRank')
export class TournamentFullRank extends BasePanel {
    @property(VirtualScrollView)
    private rankList: VirtualScrollView = null;

    @property(Node)
    private wait_round: Node = null;

    @property(ToutFullRankItem)
    private myRankItem: ToutFullRankItem = null;

    @property(Node)
    private tips: Node = null;

    public onShow(): void {
        this.init_view();
    }

    public addListen(): void {}

    public init_view(): void {}

    public setData(tournamentId: string): void {
        this.rankList.node.active = false;
        this.myRankItem.node.active = false;
        this.tips.active = false;

        if (tournamentId) {
            this.wait_round.active = true;
            TournamentWxMgr.instance.fetchFullRankingList(tournamentId)
                .then(async (rankData: any[]) => {
                    console.log("比赛" + tournamentId + "排行榜数据:", rankData);
                    this.rendeFullList(rankData);
                    this.wait_round.active = false;
                })
                .catch((error: any) => {
                    this.wait_round.active = false;
                    console.warn("获取排行榜失败:", error.code, error.message);
                });
        } else {
            this.tips.active = true;
        }
    }

    private rendeFullList(rankListData: any[]): void {
        if (rankListData && rankListData.length !== 0) {
            this.rankList.node.active = true;
            this.rankList.renderItemFn = (itemNode: Node, index: number) => {
                const rankItem = itemNode.getComponent(ToutFullRankItem);
                const isCurrentUser = rankListData[index].openid === BaseDataManager.uuid;
                rankItem.init(rankListData[index], index + 1, isCurrentUser);
            };
            this.rankList.refreshList(rankListData);
            this.myRankItem.node.active = true;

            const currentUserIndex = rankListData.findIndex((item: any) => {
                return item.openid === BaseDataManager.uuid;
            });

            if (currentUserIndex > -1) {
                this.myRankItem.init(rankListData[currentUserIndex], currentUserIndex + 1, true);
            } else {
                const defaultUserData = {
                    openid: BaseDataManager.uuid,
                    score: 0,
                    name: BaseDataManager.nickName,
                    avatar: BaseDataManager.userAvatar
                };
                this.myRankItem.init(defaultUserData, "100+", true);
            }
        } else {
            this.tips.active = true;
        }
    }

    public onCloseClick(): void {
        AudioUtils.btn_close_sound();
        UIManager.deleteNode("TournamentFullRank");
    }
}