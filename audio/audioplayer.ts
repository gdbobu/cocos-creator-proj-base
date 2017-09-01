import {loader_mgr} from "../loader/loader_mgr"
import {gen_handler, handler} from "../utils"
import {TimerMgr} from "../timer/timer_mgr"
import * as format from "../../3rd/sprintfjs/format"

const MUSIC_PATH = "sounds/music/%s";
const SOUND_PATH = "sounds/sound/%s";

export class AudioPlayer
{
    private static inst:AudioPlayer;
    private music_source:cc.AudioSource;
    private curr_music:string;
    private sound_node:cc.Node;
    private sound_volume:number;
    private sound_mute:boolean;
    private sound_sources:cc.AudioSource[];
    private clip_cache:Map<string, cc.AudioClip>;

    private constructor()
    {
        this.sound_sources = [];
        this.clip_cache = new Map();
    }

    static getInst()
    {
        if(!this.inst)
        {
            this.inst = new AudioPlayer();
        }
        return this.inst;
    }

    init(music_source:cc.AudioSource, sound_node:cc.Node)
    {
        music_source.loop = true;
        music_source.playOnLoad = false;
        this.music_source = music_source;
        this.sound_node = sound_node;
    }
    
    //同时只能播放一个
    play_music(name:string)
    {
        let path = format.sprintf(MUSIC_PATH, name);
        if(this.curr_music == path)
        {
            return;
        }
        this.curr_music = path;

        let clip = this.clip_cache.get(path);
        if(clip)
        {
            this.play_clip(this.music_source, clip, AudioType.Music);
        }
        else
        {
            let task:AudioPlayTask = {path:path, source:this.music_source, type:AudioType.Music};
            loader_mgr.get_inst().loadRawAsset(path, gen_handler(this.on_clip_loaded, this, task));
        }
    }

    stop_music()
    {
        this.curr_music = null;
        this.music_source.stop();
    }

    set_music_mute(is_mute:boolean)
    {
        this.music_source.mute = is_mute;
    }

    //0~1
    set_music_volumn(volume:number)
    {
        this.music_source.volume = volume;
    }

    private on_clip_loaded(task:AudioPlayTask, clip:cc.AudioClip)
    {
        let path = task.path;
        let source = task.source;
        this.clip_cache.set(path, clip);
        if(task.type == AudioType.Music && path != this.curr_music)
        {
            return;
        }
        this.play_clip(source, clip, task.type);
    }

    private play_clip(source:cc.AudioSource, clip:cc.AudioClip, type:AudioType)
    {
        source.clip = clip;
        source.play();
        //sound播放完回收AudioSource
        if(type == AudioType.Sound)
        {
            TimerMgr.getInst().once(Math.ceil(source.getDuration()), gen_handler(() => {
                this.sound_sources.push(source);
            }, this));  
        }
    }

    //可同时播放多个
    play_sound(name:string)
    {
        if(this.sound_mute)
        {
            cc.info("sound is mute");
            return;
        }
        //get or create a idle audio_source
        let source = this.sound_sources.pop();
        if(!source)
        {
            source = this.sound_node.addComponent(cc.AudioSource);
            // cc.info("create sound audiosource");
        }
        source.loop = false;
        source.playOnLoad = false;
        source.volume = this.sound_volume != null ? this.sound_volume : 1;
        //load and play
        let path = format.sprintf(SOUND_PATH, name);
        let clip = this.clip_cache.get(path);
        if(clip)
        {
            this.play_clip(source, clip, AudioType.Sound);
        }
        else
        {
            let task:AudioPlayTask = {path:path, source:source, type:AudioType.Sound};
            loader_mgr.get_inst().loadRawAsset(path, gen_handler(this.on_clip_loaded, this, task));
        }
    }

    set_sound_mute(is_mute:boolean)
    {
        this.sound_mute = is_mute;
        this.sound_sources.forEach((asr) => {
            if(is_mute)
            {
                asr.stop();
            }
        });
    }

    //0~1
    set_sound_volumn(volume:number)
    {
        this.sound_volume = volume;
        this.sound_sources.forEach((asr) => {
            asr.volume = volume;
        });
    }

    stop_sound()
    {
        this.sound_sources.forEach((asr) => {
            asr.stop();
        });
    }

    clear_cache()
    {
        for(let clip of this.clip_cache.values())
        {
            loader_mgr.get_inst().release(clip);
        }
        this.clip_cache.clear();
    }
}

enum AudioType 
{
    Music = 1,
    Sound = 2,
}

type AudioPlayTask = {
    type:AudioType;
    path:string;
    source:cc.AudioSource;
}