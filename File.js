const fs=require("fs");
const Window=require("./Window");
const privateStores=new WeakMap;
class File
{
    /**
     * 
     * @constructor
     * @param {Number} file File discriptor
     */
    constructor(file)
    {        
        let s={
            file,
            modificationHistory: new Array,
            modifications: new Map,
            closed: false
        };
        this.windowConstructor=Window;
        this.openedWindows=new Map;
        privateStores.set(this, s);
    }
    get closed()
    {
        return privateStores.get(this).closed;
    }
    stat()
    {
        return new Promise((resolve, reject)=>
        {
            fs.fstat(privateStores.get(this).file, (err, stats)=>
            {
                if (err)
                {
                    return reject(err);
                }
                resolve(stats);
            });
        });
    }
    generateWindowId(size, offset)
    {
        let id=`${JSON.stringify(size)}.${offset}`;
        return id;
    }
    /**
     * @returns {Buffer}
     */
    readAt(offset, length)
    {
        const file=privateStores.get(this).file;
        const buf=Buffer.alloc(length);
        return new Promise((resolve, reject)=>
        {
            fs.read(file, buf, 0, length, offset, (err, read)=>
            {
                if (err)
                {
                    return reject(err);
                }                
                resolve(buf.slice(0, read));
            });
        });
    }
    /**
     * @returns {Window}
     */
    openWindow(offset, winSize)
    {
        return new Promise((resolve, reject)=>
        {
            let windowId=this.generateWindowId(winSize, offset);
            let cached=this.openedWindows.get(windowId);
            if (cached)
            {
                cached.rc+=1;
                return cached;
            }
            let buff=Buffer.alloc(winSize[0]*winSize[1]);
            let file=privateStores.get(this).file;
            fs.read(file, buff, offset, winSize[0]*winSize[1], 0, (err, read, buf)=>
            {
                if (err)
                {
                    return reject(err);
                }
                const win=new this.windowConstructor(buf, winSize, offset, this);
                this.overwriteModifications2Window(win);
                win.id=windowId;
                win.rc=1;
                this.openedWindows.set(win.id, win);
                resolve(win);
            });
        });
    }
    /**
     * @private
     */
    async scan(){}
    /**
     * @private
     */
    async closeWindow(window)
    {
        let id=window.id;
        let cached=this.openedWindows.get(id);
        if (!cached)
        {
            return;
        }
        cached.rc-=1;
        if (cached.rc===0)
        {
            await cached._release();
            this.openedWindows.delete(id);
        }
    }
    /**
     * @private
     */
    modified(pos, ov, nv)
    {
        privateStores.get(this).modificationHistory.push({pos, ov, nv});
        privateStores.get(this).modifications.set(pos, nv);
    }
    /**
     * @private
     */
    overwriteModifications2Window(window)
    {
        let modifications=privateStores.get(this).modifications;
        for (let key of modifications.keys())
        {
            if (key>=window.offset && key<window.offset+window.size[0]*window.size[1])
            {
                window.buffer.writeUInt8(modifications.get(key), key-window.offset);
            }
        }
    }
    async undo(steps=1)
    {
        let modificationHistory=privateStores.get(this).modificationHistory;
        let modifications=privateStores.get(this).modifications;
        for (let i=0;i<steps;i++)
        {
            if (modificationHistory.length===0)
            {
                return;
            }
            let history=modificationHistory.pop();
            modifications.set(history.pos, history.ov);
        }
    }
    async save()
    {
        let jobs=new Array;
        let modifications=privateStores.get(this).modifications;
        const file=privateStores.get(this).file;
        for (let key of modifications.keys())
        {
            jobs.push(new Promise((resolve, reject)=>
            {
                fs.write(file, Buffer.from([modifications.get(key)]), key, 1, 0, (err)=>
                {
                    if (err)
                    {
                        return reject(err);
                    }
                    resolve();
                });
            }));
        }
        await Promise.all(jobs);
        privateStores.get(this).modifications=new Map;
        privateStores.get(this).modificationHistory=new Array;
    }
    async close()
    {
        let s=privateStores.get(this);
        if (s.closed)
        {
            return;
        }
        let file=privateStores.get(this).file;
        fs.close(file);
        s.closed=true;
    }
}

module.exports=File;