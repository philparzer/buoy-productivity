// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, remote} = require('electron')
const path = require('path')
var sqlite3 = require('sqlite3').verbose(); 

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';


let db = new sqlite3.Database('./buoy.db', (err) => {
  if (err) {
     console.error(err.message);
     //TODO: if missing database file -> Display database file downloadlink (Hide Inputs/Stop Programm?)
  } else{ console.log("Connected")}});

//TODO: use electron-store to store user language settings in preferences and open correct html
//TODO: disable tab

function createWindow () {
  // Create the browser window.
  
  const mainWindow = new BrowserWindow({
    width: 1100, height: 800, resizable: false, frame: false,
    webPreferences: {nodeIntegration: true, contextIsolation: false}
  })
  mainWindow.setIcon(path.join(__dirname, '/images/icon.ico'));

  // and load the index.html of the app.
  //mainWindow.loadFile('index.html');
  DBGetSettingsLanguage(mainWindow)
  
  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

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
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


ipcMain.on( 'app:quit', () => {
    app.quit();
} )


ipcMain.on( 'app:minimize', () => {
  BrowserWindow.getFocusedWindow().minimize();
} )


function DBGetSettingsLanguage(mainWindow){ //TODO: default radio button value to html file language (set in html doc)
  //TODO: Establish db connection in main.js
  db.get('SELECT language FROM settings WHERE ROWID = 1', (error, row) => {
    
    switch(row.language){
      case "en":
        console.log("en selected")
        mainWindow.loadFile('index.html');
        break;

      case "ru":
        console.log("ru selected")
        mainWindow.loadFile('index.html');
        break;

      case "de":
        console.log("de selected")
        mainWindow.loadFile('index.html');
        break;

      default:
        console.log("language not specified")
        //mainWindow.loadFile('index.html');

    }
    
  });

  //TODO: load html file with specified language
}