import { _decorator } from 'cc';

export class LoadingProgressTracker {
    private tasks: Map<string, number> = new Map();

    public addTask(taskId: string): void {
        this.tasks.set(taskId, 0);
    }

    public updateTask(taskId: string, progress: number): void {
        if (this.tasks.has(taskId)) {
            this.tasks.set(taskId, Math.min(1, Math.max(0, progress)));
        }
    }

    public finishTask(taskId: string): void {
        this.tasks.set(taskId, 1);
    }

    public isAllFinished(): boolean {
        for (const progress of this.tasks.values()) {
            if (progress < 1) {
                return false;
            }
        }
        return true;
    }

    public get totalProgress(): number {
        if (this.tasks.size === 0) {
            return 100;
        }

        let totalProgress = 0;
        this.tasks.forEach((progress) => {
            totalProgress += progress;
        });

        return Math.floor((totalProgress / this.tasks.size) * 100);
    }
}