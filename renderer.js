//VARS  ########################################################################################################################

//TODO: program identifiers for parsing captured windows TODO: maybe use window class instead
    //Browsers
    const edge = "Microsoft​ Edge";
    const chrome = "Google Chrome";

    //Popular Apps
    const blender = "Blender";
    const vsCode = "Visual Studio Code";
        // TEXT EDITING
        // 3D EDITING
        // AUDIO
        // PDF Readers
        // CODE EDITORS
        // VISUAL EFFECTS
        // MAIL
        // Engines
        // Drawing
        // ADOBE Suite
        // Microsoft Suite
        // Version Control
        // Remote Working Tools
        // Socials
        //...
        
    
//imports --------------------------------------------------------------------------------------------
const { ipcRenderer } = require('electron');
var sqlite3 = require('sqlite3').verbose(); //also const?
const { desktopCapturer } = require('electron')
const activeWindows = require('electron-active-window');

//colors  --------------------------------------------------------------------------------------------
const red = '#DBA993';
const yellow =  "#DBDB93";
const white =  "#FAFAFA";
const primaryGrey = "#474747";
const darkerGrey =  "#3F3F3F";
const lighterGrey =  "#707070";

//buttons  --------------------------------------------------------------------------------------------
const aboutBtn = document.getElementById('about');
const settingsBtn = document.getElementById('settings');

const addHoursBtn = document.getElementById('time-hours-add-btn');
const addMinutesBtn = document.getElementById('time-minutes-add-btn');
const subtractHoursBtn = document.getElementById('time-hours-subtract-btn');
const subtractMinutesBtn = document.getElementById('time-minutes-subtract-btn');

const focusBtn = document.getElementById('focus-btn');
const tagBtn = document.getElementById('tag-buoy-btn');
const startBtn = document.getElementById('start-btn');

//timerInput -----------------------------------------------------------------------------------------
    //used to set and clear intervals for mouse hold functionality
let mouseHoldTimer; 
let mouseHoldValueChangeSpeed = 125; //in milliseconds

//time  --------------------------------------------------------------------------------------------
    //main time calculation variables
let mins = 30; 
let hours = 0;
    //initial input values -> set when user clicks start button
let minsInput;
let hrsInput;
    //HTML elements timer
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');

//focus  --------------------------------------------------------------------------------------------
let focusSet = false;
let programArray = [];

//TITLEBAR  ########################################################################################################################

document.getElementById('close-main').onclick = function() {
    ipcRenderer.send( 'app:quit' );
}

document.getElementById('minimize-main').onclick = function() {
    ipcRenderer.send( 'app:minimize' );
}

//DATABASE  ########################################################################################################################

function databaseWrite(valueArray){
    var db = new sqlite3.Database('./buoy-db.db');
    db.run('INSERT INTO buoy (programs, tag, time, state, date) VALUES ("' + valueArray[0] + '","' + valueArray[1] + '","' + valueArray[2] + '","' + valueArray[3] + '","' + valueArray[4] +'");"')
    db.close()
}

//thought: insert at 'startonClick' only programs, tag, time, date -> not state
//state=preset to false, gets overwritten in another function e.g databaseWriteState
//function is called at end of timer intervall, if focus has been completed
//https://stackoverflow.com/questions/10843332/how-to-get-last-inserted-row-id-in-sqlite

databaseWrite(["TEST","CREATIVE","mins", 0,"DATUM"])




//MAIN  ########################################################################################################################

if (focusSet == false){ //make sure that focus is set before enabling start button
    disableStartBtn();
}

//TODO: focus set
    //get selected programs by reading the checkboxes' property values
    //implement interval to check for checkbox selection that terminates when user clicks start
    //when user clicks start append value of checkbox to list/array/other data structure

startBtn.onclick = function(){ //starts the timer
    setInputTimes(); //sets the fixed input values for the count variable
    switchButtonStatus(); //switches buttons to unclickable
    styleBuoy(); //styles buoy to indicate that timer is running
    styleBackground();
    let timerInput = (parseInt(hoursElement.textContent) * 1000 * 60 * 60) + (parseInt(minutesElement.textContent) * 1000 * 60); //let timerInput: time input by user parsed from HTML elements and converted into milliseconds
    let startingTime = Date.now(); //let starting time = current system clock local time
    
    

    
    //timer functionality  --------------------------------------------------------------------------------------------
    let timerLogic =  setInterval(function() {
        var delta = Date.now() - startingTime; //delta is time difference from start in ms
        
        //counter
        var count = ((hrsInput*60) + minsInput) - (delta / 1000 / 60); //count takes initial user input values and calculates time passed in float minutes
        if(count < (hours*60 + mins) -1 )

            //minutes html update
            if(minutesElement.textContent != "00"){
                mins--;
                minutesElement.textContent = numberFormatter(mins);
            }
                
            //hours html update 
            else{
                hours--;
                hoursElement.textContent = numberFormatter(hours);
                minutesElement.textContent = numberFormatter(59);
            }
        
        //TODO: focus check 
        

        //timer finished
        if(delta >= timerInput) { 
            switchButtonStatus();
            unstyleBuoy();
            unstyleBackground();
            alert("Time Over");
            clearInterval(timerLogic);
            minutesElement.textContent = numberFormatter(0);
            hoursElement.textContent = numberFormatter(0);
            focusSet = false;
            disableStartBtn();
        }
        }, 1000);
}


//TIMER - Input  ########################################################################################################################

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

//TAGS  ########################################################################################################################

TODO:
//1. add event that triggers on interaction with tag manager input field
//2. event hides/unhides add button depending on status of input field (checks if empty or not) 
//2. hook up add button to add to list below and list of possible tags in buoy input
//3. implement resolve tag functionality, that removes tags from buoy tag list
 

//FOCUS  ########################################################################################################################

//TODO: FIXME: Update focus button on fixed interval
focusBtn.onclick = function(){
    focusSet = true;
    getOpenPrograms();

    enableStartBtn(); //TODO: move to correct position (after focus has been set)
}



//uses electron-desktopcapturer to find open windows / programs 
function getOpenPrograms() {

    desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
        for (const source of sources){
            var parsedSource = parseSource(source.name);

            if (parsedSource == 0)
            {
                continue;
            }
            

            if (!programArray.includes(parsedSource)) {
                programArray.push(parsedSource);
                console.log("Program Array is now: " + programArray);
                addProgramToDropdown(parsedSource);
            }
            

        }});
        
}

//parses results from desktop capturer
function parseSource(unparsedSource) {

    //remove screens
    if (unparsedSource == "Screen 1" || unparsedSource == "Screen 2" || unparsedSource == "Screen 3" || unparsedSource == "Screen 4" || unparsedSource == "Screen 5"){return 0;};

    //remove screens
    if (unparsedSource == "buoy productivity" ||unparsedSource == "buoy-productivity"){return 0;};

    //remove overlays
    if (unparsedSource == "NVIDIA GeForce Overlay"){return 0;}
    
    //parse Browsers
    if(unparsedSource.includes(edge)) {return edge};
    if(unparsedSource.includes(chrome)) {return chrome};

    //parse Applications
    if(unparsedSource.includes(blender)) {return blender};
    if (unparsedSource.includes(vsCode)) {return vsCode};


    return unparsedSource;
}


//adds parsed results from desktop capturer
function addProgramToDropdown(program) {

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
    listItemInput.className += "form-check-input";
    listItemInput.type = "checkbox";
    listItemInput.value ="";
    listItemInput.id = program;
    listItemBox.appendChild(listItemInput);

    //instantiate labels for checkboxes
    var listItemLabel = document.createElement("label");
    listItemLabel.className ="form-check-label";
    listItemLabel.textContent = program;
    listItem.appendChild(listItemLabel);
    listItemBox.htmlFor = program;
    
}


//DEBUG WINDOW CHECKER 10secs
setInterval(function() {

    desktopCapturer.getSources({ types: ['window'] }).then(async sources => {
        for (const source of sources){
        console.log("desktop capturer:")
        console.log(source.name);
        console.log(source.id);
        //FIXME: can't access windowclass could match ID here to active window strip screen of end of id
        //use windows specific lib instead of chrome desktop capturer? https://www.npmjs.com/package/@josephuspaye/list-open-windows
        }
    });

    activeWindows().getActiveWindow().then((result)=>{
        console.log("Active window:")
        console.log(result)
    });

}, 10000)

//UTIL FUNCTIONS   ########################################################################################################################

function switchButtonStatus(){
    startBtn.disabled = !startBtn.disabled;
    addHoursBtn.disabled = !addHoursBtn.disabled;
    addMinutesBtn.disabled = !addMinutesBtn.disabled;
    subtractHoursBtn.disabled = !subtractHoursBtn.disabled;
    subtractMinutesBtn.disabled = !subtractMinutesBtn.disabled;
    focusBtn.disabled = !focusBtn.disabled;
}


function disableStartBtn(){
    startBtn.disabled = true;
    document.getElementById('Rectangle_13').style.display = "none";
    document.getElementById('start').textContent ="";
}

function enableStartBtn(){
    document.getElementById('Rectangle_13').style.display = "unset";
    document.getElementById('start').textContent = "start";
    startBtn.disabled = false;
}

    //formats numbers in timer to contain 0 at beginning
function numberFormatter(number){

    if(number.toString().length < 2){
        number = '0' + number;
    }

    return number;

}

    //sets input times once on start click
function setInputTimes(){
    hrsInput = hours;
    minsInput = mins;
}

    //Input Sanity Checks

    function hoursSanityCheck(){
    
        if (hours == -1)
        {
            hours = 99;
        }
    
        else if (hours >= 99)
        {
            hours = 0; //changed from 1 to 0
        }
    
    }
    
    function minuteSanityCheck(){
        if (mins == -1){
            mins = 59;
        }
        
        if (mins == 60){
            mins = 0;
        }
    }
    


//Styling  ########################################################################################################################

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
    //FIXME:document.getElementById("tagText").textContent = "mytag"; or use POPPER.JS to display chosen tag on hover
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

    //focus buttons
    //DEPRECATED document.getElementById('Ellipse_8').style.fill = primaryGrey;
    //document.getElementById('focus').style.fill = white;
    

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
    
    //background image fade in
    document.getElementById("fade-in-bg").id = "fade-out-bg";

    
}