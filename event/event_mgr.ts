export class event_mgr
{
    private static inst:event_mgr;
    private listeners:any;          //Event_Name => cb[]

    private constructor()
    {
        this.listeners = {};
    }

    static get_inst():event_mgr
    {
        if(!this.inst)
        {
            this.inst = new event_mgr();
        }
        return this.inst;
    }

    fire(event:Event_Name, ...params:any[]):void
    {
        let cbs:any[] = this.listeners[event];
        if(!cbs)
        {
            return;
        }
        for(let i:number = 0, len:number = cbs.length; i < len; i += 2)
        {
            let cb:any = cbs[i];
            let host:any = cbs[i+1];
            cb.call(host, ...params);
        }
    }

    add(event:Event_Name, cb:Function, host:any = null):void
    {
        let cbs:any[] = this.listeners[event];
        if(!cbs)
        {
            this.listeners[event] = cbs = []; 
        }
        cbs.push(cb, host);
    }

    remove(event:Event_Name, cb:Function)
    {
        let cbs:any[] = this.listeners[event];
        if(!cbs)
        {
            return;
        }
        let index:number = cbs.indexOf(cb);
        if(index < 0)
        {
            cc.warn("event_mgr remove", event, ", but cb not exists!");
            return;
        }
        cbs.splice(index, 2);
    }

    clear()
    {
        for(let key in this.listeners)
        {
            this.listeners[key].length = 0;
        }
        this.listeners = {};
    }
}

/**事件名称定义*/
export const enum Event_Name {
    USER_INFO_UPDATE,
    PHONE_CHANGED,
    PHOTONAME_UPDATE,
    BALANCE_UPDATE,
    SYSTEM_NOTICE_UPDATED,
    PACK_ROOM_INFO_UPDATE,
}