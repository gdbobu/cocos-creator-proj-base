import {pool_mgr} from "../pool/pool_mgr"
import {handler, gen_handler} from "../utils"
import {POP_UI_BASE} from "./pop_ui_base"

export class pop_mgr
{
    private static inst:pop_mgr;
    private ui_cache:any;      //path => pop_ui

    private constructor()
    {
        this.ui_cache = {};
    }

    static get_inst():pop_mgr
    {
        if(!this.inst)
        {
            this.inst = new pop_mgr();
        }
        return this.inst;
    }

    private get_ui(path:string):pop_ui
    {
        let ui:pop_ui = this.ui_cache[path];
        if(!ui)
        {
            this.ui_cache[path] = ui = {node:null, is_show:false};
        }
        return ui;
    }

    clear()
    {
        this.ui_cache = {};    
    }

    is_show(path:string):boolean
    {
        let ui:pop_ui = this.ui_cache[path];
        return ui && ui.is_show;
    }

    show(path:string, ...params:any[]):void
    {
        let ui:pop_ui = this.get_ui(path);
        if(ui.is_show)
        {
            return;
        }
        ui.is_show = true;
        pool_mgr.get_inst().get_ui(path, gen_handler((node:cc.Node):void=>{
            if(!ui.is_show)
            {
                pool_mgr.get_inst().put_ui(path, node);
                return;
            }
            ui.node = node;
            cc.director.getScene().addChild(node);
            //调用show
            let ui_base:POP_UI_BASE = node.getComponent(POP_UI_BASE);
            ui_base.ui_name = path;
            ui_base.__show__(...params);
        }, this));
    }

    //关闭界面时不destroy，只是从父节点移除并缓存
    hide(path:string):void
    {
        let ui:pop_ui = this.ui_cache[path];
        if(!ui || !ui.is_show)
        {
            return;
        }
        this.ui_cache[path] = null;
        ui.is_show = false;
        pool_mgr.get_inst().put_ui(path, ui.node);
        //调用hide
        let ui_base:POP_UI_BASE = ui.node.getComponent(POP_UI_BASE);
        ui_base.__hide__();
    }
}

type pop_ui = {
    node:cc.Node;
    is_show:boolean;
}

//界面prefab路径配置, 相对于assets/resources目录
export const UI_CONFIG = {
    overlay_bg:"prefabs/pop_overlay_bg",
    add_node:"prefabs/panel_addnode",
    upgrade_node:"prefabs/panel_upgradenode",
    present:"prefabs/panel_present",
    cash:"prefabs/panel_cash",
    updatepwd:"prefabs/panel_updatepwd",
    bindcard:"prefabs/panel_bindcard",
    unbindcard:"prefabs/panel_unbindcard",
    node_choose_lv:"prefabs/panel_chooselv",
    transaction_list:"prefabs/panel_transaction",
    bind_phone:"prefabs/panel_bindphone",
    reset_pwd:"prefabs/panel_resetpwd",
    topicview:"prefabs/panel_topicview",
    topicadd:"prefabs/panel_topicadd",
    topics:"prefabs/panel_topics",
    msg_box:"prefabs/panel_msgbox",
    notice:"prefabs/panel_notice",
    trans_type:"prefabs/panel_transtype",
    head_list:"prefabs/panel_headlist",
    server_list:"prefabs/panel_serverlist",
    activecode:"prefabs/panel_activecode",
    seekuser:"prefabs/panel_seekuser",
    confirmed:"prefabs/panel_confirmed",
    confirm:"prefabs/panel_confirm",
}