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
        this.metronomeVolume = this.audioContext.createGain();
        this.metronomeVolume.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.oscillator = this.audioContext.createOscillator();
        this.biquadFilter = this.audioContext.createBiquadFilter();

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
            for (let j = 1; j <= 16; j++) {
                let track = this.grid.getElementsByClassName(`track-${i}-container`).item(0);
                let item = document.createElement('div');
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
    sequenceGridToggler(domEle, arr) {
        $(domEle).on('mousedown', '.grid-item', function() {
            let gridIndexValue = $(this).index();
            let offset = gridIndexValue + 1;
            let index = arr.indexOf(offset);
            if (index > -1) {
                arr.splice(index, 1);
                console.table('splice',arr);
                $(this).css('background', '');
            } else {
                arr.push(offset);
                $(this).css('background', 'purple');
                console.table('push',arr);
            }
        });
    },

    loadEvents(){
        this.sequenceGridToggler(".track-1-container", this.gridPositions.kickTrack);
        this.sequenceGridToggler(".track-2-container", this.gridPositions.snareTrack);
        this.sequenceGridToggler(".track-3-container", this.gridPositions.hatTrack);
        this.sequenceGridToggler(".track-4-container", this.gridPositions.shakerTrack);

    },
    setMetronomeGainValue(e) {
        console.log(e.value);
        
        if(this.metronomeVolume) {
            this.metronomeVolume.gain.setValueAtTime(e.value, this.audioContext.currentTime);
        }
    },

    playMetronome(time) {
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'square';
       
        //this.oscillator.connect(this.metronomeVolume);
        this.oscillator.connect(this.biquadFilter);
        this.biquadFilter.connect(this.metronomeVolume);
        this.metronomeVolume.connect(this.audioContext.destination);

        this.biquadFilter.type = "highpass";
        this.biquadFilter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        this.biquadFilter.gain.setValueAtTime(25, this.audioContext.currentTime);
        
        if (this.counter === 1 || (this.counter - 1)%4 === 0) {
            if(this.counter === 1) {
                this
                    .oscillator
                    .frequency
                    .setValueAtTime(
                        this.options.freqOne, 
                        this.audioContext.currentTime
                    );
            } else {
                this
                    .oscillator
                    .frequency
                    .setValueAtTime(
                        this.options.freqTwo, 
                        this.audioContext.currentTime
                    );
            }
           
            this.oscillator.start(time);
            this.oscillator.stop(time + 0.1); 
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
        if (this.counter === 1) {
            return;
        } else if(this.counter === 16){
            count = this.counter;
        } else{
            count = this.counter - 1;
        }
        let items = $(`.step-${count}`);
        
        $(items).addClass('timer');
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