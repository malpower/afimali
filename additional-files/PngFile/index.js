const File=require("../../File");
const Block=require("./Block");



class PngFile extends File
{
    constructor(file)
    {
        super(file);
    }
    async scan()
    {
        this.properties=await this.stat();
        const header=await this.readAt(0, 8);
        const pngFlag=[137, 80, 78, 71, 13, 10, 26, 10];
        for (let i=0;i<pngFlag.length;i++)
        {
            if (pngFlag[i]!==header[i])
            {
                throw new Error("Unrecognized file format");
            }
        }
        const ihdr=await this.readBlock(8);
        this.ihdr=ihdr;
        let offset=8;
        const index=new Map;
        while (offset<this.properties.size)
        {
            let blockInfo=await this.readAt(offset, 8);
            let blockSize=blockInfo.readUInt32BE(0);
            let blockType=blockInfo.toString("utf8", 4);
            index.set(offset, blockType);
            offset+=blockSize+12;
        }
        this.blockIndex=index;
    }
    async readBlock(beginAt)
    {
        let blockLength=await this.readAt(beginAt, 4);
        blockLength=blockLength.readUInt32BE(0);
        let block=await this.readAt(beginAt, blockLength+12);
        return new Block(block, beginAt);
    }

}

module.exports=PngFile;