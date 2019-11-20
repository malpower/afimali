let lib=require("../");


async function start()
{
    let file=await lib.open("./package.json");
    let win=await file.openWindow(0, [5, 5]);
    await win.at(0, 0, 97);
    await file.save();
}


start();