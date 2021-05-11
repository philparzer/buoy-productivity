//VARS ------------------------------------------------------------

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

const startBtn = document.getElementById('start-btn');

//time
    //main time calculation variables
let mins = 30; 
let hours = 0;
    //initial input values -> set when user clicks start button
let minsInput;
let hrsInput;

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

    setInputTimes(); //sets the fixed input values for the count variable
    switchButtonStatus();
    styleBuoy();

    //let timerInput: time input by user parsed from HTML elements and converted into milliseconds
    let timerInput = (parseInt(hoursElement.textContent) * 1000 * 60 * 60) + (parseInt(minutesElement.textContent) * 1000 * 60);
    //set starting time
    let startingTime = Date.now();

    
    //let timerLogic = main timer functionality
    let timerLogic =  setInterval(function() {
        //delta is time difference from start in ms
        var delta = Date.now() - startingTime;
        
        //counter
        var count = ((hrsInput*60) + minsInput) - (delta / 1000 / 60); //count takes initial user Input values and calculates time passed in seconds
        console.log("count: " + count);

        if(count < (hours*60 + mins) -1 )
            if(minutesElement.textContent != "00"){
                mins--;
                minutesElement.textContent = numberFormatter(mins);
            }
                
            
            else{
                hours--;
                hoursElement.textContent = numberFormatter(hours);
                minutesElement.textContent = numberFormatter(59);
            }


        if(delta >= timerInput) {
            switchButtonStatus();
            //document.getElementById('Rectangle_13').style.fill ="";
            unstyleBuoy();
            alert("Time Over");
            clearInterval(timerLogic);
            minutesElement.textContent = numberFormatter(0);
            hoursElement.textContent = numberFormatter(0);
        }
        }, 1000); //<- interval of 1

    
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
    document.getElementById('Rectangle_13').style.fill = primaryGrey;
    document.getElementById('start').textContent = "start";
    document.getElementById('start').style.fill = white;
    document.getElementById('start').style.transform = "translate(32px, 21px)";
}