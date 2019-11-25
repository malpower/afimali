# afimali
Another file manupulate library for nodeJS.

Please feel free to raise pull requests on github.

## Install

```bash
npm install afimali
```



## Basic Usage

```javascript
const lib=require("afimali");

async function start()
{
    let file=await lib.open("./test.bin");                      //Open a file to edit.
    let win=await file.openWindow(0, [5, 5]);                   //Open a 5x5 matrix as a window.
    console.log(await win.at(0, 0));                            //Read data from the window at 0,0.
    await win.at(0, 0, 97);                                     //Write 97 to window at 0,0.
    await file.save();                                          //Save the file to storage.
}


start();

```



## Classes & Methods


  - afimali.open(path)

    returns an instance of `File` which should opened the file on the path.
    - path `String`, path to the file


  - Class `File`

    This is what you really need to manipulate your file.

    - Properties
      - closed `Boolean` True if the file is already closed.
      - openedWindows `Array<Window>` The opened windows on the file.

    - Methods
      - stat() : `Promise<Stat>`
      
        returns the file stat info.
      - openWindow(offset, winSize) : `Promise<Window>`

        return a new window or an opened window from `openedWindows`.

          - offset `Number` the offset on the file.
          - winSize `Array<Number>` an 1x2 array to indicate the size of the window.
      - undo() : `Promise`
        Undo a writing operation.

      - save(): `Promise`

        Save the file, this will clear the operation history. Means that after you call this method, you're no long able to use undo method before you do another write operating.

      - close() : `Promise`
        
        Close the file, close property will be set as `true`, please do not call any another method on this object after calling this.




  - Class `Window`
    
    A class the you use to modify the content of a file.

      - Properties
        - buffer `Buffer` the content buffer.
        - size `Array<Number>` the size of the window.
        - offset `Number` offset on file.
        - length `Number` length of buffer.
        - file `File` The file which this window opened on.
      - Methods
        - clone() : `Promise<Window>`

          returns a cloned window of this.

        - at(x, y, [data]) : `Promise<Number>`

          if `data` is not passed, this method only returns the value on the position, if passed, the value on the cell will be replaced by `data`.
          
           - x `Number` x position of cell.
           - y `Number` y position of cell.
           - data `Number` data which will be set into the cell.
        - disassemble(...slices) : `Promise<Buffer>`

          returns a buffer whichi contains slices' data.

           - slice `Array<Number>` [x, y, length]

        - close() : `Promise`
          
          close window




## Additional Files

Afimali supports reading structure from below file formats:

  - GIF
  - PNG


The files above are derived from `File`. Use `openWindow` to manipulate them.



### Example

```javascript
const lib=require("afimali");

async function start()
{
    let file=await lib.open("./test.gif", lib.manipulators.GifFile);
    console.log(file);
}


start();
```




## Documents

Please visit wiki page at https://github.com/malpower/afimali/wiki for docs.