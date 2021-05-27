//TODO: stop interval checks when focus dropdown is collapsed to increase performance?
//TODO: think about APPLICATIONFRAMEHOST windows apps
//TODO: electron / buoy itself should probably always be an exception for check
//TODO: snipping tool, search bar, etc should probably always be exceptions for check
//TODO: half-time overlay?


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

//audio  --------------------------------------------------------------------------------------------

const warningAudio = new Audio("./audio/warningSound.mp3");
//TODO: const focusAudio = new Audio("./audio/focusSound.mp3");


//buttons and input fields --------------------------------------------------------------------------------------------

    //title bar fields
const aboutBtn = document.getElementById('about');
const settingsBtn = document.getElementById('settings');
const addTagBtn = document.getElementById('add-tag-input-button')

const createTagElement = document.getElementById("add-tag-input");
const searchElement = document.getElementById('search');
const createTagButton = document.getElementById("add-tag-input-button");
let inputElementCheckInterval;

    //calendar
const showStatsWindowButton = document.getElementById("calendar-btn");

    //buoy input fields
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

let timerLogic;

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


//focus  --------------------------------------------------------------------------------------------

let focusSet = false;
let programArray = []; //array of all open programs (placeholder.exe, placeholder2.exe, ...)
let allowedProgramArray = []; //array of all focus and exception programs chosen by user
let setFocusInterval;

let warningOverlay; //reference to window that is opened when user exits focus
let focusingOverlay;

let recentlyOutOfFocus = false; //state that checks whether user has recently exited focus app


//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




//DEBUG --------------------------------------------------------------------------------



//--------------------------------------------------------------------------------------


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



//TITLEBAR  ########################################################################################################################

//Search



//settings

//about

aboutBtn.onclick = function()
{
    shell.openExternal('https://buoy-productivity.com/'); //TODO: link to about page
}



//Minimize and Quit
document.getElementById('close-main').onclick = function() {
    ipcRenderer.send( 'app:quit' );
}

document.getElementById('minimize-main').onclick = function() {
    ipcRenderer.send( 'app:minimize' );
}


//MAIN  ########################################################################################################################

if (focusSet == false){ //make sure that focus is set before enabling start button
    disableStartBtn();
}


startBtn.onclick = function(){ //starts the main process, timer, focus retrieval and focus check
    
    //preparations
    clearInterval(setFocusInterval);
    retrieveFocusAndExceptions();
    
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

            //main check if active window is in allowed program
            if (allowedProgramArray.includes(result.windowClass)) 
            {
                //checks if user has recently exited focus
                if (recentlyOutOfFocus)
                {
                    //TODO: play focusing... sound
                    focusingOverlay = window.open('html/focusingOverlay.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                    setTimeout(() => {focusingOverlay.close()}, 2000)
                    recentlyOutOfFocus = false;
                }
                
                unfocusedTime = 0;
            }
    
            else 
            {

                if (timerRecentlyEnded){return;}

                recentlyOutOfFocus = true;

                if(unfocusedTime == 0) //triggers message once when user exits focus program, prevents message from being spammed out every second
                {   
                    warningAudio.play();
                    warningOverlay = window.open('./html/warningOverlay.html', '_blank', 'transparent=true,fullscreen=true,frame=false,nodeIntegration=yes, alwaysOnTop=true, focusable=false, skipTaskbar = true');
                }

                if(unfocusedTime == warningGoneAfter)
                {
                    warningOverlay.close();
                }

                unfocusedTime++;
                
                if (unfocusedTime >= maxTimeUnfocused){ //timer finished unsuccesfully
                    
                    endTimer();
                }
            }
        });

        //timer finished succesfully
        if(delta >= timerInput) 
        {
            timerRecentlyEnded = true; //FIXED BUG THAT DISPLAYED WARNING OVERLAY AFTER TIMER ENDS - maybe debug once more?
            endTimer();
        }

    }, 1000);
}


function endTimer (){ 
    switchButtonStatus();
    unstyleBuoy();
    unstyleBackground();
    alert("Time Over");
    
    //cleanup
    recentlyOutOfFocus = false;
    clearInterval(timerLogic);
    minutesElement.textContent = numberFormatter(30);
    hoursElement.textContent = numberFormatter(0);
    focusSet = false;
    unfocusedTime = 0;
    allowedProgramArray = [];
    uncheckCheckmarks();
    disableStartBtn();
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



inputElementCheckInterval = setInterval(function() //checks input in input elements each second
    {  

        if (searchElement.value != "")
        {
            //TODO: search database
        }
        
        if (createTagElement.value != "")
        {   
            //listens to enter input
            

            //sets add button to visible
            createTagButton.style.visibility = "unset";
        }

        else
        {
            createTagButton.style.visibility = "hidden";
        }

    }, 1000)

//creates new tag in both dropdowns new tag when create tag button is pressed
createTagButton.onclick = function()
{
    addNewTag();
}

//adds enter listener to tagmanager input element, creates new tag in both dropdowns
createTagElement.addEventListener("keyup", function(event) {
    if (event.key === "Enter" && createTagElement.value != "") {
        addNewTag();
    }
});


function addNewTag()
{
    createdTagName = createTagElement.value;
    createTagElement.value = "";


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
    }
    
    resolveTagItemBox.textContent = createdTagName;
    resolveTagItem.appendChild(resolveTagItemBox);
    
}


//TODO: ADD CHOSEN TAG TO BUOY WHEN TIMER IS RUNNING

function addTagTooltipOnStart()
{
    //TODO: on StartButtonClick call this function

    //add .tooltip-tag to id="tag-buoy-dropdown-box"
    //instantiate <span id="chosen-tag-tooltip" class="tooltiptext">PLACEHOLDER</span>
    //fill text content of tooltip with chosen tag
}




//SET FOCUS  ########################################################################################################################

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

                programArray.push(programExe);
                addProgramToDropdown(programExe);
            }
        });
    }
}

function parseFilePath(path)
{
    //TODO: Cross Platform "\" (windows) - "/" (Mac) - Linux (WIP) not implemented in windowManager yet -> Mac OS admin access (request accessibility)
    directoryArray = path.split("\\") // "\\" to terminate string literal escape backslash
    return directoryArray[directoryArray.length - 1] // return last item in array
}

function addProgramToDropdown(program) 
{
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
    listItemInput.className += "form-check-input";
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
    var parsedProgram = program.slice(0, -4); //remove .exe
    parsedProgram = parsedProgram.charAt(0).toUpperCase() + parsedProgram.slice(1); //uppercase
    return parsedProgram;
}


//loops over html elements, checks checked checkboxes, pushes checked checkboxes to allowedProgramArray //TODO: later: don't start if no checked checkboxes
function retrieveFocusAndExceptions()
{
    var allCheckboxes = document.querySelectorAll(".form-check-input");
    
    allCheckboxes.forEach(function(element){
        if(element.checked){
            var elementName = element.id;
            allowedProgramArray.push(elementName);
        }
    });
}


//UTIL FUNCTIONS   ########################################################################################################################

//enables or disables the start button depending on correct time input (not zero) and on correct checkbox input (at least one checkbox has been checked)
function enableDisableStartBtn()
{
    var focusChecked = [];
    var focusCheckboxes = document.querySelectorAll(".form-check-input");
    
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
        focuset = false;
        disableStartBtn();
    }
}


function uncheckCheckmarks()
{
    var checks = document.querySelectorAll(".form-check-input");
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
    document.getElementById('start').textContent = "start";
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
    //TODO: document.getElementById("tagText").textContent = "mytag"; or use POPPER.JS to display chosen tag on hover
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


function styleTag()
{
    document.getElementById('Rectangle_15').style.fill = red;
}


//_________________________________________________________________________________________
//STATS

showStatsWindowButton.onclick = function() 
{   
    updateSuccessRate();
}

//Success Rate

function updateSuccessRate()
{
    document.getElementById("kdRatio").innerHTML = "100%"; 
    
    //TODO: calculate Success Rate from data
    //TODO: style sucess rate red, white, or yellow for given range of %
}

//Calendar  ########################################################################################################################
//TODO: use data to color dates red or yellow


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
    months = ["", "", "", "", "", "", "", "", "", "", "", ""];
    days = ["", "", "", "", "", "", ""];
} else if (lang == "ru") {
    months = ["", "", "", "", "", "", "", "", "", "", "", ""];
    days = ["", "", "", "", "", "", ""];
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
showCalendar(currentMonth, currentYear);



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

function showCalendar(month, year) { //TODO: add coloration from data

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
                cell.innerHTML = "<span>" + date + "</span>";

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