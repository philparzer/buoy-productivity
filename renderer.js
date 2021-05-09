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

//workers for timer?
