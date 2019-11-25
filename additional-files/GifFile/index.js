const File=require("../../File");
const BlockAnalyst=require("./BlockAnalyst");



class GifFile extends File
{
    constructor(file)
    {
        super(file);
        this.blockAnalyst=new BlockAnalyst(this);
    }
    async scan()
    {
        this.properties=await this.stat();
        let buf=await this.readAt(0, 6);
        if (!/^GIF8[79]a$/.test(buf.toString("utf8")))
        {
            throw new Error("Not a gif file.");
        }
        this.version=buf.toString("utf8", 3);
        let logicalScreenDescriptor=await this.readAt(6, 7);
        this.width=logicalScreenDescriptor.readUInt16LE(0);
        this.height=logicalScreenDescriptor.readUInt16LE(2);
        this.backgroundColorIndex=logicalScreenDescriptor.readUInt8(5);
        this.pixelAspectRadio=logicalScreenDescriptor.readUInt8(6);
        let flags=logicalScreenDescriptor.readUInt8(4);
        this.globalColorTableFlag=(flags&0x80===0x80);
        this.colorResolution=flags&0x70;
        this.colorResolution>>=4;
        this.colorResolution+=1;
        this.sortFlag=flags&0x08===0x08;
        this.globalColorTableLength=(this.globalColorTableFlag?(2**((flags&0x07)+1)):0);
        let globalColorTable=await this.readAt(13, this.globalColorTableLength*3);
        this.globalColorTable=new Array;
        for (let i=0;i<globalColorTable.length;i+=3)
        {
            this.globalColorTable[i/3]=[globalColorTable.readUInt8(i), globalColorTable.readUInt8(i+1), globalColorTable.readUInt8(i+2)];
        }
        let segmentOffset=13+this.globalColorTableLength*3;
        let segments=new Array;
        do
        {
            let segment=await this.blockAnalyst.detect(segmentOffset);
            if (segment.type==="Unknown")
            {
                throw new Error("Unknown block detected");
            }
            segmentOffset+=segment.length;
            segments.push(segment);
        } while (segments.length>0 && segments[segments.length-1].type!=="GifTrailer");
        this.segments=segments;
    }

}

module.exports=GifFile;