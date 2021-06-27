const {app, BrowserWindow, ipcMain, remote, Menu} = require('electron')
const path = require('path')
const menu = new Menu();
var sqlite3 = require('sqlite3').verbose();
var mainWindow;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let db = new sqlite3.Database('./buoy.db', (err) => {
  if (err) {
     console.error(err.message);
     //TODO: if missing database file -> Display database file downloadlink (Hide Inputs/Stop Programm?)
  } else{ console.log("Connected")}});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function createWindow () {
  // Create the browser window.
  
  mainWindow = new BrowserWindow({
    width: 1100, height: 800, resizable: false, frame: false,
    webPreferences: {nodeIntegration: true, contextIsolation: false, spellcheck: false}
  })

  //WINDOWS
  if (process.platform !== 'darwin')
  {
    mainWindow.setIcon(path.join(__dirname, '/images/icon.ico'));
    mainWindow.removeMenu() //disables ctrl r
  }
  
  //MACOS
  else
  {
    //TODO: handle iconS
    Menu.setApplicationMenu(Menu.buildFromTemplate([])); //disables ctrl r
  }

  //load window
  DBGetSettingsLanguage(mainWindow)
  // Open DevTools.
  mainWindow.webContents.openDevTools()
}





function DBGetSettingsLanguage(mainWindow){ 

  db.get('SELECT language FROM settings WHERE ROWID = 1', (error, row) => {
    
    switch(row.language){
      case "en":
        console.log("en selected")
        mainWindow.loadFile('index.html');
        break;

      case "ru":
        console.log("ru selected")
        mainWindow.loadFile('index-ru.html');
        break;

      case "de":
        console.log("de selected")
        mainWindow.loadFile('index-de.html');
        break;

      case "fr":
        console.log("fr selected")
        mainWindow.loadFile('index-fr.html');
        break;

      default:
        console.log("language not specified");

    }
    
  });

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit() //TODO: just quit on mac as well?

})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.on('browser-window-blur', function (){
  if (process.platform !== 'darwin') {}
  else 
  {
    mainWindow.webContents.send('blurred')
    //TODO: undo styling
  }
})

app.on('browser-window-focus', function (){
  if (process.platform !== 'darwin') {}
  else 
  {
    mainWindow.webContents.send('focused')
    //TODO: grey out buttons
  }
})

ipcMain.on('app:relaunch', () => {
    app.relaunch();
    app.exit();
} )


ipcMain.on( 'app:quit', () => {
    app.quit();
} )


ipcMain.on( 'app:minimize', () => {
  BrowserWindow.getFocusedWindow().minimize();
} )


