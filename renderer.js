//VARS ------------------------------------------------------------

//colors
const red = '#DBA993';
const yellow =  "#DBDB93";
const white =  "#FAFAFA";
const primaryGrey = "#474747";
const darkerGrey =  "#3F3F3F";
const lighterGrey =   "#707070";

//buttons
const aboutBtn = document.getElementById('about');
const settingsBtn = document.getElementById('settings');

const addHoursBtn = document.getElementById('time-hours-add-btn');
const addMinutesBtn = document.getElementById('time-minutes-add-btn');
const subtractHoursBtn = document.getElementById('time-hours-subtract-btn');
const subtractMinutesBtn = document.getElementById('time-minutes-subtract-btn');

const startBtn = document.getElementById('start-btn');

//time
let mins = 30;
let hours = 0;

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

//FIXME: sanity checks

function hoursSanityCheck(){
    
    if (hours == -1)
    {
        hours = 99;
    }

    else if (hours >= 99)
    {
        hours = 1;
    }

}

function minuteSanityCheck(){
    if (mins == -1){
        mins = 59;
    }
    
    if (mins == 60){
        hours++;
        mins = 0;
    }
}

function numberFormatter(number){

    if(number.toString().length < 2){
        number = '0' + number;
    }

    return number;

} 

//TITLEBAR  ------------------------------------------------------------

const { ipcRenderer } = require( 'electron' );

document.getElementById('close-main').onclick = function() {
    ipcRenderer.send( 'app:quit' );
}

document.getElementById('minimize-main').onclick = function() {
    ipcRenderer.send( 'app:minimize' );
}


//TIMER - MAIN  ------------------------------------------------------------ TODO: consider js worker ?

startBtn.onclick = function(){
    
    switchButtonStatus();
    styleBuoy();

    //let timerInput: time input by user parsed from HTML elements and converted into milliseconds
    let timerInput = (parseInt(hoursElement.textContent) * 1000 * 60 * 60) + (parseInt(minutesElement.textContent) * 1000 * 60);
    //set starting time
    let startingTime = Date.now();

    
    //let timerLogic = main timer functionality
    let timerLogic =  setInterval(function() {
        //delta is time difference from start
        var delta = Date.now() - startingTime;
        //update HTML elements 
        //TODO: add some function that checks every 30seconds (if delta divisible by 30? or 60? maybe) or so if 'minutes' and 'hours' vars have changed and update fields inside of this function instead of main intervall?
        //check if timer has finished
        if(delta >= timerInput) {
            switchButtonStatus();
            document.getElementById('Rectangle_13').style.fill ="";
            unstyleBuoy();
            alert("Time Over");
            clearInterval(timerLogic);
        }
        }, 1000); //<- interval
}

//TIMER - Input  ------------------------------------------------------------

addMinutesBtn.onclick = function(){TimerInput(addMinutesBtn);}
addHoursBtn.onclick = function(){TimerInput(addHoursBtn);}
subtractMinutesBtn.onclick = function(){TimerInput(subtractMinutesBtn);}
subtractHoursBtn.onclick = function(){TimerInput(subtractHoursBtn);}

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

    minutesElement.textContent = numberFormatter(mins);
    hoursElement.textContent = numberFormatter(hours);
};

//Buoy Styling

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
    document.getElementById('Rectangle_13').style.fill = primaryGrey;
    document.getElementById('start').textContent = "start";
    document.getElementById('start').style.fill = white;
    document.getElementById('start').style.transform = "translate(32px, 21px)";
}