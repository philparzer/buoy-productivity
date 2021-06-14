//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//HIGH PRIORITY:
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//STYLING WRAP-UP
    //TODO: restore style, spacing, etc (font changed bahnschrift -> roboto)
    //FIXME: overlay positions, anims, text, etc. (e.g.fix / implement additional media queries for animations (ultrawide etc)) -> use vw or other relative css measurements

//MAIN PROCESS WRAP-UP
    //TODO: add more windows system "tools" to preExceptionArray: snippingtool 
    //FIXME: electron freezes when timer ends / when tabbed out -> or change html when window is out of focus e.g. discord stream still running
    //FIXME: audio start delayed if user switches to out of focus program too soon after timer started

//MAC SUPPORT
    // - TODO: icon throws error (maybe .ico -> .png) -> app needs to be built first
    // - TODO: overlay transparency doesn't work -> fullscreen autofocuses on mac probably the problem
    // - TODO: maybe don't even use overlays -> use mac messages
    // - FIXME: focus check doesn't work -> new html auto focuses on mac?
    // - TODO: FIXME: why on mac focus dropdown (getOpenWindows()?) not working if visual studio screen record is ticked
    // - FIXME: weird minimize behavior
    // - FIXME: microsoft word.app -> word.app splitting error when program name includes space?


//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//LOW PRIORITY:
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//TODO: create and implement remaining SFX (focus sound: calm wave, distraction sound: foghorn / buoy whistle, completed: buoy bell, failed: buoy whistle / foghorn)
//TODO: implement SFX toggle functionality
//TODO: different tooltips / dropdowns should collapse all others if uncollapsed
//TODO: think about closing overlays and alerts when click somewhere specific / anywhere on overlay window
//TODO: electron icon in taskbar to "alerted icon" when timer has ended
//TODO: before building -> disable ctrl to ensure users not reloading page w ctrl+r (consider disabling tab and other keys)
//TODO: custom scrollbars for windows -> mac scrollbars are fine as is
//TODO: handle SQL injection
//TODO: reposition all start-up functions to increase code readability
//TODO: add space after comma / decimal point in search results
//FIXME: maybe implement text scrolling animation for tag tooltips w large text content
//FIXME: search should be case insensitive
//FIXME: position polish (margins, etc.)
//TODO: think about splash screen (need?)
//FIXME: ? npm audit 1 high severity vulnerability

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//GLOBAL VARIABLES

//imports --------------------------------------------------------------------------------------------
const { ipcRenderer } = require('electron');
var sqlite3 = require('sqlite3').verbose();
const { desktopCapturer } = require('electron');
const activeWindows = require('electron-active-window');
const { windowManager } = require("node-window-manager");
const { shell } = require('electron');

//colors  --------------------------------------------------------------------------------------------
const red = '#DBA993';
const yellow =  "#DBDB93";
const white =  "#FAFAFA";
const primaryGrey = "#474747";
const darkerGrey =  "#3F3F3F";
const lighterGrey =  "#707070";
    //calendar colors
const halfYellowColor = "#DBC293";
const quarterYellowColor = "#DBB793";
const threeQuarterYellowColor = "#DBCD93";

//audio  --------------------------------------------------------------------------------------------

const warningAudio = new Audio("./audio/warningSound.mp3");
/* TODO:
const focusAudio = new Audio("./audio/focusSound.mp3");
const failAudio = new Audio("./audio/failSound.mp3");
const completionAudio = new Audio("./audio/completionSound.mp3");
*/


//buttons and input fields --------------------------------------------------------------------------------------------

    //title bar fields
const aboutBtn = document.getElementById('about');
const settingsBtn = document.getElementById('settings');
const addTagBtn = document.getElementById('add-tag-input-button')
const restartBtn = document.getElementById('restart-info');

const createTagElement = document.getElementById("add-tag-input");
const searchElement = document.getElementById('search');
const createTagButton = document.getElementById("add-tag-input-button");
let inputElementCheckInterval;

    //search box fields

const searchBox = document.getElementById("tooltip-search-box");

const tagTop1Result = document.getElementById("top1-tag");
const tagTop2Result = document.getElementById("top2-tag");
const tagTop3Result = document.getElementById("top3-tag");
const tagTop4Result = document.getElementById("top4-tag");
const tagTop5Result = document.getElementById("top5-tag");

const durationTop1Result = document.getElementById("top1-duration");
const durationTop2Result = document.getElementById("top2-duration");
const durationTop3Result = document.getElementById("top3-duration");
const durationTop4Result = document.getElementById("top4-duration");
const durationTop5Result = document.getElementById("top5-duration");

    //dots
const dot1 = document.getElementById("dot-1");
const dot2 = document.getElementById("dot-2");
const dot3 = document.getElementById("dot-3");
const dot4 = document.getElementById("dot-4");
const dot5 = document.getElementById("dot-5"); // <- most recent action

let lastStatus;
let secondLastStatus;
let thirdLastStatus;
let fourthLastStatus;
let fifthLastStatus;

let dotTooltip1;
let dotTooltip2;
let dotTooltip3;
let dotTooltip4;
let dotTooltip5;

    //stats
const successRateElement = document.getElementById("kdRatio");
const showStatsWindowButton = document.getElementById("calendar-btn"); 

    //calendar

let today; //date object generated by calendar
let dayMonthYearToday; //day-month-year format for DB entry

    //calendar coloration
var singleCalendarEntries = [];
var multipleCalendarEntries = [];

var solidRedDays = [];
var solidYellowDays = [];
var quarterYellowDays = [];
var halfYellowDays = [];
var threeQuarterYellowDays = [];

    //buoy input fields
const addHoursBtn = document.getElementById('time-hours-add-btn');
const addMinutesBtn = document.getElementById('time-minutes-add-btn');
const subtractHoursBtn = document.getElementById('time-hours-subtract-btn');
const subtractMinutesBtn = document.getElementById('time-minutes-subtract-btn');

const focusBtn = document.getElementById('focus-btn');
const tagBtn = document.getElementById('tag-buoy-btn');
const startBtn = document.getElementById('start-btn');

//general vars

var versionNumber = "0.1"
document.getElementById("version-number").innerHTML = versionNumber;

//search

var searchResultTags = [];

//timerInput -----------------------------------------------------------------------------------------

    //used to set and clear intervals for mouse hold functionality
let mouseHoldTimer; 
let mouseHoldValueChangeSpeed = 125; //in milliseconds

//time  --------------------------------------------------------------------------------------------

var minutesUnit = "m";
var hoursUnit = "h"; //search box suffix
if (document.documentElement.lang == "ru"){hoursUnit = "ч";}
if (document.documentElement.lang == "ru"){minutesUnit = "м";}

let timerLogic;
let timerRunning = false; //variable for timer state

    //main time calculation variables
let mins = 30; 
let hours = 0;

    //initial input values -> set when user clicks start button
let minsInput;
let hrsInput;

    //HTML elements timer
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');

    //focus time Variables
let maxTimeUnfocused = 15; //in seconds
let unfocusedTime = 0;
let warningGoneAfter = 4; //in seconds (time it takes for warning to disappear)

//tags  --------------------------------------------------------------------------------------------

const tagBuoyBtnBox = document.getElementById("tag-buoy-dropdown-box");
let tagTooltip;
let chosenTag;
var frontEndTags = [];


//focus  --------------------------------------------------------------------------------------------

let programArray = []; //array of all open programs (placeholder.exe, placeholder2.exe, ...)
let allowedProgramArray = []; //array of all focus and exception programs chosen by user

let focusSet = false;
let recentlyOutOfFocus = false; //state that checks whether user has recently exited focus app
let setFocusInterval;

    //exceptions
let thisApplicationWin = "electron.exe"; //TODO: when application name is defined -> change to application name e.g. "buoy"
let thisApplicationMac = 'Electron.app';
var applicationFrameHostName = "Windows Store App";

var preExceptionArrayWin = //array of all exceptions -> gets concatenated w allowed programs at start btn click
[
    //win
    "SearchApp.exe", "StartMenuExperienceHost.exe", "ShellExperienceHost.exe", "SystemSettings.exe", "SystemPropertiesAdvanced.exe", "explorer.exe",  //TODO: add other windows and mac functions

];

var preExceptionArrayMac = 
[
    //mac
    "Finder.app", "System Preferences.app", "System Information.app" //TODO:
];


    //overlays
let warningOverlay; //reference to window that is opened when user exits focus
let focusingOverlay;
let doneOverlay;
let doneAlert;
let failedAlert;






//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------------------------------------------------------
//DATABASE  ########################################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------

let db = new sqlite3.Database('./buoy.db', (err) => {
    if (err) {
       console.error(err.message);
       //TODO: if missing database file -> Display database file downloadlink (Hide Inputs/Stop Programm?)
    } else{ console.log("Connected")}});

DBReadandDisplayTags()

let highestValue = 0
let tags = []
let similar = []

function DBaddTag(tagName){
    db.get('SELECT name FROM tags WHERE name = "' + tagName + '";', (error, row) => {
        
        if(row != null) //tag already exists
        {
            return;
        }

        db.run('INSERT INTO tags (name) VALUES ("'+ tagName +'")')
    })
}

function DBSettingsChange(param){


    //onclick event calls this function w parameter signalling which element was clicked

    //languages
    if(param == 'en')
    {
        restartBtn.style.visibility = "visible";
        if (document.getElementById("exampleRadios1").checked == true)
        {
            db.run('UPDATE settings SET language = "en" WHERE ROWID = 1;')
        }
    }

    if(param == 'ru')
    {
        restartBtn.style.visibility = "visible";
        if (document.getElementById("exampleRadios2").checked == true)
        {
            db.run('UPDATE settings SET language = "' + param +'" WHERE ROWID = 1;')
        }
    }

    if(param == 'de')
    {
        restartBtn.style.visibility = "visible";
        if (document.getElementById("exampleRadios3").checked == true)
        {
            db.run('UPDATE settings SET language = "' + param +'"  WHERE ROWID = 1;')
        }
    }

    if(param == 'fr')
    {
        restartBtn.style.visibility = "visible";
        if (document.getElementById("exampleRadios4").checked == true)
        {
            db.run('UPDATE settings SET language = "' + param +'"  WHERE ROWID = 1;')
        }
    }

    //sounds TODO: set global boolean
    if(param == 'lost')
    {
        if (document.getElementById("focus-lost-sound-switch").checked == true)
        {
            db.run('UPDATE settings SET focus_lost = 1  WHERE ROWID = 1;')
        }

        else 
        {
            db.run('UPDATE settings SET focus_lost = 0  WHERE ROWID = 1;')
        }
    }

    if(param == 'gained')
    {
        if (document.getElementById("focus-gained-sound-switch").checked == true)
        {
            db.run('UPDATE settings SET focus_gained = 1  WHERE ROWID = 1;')
        }

        else 
        {
            db.run('UPDATE settings SET focus_gained = 0  WHERE ROWID = 1;')
        }
    }

    if(param == 'completion'){
        if(document.getElementById("focus-completion-sound-switch").checked == true)
        {
            db.run('UPDATE settings SET completion = 1 WHERE ROWID = 1')
        }
        else
        {
            db.run('UPDATE settings SET completion = 0 WHERE ROWID = 1')
        } 
    }

    if(param == 'fail'){
        if(document.getElementById("focus-fail-sound-switch").checked == true)
        {
            db.run('UPDATE settings SET fail = 1 WHERE ROWID = 1')
        }
        else
        {
            db.run('UPDATE settings SET fail = 0 WHERE ROWID = 1')
        }
    } 
}

function DBGetSettingsDropdown(){ 
    db.get('SELECT focus_gained, focus_lost, completion, fail FROM settings WHERE ROWID = 1', (error, row) => {
        try
        {
        document.getElementById("focus-gained-sound-switch").checked = (row.focus_gained == 1);
        document.getElementById("focus-lost-sound-switch").checked = (row.focus_lost == 1);
        document.getElementById("focus-fail-sound-switch").checked = (row.fail == 1);
        document.getElementById("focus-completion-sound-switch").checked = (row.completion == 1);
        }
        
        catch{}
    });
}

DBGetSettingsDropdown() //call at startup

function DBremTag(tagName){
    db.run('DELETE FROM tags WHERE name = "' + tagName + '";')
}

function DBReadandDisplayTags(){
    db.all('SELECT name FROM tags;', (error, rows) => {
        
        rows.forEach( row => {
            addNewTag(row.name);
            })

    })
}

function DBSearch(searchArg){
    
    tags.length = 0;
    similar.length = 0;
    

    db.all('SELECT duration, tag FROM focus WHERE tag LIKE "%' + searchArg + '%"', (error, rows) => {
        rows.forEach( row => {
            tags.push(row.tag);
            sim = similarity(searchArg, row.tag);
            similar.push(sim);
        });
        
        //5 most similar results
        tags = addSearchResults(tags, similar);
        tags = addSearchResults(tags, similar);
        tags = addSearchResults(tags, similar);
        tags = addSearchResults(tags, similar);
        tags = addSearchResults(tags, similar);

        updateSearchBox();
    })
}

function similarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
  }

  function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  
    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
      var lastValue = i;
      for (var j = 0; j <= s2.length; j++) {
        if (i == 0)
          costs[j] = j;
        else {
          if (j > 0) {
            var newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue),
                costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }



  function addSearchResults(allTags, similarArray)
  {
    highestValue = Math.max.apply(null, similar);
    mostSimilarTag = tags[similar.indexOf(highestValue)] 
    try 
    {
        searchResultTags.push(mostSimilarTag);

        for (var i = allTags.length - 1; i >= 0; i--) 
        {
            if (allTags[i] === mostSimilarTag) {
                allTags.splice(i, 1);
                similarArray.splice(i, 1);
            }
        }
    }
    catch{}
    
    return allTags;
  }


  function startBuoyDBEntry(tag, duration, programs, date, status)
  {
    db.run('INSERT INTO focus (status, tag, programs, date, duration) VALUES ("' + status + '","' + tag + '","' + programs + '","' + date + '","' + duration + '");"');
  }

//---------------------------------------------------------------------------------------------------------------------------------------
//TITLEBAR  ########################################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------

//Search

  //add input event listener to search element
searchElement.addEventListener('input', getSearchResults);

  //gets DB entries and updates html
function getSearchResults()
{

    let searchInput = searchElement.value;

    //database search
    DBSearch(searchInput);
    
}

function updateSearchBox()
{
    var tagMostSimilar = searchResultTags[0];
    var tagSecondSimilar = searchResultTags[1]; 
    var tagThirdSimilar = searchResultTags[2];
    var tagFourthSimilar = searchResultTags[3]; 
    var tagFifthSimilar = searchResultTags[4];

    var tagMostSimilarDuration;
    var tagSecondSimilarDuration;
    var tagThirdSimilarDuration;
    var tagFourthSimilarDuration;
    var tagFifthSimilarDuration;


    db.all('SELECT tag, SUM([duration]) AS cumulativeDuration FROM focus WHERE status = 1 GROUP BY tag;', (error, rows) => {
        rows.forEach(row => {
            if (row.tag == tagMostSimilar)
            {   

                if (row.cumulativeDuration < 60)
                {
                    
                    tagMostSimilarDuration = row.cumulativeDuration + '\xa0' + minutesUnit;
                }

                else if (row.cumulativeDuration % 60 == 0)
                {
                    tagMostSimilarDuration = row.cumulativeDuration / 60 +'\xa0'+ hoursUnit;
                }

                else
                {
                    console.log("cumulative time" + row.cumulativeDuration)
                    tagMostSimilarDuration = Math.round(row.cumulativeDuration / 60 * 10) / 10 + '\xa0' + hoursUnit;
                    console.log("cumulative time rounded" + tagMostSimilarDuration)

                    if (document.documentElement.lang != 'en')
                    {
                        tagMostSimilarDuration = tagMostSimilarDuration.replace('.', ',')
                    }
                    


                }
                
            }

            if (row.tag == tagSecondSimilar)
            {   

                if (row.cumulativeDuration < 60)
                {
                    tagSecondSimilarDuration = row.cumulativeDuration + '\xa0' + minutesUnit;
                }

                else if (row.cumulativeDuration % 60 == 0)
                {
                    tagSecondSimilarDuration = row.cumulativeDuration / 60 +'\xa0'+ hoursUnit;
                }

                else
                {
                    tagSecondSimilarDuration = Math.round(row.cumulativeDuration / 60 * 10) / 10 + '\xa0' + hoursUnit;

                    if (document.documentElement.lang != 'en')
                    {
                        tagSecondSimilarDuration = tagSecondSimilarDuration.replace('.', ',')
                    }

                }
            }

            if (row.tag == tagThirdSimilar)
            {

                if (row.cumulativeDuration < 60)
                {
                    tagThirdSimilarDuration = row.cumulativeDuration + '\xa0' + minutesUnit;
                }

                else if (row.cumulativeDuration % 60 == 0)
                {
                    tagThirdSimilarDuration = row.cumulativeDuration / 60 +'\xa0'+ hoursUnit;
                }

                else
                {
                    tagThirdSimilarDuration = Math.round(row.cumulativeDuration / 60 * 10) / 10 + '\xa0' + hoursUnit;

                    if (document.documentElement.lang != 'en')
                    {
                        tagThirdSimilarDuration = tagThirdSimilarDuration.replace('.', ',')
                    }


                }
            }

            if (row.tag == tagFourthSimilar)
            {   

                if (row.cumulativeDuration < 60)
                {
                    tagFourthSimilarDuration = row.cumulativeDuration +'\xa0' + minutesUnit;
                }

                else if (row.cumulativeDuration % 60 == 0)
                {
                    tagFourthSimilarDuration = row.cumulativeDuration / 60 +'\xa0'+ hoursUnit;
                }

                else
                {
                    tagFourthSimilarDuration = Math.round(row.cumulativeDuration / 60 * 10) / 10 +'\xa0' + hoursUnit;

                    if (document.documentElement.lang != 'en')
                    {
                        tagFourthSimilarDuration = tagFourthSimilarDuration.replace('.', ',')
                    }
                }
            }

            if (row.tag == tagFifthSimilar)
            {

                if (row.cumulativeDuration < 60)
                {
                    tagFifthSimilarDuration = row.cumulativeDuration + '\xa0' + minutesUnit;
                }

                else if (row.cumulativeDuration % 60 == 0)
                {
                    tagFifthSimilarDuration = row.cumulativeDuration / 60 +'\xa0'+ hoursUnit;
                }

                else
                {
                    tagFifthSimilarDuration = Math.round(row.cumulativeDuration / 60 * 10) / 10 +'\xa0' + hoursUnit;

                    if (document.documentElement.lang != 'en')
                    {
                        tagFifthSimilarDuration = tagFifthSimilarDuration.replace('.', ',')
                    }
                }
            }
        })
        
        //instantiate search results   
        tagTop1Result.textContent = tagMostSimilar;
        tagTop2Result.textContent = tagSecondSimilar;
        tagTop3Result.textContent = tagThirdSimilar;
        tagTop4Result.textContent = tagFourthSimilar;
        tagTop5Result.textContent = tagFifthSimilar;

        console.log("Search tag results" + searchResultTags);
        

        durationTop1Result.textContent = tagMostSimilarDuration;
        if (durationTop1Result.textContent == ""){tagTop1Result.style.color = red;}
        else {tagTop1Result.style.color = yellow;}

        durationTop2Result.textContent = tagSecondSimilarDuration;
        if (durationTop2Result.textContent == ""){tagTop2Result.style.color = red;}
        else {tagTop2Result.style.color = yellow;}

        durationTop3Result.textContent = tagThirdSimilarDuration;
        if (durationTop3Result.textContent == ""){tagTop3Result.style.color = red;}
        else {tagTop3Result.style.color = yellow;}
        
        durationTop4Result.textContent = tagFourthSimilarDuration;
        if (durationTop4Result.textContent == ""){tagTop4Result.style.color = red;}
        else {tagTop4Result.style.color = yellow;}
        
        durationTop5Result.textContent = tagFifthSimilarDuration;
        if (durationTop5Result.textContent == ""){tagTop5Result.style.color = red;}
        else {tagTop5Result.style.color = yellow;}

        let allDurationResults = document.querySelectorAll(".search-tag-duration");
        allDurationResults.forEach((element) => {
            if (element.textContent != ""){element.style.borderLeft = "2px solid #707070";}
            else 
            {
                element.style.borderLeft = "none";
            }
        })

        searchResultTags.length = 0;
    })

    
}

function clearSearchResults()
{
    try
    {
        let allTagResults = document.querySelectorAll(".search-tag-result");
        let allDurationResults = document.querySelectorAll(".search-tag-duration");

        allTagResults.forEach((element) => {
            element.textContent = "";
        })

        allDurationResults.forEach((element) => {
            element.textContent = "";
            element.style.borderLeft = darkerGrey;
        })
    }

    catch{}
    
}


//about

aboutBtn.onclick = function()
{
    shell.openExternal('https://buoy-productivity.com/'); //TODO: link to respective page as soon as website is done
}


//settings

restartBtn.onclick = function (){
    ipcRenderer.send( 'app:relaunch' );
}



//Windows Minimize and Quit

if (process.platform !== "darwin")
{
    document.getElementById("btns-mac-box").style.display = "none";

    document.getElementById('close-main').onclick = function() {
        ipcRenderer.send( 'app:quit' );
    }

    document.getElementById('minimize-main').onclick = function() {
        ipcRenderer.send( 'app:minimize' );
    }
}



//Mac Minimize and Quit

else
{
    document.getElementById("title-logo").style.display = "none";
    document.getElementById('minimize-main').style.display = "none";
    document.getElementById('close-main').style.display = "none";

    document.getElementById('close-mac').onclick = function() {
        ipcRenderer.send( 'app:quit' );
    }

    document.getElementById("minimize-mac").onclick = function() {
        ipcRenderer.send( 'app:minimize' );
    }


}





//---------------------------------------------------------------------------------------------------------------------------------------
//MAIN  ########################################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------

if (focusSet == false){ //make sure that focus is set before enabling start button
    disableStartBtn();
}

hideFocusBtn();


startBtn.onclick = function(){ //starts the main process, timer, focus retrieval and focus check

    //preparations
    clearInterval(setFocusInterval);
    retrieveFocusAndExceptions();
    searchElement.value = ""; //collapses search if search window still open when start is hit
    
    if (allowedProgramArray.length == 0){
        startBtnStyledFocusNotSet = true;
        return;
    }

    setInputTimes(); //sets the fixed input values for the count variable
    switchButtonStatus(); //switches buttons to unclickable
    styleBuoy(); //styles buoy to indicate that timer is running
    styleBackground();
    

    let timerInput = (parseInt(hoursElement.textContent) * 1000 * 60 * 60) + (parseInt(minutesElement.textContent) * 1000 * 60); //let timerInput: time input by user parsed from HTML elements and converted into milliseconds
    let startingTime = Date.now(); //let starting time = current system clock local time
    let timerRecentlyEnded = false; //used as a bugfix -> warning is displayed when timer ended succesfully
    
        //set tag tooltip while timer running
    timerRunning = true;
    manageTagTooltip();

        //add exceptions to allowed programs
    
    if (process.platform !== 'darwin')
    {
        allowedProgramArray.push(thisApplicationWin);
        allowedProgramArray = allowedProgramArray.concat(preExceptionArrayWin);
    }

    else 
    {
        allowedProgramArray.push(thisApplicationMac);
        allowedProgramArray = allowedProgramArray.concat(preExceptionArrayMac);
    }

    
    console.log(allowedProgramArray);

        //get current date
        dayMonthYearToday = today.getDate() + "-" + (today.getMonth()+1) + "-" + today.getFullYear();

        //write to database
        startBuoyDBEntry(chosenTag, (timerInput / 60000), "/**/", dayMonthYearToday, 0);
        
    
    
    //timer functionality  --------------------------------------------------------------------------------------------
    timerLogic =  setInterval(function() {
        var delta = Date.now() - startingTime; //delta is time difference from start in ms
        
        //counter
        var count = ((hrsInput*60) + minsInput) - (delta / 1000 / 60); //count takes initial user input values and calculates time passed in minutes
        if(count < (hours*60 + mins) -1)
        {
            //minutes html update 
            if(minutesElement.textContent != "00")
            {
                mins--;
                minutesElement.textContent = numberFormatter(mins);
            }
            
            //hours html update 
            else
            {
                hours--;
                hoursElement.textContent = numberFormatter(hours);
                mins = 59;
                minutesElement.textContent = numberFormatter(59);
            }
        }
        
        //Focus Check
        activeWindows().getActiveWindow().then((result)=>{
            var windowCheckResult;
            

            if (process.platform !== 'darwin')
            {
                windowCheckResult = result.windowClass;
            }
            
            else 
            {
                let unparsedWindowCheckresult = result.windowClass.split('.');
                let splitWindowCheckResult = unparsedWindowCheckresult[unparsedWindowCheckresult.length - 1];
                windowCheckResult = splitWindowCheckResult + '.app';

            }

            console.log("allowedProgramArray in timer")
            console.log(allowedProgramArray)

            console.log("result.windowClass in timer")
            console.log(windowCheckResult)

            //main check if active window is in allowed program
            if (allowedProgramArray.includes(windowCheckResult))
            {
                //checks if user has recently exited focus
                if (recentlyOutOfFocus)
                {
                    if (process.platform !== 'darwin')
                    {
                        //TODO: play focusing... sound
                        switch(document.documentElement.lang)
                        {
                            case 'en': focusingOverlay = window.open('html/focusingOverlay.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                                break; 
                            case 'ru': focusingOverlay = window.open('html/focusingOverlay-ru.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                                break;
                            case 'de': focusingOverlay = window.open('html/focusingOverlay-de.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                                break;
                            case 'fr': focusingOverlay = window.open('html/focusingOverlay-fr.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                                break;
                            default:
                                console.log("error lang");
                        }
                        setTimeout(() => {focusingOverlay.close()}, 2000)
                        }
                        
                        recentlyOutOfFocus = false;
                    }
                    else{/*TODO: mac message?*/ console.log("focusing")}

                unfocusedTime = 0;
            }
    
            else 
            {

                if (timerRecentlyEnded){return;}

                recentlyOutOfFocus = true;

                if(unfocusedTime == 0) //triggers message once when user exits focus program, prevents message from being spammed out every second
                {   
                    warningAudio.play();

                    if (process.platform !== 'darwin')
                    {
                        switch(document.documentElement.lang)
                        {
                        case 'en': warningOverlay = window.open('./html/warningOverlay.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break; 
                        case 'ru': warningOverlay = window.open('html/warningOverlay-ru.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break;
                        case 'de': warningOverlay = window.open('html/warningOverlay-de.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break;
                        case 'fr': warningOverlay = window.open('html/warningOverlay-fr.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break;
                        default:
                            console.log("error lang")
                        }
                    }

                    else{/*TODO: mac notifications?*/ console.log("warning")}
                    
                    
                    
                }

                if(unfocusedTime == warningGoneAfter)
                {
                    if (process.platform !== 'darwin') {warningOverlay.close();}
                    else{/*TODO: mac notifications?        */}
                }

                unfocusedTime++;
                
                if (unfocusedTime >= maxTimeUnfocused){ //timer finished unsuccesfully
                    endTimer();
                    
                    if (process.platform !== 'darwin')
                    {
                        switch(document.documentElement.lang)
                        {
                        case 'en': failedAlert = window.open('html/failedAlert.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break; 
                        case 'ru': failedAlert = window.open('html/failedAlert-ru.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break;
                        case 'de': failedAlert = window.open('html/failedAlert-de.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break;
                        case 'fr': failedAlert = window.open('html/failedAlert-fr.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break;
                        default:
                            console.log("error lang");
                        }   

                        setTimeout(() => {failedAlert.close()}, 3500);
                    }
                    
                    else{/*TODO: mac notifications?        */ console.log("failed")}
                    
                    
                }
            }
        });

        //timer finished succesfully
        if(delta >= timerInput)
        {
            timerRecentlyEnded = true; //FIXED BUG THAT DISPLAYED WARNING OVERLAY AFTER TIMER ENDS - maybe debug once more?
            db.run('UPDATE focus SET status = 1 WHERE ROWID = (SELECT MAX(ROWID) FROM focus);')
            
            
            endTimer();

            if (process.platform !== 'darwin')
            {
                switch(document.documentElement.lang)
                    {
                        case 'en': doneAlert = window.open('html/doneAlert.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break; 
                        case 'ru': doneAlert = window.open('html/doneAlert-ru.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break;
                        case 'de': doneAlert = window.open('html/doneAlert-de.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break;
                        case 'fr': doneAlert = window.open('html/doneAlert-fr.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                            break;
                        default:
                            console.log("error lang")
                    }
            
                setTimeout(() => {doneAlert.close()}, 3500);
            }

            else{/*TODO: mac notifications?        */ console.log("done")}
            
        }

    }, 1000);
}


function endTimer (){
    showStatsWindowButton.style.visibility = 'unset'; //relevant for 1st entry
    instantiateDotTooltips();
    updateDots();
    updateAvgFocusDuration();
    switchButtonStatus();
    unstyleBuoy();
    unstyleBackground();
    //cleanup
    recentlyOutOfFocus = false;
    clearInterval(timerLogic);
    minutesElement.textContent = numberFormatter(30);
    hoursElement.textContent = numberFormatter(0);
    hideFocusBtn();
    focusSet = false;
    timerRunning = false;
    manageTagTooltip();
    unfocusedTime = 0;
    allowedProgramArray = [];
    uncheckCheckmarks();
    disableStartBtn();
    resetTagChoice();
    //color calendar TODO: test
    singleCalendarEntries = [];
    multipleCalendarEntries = [];
    solidRedDays = [];
    solidYellowDays = [];
    quarterYellowDays = [];
    halfYellowDays = [];
    threeQuarterYellowDays = [];
    getNumberOfCalendarEntries(); 
 }



//---------------------------------------------------------------------------------------------------------------------------------------
//TIMER - Input  ########################################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------
//1. add listeners to all relevant buttons
//2. call sanity checks
//3. increment/decrement code variables
//4. update html elements accordingly

addMinutesBtn.addEventListener('mousedown', incrementMinutesHold);
addHoursBtn.addEventListener('mousedown', incrementHoursHold);
subtractMinutesBtn.addEventListener('mousedown', decrementMinutesHold);
subtractHoursBtn.addEventListener('mousedown', decrementHoursHold);

addMinutesBtn.addEventListener('mouseup', timeoutClear);
addHoursBtn.addEventListener('mouseup', timeoutClear);
subtractMinutesBtn.addEventListener('mouseup', timeoutClear);
subtractHoursBtn.addEventListener('mouseup', timeoutClear);

addMinutesBtn.addEventListener('mouseleave', timeoutClear);
addHoursBtn.addEventListener('mouseleave', timeoutClear);
subtractMinutesBtn.addEventListener('mouseleave', timeoutClear);
subtractHoursBtn.addEventListener('mouseleave', timeoutClear);

function incrementMinutesHold() {
    mins++;
    minuteSanityCheck();
    minutesElement.textContent = numberFormatter(mins);
    mouseHoldTimer = setTimeout(incrementMinutesHold, mouseHoldValueChangeSpeed);
}

function incrementHoursHold() {
    hours++;
    hoursSanityCheck();
    hoursElement.textContent = numberFormatter(hours);
    mouseHoldTimer = setTimeout(incrementHoursHold, mouseHoldValueChangeSpeed);
}

function decrementMinutesHold() {
    mins--;
    minuteSanityCheck();
    minutesElement.textContent = numberFormatter(mins);
    mouseHoldTimer = setTimeout(decrementMinutesHold, mouseHoldValueChangeSpeed);
}

function decrementHoursHold() {
    hours--;
    hoursSanityCheck();
    hoursElement.textContent = numberFormatter(hours);
    mouseHoldTimer = setTimeout(decrementHoursHold, mouseHoldValueChangeSpeed);
}

function timeoutClear() {
    clearTimeout(mouseHoldTimer);
  }


//---------------------------------------------------------------------------------------------------------------------------------------
//TAGS  ########################################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------

inputElementCheckInterval = setInterval(function() //checks input in input elements each second TODO: change this to input event as well? more performant?
    {  
        

        if (searchElement.value == "")
        {
            
            searchBox.style.visibility = "hidden";
            clearSearchResults();
        } 

        else
        {
            
            searchBox.style.visibility = "visible";
        }

        if (createTagElement.value != "")
        {   
            document.getElementById("add-tag-input").style.borderColor = lighterGrey;
            createTagButton.style.visibility = "unset";

            //checks if input is just spaces
            if (!/\S/.test(createTagElement.value)) {
                createTagButton.style.backgroundColor = red;
            }

            else {createTagButton.style.backgroundColor = yellow;}
        }

        else
        {   
            document.getElementById("add-tag-input").style.borderColor = darkerGrey;
            createTagButton.style.visibility = "hidden";
        }

        

    }, 1000)

//creates new tag in both dropdowns new tag when create tag button is pressed
createTagButton.onclick = function()
{
    tagAddingPreprocessor(createTagElement);
}

//adds enter listener to tagmanager input element, creates new tag in both dropdowns
createTagElement.addEventListener("keyup", function(event) {
    if (event.key === "Enter" && createTagElement.value != "") {
        
        tagAddingPreprocessor(createTagElement);
    }
});

function tagAddingPreprocessor(createTagElement)
{
    //checks if input is just spaces
    if (!/\S/.test(createTagElement.value)) {
        document.getElementById("add-tag-input").style.borderColor = red; return;
    }


    if (frontEndTags.includes(createTagElement.value)){document.getElementById("add-tag-input").style.borderColor = red; return;}; //stops duplicate tags
        DBaddTag(createTagElement.value);
        addNewTag();
}

function addNewTag(createdTagName = createTagElement.value)
{
    //createdTagName = createTagElement.value; moved to function declaration to make it work with values read from the database
    createTagElement.value = "";

    frontEndTags.push(createdTagName);

    //ADD TAG TO BUOY INPUT LIST

    var buoyTagDropdown = document.getElementById("tag-buoy-dropdown");

    var buoyTagItem = document.createElement("li");
    buoyTagDropdown.appendChild(buoyTagItem);

    var buoyTagItemBox = document.createElement("button");
    buoyTagItemBox.className ="dropdown-item dropdown-item-tag";
    buoyTagItemBox.type = "button";
    buoyTagItemBox.id = createdTagName;
    buoyTagItemBox.value = "false"
    buoyTagItemBox.textContent = createdTagName;


        // add toggle to button
    buoyTagItemBox.onclick = function()
    {
        var allDropDownItemTags = document.getElementsByClassName("dropdown-item dropdown-item-tag");
        for(var i = 0; i < allDropDownItemTags.length; i++)
        {
            allDropDownItemTags[i].value = "false";
            allDropDownItemTags[i].style.backgroundColor = "unset";
        }
        buoyTagItemBox.value = "true";
        chosenTag = buoyTagItemBox.textContent; //sets chosen tag
        unhideFocusBtn();
        styleTag();
        buoyTagItemBox.style.backgroundColor = red;
    }
    buoyTagItem.appendChild(buoyTagItemBox);

    

    //ADD TAG TO RESOLVE LIST

    var resolveDropdown = document.getElementById("manage-tags-dropdown");
    var resolveTagItem = document.createElement("li");
    resolveDropdown.appendChild(resolveTagItem);
    resolveTagItem.id = createdTagName;

    var resolveTagItemBox = document.createElement("button");
    resolveTagItemBox.className ="dropdown-item tag-resolve";
    resolveTagItemBox.type = "button";
    


    resolveTagItemBox.onclick = function ()
    {   
        resolveTagItem.remove(); //removes from resolve dropdown
        buoyTagItem.remove(); //removes from tag buoy dropdown
        DBremTag(createdTagName); //removes tag from database
    }
    
    resolveTagItemBox.textContent = createdTagName;
    resolveTagItem.appendChild(resolveTagItemBox);
    
}

//handles tooltip that displays tag when timer is started
function manageTagTooltip()
{

    if (!timerRunning)
    {   
        try{tagTooltip.remove();}
        catch{console.log("couldnt remove anything");}
        
        tagBuoyBtnBox.className = "dropdown";
    }

    if(timerRunning){
        tagTooltip = document.createElement("span");
        tagTooltip.className = "tooltiptext";
        tagTooltip.id = "chosen-tag-tooltip";
        tagTooltip.textContent = chosenTag;
    
        tagBuoyBtnBox.className = "dropdown tooltip-tag"
        tagBuoyBtnBox.appendChild(tagTooltip);
    }
}

//reset tag choice after timer ended
function resetTagChoice(){
    chosenTag = "";
    var allDropDownItemTagsForRemoval = document.getElementsByClassName("dropdown-item dropdown-item-tag");
        for(var i = 0; i < allDropDownItemTagsForRemoval.length; i++)
        {
            allDropDownItemTagsForRemoval[i].value = "false";
            allDropDownItemTagsForRemoval[i].style.backgroundColor = "unset";
        }
}



//---------------------------------------------------------------------------------------------------------------------------------------
//SET FOCUS  ########################################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------



focusBtn.onclick = function()
{
    //check every second if new program has been opened, enable disable start button on focus picked status
    setFocusInterval = setInterval(function(){
        getOpenWindows();
        enableDisableStartBtn();
    }, 1000)
}


function getOpenWindows()
{
    //chrome desktop capturer gets all open windows
    asyncOpenWindows = desktopCapturer.getSources({ types: ['window'] });
    asyncOpenWindows.then(async sources => getOpenExes(sources))
}

function getOpenExes(sources) 
{
    for (const source of sources) {
        //compares title retrieved from desktop capturer and window manager path
        windowManager.getWindows().forEach(element => {
            if(element.getTitle() == source.name){
                var programExe = parseFilePath(element.path);
                
                if (programArray.includes(programExe))
                {
                    return;
                }
                console.log(programArray);
                programArray.push(programExe);
                addProgramToDropdown(programExe);
            }
        });
    }
}

function parseFilePath(path)
{
    if (process.platform !== 'darwin')
    {
        directoryArray = path.split("\\") // "\\" to terminate string literal escape backslash
        return directoryArray[directoryArray.length - 1] // return last item in array
    }

    else
    {
        directoryArray = path.split("/")
        return directoryArray[directoryArray.length - 1] // return last item in array
    }
}

function addProgramToDropdown(program) 
{
    //excludes exceptions from dropdown
    if (process.platform !== 'darwin')
    {
        if (program == thisApplicationWin){return;}
        if (preExceptionArrayWin.includes(program)){return;}
    }
    
    else
    {
        if (program == thisApplicationMac){return;}
        if (preExceptionArrayMac.includes(program)){return;}
    }
    
    

    parsedProgram = parseExeForUI(program);

    //instantiate list items
    var focusDropdown = document.getElementById("focus-dropdown");
    var listItem = document.createElement("li");
    listItem.className  = "dropdown-item";
    focusDropdown.appendChild(listItem);

    //create box inside list items to instantiate checkbox and label there
    var listItemBox = document.createElement("div");
    listItemBox.className ="form-check-inline";
    listItem.appendChild(listItemBox);

    //instantiate checkboxes iniside list items
    var listItemInput = document.createElement("input");
    listItemInput.className += "form-check-input exe"; //added "exe" to make sure query selectors work
    listItemInput.type = "checkbox";
    listItemInput.id = program;
    listItemBox.appendChild(listItemInput);

    //instantiate labels for checkboxes
    var listItemLabel = document.createElement("label");
    listItemLabel.className ="form-check-label";
    listItemLabel.textContent = parsedProgram;
    listItem.appendChild(listItemLabel);
    listItemBox.htmlFor = parsedProgram;
}

function parseExeForUI(program)
{   
    if (program == "ApplicationFrameHost.exe") {return applicationFrameHostName;}
    var parsedProgram = program.slice(0, -4); //remove .exe
    parsedProgram = parsedProgram.charAt(0).toUpperCase() + parsedProgram.slice(1); //uppercase
    return parsedProgram;
}


//loops over html elements, checks checked checkboxes, pushes checked checkboxes to allowedProgramArray
function retrieveFocusAndExceptions()
{
    var allCheckboxes = document.querySelectorAll(".exe");

    allCheckboxes.forEach(function(element){
        if(element.checked){
            var elementName = element.id;
            allowedProgramArray.push(elementName);
        }
    });
}



//---------------------------------------------------------------------------------------------------------------------------------------
//UTIL FUNCTIONS   ########################################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------

//converts array to set then removes duplicates
function remove_duplicates_es6(arr) {
    let s = new Set(arr);
    let it = s.values();
    return Array.from(it);
}

//allows to count how often item is found in given array
function countInArray(array, item) {
    var count = 0;
    for (var i = 0; i < array.length; i++) {
        if (array[i] === item) {
            count++;
        }
    }
    return count;
}



//enables or disables the start button depending on correct time input (not zero) and on correct checkbox input (at least one checkbox has been checked)
function enableDisableStartBtn()
{
    var focusChecked = [];
    var focusCheckboxes = document.querySelectorAll(".exe");
    
    focusCheckboxes.forEach(function(focusCheckbox){
        if(focusCheckbox.checked){
            focusChecked.push(focusCheckbox);
    }});
    
    if(focusChecked.length != 0){
        focusSet = true;

       
        if(hoursElement.textContent == "00" && minutesElement.textContent == "00")
        {
          disableStartBtn();
          return;
        }

        enableStartBtn();
    }

    else{
        focusSet = false;
        disableStartBtn();
    }
}


function uncheckCheckmarks()
{
    var checks = document.querySelectorAll(".exe");
    checks.forEach(function(element){
        element.checked = false;
    });
}


function switchButtonStatus()
{
    startBtn.disabled = !startBtn.disabled;
    addHoursBtn.disabled = !addHoursBtn.disabled;
    addMinutesBtn.disabled = !addMinutesBtn.disabled;
    subtractHoursBtn.disabled = !subtractHoursBtn.disabled;
    subtractMinutesBtn.disabled = !subtractMinutesBtn.disabled;
    focusBtn.disabled = !focusBtn.disabled;
}


function disableStartBtn()
{
    startBtn.disabled = true;
    document.getElementById('Rectangle_13').style.display = "none";
    document.getElementById('start').textContent ="";
}

function enableStartBtn()
{
    document.getElementById('Rectangle_13').style.display = "unset";
    if(document.documentElement.lang == "en"){document.getElementById('start').textContent = "start";}
    if(document.documentElement.lang == "ru"){document.getElementById('start').textContent = "старт";}
    if(document.documentElement.lang == "de"){document.getElementById('start').textContent = "Start";}
    if(document.documentElement.lang == "fr"){document.getElementById('start').textContent = "début";}
    startBtn.disabled = false;
}

    //formats numbers in timer to contain 0 at beginning
function numberFormatter(number)
{

    if(number.toString().length < 2){
        number = '0' + number;
    }

    return number;
}

    //sets input times once on start click
function setInputTimes()
{
    hrsInput = hours;
    minsInput = mins;
}

    //Input Sanity Checks

function hoursSanityCheck()
{
    if (hours == -1)
    {
        hours = 99;
    }

    else if (hours >= 99)
    {
        hours = 0; //changed from 1 to 0
    }
}

function minuteSanityCheck()
{
    if (mins == -1){
        mins = 59;
    }
    
    if (mins == 60){
        mins = 0;
    }
}
    

//---------------------------------------------------------------------------------------------------------------------------------------
//Styling  ########################################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------


function styleBackground(){
    
    //title bar
    document.getElementById('search').style.display = 'none';
    document.getElementById('manage-tags-dropdown-box').style.display ='none';
    document.getElementById('about').style.display ='none';
    document.getElementById('settings').style.display ='none';

    //calendar
    document.getElementById('calendar-box').style.display = 'none';
    
    //  dots fade out

    try{document.getElementById("fade-out-bg").id = "main-background"} //ensures that bg fade works second time around
    catch{console.log("startup")};


    document.getElementById("dot-1").className = "fade-out";
    document.getElementById("dot-2").className = "fade-out";
    document.getElementById("dot-3").className = "fade-out";
    document.getElementById("dot-4").className = "fade-out";
    document.getElementById("dot-5").className = "fade-out";

    document.getElementById("chosen-dot-tooltip-dot-1").style.display = "none";
    document.getElementById("chosen-dot-tooltip-dot-2").style.display = "none";
    document.getElementById("chosen-dot-tooltip-dot-3").style.display = "none";
    document.getElementById("chosen-dot-tooltip-dot-4").style.display = "none";
    document.getElementById("chosen-dot-tooltip-dot-5").style.display = "none";

    //background image
    document.getElementById("main-background").id = "fade-in-bg";

}

function styleBuoy(){
    document.getElementById('semicolon').style.color = red;
    document.getElementById('hrs-btn-up').style.display = 'none';
    document.getElementById('min-btn-up').style.display = 'none';
    document.getElementById('hrs-btn-down').style.display = 'none';
    document.getElementById('min-btn-down').style.display = 'none';

    //focus button DEPRECATED
    //document.getElementById('Ellipse_8').style.fill = red;
    //document.getElementById('focus').style.fill = darkerGrey;

    //tag button
    tagBtn.disabled = true;
    document.getElementById('Rectangle_15').style.fill = red;
    


    //focus Dropdown 
    document.getElementById('focus-col').style.display ="none";


    //start button
    document.getElementById('start-box').style.display = 'none';
    document.getElementById('loadingButton').style.display = 'unset';
    //DEPRECATED document.getElementById('focus-btn').style.marginBottom ='-70px';

    
}

function unstyleBuoy(){
    document.getElementById('semicolon').style.color = yellow;
    document.getElementById('hrs-btn-up').style.display = 'unset';
    document.getElementById('min-btn-up').style.display = 'unset';
    document.getElementById('hrs-btn-down').style.display = 'unset';
    document.getElementById('min-btn-down').style.display = 'unset';
    

    //tag button
    tagBtn.disabled = false;
    document.getElementById('Rectangle_15').style.fill = yellow;
    
    //Loading button
    document.getElementById('loadingButton').style.display ='none';
    //focus button
    document.getElementById('focus-col').style.display ="unset";
    document.getElementById('focus-btn').style.marginTop ='';
    

    //start button
    
    document.getElementById('start-box').style.display = 'unset';
    
}

function unstyleBackground(){

    //title bar
    document.getElementById('search').style.display = 'unset';
    document.getElementById('manage-tags-dropdown-box').style.display ='unset';
    document.getElementById('about').style.display ='unset';
    document.getElementById('settings').style.display ='unset';

    //calendar
    document.getElementById('calendar-box').style.display = 'unset';

    //  dots fade in
    document.getElementById("dot-1").className = "fade-in";
    document.getElementById("dot-2").className = "fade-in";
    document.getElementById("dot-3").className = "fade-in";
    document.getElementById("dot-4").className = "fade-in";
    document.getElementById("dot-5").className = "fade-in";

    //  dot tooltips
    try //this try catch catches deleted tooltip style changes when timer runs out
    {
        document.getElementById("chosen-dot-tooltip-dot-1").style.display = "unset";
        document.getElementById("chosen-dot-tooltip-dot-2").style.display = "unset";
        document.getElementById("chosen-dot-tooltip-dot-3").style.display = "unset";
        document.getElementById("chosen-dot-tooltip-dot-4").style.display = "unset";
        document.getElementById("chosen-dot-tooltip-dot-5").style.display = "unset";
    }

    catch{}
    
    
    //background image fade in
    document.getElementById("fade-in-bg").id = "fade-out-bg";
}


function styleTag()
{
    document.getElementById('Rectangle_15').style.fill = red;
}


function unhideFocusBtn()
{
     focusBtn.style.visibility = "unset";
}

function hideFocusBtn()
{
     focusBtn.style.visibility = "hidden";
}


//---------------------------------------------------------------------------------------------------------------------------------------
//STATS #############################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------



showStatsWindowButton.onclick = function() 
{   
    updateSuccessRate();
    setMostUsedTag();
}

//Success Rate

function updateSuccessRate()
{
    let success;
    let total;
    let successRate;
    showStatsWindowButton.style.visibility ="unset";
    
    try 
    {
        db.get('SELECT Count(*) AS "succeeded" FROM focus WHERE status = 1;', (error, row) => {
            success = row.succeeded
            db.get('SELECT Count(*) AS "totalrows" FROM focus;', (error, row) => {
                total = row.totalrows
                successRate = (success / total) * 100;
                if(total == 0)
                {
                    console.log("disable stats button no success rate")
                    successRate = 100;
                }

                var roundedRate = Math.round(successRate);
                
                
                successRateElement.innerHTML = roundedRate + "%";

                //color success rate
                if (roundedRate <= 65) {successRateElement.style.color = red;}
                else if (roundedRate <=  95){successRateElement.style.color = white;}
                else if (roundedRate >= 95){successRateElement.style.color = yellow;}


                })
            })
    }
    
    catch
    {
        showStatsWindowButton.style.visibility ="hidden";
    }
    
}

function setMostUsedTag(){

    showStatsWindowButton.style.visibility ="unset";
    
        db.get('SELECT tag, COUNT(tag) AS counted FROM focus GROUP BY tag ORDER BY counted DESC LIMIT 10;', (error, row) => {
                    
            try {document.getElementById("most-used-tag").innerHTML = row.tag;}
            catch {showStatsWindowButton.style.visibility ="hidden";}

            })


}


function updateAvgFocusDuration(){

    let averageDuration = 0;

    db.all('SELECT duration FROM focus WHERE status = 1;', (error, val) => {
        db.get('SELECT Count(*) AS "count" FROM focus WHERE status = 1', (error, row) => {


            val.forEach(element => 
                {   
                    
                    averageDuration += element.duration;

                }
            )
            
            averageDuration = averageDuration / row.count;
            document.getElementById("avg-duration-value").textContent = Math.round(averageDuration);
        })
    })
}

updateSuccessRate(); //calls on startup to catch error when new user tries to click on button without any entries
setMostUsedTag();
updateAvgFocusDuration();


//---------------------------------------------------------------------------------------------------------------------------------------
//DOTS  ########################################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------
function updateDots(){
    db.get('SELECT status FROM focus WHERE ROWID = (SELECT MAX(ROWID)-4 FROM focus);', (error, row) => {try{fifthLastStatus = row.status;}catch{}
    db.get('SELECT status FROM focus WHERE ROWID = (SELECT MAX(ROWID)-3 FROM focus);)', (error, row) => {try{fourthLastStatus = row.status;}catch{}
    db.get('SELECT status FROM focus WHERE ROWID = (SELECT MAX(ROWID)-2 FROM focus);)', (error, row) => {try{thirdLastStatus = row.status;}catch{}
    db.get('SELECT status FROM focus WHERE ROWID = (SELECT MAX(ROWID)-1 FROM focus);', (error, row) => {try{secondLastStatus = row.status;}catch{}
    db.get('SELECT status FROM focus WHERE ROWID = (SELECT MAX(ROWID) FROM focus);', (error, row) => {try{lastStatus = row.status;}catch{}

    if (lastStatus == 0) {dot5.style.backgroundColor = red;}
    else if (lastStatus == 1)  {dot5.style.backgroundColor = yellow;}
    else{document.getElementById("chosen-dot-tooltip-dot-5").style.display = "none";}

    if (secondLastStatus == 0) {dot4.style.backgroundColor = red;}
    else if (secondLastStatus == 1) {dot4.style.backgroundColor = yellow;}
    else{document.getElementById("chosen-dot-tooltip-dot-4").style.display = "none";}

    if (thirdLastStatus == 0) {dot3.style.backgroundColor = red;}
    else if (thirdLastStatus == 1) {dot3.style.backgroundColor = yellow;}
    else{document.getElementById("chosen-dot-tooltip-dot-3").style.display = "none";}

    if (fourthLastStatus == 0) {dot2.style.backgroundColor = red;}
    else if (fourthLastStatus == 1) {dot2.style.backgroundColor = yellow;}
    else{document.getElementById("chosen-dot-tooltip-dot-2").style.display = "none";}

    if (fifthLastStatus == 0) {dot1.style.backgroundColor = red;}
    else if (fifthLastStatus == 1) {dot1.style.backgroundColor = yellow;}
    else{document.getElementById("chosen-dot-tooltip-dot-1").style.display = "none";}
                })
            })
        })
    })
})
    
    
}


updateDots() //updates dots at startup
instantiateDotTooltips() //instantiate tooltips at start


function instantiateDotTooltips()
{   

    let dotBox1 = document.getElementById("dot-box-1");
    let dotBox2 = document.getElementById("dot-box-2");
    let dotBox3 = document.getElementById("dot-box-3");
    let dotBox4 = document.getElementById("dot-box-4");
    let dotBox5 = document.getElementById("dot-box-5");
    

    //Tooltip1
    try {dotTooltip1.remove()}
    catch{}
    
        dotTooltip1 = document.createElement("span");
        dotTooltip1.className = "tooltiptextdot";
        dotTooltip1.id = "chosen-dot-tooltip-dot-1";

        db.get('SELECT tag FROM focus WHERE ROWID = (SELECT MAX(ROWID)-4 FROM focus);', (error, row) => {
            try
            {
                dotTooltip1.textContent = row.tag;
                
                db.get('SELECT status FROM focus WHERE ROWID = (SELECT MAX(ROWID)-4 FROM focus);', (error, row) => {
                    try
                    {
                        if (row.status == 0) 
                        {
                            dotTooltip1.style.backgroundColor = red;
                        }

                        else
                        {
                            dotTooltip1.style.backgroundColor = yellow;
                        }
                        
                    }
                    
                    catch{console.log("didnt work")}
                })
            }
            
            catch{console.log("didnt work")}

            


        dotBox1.className = " tooltip-dot"
        dotBox1.appendChild(dotTooltip1);
    
        })
    
    

    //Tooltip2
    try {dotTooltip2.remove()}
    catch{}

        dotTooltip2 = document.createElement("span");
        dotTooltip2.className = "tooltiptextdot";
        dotTooltip2.id = "chosen-dot-tooltip-dot-2";

        db.get('SELECT tag FROM focus WHERE ROWID = (SELECT MAX(ROWID)-3 FROM focus);', (error, row) => {
            try
            {
                dotTooltip2.textContent = row.tag;

                db.get('SELECT status FROM focus WHERE ROWID = (SELECT MAX(ROWID)-3 FROM focus);', (error, row) => {
                    try
                    {
                        if (row.status == 0) 
                        { 
                            dotTooltip2.style.backgroundColor = red;
                        }

                        else
                        {
                            dotTooltip2.style.backgroundColor = yellow;
                        }
                        
                    }
                    
                    catch{console.log("didnt work")}
                })


            }

            catch{console.log("didnt work")}
        dotBox2.className = " tooltip-dot"
        dotBox2.appendChild(dotTooltip2);
    
    })
    
    //Tooltip3
    try {dotTooltip3.remove()}
    catch{}

        dotTooltip3 = document.createElement("span");
        dotTooltip3.className = "tooltiptextdot";
        dotTooltip3.id = "chosen-dot-tooltip-dot-3";

        db.get('SELECT tag FROM focus WHERE ROWID = (SELECT MAX(ROWID)-2 FROM focus);', (error, row) => 
        {
            try
            {
                dotTooltip3.textContent = row.tag;

                db.get('SELECT status FROM focus WHERE ROWID = (SELECT MAX(ROWID)-2 FROM focus);', (error, row) => {
                    try
                    {
                        if (row.status == 0) 
                        { 
                            dotTooltip3.style.backgroundColor = red;
                        }

                        else
                        {
                            dotTooltip3.style.backgroundColor = yellow;
                        }
                        
                    }
                    
                    catch{console.log("didnt work")}
                })
            }
            
            catch {console.log("didnt work")}


        dotBox3.className = " tooltip-dot"
        dotBox3.appendChild(dotTooltip3);
    
    })
    

    //Tooltip4
    try {dotTooltip4.remove()}
    catch{}

        dotTooltip4 = document.createElement("span");
        dotTooltip4.className = "tooltiptextdot";
        dotTooltip4.id = "chosen-dot-tooltip-dot-4";

        db.get('SELECT tag FROM focus WHERE ROWID = (SELECT MAX(ROWID)-1 FROM focus);', (error, row) => {
            try
            {
                dotTooltip4.textContent = row.tag;

                db.get('SELECT status FROM focus WHERE ROWID = (SELECT MAX(ROWID)-1 FROM focus);', (error, row) => {
                    try
                    {
                        if (row.status == 0) 
                        {
                            dotTooltip4.style.backgroundColor = red;
                        }

                        else
                        {
                            dotTooltip4.style.backgroundColor = yellow;
                        }
                        
                    }
                    
                    catch{console.log("didnt work")}
                })
            }
            
            catch{console.log("didnt work")}

        dotBox4.className = " tooltip-dot"
        dotBox4.appendChild(dotTooltip4);
    
    })

    //Tooltip5 <- most recent
    try {dotTooltip5.remove()}
    catch{}

        dotTooltip5 = document.createElement("span");
        dotTooltip5.className = "tooltiptextdot";
        dotTooltip5.id = "chosen-dot-tooltip-dot-5";

        db.get('SELECT tag FROM focus WHERE ROWID = (SELECT MAX(ROWID) FROM focus);', (error, row) => {
            try
            {
                dotTooltip5.textContent = row.tag;

                db.get('SELECT status FROM focus WHERE ROWID = (SELECT MAX(ROWID) FROM focus);', (error, row) => {
                    try
                    {
                        if (row.status == 0) 
                        {
                            dotTooltip5.style.backgroundColor = red;
                        }

                        else
                        {
                            dotTooltip5.style.backgroundColor = yellow;
                        }
                        
                    }
                    
                    catch{console.log("didnt work")}
                })
            }
            
            catch{console.log("didnt work")}
        dotBox5.className = " tooltip-dot"
        dotBox5.appendChild(dotTooltip5);
    
    })




    
    


}

//---------------------------------------------------------------------------------------------------------------------------------------
//CALENDAR  ########################################################################################################################
//---------------------------------------------------------------------------------------------------------------------------------------


function generate_year_range(start, end) {
    var years = "";
    for (var year = start; year <= end; year++) {
        years += "<option value='" + year + "'>" + year + "</option>";
    }
    return years;
}

today = new Date();
currentMonth = today.getMonth();
currentYear = today.getFullYear();
selectYear = document.getElementById("year");
selectMonth = document.getElementById("month");


createYear = generate_year_range(2021, currentYear);

document.getElementById("year").innerHTML = createYear;

var calendar = document.getElementById("calendar");
var lang = calendar.getAttribute('data-lang');

var months = "";
var days = "";

var monthDefault = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var dayDefault = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

if (lang == "en") {
    months = monthDefault;
    days = dayDefault;
} else if (lang == "de") {
    months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
} else if (lang == "ru") {
    months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
} else if (lang == "fr") {
    months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    days = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];

} else {
    months = monthDefault;
    days = dayDefault;
}


var $dataHead = "<tr>";
for (dhead in days) {
    $dataHead += "<th data-days='" + days[dhead] + "'>" + days[dhead] + "</th>";
}
$dataHead += "</tr>";

//alert($dataHead);
document.getElementById("thead-month").innerHTML = $dataHead;


monthAndYear = document.getElementById("monthAndYear");




function next() {

    document.getElementById("previous").style.visibility = "unset"

    if (currentMonth == today.getMonth() && currentYear == today.getYear())
    {
        
        document.getElementById("next").style.visibility = "hidden";
    }


    currentYear = (currentMonth === 11) ? currentYear + 1 : currentYear;
    currentMonth = (currentMonth + 1) % 12;
    showCalendar(currentMonth, currentYear);

}

function previous() {

    document.getElementById("previous").style.visibility = "unset"

    if (currentYear != today.getYear())
    {
        document.getElementById("next").style.visibility = "unset";
    }

    if (currentMonth == 1 && currentYear == 2021)
    {
        document.getElementById("previous").style.visibility = "hidden";
    }


    currentYear = (currentMonth === 0) ? currentYear - 1 : currentYear;
    currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
    showCalendar(currentMonth, currentYear);
}

function jump() {
    currentYear = parseInt(selectYear.value);
    currentMonth = parseInt(selectMonth.value);
    showCalendar(currentMonth, currentYear);
}

function showCalendar(month, year) {

    if (currentMonth == today.getMonth()){
        document.getElementById("next").style.visibility = "hidden";
    }

    var firstDay = ( new Date( year, month ) ).getDay();

    tbl = document.getElementById("calendar-body");

    
    tbl.innerHTML = "";

    
    monthAndYear.innerHTML = months[month] + " " + year;
    selectYear.value = year;
    selectMonth.value = month;

    // creating all cells
    var date = 1;
    for ( var i = 0; i < 6; i++ ) {
        
        var row = document.createElement("tr");

        for ( var j = 0; j < 7; j++ ) {
            if ( i === 0 && j < firstDay ) {
                cell = document.createElement( "td" );
                cellText = document.createTextNode("");
                cell.appendChild(cellText);
                row.appendChild(cell);
            } else if (date > daysInMonth(month, year)) {
                break;
            } else {
                cell = document.createElement("td");
                cell.setAttribute("data-date", date);
                cell.setAttribute("data-month", month + 1);
                cell.setAttribute("data-year", year);
                cell.setAttribute("data-month_name", months[month]);
                cell.className = "date-picker";
                cell.id = date + "-" + (month + 1) + "-" + year;
                cell.innerHTML = "<span>" + date + "</span>";

                //coloration
                if (solidYellowDays.includes(cell.id)) 
                {
                    cell.style.color = darkerGrey;
                    cell.style.backgroundColor = yellow;
                }
                if (solidRedDays.includes(cell.id)) 
                {
                    cell.style.color = darkerGrey;
                    cell.style.backgroundColor = red;
                }
                if (threeQuarterYellowDays.includes(cell.id)) 
                {
                    cell.style.color = darkerGrey;
                    cell.style.backgroundColor = threeQuarterYellowColor;
                }

                if (quarterYellowDays.includes(cell.id)) 
                {
                    cell.style.color = darkerGrey;
                    cell.style.backgroundColor = quarterYellowColor;
                }

                if (halfYellowDays.includes(cell.id)) 
                {
                    cell.style.color = darkerGrey;
                    cell.style.backgroundColor = halfYellowColor;
                }

                //selected frame
                if ( date === today.getDate() && year === today.getFullYear() && month === today.getMonth() ) {
                    cell.className = "date-picker selected";
                }
                row.appendChild(cell);
                date++;
            }


        }

        tbl.appendChild(row);
    }

}

function daysInMonth(iMonth, iYear) {
    return 32 - new Date(iYear, iMonth, 32).getDate();
}


// calendar coloration --------------------------------------------------------------------------------------------------------------------------------


getNumberOfCalendarEntries()



function getNumberOfCalendarEntries()
{
    

    db.all('SELECT status, date FROM focus', (error,rows) => {
                
        var lastLoopedElement = ""; //TODO: check if this ="" and change from let to var fixed bug

                rows.forEach(row => {
                    try //reposition
                    {   
                        

                        if (lastLoopedElement == row.date)
                        {
                            singleCalendarEntries = singleCalendarEntries.filter(entry => entry != row.date)
                            multipleCalendarEntries.push(row.date);
                        }

                        else
                        {
                            singleCalendarEntries.push(row.date);
                        }

                        lastLoopedElement = row.date;
                        
                    }
                    

                    catch{console.log("calendar check didnt work")}

                    
                })

                multipleCalendarEntries = remove_duplicates_es6(multipleCalendarEntries);

                console.log("single: " + singleCalendarEntries);
                console.log("multiple: " + multipleCalendarEntries);


                sortEntryColoration();
            })
}


function sortEntryColoration()
{
    try 
    {
        singleCalendarEntries.forEach(entry => {
            db.get('SELECT status FROM focus where date = "' + entry + '";', (error,row) => {
                if (row.status == 0){solidRedDays.push(entry);}
                else{solidYellowDays.push(entry)}
            })
        })


        multipleCalendarEntries.forEach(entry => {
            db.all('SELECT status FROM focus where date = "' + entry + '";', (error,rows) => {
                console.log("entry: " + entry)
                console.log(rows)

                let entryStatusArray = [];
                rows.forEach(row => {entryStatusArray.push(row.status)});
                let cumulativeStatus = 0;
                let statusQuotient = 0;

                entryStatusArray.forEach(status => {
                    cumulativeStatus = (status + cumulativeStatus);
                    statusQuotient = cumulativeStatus / entryStatusArray.length;
                })

                if (entryStatusArray.every(status => status == 1)) {solidYellowDays.push(entry)}
                else if (entryStatusArray.every(status => status == 0)) {solidRedDays.push(entry)}
                else if (statusQuotient < 0.5) {quarterYellowDays.push(entry)}
                else if (statusQuotient == 0.5) {halfYellowDays.push(entry)}
                else if (statusQuotient > 0.5) {threeQuarterYellowDays.push(entry)}

                console.log("Solid Red Days: " + solidRedDays);
                console.log("Solid Yellow Days: " + solidYellowDays);
                console.log("1/4 yellow: " + quarterYellowDays);
                console.log("1/2 yellow: " + halfYellowDays);
                console.log("3/4 yellow" + threeQuarterYellowDays);

                //instantiate calendar when coloration is done
                showCalendar(currentMonth, currentYear);

            })
        })
    }
    catch{}
}