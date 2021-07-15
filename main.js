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
        mainWindow.loadFile('index.html');
        break;
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
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()

})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// CUSTOM MAIN

app.on('browser-window-blur', function (){
  if (process.platform !== 'darwin') {}
  else 
  {
    mainWindow.webContents.send('blurred')
  }
})

app.on('browser-window-focus', function (){
  if (process.platform !== 'darwin') {}
  else 
  {
    mainWindow.webContents.send('focused')
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

ipcMain.on('app:icon-flash-bounce', () => {
  if(process.platform !== 'darwin') {mainWindow.flashFrame(true)}
  else {app.dock.bounce("critical")}
} )

  //PROGRESS BAR

var progInterval;
var progIncrement = 0; // -1 <= progIncrement <= 1
var deltaTime = 0;

ipcMain.on('app:progBarStart', (event, timerSeconds) => {
  
  var timerInputSeconds = timerSeconds;
  deltaTime = timerInputSeconds;
  
  progInterval = setInterval(() => {
    
    if (deltaTime !== timerInputSeconds)
    { 
      progIncrement = 1 - (deltaTime / timerInputSeconds);
      console.log(progIncrement);
      mainWindow.setProgressBar(progIncrement);
    }
    
    deltaTime -= 1;

  }, 1000)
  
  
})

ipcMain.on('app:progBarStop', () => {
  clearInterval(progInterval);
  mainWindow.setProgressBar(-1); //reset progress bar
})