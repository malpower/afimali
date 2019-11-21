
const contentResolvers=new Array;

contentResolvers["IHDR"]=(obj, chunk)=>
{
    obj.width=chunk.readUInt32BE(0);
    obj.height=chunk.readUInt32BE(4);
    obj.depth=chunk.readUInt8(8);
    obj.colorType=chunk.readUInt8(9);
    obj.compression=chunk.readUInt8(10);
    obj.filter=chunk.readUInt8(11);
    obj.interlace=chunk.readUInt8(12);
};

class PngBlock
{
    /**
     * @param blockBuffer {Buffer} block data
     * @param offset {Number} offset on file
     */
    constructor(blockBuffer, offset)
    {
        this.length=blockBuffer.readUInt32BE(0)+12;
        this.offset=offset;
        this.typeCode=blockBuffer.toString("utf8", 4, 8);
        this.content=blockBuffer.slice(8, this.length-4);
        this.crc=blockBuffer.slice(this.length-4);
        try
        {
            contentResolvers[this.typeCode](this, this.content);
        }
        catch (e)
        {
            console.log(e);
            console.error(`unrecognized block type '${this.typeCode}'`);
        }
    }
}

module.exports=PngBlock;