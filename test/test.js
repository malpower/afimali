let lib=require("../");


async function start()
{
    let file=await lib.open("./test.gif", lib.manipulators.GifFile);
    console.log(file.version);
}


start();