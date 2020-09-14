(function() {
    let DAW = {
        main: document.getElementById('clicker'),
        metronome: document.getElementById('metronome'),
        tempo: document.getElementById('tempo'),
        showTempo: document.getElementById('showTempo'),
        metronomeRange : document.getElementById('metronome_range'),
        init() {
            this.loadEvents();
        },
        loadEvents() {
            this.main.addEventListener('click', () => {
                AudioLoader.init(); 
                Sequencer.init(); 
            });
        
            this.metronome.addEventListener('click', (e) => {
                if (!Sequencer.metronomeVolume) return;

                if (Sequencer.metronomeVolume.gain.value){
                    Sequencer.setMetronomeGainValue({value:0});
                    this.metronome.innerHTML = "[ON] METRONOME";
                } else {
                    Sequencer.setMetronomeGainValue({value:parseFloat(this.metronomeRange.value)});
                    this.metronome.innerHTML = "[OFF] METRONOME";
                }
            });
        
            this.tempo.addEventListener('change', (e) => {
                let value = e.target.value;
                Sequencer.playTick(value);
                this.showTempo.innerHTML = value;
            });
            
            this.metronomeRange.addEventListener('change', (e) => {
                Sequencer.setMetronomeGainValue({value:parseFloat(e.target.value)});
            });
        }
    }

    DAW.init();
    
})();