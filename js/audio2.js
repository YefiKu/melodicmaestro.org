export default {
}
class Synth {
    audio = [];
    pack = null;
    constructor(obj) {
        this.pack = createAudioPack();
        obj && this.setup(obj);
    }
    setup(obj) {
        let audio = [];
        let last = {};
        for (let part of obj) {
            last.part = {
                clef: [],
                key: {
                    tonality: [0,0],
                    alterations: {
                        tones: [],
                        mode: 0
                    }
                }
                
            }
            for (let measure of part) {
                last.measure = {
                    alterations: []
                }
                for (let line of measure) {
                    for (let e of line) {
                        switch (e.name) {
                            case "clef":
                                last.part.clef = [e.tone,e.line];
                                break;
                            case "key":
                                last.part.key = e;
                                break;
                            case "alteration":
                                break;
                            case "note":
                                audio.push({duration: this.duration*.9, tone: [[this.tone.slice(0,-1), this.alteration], e.tone.slice(-1)], volume: 10}, {duration: e.duration*.1})
                        }
                    }
                }
            }
        }
        this.audio = audio;
    }
    play() {

    }
    pause() {

    }
}
function tone(audioPack, frequency, duration, volume) {
    audioPack.oscillator.frequency.value = frequency;
    audioPack.gain.gain.value = volume;
    audioPack.gain.connect(audioPack.audioContext.destination);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (!audioPack.oscillator) reject();
            audioPack.gain.disconnect(audioPack.audioContext.destination)
            resolve();
        }, duration)
    })
}
function delay(duration) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, duration);
    })
}
function createAudioPack() {
    let oscillator = audioContext.createOscillator();
    let gain = audioContext.createGain();
    oscillator.connect(gain);
    oscillator.start();
    return {audioContext: audioContext, oscillator: oscillator, gain: gain};
}
async function playNoteForm(audioPack, form, oneSecond) {
    function getFrequency(note) {
        let notes = {
            "Do": {
                "flat": 246.94,
                "natural": 261.63,
                "sharp": 277.18
            },
            "Re": {
                "flat": 277.18,
                "natural": 293.66,
                "sharp": 311.13
            },
            "Mi": {
                "flat": 311.13,
                "natural": 329.63,
                "sharp": 349.23
            },
            "Fa": {
                "flat": 329.63,
                "natural": 349.23,
                "sharp": 369.99
            },
            "Sol": {
                "flat": 369.99,
                "natural": 392.00,
                "sharp": 415.30
            },
            "La": {
                "flat": 415.30,
                "natural": 440.00,
                "sharp": 466.16
            },
            "Si": {
                "flat": 466.16,
                "natural": 493.88,
                "sharp": 523.25
            }
        }
        let freq = notes[note[0][0]][note[0][1]];
        freq *= (2 ** (note[1] - 4));
        return freq;
    }
    for (let index in form) {
        if (index % 2) {
            await delay(1000 / (oneSecond / form[index].duration));
        } else {
            await tone(audioPack, getFrequency(form[index].tone), 1000 / (oneSecond / form[index].duration), form[index].volume);
        }
    }
}