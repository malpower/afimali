let lib=require("../");


async function start()
{
    let file=await lib.open("./test.png", lib.manipulators.PngFile);
    console.log(file);
}


start();