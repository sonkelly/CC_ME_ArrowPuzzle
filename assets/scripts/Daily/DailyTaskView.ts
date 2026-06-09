import { _decorator, Component } from 'cc';
import { BasePanel } from './../BasePanel';
import { ModuleEventKey } from './../IGameRawData';
import { DailyTaskDataManager } from './DailyTaskDataManager';
import { DailyTaskState } from './DailyTaskRecorder';
import { GameRecord } from './../GameRecord';
import { EventManager } from './../Event/EventManager';
import { GameLogicConfig } from './../GameLogicConfig';
import { TimeCounter } from './../TimeCounter';
import { FlyEffectManager } from './../FlyEffectManager';
import { DailyTaskListItem } from './DailyTaskListItem';
import { VirtualScrollView } from './../VScrollView';
import { Toast } from './../Toast';
import { UIManager } from './../UIManager';
import { JsonClassStorage } from './../JsonClass';
import { I18nManager } from './../I18nManager';
import { AudioUtils } from './../Utils/AudioUtils';

const { ccclass, property } = _decorator;

@ccclass('DailyTaskView')
export class DailyTaskView extends BasePanel {
    @property(VirtualScrollView)
    public list: VirtualScrollView | null = null;

    @property(TimeCounter)
    public timeCounter: TimeCounter | null = null;

    public static flying: boolean = false;
    private _configs: any[] | null = null;

    public onShow(): void {
        EventManager.on(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.onDailyTaskComplete,
            this.updateDialog,
            this
        );
    }

    public onHide(): void {
        EventManager.off(
            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.onDailyTaskComplete,
            this.updateDialog
        );
    }

    public setData(data: any): void {
        this.updateDialog();
        if (data.checkAutoReceive) {
            this.scheduleOnce(() => {
                this.checkAutoReceive();
            }, 0.5);
        }
    }

    public updateDialog(): void {
        this.updateList();
        this.timeCounter!.setDuration(DailyTaskDataManager.getDailyTaskCounterTime());
        this.timeCounter!.startCount();
    }

    public checkAutoReceive(): void {
        const completeTasks = DailyTaskDataManager.getAllDailyTaskDataByState(DailyTaskState.COMPLETE);
        if (completeTasks.length > 0) {
            const rewards: { CfgId: number; Num: number }[] = [];
            for (let i = 0; i < completeTasks.length; i++) {
                const config = JsonClassStorage.instance.getConfig("TaskConfig", completeTasks[i]);
                if (config) {
                    rewards.push({
                        CfgId: config.goodsId,
                        Num: config.goodsNum
                    });
                }
            }
            UIManager.createPanel("game", "CommonRewardView", {
                showAnimation: true,
                openFuncion: () => {
                    if (rewards.length > 0) {
                        DailyTaskView.flying = true;
                    }
                },
                setData: {
                    title: I18nManager.t("Rewards"),
                    rewards: rewards,
                    cb: () => {
                        EventManager.emit(
                            GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.refreshDailyTask
                        );
                        this.updateList();
                        DailyTaskView.flying = false;
                    }
                }
            });
        }
    }

    public updateList(): void {
        const taskDatas = DailyTaskDataManager.getTodayDailyTaskDatas();
        const recorder = GameRecord.GetInstance().DailyTaskRecorder;
        
        taskDatas.sort((a: any, b: any) => {
            const dataA = recorder.getDailyTaskData(a.taskId);
            const dataB = recorder.getDailyTaskData(b.taskId);
            
            if (dataA.state === DailyTaskState.COMPLETE) {
                return dataB.state === DailyTaskState.COMPLETE ? dataA.taskId - dataB.taskId : -1;
            } else if (dataA.state === DailyTaskState.RECEIVED) {
                return (dataB.state === DailyTaskState.COMPLETE || dataB.state === DailyTaskState.UNCOMPLETE) ? 1 : dataA.taskId - dataB.taskId;
            } else {
                return dataB.state === DailyTaskState.COMPLETE ? 1 : dataB.state === DailyTaskState.RECEIVED ? -1 : dataA.taskId - dataB.taskId;
            }
        });

        if (this.list) {
            this._configs = taskDatas;
            this.list.renderItemFn = (itemNode: any, index: number) => {
                const component = itemNode?.getComponent(DailyTaskListItem);
                component?.init(this._configs![index]);
            };
            this.list.refreshList(this._configs);
            this.list.onItemClickFn = (itemNode: any, index: number) => {
                const component = itemNode?.getComponent(DailyTaskListItem);
                const taskData = GameRecord.GetInstance().DailyTaskRecorder.getDailyTaskData(component!._cfg.id);
                
                if (taskData.state === DailyTaskState.UNCOMPLETE) {
                    Toast.instance.tip_div("Task Incomplete");
                } else if (taskData.state === DailyTaskState.RECEIVED) {
                    Toast.instance.tip_div("Reward Claimed");
                } else {
                    EventManager.emit(
                        GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.receiveDailyTaskReward,
                        component!.data.taskId
                    );
                    this.onDailyTaskReceive(component!);
                    component!.updateState();
                }
            };
        }
    }

    public onDailyTaskReceive(item: DailyTaskListItem): void {
        this.flying = true;
        FlyEffectManager.instance.playFlyGoods(
            item.goods.goodsId,
            item.goods.goodsNum,
            item.goods.icon.node.worldPosition,
            {
                callback: () => {
                    DailyTaskView.flying = false;
                    EventManager.emit(
                        GameLogicConfig.event_conf.module_msg + "_" + ModuleEventKey.WantSaveRecordToNet,
                        [false]
                    );
                },
                flyNode: item.goods.icon.node
            }
        );
        this.updateList();
    }

    public onCloseClick(): void {
        AudioUtils.btn_click_sound();
        UIManager.deleteNode("DailyTaskView");
    }
}