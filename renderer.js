//VARS ------------------------------------------------------------

//requires
const { ipcRenderer } = require('electron');
var sqlite3 = require('sqlite3').verbose(); //also const?
const { desktopCapturer } = require('electron')
const activeWindows = require('electron-active-window');

//colors
const red = '#DBA993';
const yellow =  "#DBDB93";
const white =  "#FAFAFA";
const primaryGrey = "#474747";
const darkerGrey =  "#3F3F3F";
const lighterGrey =  "#707070";

//buttons
const aboutBtn = document.getElementById('about');
const settingsBtn = document.getElementById('settings');

const addHoursBtn = document.getElementById('time-hours-add-btn');
const addMinutesBtn = document.getElementById('time-minutes-add-btn');
const subtractHoursBtn = document.getElementById('time-hours-subtract-btn');
const subtractMinutesBtn = document.getElementById('time-minutes-subtract-btn');

//const tagBtn;
const focusBtn = document.getElementById('focus-btn')
const startBtn = document.getElementById('start-btn');


//time
    //main time calculation variables
let mins = 30; 
let hours = 0;
    //initial input values -> set when user clicks start button
let minsInput;
let hrsInput;
    //HTML elements timer
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');


//REUSABLE FUNCTIONS   ------------------------------------------------------------

function switchButtonStatus(){
    startBtn.disabled = !startBtn.disabled;
    addHoursBtn.disabled = !addHoursBtn.disabled;
    addMinutesBtn.disabled = !addMinutesBtn.disabled;
    subtractHoursBtn.disabled = !subtractHoursBtn.disabled;
    subtractMinutesBtn.disabled = !subtractMinutesBtn.disabled;
}

    //formats numbers in timer to contain 0 at beginning
function numberFormatter(number){

    if(number.toString().length < 2){
        number = '0' + number;
    }

    return number;

} 

//TITLEBAR  ------------------------------------------------------------



document.getElementById('close-main').onclick = function() {
    ipcRenderer.send( 'app:quit' );
}

document.getElementById('minimize-main').onclick = function() {
    ipcRenderer.send( 'app:minimize' );
}

//DATABASE  ------------------------------------------------------------

function databaseWrite(valueArray){
    var db = new sqlite3.Database('./buoy-db.db');
    db.run('INSERT INTO buoy (programs, tag, time, state, date) VALUES ("' + valueArray[0] + '","' + valueArray[1] + '","' + valueArray[2] + '","' + valueArray[3] + '","' + valueArray[4] +'");"')
    db.close()
}

databaseWrite(["TEST","CREATIVE","mins", 0,"DATUM"])

//TIMER - MAIN  ------------------------------------------------------------

startBtn.onclick = function(){ //starts the timer

    setInputTimes(); //sets the fixed input values for the count variable
    switchButtonStatus(); //switches buttons to unclickable
    styleBuoy(); //styles buoy to indicate that timer is running

    
    let timerInput = (parseInt(hoursElement.textContent) * 1000 * 60 * 60) + (parseInt(minutesElement.textContent) * 1000 * 60); //let timerInput: time input by user parsed from HTML elements and converted into milliseconds
    let startingTime = Date.now(); //let starting time = current system clock local time
    
    
    //main timer functionality
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
        
        
        //timer finished
        if(delta >= timerInput) { 
            switchButtonStatus();
            unstyleBuoy();
            alert("Time Over"); //TODO: PLACEHOLDER ALERT
            clearInterval(timerLogic);
            minutesElement.textContent = numberFormatter(0);
            hoursElement.textContent = numberFormatter(0); 
        }
        }, 1000); //<- interval of 1second 
}

//TIMER - Input  ------------------------------------------------------------

    //onclick Events
addMinutesBtn.onclick = function(){TimerInput(addMinutesBtn);}
addHoursBtn.onclick = function(){TimerInput(addHoursBtn);}
subtractMinutesBtn.onclick = function(){TimerInput(subtractMinutesBtn);}
subtractHoursBtn.onclick = function(){TimerInput(subtractHoursBtn);}
    
    //button functionality and calls to sanitycheck input
function TimerInput(btn) {
    if (btn == addMinutesBtn){
        mins++;
        minuteSanityCheck();
    }
    if (btn == addHoursBtn){
        hours++;
        hoursSanityCheck();
    }
    if (btn == subtractMinutesBtn){
        mins--;
        minuteSanityCheck();
    }   
    if (btn == subtractHoursBtn){
        hours--;
        hoursSanityCheck();
    }

    //update HTML afterwards
    minutesElement.textContent = numberFormatter(mins);
    hoursElement.textContent = numberFormatter(hours);
};

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


//FOCUS  ------------------------------------------------------------



focusBtn.onclick = function(){
    //set focus app and exceptions
}

    //TODO: check set focus app and exceptions
    /*activeWindows().getActiveWindow().then((result)=>{
        console.log(result)
    });*/

//TODO: get list of windows
/*desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
    for (const source of sources) {console.log(source)}});*/



//Buoy Styling  ------------------------------------------------------------

function styleBuoy(){
    document.getElementById('semicolon').style.color = red;
    document.getElementById('hrs-btn-up').style.display = 'none';
    document.getElementById('min-btn-up').style.display = 'none';
    document.getElementById('hrs-btn-down').style.display = 'none';
    document.getElementById('min-btn-down').style.display = 'none';

    //tag button
    document.getElementById('Rectangle_15').style.fill = red;

    //start button
    document.getElementById('Rectangle_13').style.fill = red;
    document.getElementById('start').textContent = "running";
    document.getElementById('start').style.fill = darkerGrey;
    document.getElementById('start').style.transform = "translate(21px, 21px)";


}

function unstyleBuoy(){
    document.getElementById('semicolon').style.color = yellow;
    document.getElementById('hrs-btn-up').style.display = 'unset';
    document.getElementById('min-btn-up').style.display = 'unset';
    document.getElementById('hrs-btn-down').style.display = 'unset';
    document.getElementById('min-btn-down').style.display = 'unset';

    //tag button
    document.getElementById('Rectangle_15').style.fill = yellow;

    //start button
    document.getElementById('Rectangle_13').style.fill ="";
    document.getElementById('start').textContent = "start";
    document.getElementById('start').style.fill = "";
    document.getElementById('start').style.transform = "translate(32px, 21px)";
}