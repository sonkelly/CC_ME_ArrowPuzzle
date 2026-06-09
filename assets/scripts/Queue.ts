export interface QueueOptions {
    delay?: number;
    timeout?: number;
}

interface QueueItem {
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

export class Queue {
    private timer: ReturnType<typeof setTimeout> | null = null;
    private waitingQueue: QueueItem[] = [];
    private delay: number = 0;
    private timeout: number = 10000;

    constructor(options?: QueueOptions) {
        const { delay = 0, timeout = 10000 } = options || {};
        this.delay = delay;
        this.timeout = timeout;
    }

    push(task: () => Promise<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.timer) {
                this.waitingQueue.push({ task, resolve, reject });
            } else {
                this.execute(task, resolve, reject);
            }
        });
    }

    private execute(
        task: () => Promise<any>,
        resolve: (value: any) => void,
        reject: (reason?: any) => void
    ): void {
        let isCompleted = false;
        let isDelayPassed = false;

        task().then((result: any) => {
            resolve(result);
            isCompleted = true;
            clearTimeout(this.timer!);
            this.timer = null;

            if (isDelayPassed) {
                this.next();
            }
        }).catch((err: any) => {
            reject(err);
            clearTimeout(this.timer!);
            this.timer = null;
            this.next();
        });

        // Timeout timer
        this.timer = setTimeout(() => {
            reject("超时"); // timeout
            this.timer = null;
            this.next();
        }, this.timeout);

        // Delay timer
        setTimeout(() => {
            if (isCompleted) {
                this.next();
            }
            isDelayPassed = true;
        }, this.delay);
    }

    private next(): void {
        const nextTask = this.waitingQueue.shift();
        if (nextTask) {
            this.execute(nextTask.task, nextTask.resolve, nextTask.reject);
        }
    }

    clear(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.waitingQueue = [];
    }
}