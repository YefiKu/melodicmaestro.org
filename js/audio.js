export default {
	tone(synthPack, frequency, duration, volume) {
		synthPack.oscillator.frequency.value = frequency;
		synthPack.gain.gain.value = volume;
		synthPack.gain.connect(synthPack.audioContext.destination);
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				if (!synthPack.oscillator) reject();
				synthPack.gain.disconnect(synthPack.audioContext.destination)
				resolve();
			}, duration)
		})
	},
	delay(duration) {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, duration);
		})
	},
	createSynthPack() {
		let oscillator = audioContext.createOscillator();
		let gain = audioContext.createGain();
		oscillator.connect(gain);
		oscillator.start();
		return {audioContext: audioContext, oscillator: oscillator, gain: gain};
	},
	async playNoteForm(synthPack, form, oneSecond) {
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
				await this.delay(1000 / (oneSecond / form[index].duration));
			} else {
				await this.tone(synthPack, getFrequency(form[index].tone), 1000 / (oneSecond / form[index].duration), form[index].volume);
			}
		}
	}
}