import { _decorator, Component, Label } from 'cc';
import { I18nManager } from './I18nManager';

const { ccclass, property } = _decorator;

@ccclass('I18nLabel')
export class I18nLabel extends Component {
    @property
    public key: string = '';

    public start(): void {
        const label = this.getComponent(Label);
        if (label) {
            if (this.key === '') {
                label.string = I18nManager.t(label.string);
            } else {
                label.string = I18nManager.t(this.key);
            }
        }
    }
}