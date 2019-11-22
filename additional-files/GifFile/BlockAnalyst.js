const GifFile=require("./index");

class BaseSegment
{
    /**
     * @param file {GifFile} 
     */
    constructor(offset, file)
    {
        this.file=file;
        this.offset=offset;
    }
    async recognize()
    {
        this.type="Unknown";
        this.length=0;
    }
    async listBlocks(offset)
    {
        const blocks=new Array;
        do 
        {
            let buffer=await this.file.readAt(offset, 1);
            let blockLength=buffer.readUInt8(0);
            if (blockLength===0)
            {
                break;
            }
            blocks.push({offset: this.offset+offset, length: blockLength});
            offset+=1+blockLength;
        } while (blocks.length>0 && blocks[blocks.length-1].length>0);
        blocks.push({offset, length: 0});
        return blocks;
    }
}

class ImageDescriptor extends BaseSegment
{
    async recognize()
    {
        this.type="ImageDescriptor";
        let header=await this.file.readAt(this.offset, 10);
        this.x=header.readUInt16LE(1);
        this.y=header.readUInt16LE(3);
        this.width=header.readUInt16LE(5);
        this.height=header.readUInt16LE(7);
        let flag=header.readUInt8(9);
        this.localColorTableFlag=(flag&0x80===0x80);
        this.interlaceFlag=(flag&0x40===0x40);
        this.sortFlag=(flag&0x20===0x20);
        this.localColorTableLength=2**((flag&0x07)+1);
        if (this.localColorTableFlag===0)
        {
            this.localColorTableLength=0;
        }
        const lzwCodeOffset=this.offset+10+(this.localColorTableLength*3);
        let lzwCodeLength=await this.file.readAt(lzwCodeOffset, 1);
        this.lzwCodeLength=lzwCodeLength.readUInt8(0);
        this.blocks=await this.listBlocks(lzwCodeOffset+1);
        this.length=this.blocks.reduce((p, v)=>p+v.length+1, 0)+1+(3*this.localColorTableLength)+10;
    }
}

class ExtensionSegment extends BaseSegment
{
    async recognize()
    {
        this.type="Extension";
        let label=await this.file.readAt(this.offset+1, 1);
        this.label=label.readUInt8(0);
        switch (this.label)
        {
            case 0xf9:
                return await this.rGraphicControlExtension();
            case 0xfe:
                return await this.rCommentExtension();
            case 0x01:
                return await this.rPlainTextExtension();
            case 0xFF:
                return await this.rApplicationExtension();
            default:
                throw new Error("Unknown extension type");
        }
    }
    async rGraphicControlExtension()
    {
        this.labelText="GraphicControlLabel";
        let header=await this.file.readAt(this.offset+3, 4);
        let flag=header.readUInt8(0);
        this.disposalMethod=flag&0x1c;
        this.disposalMethod>>=2;
        this.userInputFlag=(flag&0x02===0x02);
        this.transparentColorFlag=(flag&1===1);
        this.delayTime=header.readUInt16LE(1);
        this.transparentColorIndex=header.readUInt8(3);
        this.length=8;
    }

    async rCommentExtension()
    {
        this.labelText="CommentLabel";
        let offset=2;
        this.blocks=await this.listBlocks(this.offset+offset);
        this.length=this.blocks.reduce((p, v)=>p+v.length, 0)+2;
    }
    async rPlainTextExtension()
    {
        this.labelText="PlainTextExtension";
        const header=await this.file.readAt(this.offset,  14);
        this.textGridLeftPosition=header.readUInt16LE(3);
        this.textGridTopPosition=header.readUInt16LE(5);
        this.textGridWidth=header.readUInt16LE(7);
        this.textGridHeight=header.readUInt16LE(9);
        this.characterCellWidth=header.readUInt8(11);
        this.characterCellHeight=header.readuInt8(12);
        this.textForegroundColorIndex=header.readUInt8(13);
        this.textBackgroundColorIndex=header.readUInt8(14);
        this.blocks=await this.listBlocks(this.offset+15);
        this.length=this.blocks.reduce((p, v)=>p+v.length, 0)+15+this.blocks.length;
    }
    async rApplicationExtension()
    {
        this.labelText="ApplicationExtension";
        const header=await this.file.readAt(this.offset, 14);
        this.applicationIdentifier=header.toString("utf8", 3, 11);
        this.applicationAuthenticationCode=header.toString("utf8", 11, 14);
        this.blocks=await this.listBlocks(this.offset+14);
        this.length=this.blocks.reduce((p, v)=>p+v.length, 0)+14+this.blocks.length;
    }

}


class GifTrailer extends BaseSegment
{
    async recognize()
    {
        this.length=1;
        this.type="GifTrailer";
    }
}



const typedSegmentConstructors=new Map;
typedSegmentConstructors.set(0x2c, ImageDescriptor);
typedSegmentConstructors.set(0x21, ExtensionSegment);
typedSegmentConstructors.set(0x3b, GifTrailer);





class BlockAnalyst
{
    constructor(file)
    {
        this.file=file;
    }
    async detect(offset)
    {
        let segmentType=await this.file.readAt(offset, 1);
        segmentType=segmentType.readUInt8(0);
        let cons=typedSegmentConstructors.get(segmentType);
        if (!cons)
        {
            throw new Error("Unknown block type");
        }
        let segment=new cons(offset, this.file);
        await segment.recognize();
        Reflect.deleteProperty(segment, "file");
        return segment;
    }
}

module.exports=BlockAnalyst;