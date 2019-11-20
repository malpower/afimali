class Window
{
    constructor(buff=Buffer.alloc(0), size=[0, 0], offset=0, file)
    {
        this.buffer=buff;
        this.size=size;
        this.offset=offset;
        this.length=this.buffer.length;
        this.file=file;
        this.nulptr=Symbol();
    }
    async clone()
    {
        return new Window(this.buffer, this.size, this.offset);
    }
    async at(x, y, value=this.nulptr)
    {
        if (x>=this.size[0] || y>=this.size[1])
        {
            throw new Error(`Out of window @${x},${y}`);
        }
        let ov=this.buffer.readUInt8(x*y);
        if (value===this.nulptr)
        {
            return ov;
        }
        this.buffer.writeUInt8(value, x*y);
        this.file && this.file.modified(x*y+this.offset, ov, value);
    }
    async disassemble(...slices)
    {
        const buff=Buffer.alloc(0);
        for (let slice of slices)
        {
            if (slice[0]*slice[1]+slice[2]>=this.buffer.length)
            {
                throw new Error("Out of bouds");
            }
            buff=Buffer.concat([buff, this.buffer.slice(slice[0]*slice[1], slice[0]*slice[1]+slice[2])]);
        }
        return buff;
    }
    async _release()
    {
        //
    }
    async close()
    {
        this.file && (await this.file.closeWindow(this));
    }
}

module.exports=Window;