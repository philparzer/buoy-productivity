//colors
const red = '#DBA993';
const yellow =  "#DBDB93";
const white =  "#FAFAFA";
const primaryGrey = "#474747";
const darkerGrey =  "#3F3F3F";
const lighterGrey =   "#707070";

//buttons  ------------------------------------------------------------
const aboutBtn = document.getElementById('about');
const settingsBtn = document.getElementById('settings');

const addHoursBtn = document.getElementById('time-hours-add-btn');
const addMinutesBtn = document.getElementById('time-minutes-add-btn');
const subtractHoursBtn = document.getElementById('time-hours-subtract-btn');
const subtractMinutesBtn = document.getElementById('time-minutes-subtract-btn');

const startBtn = document.getElementById('start-btn');

//time  ------------------------------------------------------------
let mins = 30;
let hours = 0;


//reusable functions   ------------------------------------------------------------
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

//title bar  ------------------------------------------------------------

const { ipcRenderer } = require( 'electron' );

document.getElementById('close-main').onclick = function() {
    ipcRenderer.send( 'app:quit' );
}

document.getElementById('minimize-main').onclick = function() {
    ipcRenderer.send( 'app:minimize' );
}


//timer-start  ------------------------------------------------------------

startBtn.onclick = function(){
    
    switchButtonStatus();
    document.getElementById('Rectangle_13').style.fill = red;

    
    let timer = parseInt(document.getElementById('minutes').textContent) * 1000 /* Seconds to Mins -->  x60 */;
    let start = Date.now();

    let interval =  setInterval(function() {
        var delta = Date.now() - start;
        if(delta >= timer) {
            switchButtonStatus();
            document.getElementById('Rectangle_13').style.fill ="";
            alert("Time over");
            clearInterval(interval);
        }
        }, 1000);
}

//timer-input  ------------------------------------------------------------

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
        console.log("subtractingminutes")
        mins--;
        minuteSanityCheck();
    }   
    if (btn == subtractHoursBtn){
        hours--;
        hoursSanityCheck();
    }


    
    document.getElementById("minutes").textContent = numberFormatter(mins);
    document.getElementById("hours").textContent = numberFormatter(hours);
};