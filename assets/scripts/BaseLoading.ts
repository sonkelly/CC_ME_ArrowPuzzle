import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

export class PreloadCreateInfo {
    public Num: number = 0;
}

@ccclass('BaseLoading')
export class BaseLoading extends Component {
    public async load_all_res(): Promise<null> {
        return Promise.resolve(null);
    }

    public preload(): void {
        // Empty implementation
    }

    public async load_all_asset(): Promise<void> {
        // Empty implementation
    }

    public create_node(param1: any, param2: any, param3: any): void {
        // Empty implementation
    }
}