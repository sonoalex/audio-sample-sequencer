import AudioLoader from './utils/audiolib';
import Metronome from './metronome';

const Sequencer = {
    options: {
        TEMPO: 125,
        BAR_LENGTH: 16,
        sixteenth:4,
        minuteSeconds:60,
        freqOne: 500,
        freqTwo: 300

    },
    audioContext:null,
    futureTickTime:null,
    counter:1,
    oscillator:null,
    metronomeVolume : null,
    samples:null,
    gridPositions:{
        kickTrack:[],
        snareTrack:[],
        hatTrack:[],
        shakerTrack:[]
    },
    timerId:undefined,
    isPlaying:false,
    grid: document.getElementById('app-grid'),
    
    init() {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
        this.secondsPerBeat = this.options.minuteSeconds/this.options.TEMPO;
        this.counterTimeValue = this.secondsPerBeat/this.options.sixteenth; //16th note (4/4 ) => Each beat has 4 subdivisions
        
        this.constructGrid();

        AudioLoader.audioBatchLoader({
            kick:'audio/kick.wav',
            snare:'audio/snare.wav',
            hat:'audio/hat.wav',
            shaker:'audio/shaker.wav'
        }).then(samples => {
            this.samples = samples;
            this.start();
       });
    },

    start() {
        this.futureTickTime = this.audioContext.currentTime;
        
        this.metronome = new Metronome(new GainNode(this.audioContext));
        this.metronome
            .getGain()
            .setValueAtTime(
                0, 
                this.audioContext.currentTime
            ); 

        this.loadEvents();
        this.play();
    },

    constructGrid() {

        this.grid.innerHTML='';
        let i = 1;

        for (let el in this.gridPositions) {
            let div = document.createElement('div');
            div.classList.add(`track-${i}-container`);
            this.grid.appendChild(div);
            for (let j = 1; j <= this.options.BAR_LENGTH; j++) {
                let track = this.grid.getElementsByClassName(`track-${i}-container`).item(0);
                let item = document.createElement('div');
                if (j==1) item.classList+='timer ';
                if ((j - 1)%4 == 0) {
                    item.classList+=`grid-item track-step-double step-${j}`;
                } else {
                    item.classList+=`grid-item track-step step-${j}`;
                }
                
                track.appendChild(item);  
                this.drawPatterns(item,i,j);
            }
            i++;
        }
    },

    drawPatterns(item, i, j){
        console.log('drawing...');
        Object.entries(this.gridPositions)[i - 1].forEach(el => {
            if (Array.isArray(el)) {
                if (el.indexOf(j) > -1) {
                    item.style.background = 'purple';
                } else {
                    item.style.background = '';
                }
            }
        });
    },
    sequenceGridToggler(domEleClass, arr) {
       
        let domElements = document.getElementsByClassName(domEleClass);
        let domEle = domElements.item(0);
        let elements = domEle.getElementsByClassName('grid-item');
        for (let item of elements) {    
            item.addEventListener(
                'click', 
                (e) => this.handleGridClick(e, elements, arr)
            );
        };
    },
    handleGridClick(e, elements, arr) {

        function findIndexInClass(collection, node) {
            for (var i = 0; i < collection.length; i++) {
              if (collection[i] === node)
                return i + 1;
            }
            return -1;
        }

        let target = e.target;
        let offsetIndex = findIndexInClass(elements, target);
        let positionIndex = arr.indexOf(offsetIndex);
        if (positionIndex > -1) {
            arr.splice(positionIndex, 1);
            target.style.background = '';
        } else {
            arr.push(offsetIndex);
            target.style.background = 'purple';
        }          
    },

    loadEvents(){
        this.sequenceGridToggler("track-1-container", this.gridPositions.kickTrack);
        this.sequenceGridToggler("track-2-container", this.gridPositions.snareTrack);
        this.sequenceGridToggler("track-3-container", this.gridPositions.hatTrack);
        this.sequenceGridToggler("track-4-container", this.gridPositions.shakerTrack);

    },

    setMetronomeGainValue(e) {        
        this.metronome
            .getGain()
            .setValueAtTime(
                e.value, 
                this.audioContext.currentTime
            );
    },

    playMetronome(time) {

        this.metronome.setOscillator(this.audioContext.createOscillator());
        this.metronome.getVolume().connect(this.audioContext.destination);

        if (this.counter === 1 || (this.counter - 1)%4 === 0) {
            if(this.counter === 1) {
                this.metronome
                    .getOscillator()
                    .frequency
                    .setValueAtTime(
                        this.options.freqOne, 
                        this.audioContext.currentTime
                );
            } else {
                this.metronome
                    .getOscillator()
                    .frequency
                    .setValueAtTime(
                        this.options.freqTwo, 
                        this.audioContext.currentTime
                );
            }
           
           this.metronome.start(time);
           this.metronome.stop(time);
        } 
    },

    play() {

        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {            
            this.counter = 1;
            this.futureTickTime = this.audioContext.currentTime;
            this.scheduler();    
        } else {
            window.clearTimeout(this.timerId);
        }
    },

    playTick(tempo) {
        //console.log("This is 16th beat : " + this.counter);
        this.options.TEMPO = tempo;
        this.secondsPerBeat = this.options.minuteSeconds/this.options.TEMPO;
        this.counterTimeValue = this.secondsPerBeat/this.options.sixteenth; //16th note (4/4 ) => Each beat has 4 subdivisions
        this.displayTimer();
        this.playMetronome(this.futureTickTime);
        this.counter+=1;
        
        if(this.counter > this.options.BAR_LENGTH) { 
            this.counter = 1;
        }
    },

    displayTimer() {

        $('.timer').removeClass('timer');
        let count;
        
        // That way does not work well at all
        // let timerElements = document.getElementsByClassName('timer');
        // console.log(timerElements);
        // [].forEach.call(timerElements, (item)=>{item.classList.remove("timer")});
        
        if (this.counter === 1) {
            return;
        } else if(this.counter === 16){
            count = this.counter;
        } else{
            count = this.counter - 1;
        }

        let stepElements = document.getElementsByClassName(`step-${count}`);
        [].forEach.call(stepElements, (item)=>{item.classList.add("timer")});
    },

    scheduler() {
        if (this.futureTickTime < this.audioContext.currentTime + 0.1) {
            this.futureTickTime += this.counterTimeValue;
            //console.log(this.futureTickTime);
            this.scheduleSound(this.gridPositions.kickTrack, this.samples.kick, this.counter, this.futureTickTime - this.audioContext.currentTime);
            this.scheduleSound(this.gridPositions.snareTrack, this.samples.snare, this.counter, this.futureTickTime - this.audioContext.currentTime);
            this.scheduleSound(this.gridPositions.hatTrack, this.samples.hat, this.counter, this.futureTickTime - this.audioContext.currentTime);
            this.scheduleSound(this.gridPositions.shakerTrack, this.samples.shaker, this.counter, this.futureTickTime - this.audioContext.currentTime);
            this.playTick(this.options.TEMPO);
            
        }
        this.timerId = window.setTimeout(this.scheduler.bind(this), 0);
    },
    
    scheduleSound(trackArray, sound, count, time) {
        for (let i = 0; i < trackArray.length; i++) {
            if (count === trackArray[i]) {
                sound.play(time);
            }
        }
    }
};

export {Sequencer as default}