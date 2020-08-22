(function($) {
    let main = document.getElementById('clicker');
    let metronome = document.getElementById('metronome');
    let tempo = document.getElementById('tempo');
    let showTempo = document.getElementById('showTempo');

    
    main.addEventListener('click', () => {
        AudioLoader.init(); 
        Sequencer.init(); 
    });

    metronome.addEventListener('click', (e) => {
        if (Sequencer.metronomeVolume.gain.value){
            Sequencer.metronomeVolume.gain.value = 0
        } else {
            Sequencer.metronomeVolume.gain.value = 1;
        }
    });

    tempo.addEventListener('change', (e) => {
        Sequencer.playTick(e.target.value);
        showTempo.innerHTML = e.target.value;
    });

})(jQuery);