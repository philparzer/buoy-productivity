//title bar

const { ipcRenderer } = require( 'electron' );

document.getElementById('close-main').onclick = function() {
    ipcRenderer.send( 'app:quit' );
}

document.getElementById('minimize-main').onclick = function() {
    ipcRenderer.send( 'app:minimize' );
}

ipcMain.on( 'app:minimize', () => {
    remote.BrowserWindow.getFocusedWindow().minimize();
  } )

//TODO: Timer, other buttons, writing to file

//--Timer--

document.getElementById('start-box').onclick = function(){
    
    console.log("TEST")

    let timer = parseInt(document.getElementById('minutes').nodeValue()) * 1000 /* Seconds to Mins -->  x60 */;
    let start = Date.now();
    
    
    setInterval(function() {
        var delta = Date.now() - start;
        
        if(delta >= timer){
            alert("Time over");
        }
        }, 1000);
}
//---------

//workers for timer?
