const fs=require("fs");

const File=require("./File");
const Window=require("./Window");




/**
 * @description open a file with specified type
 * @param {String} path File path
 * @param {File} manipulator File constructor
 * @async
 * @returns {File}
**/

async function open(path, manipulator=File)
{
    const file=await new Promise((resolve, reject)=>
    {
        fs.open(path, "r+", (err, file)=>
        {
            if (err)
            {
                return reject(err);
            }
            return resolve(file);
        });
    });
    const instance=new manipulator(file);
    await instance.scan();
    return instance;
}


module.exports={
    open,
    manipulators: {
        File,
        PngFile: require("./additional-files/PngFile")
    },
    windows: {
        Window
    }
};

