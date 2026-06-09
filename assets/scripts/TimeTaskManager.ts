import { _decorator } from 'cc';

// Định nghĩa interface cho TimeTask
interface TimeTask {
    taskID: number;
    delay: number;
    isPause: boolean;
    destTime: number;
    curTime: number;
    callback: () => void;
    nameString: string;
}

// Hàm tạo TimeTask
function createTimeTask(
    callback: () => void,
    delay: number,
    destTime: number,
    curTime: number,
    taskID: number = -1,
    nameString: string = ""
): TimeTask {
    return {
        taskID: taskID,
        delay: delay,
        isPause: false,
        destTime: destTime,
        curTime: curTime,
        callback: callback,
        nameString: nameString
    };
}

export class TimeTaskManager {
    private static timeTaskArr: TimeTask[] = [];
    private static tempDelTimeArr: TimeTask[] = [];

    static update2(deltaTime: number): void {
        // Xóa các task đã được đánh dấu xóa
        if (this.tempDelTimeArr.length > 0) {
            for (let i = this.tempDelTimeArr.length - 1; i >= 0; i--) {
                this.removeElement(this.timeTaskArr, this.tempDelTimeArr[i]);
                this.removeElement(this.tempDelTimeArr, this.tempDelTimeArr[i]);
            }
        }

        // Cập nhật thời gian cho các task
        for (let i = this.timeTaskArr.length - 1; i >= 0; i--) {
            const task = this.timeTaskArr[i];
            
            if (!task.isPause) {
                task.curTime += deltaTime;
            }

            if (task.curTime >= task.destTime) {
                try {
                    task.callback();
                    this.removeElement(this.timeTaskArr, task);
                } catch (error) {
                    this.removeElement(this.timeTaskArr, task);
                    console.warn(error);
                }
            }
        }
    }

    private static removeElement(arr: any[], element: any): void {
        const index = arr.indexOf(element);
        if (index >= 0) {
            arr.splice(index, 1);
        }
    }

    static addTimeTask(callback: () => void, delay: number, taskID: number = -1): void {
        this.timeTaskArr.push(createTimeTask(callback, delay, delay, 0, taskID, ""));
    }

    static addTimeTaskWithString(callback: () => void, delay: number, nameString: string = ""): void {
        this.timeTaskArr.push(createTimeTask(callback, delay, delay, 0, -1, nameString));
    }

    static pauseTaskByID(taskID: number): void {
        for (let i = 0; i < this.timeTaskArr.length; i++) {
            const task = this.timeTaskArr[i];
            if (task.taskID === taskID) {
                task.isPause = true;
                break;
            }
        }
    }

    static pauseAllTask(): void {
        for (let i = 0; i < this.timeTaskArr.length; i++) {
            this.timeTaskArr[i].isPause = true;
        }
    }

    static continueAllTask(): void {
        for (let i = 0; i < this.timeTaskArr.length; i++) {
            this.timeTaskArr[i].isPause = false;
        }
    }

    static deleteTimeTaskByID(taskID: number): void {
        for (let i = 0; i < this.timeTaskArr.length; i++) {
            const task = this.timeTaskArr[i];
            if (task.taskID === taskID) {
                this.tempDelTimeArr.push(task);
            }
        }
    }

    static deleteTimeTaskByName(nameString: string): void {
        for (let i = 0; i < this.timeTaskArr.length; i++) {
            const task = this.timeTaskArr[i];
            if (task.nameString === nameString) {
                this.tempDelTimeArr.push(task);
            }
        }
    }

    static deleteAllTimeTask(): void {
        this.timeTaskArr = [];
        this.tempDelTimeArr = [];
    }
}