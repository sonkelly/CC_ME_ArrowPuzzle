import { _decorator, Component, AudioClip, AudioSource, CCString, Enum, game } from 'cc';
import { GameLocalStorage } from './GameLocalStorage';
import { GameAssetManager } from './GameAssetManager';
import { CCExtends } from './CCExtends';
import { Utilsqdd } from './Utils/Utilsqdd';
import { SettingToggleEnum } from './GlobalEnum';

const { ccclass, property } = _decorator;

class SoundClip {
    @property(CCString)
    name: string = '';

    @property({
        type: Enum(SettingToggleEnum)
    })
    type: SettingToggleEnum = SettingToggleEnum.Effect;

    @property(AudioClip)
    clip: AudioClip | null = null;
}

@ccclass('AudioManager')
class AudioManager extends Component {
    public static instance: AudioManager | null = null;

    @property([SoundClip])
    mount_clips: SoundClip[] = [];

    private bgm_sound: AudioSource | null = null;
    private effectIndex: number = 0;
    private arrEffectSound: AudioSource[] = [];
    private loopEffectSound: AudioSource | null = null;
    private current_index: number = 0;
    private effect_play_num_invoke: number = 0;
    private effect_play_num_succ: number = 0;
    private innerAudioContextConst: any = null;
    private innerAudioContextConstEffectArr: any[] = [];
    private bgm_is_open: boolean = true;
    private effect_is_open: boolean = true;
    private bgm_volume: number = 1;
    private effect_volume: number = 1;
    private current_bgm_info: { name: string; loop: boolean; bundleName: string } | null = null;

    onLoad(): void {
        if (AudioManager.instance) {
            AudioManager.instance.mount_clips = this.mount_clips;
            this.node.destroy();
            return;
        }
        AudioManager.instance = this;
        game.addPersistRootNode(this.node);
        this.updateIsOpen(true);
        this.init();
    }

    async updateIsOpen(isFirst: boolean = false): Promise<void> {
        /*if (SDKInstance.isFacebookMiniGame()) {
            if (isFirst) {
                await GameLocalStorage.synItem();
            }
            this.bgm_is_open = Number(GameLocalStorage.getItem('last_setting_music_bg') || 0) === 1;
        } else {
            this.bgm_is_open = Number(GameLocalStorage.getItem('last_setting_music_bg') || 1) === 1;
        }
        */
        this.bgm_is_open = Number(GameLocalStorage.getItem('last_setting_music_bg') || 1) === 1;

        this.effect_is_open = Number(GameLocalStorage.getItem('last_setting_music_effect') || 1) === 1;
        this.bgm_volume = GameLocalStorage.getItem('last_setting_music_volume');
        if (Utilsqdd.isNil(this.bgm_volume)) {
            this.bgm_volume = 1;
        }
        this.effect_volume = GameLocalStorage.getItem('last_setting_effect_volume');
        if (Utilsqdd.isNil(this.effect_volume)) {
            this.effect_volume = 1;
        }
    }

    init(): void {
        if (!this.bgm_sound) {
            this.bgm_sound = this.node.addComponent(AudioSource);
            if (SDKInstance.isWxPlatform()) {
                wx.onAudioInterruptionEnd(() => {
                    console.log('onAudioInterruptionEnd=======');
                    this.resume_bgm();
                });
            }
        }

        if (this.arrEffectSound.length < 9) {
            for (let i = 0; i < 9; i++) {
                const effectSound = this.node.addComponent(AudioSource);
                effectSound.playOnAwake = false;
                effectSound.volume = this.effect_volume;
                this.arrEffectSound.push(effectSound);
            }
        }

        this.loopEffectSound = this.node.addComponent(AudioSource);
        this.loopEffectSound.playOnAwake = false;
        this.loopEffectSound.volume = this.effect_volume;
    }

    set_swtich(type: SettingToggleEnum, isOpen: boolean): void {
        switch (type) {
            case SettingToggleEnum.BGM:
                if (isOpen) {
                    this.resume_bgm();
                } else {
                    this.stop_bgm();
                }
                break;
            case SettingToggleEnum.Effect:
                if (!isOpen) {
                    this.stop_all_effect();
                }
                break;
        }
    }

    async load_and_play_bgm(name: string, loop: boolean, bundleName: string, isLoad: boolean = true): Promise<void> {
        if (!name) return;

        this.current_bgm_info = {
            name: name,
            loop: loop,
            bundleName: bundleName
        };

        if (bundleName) {
            if (isLoad) {
                const clip = await GameAssetManager.loadAsset(bundleName, name, AudioClip);
                this.play_bgm(clip, loop);
            } else {
                const clip = GameAssetManager.getAsset(bundleName, name);
                if (clip) {
                    this.play_bgm(clip, loop);
                } else {
                    GameAssetManager.loadAsset(bundleName, name, AudioClip);
                }
            }
        } else {
            const clip = this.get_mount_clip(name);
            if (clip) {
                this.play_bgm(clip, loop);
            } else {
                console.log('未挂载 ' + name + ' 背景音乐,请添加传递 bundleName');
            }
        }
    }

    play_bgm(clip: AudioClip, loop: boolean = false): void {
        if (!this.bgm_is_open || !this.bgm_sound) return;
        if (this.bgm_sound.clip === clip) return;

        CCExtends.StopAudio(this.bgm_sound);
        this.bgm_sound.clip = clip;
        this.bgm_sound.loop = loop;
        this.bgm_sound.volume = this.bgm_volume;
        if (this.bgm_sound.clip) {
            this.bgm_sound.play();
        }
    }

    resume_bgm(): void {
        if (!this.bgm_is_open) return;

        console.log('resume_bgm====');
        if (this.bgm_sound?.clip) {
            if (this.bgm_is_open && this.bgm_sound.clip) {
                this.bgm_sound.play();
            }
        } else if (this.current_bgm_info) {
            this.load_and_play_bgm(
                this.current_bgm_info.name,
                this.current_bgm_info.loop,
                this.current_bgm_info.bundleName
            );
        }
    }

    stop_bgm(): void {
        console.log('stop_bgm====');
        if (this.bgm_sound?.clip) {
            this.bgm_sound.pause();
            this.bgm_sound.clip = null;
        }
    }

    async load_and_play_effect(name: string, loop: boolean, bundleName: string, isLoad: boolean = true): Promise<void> {
        if (!name) return;

        if (bundleName) {
            if (isLoad) {
                const clip = await GameAssetManager.loadAsset(bundleName, name, AudioClip);
                this.play_effect(clip, loop);
            } else {
                const clip = GameAssetManager.getAsset(bundleName, name);
                if (clip) {
                    this.play_effect(clip, loop);
                } else {
                    GameAssetManager.loadAsset(bundleName, name, AudioClip);
                }
            }
        } else {
            const clip = this.get_mount_clip(name);
            if (clip) {
                this.play_effect(clip, loop);
            } else {
                console.log('未挂载 ' + name + ' 音效,请添加传递 bundleName');
            }
        }
    }

    play_effect(clip: AudioClip, loop: boolean = false): void {
        if (!this.effect_is_open) return;

        this.effect_play_num_invoke++;
        if (clip == null || !clip.isValid) return;

        if (loop) {
            if (this.loopEffectSound) {
                this.loopEffectSound.playOnAwake = false;
                this.loopEffectSound.clip = clip;
                this.loopEffectSound.volume = this.effect_volume;
                this.loopEffectSound.play();
                this.loopEffectSound.loop = true;
            }
        } else {
            const index = this.effectIndex++ % this.arrEffectSound.length;
            const effectSound = this.arrEffectSound[index];
            effectSound.playOnAwake = false;
            effectSound.clip = clip;
            effectSound.volume = this.effect_volume;
            effectSound.play();
            effectSound.loop = false;
        }
        this.effect_play_num_succ++;
    }

    stop_effect(): void {
        this.stop_all_effect();
    }

    stop_all_effect(): void {
        for (let i = 0; i < this.arrEffectSound.length; i++) {
            CCExtends.StopAudio(this.arrEffectSound[i]);
        }
    }

    stop_loop_effect(): void {
        if (this.loopEffectSound) {
            CCExtends.StopAudio(this.loopEffectSound);
        }
    }

    pause_loop_effect(): void {
        if (this.loopEffectSound) {
            this.loopEffectSound.volume = 0;
        }
    }

    resume_loop_effect(): void {
        if (this.loopEffectSound) {
            this.loopEffectSound.volume = this.effect_volume;
        }
    }

    get_mount_clip(name: string): AudioClip | null {
        const clipData = this.mount_clips.find((item) => item.name === name);
        return clipData ? clipData.clip : null;
    }

    updateMusicVolum(volume: number): void {
        this.bgm_volume = volume;
        if (this.bgm_sound) {
            this.bgm_sound.volume = this.bgm_volume;
        }
    }

    updateEffectVolum(volume: number): void {
        this.effect_volume = volume;
        for (let i = 0; i < this.arrEffectSound.length; i++) {
            this.arrEffectSound[i].volume = this.effect_volume;
        }
    }
}

export { AudioManager, SoundClip };