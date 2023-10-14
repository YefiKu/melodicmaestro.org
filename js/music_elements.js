const whole_note = 64;
import {default as SVG} from './svg.js';
import {default as Synth} from './audio.js';
class MusicElement {
	parent = null;
	index = null;
	#color = 'black';
	#coords = null;
	isSelected = false;
	constructor() {}
	get color() {
		return this.#color;
	}
	set color(val) {
		this.#color = val;
		this.update?.();
	}
	insertTo(i) {
		this.parent.parent.measures[i[0]].elements.splice(i[1], 0, this);
		this.parent = this.parent.parent.measures[i[0]];
		this.index = i[1];
		this.parent.parent ? this.parent.parent.reindexing() : this.parent.reindexing();
	}
	remove(doNotRemoveParent) {
		if (this instanceof Measure) {
			if (this.parent.measures.length !== 1 || this.parent.parent.lines.length !== 1) {
				this.parent.measures.splice(this.index, 1);
				this.index = null;
			}
			if (!this.parent.measures.length && !doNotRemoveParent) this.parent.remove();
			else this.parent.reindexing();
		} else if (this instanceof Stave) {
			this.parent.lines.splice(this.index, 1);
		} else {
			this.parent.elements.splice(this.index, 1);
			this.index = null;
			if (!this.parent.elements.length && !doNotRemoveParent) this.parent.remove();
			else this.parent.parent.reindexing();
		}
	}
	set coords(val) {
		this.#coords = val;
		this.update?.()
	}
	get coords() {
		if (this.constructor.name === "Measure") {
			return this.parent?.coordinates?.([this.index,0]) || this.#coords;
		}
		return this.parent?.coordinates?.(this.index) || this.#coords;
	}
	select() {
		if (this.selectable) {
			if (this.isSelected) this.color = 'black';
			else {
				this.color = 'gold';
			}
			this.isSelected = !this.isSelected;
			if (this.constructor.name === "Key") this.alterations.tones.forEach(a => a.color = this.#color);
		}
	}
}
class Note extends MusicElement {
	#position = null;
	#tone = null;
	constructor(duration, type, data, points = 0) {
		super();
		if (!Number.isInteger(Math.log2(duration))) throw 'Illegal duration of the note';
		this.duration = duration;
		if (type === "tone") 
			this.#tone = data;
		else this.#position = data;
		this.parts = {head: duration < whole_note*2, fill: duration < whole_note/2, body: duration < whole_note, tail: Math.max(Math.log2(parseInt(whole_note/8/duration)) + 1, 0), point: points};
		this.element = SVG('g', true, {});
	}
	checkPos = true;
	clone() {
		return new Note(this.duration, "tone", this.tone, this.parts.point);
	}
	get tone() {
		let t = this.#position !== null ? this.parent?.systemNotes("tone", this.#position, this.index) : undefined;
		return t === undefined ? this.#tone : t;
	}
	set tone(t) {
		this.#tone = t;
	}
	get position() {
		let pos = this.#tone ? this.parent?.systemNotes("position", this.#tone, this.index) : undefined;
		return this.#position === null ? pos : this.#position;
	}
	set position(pos) {
		this.#position = pos;
	}
	get alteration() {
		return this.parent.alterations(this.tone, this.index) || this.parent?.parent.key(this.tone, [this.parent.index, this.index]) || "natural";
	}
	click() {
		this.play(this.parent.parent.parent.getPlayPack(), this.parent.parent.parent.temp);
	}
	drag() {
		
	}
	width(height) {
		let totalWidth = 0;
		if (this.parts.head) totalWidth += height / 4 * 2;
		if (this.parts.tail && this.position > 4) totalWidth += height/4;
		return totalWidth;
	}
	get form() {
		return [{duration: this.duration*.9, tone: [[this.tone.slice(0,-1), this.alteration], this.tone.slice(-1)], volume: 10}, {duration: this.duration*.1}];
	}
	async play(playPack, temp) {
		await Synth.playNoteForm(playPack, this.form, temp/60*whole_note);
	}
	update() {
		let {bottom, x, top} = this.coords;
		let parts = [];
		let width = (bottom - top) / 4;
		let pos = top + this.position * width / 2;
		let baseStyles = {fill: 'none', stroke: this.color, 'stroke-width': width/8};
		let drawLineUp = this.position > 4;
		let additional_lines_top = Math.round((this.position < -1) * (-1 - this.position) / 2);
		let additional_lines_bottom = Math.round((this.position > 9) * (this.position - 9) / 2);
		let d = '';
		if (this.parts.head) {
			let head = SVG('path', true, {d: `M${x},${pos + width / 4} a${width/2} ${width/4} -45 0 0 ${width} ${-width/2} M${x},${pos + width / 4} a${width/2} ${width/4} -45 0 1 ${width} ${-width/2}`, ...baseStyles, fill: (this.parts.fill ? this.color : 'none')});
			parts.push(head);
		}
		if (this.parts.body) {
			let x1 = drawLineUp ? x + width : x,
				x2 = x1,
				y1 = drawLineUp ? pos - width/4 : pos + width/4,
				y2 = drawLineUp ? y1 - width*4 : y1 + width*4;
			let body = SVG('line', true, {x1:x1,x2:x2,y1:y1,y2:y2, ...baseStyles});
			parts.push(body);
		}
		if (this.parts.tail) {
			let tails = SVG('g', true);
			let x1 = drawLineUp ? x + width : x,
				y1 = drawLineUp ? pos - width/4 - width*4 : pos + width/4 + width*4;
			for (let i = 0; i < this.parts.tail; i++) 
				tails.append(SVG('path', true, {d: (drawLineUp ? `M${[x1,y1+i*width]} l${[width,width]} a${[Math.sqrt((width)**2/2),Math.sqrt((width)**2/2)]} 0 0 1 0 ${width}`:`M${[x1,y1-i*width]} l${[width,-width]} a${[Math.sqrt((width)**2/2),Math.sqrt((width)**2/2)]} 0 0 0 0 ${-width}`), ...baseStyles}));
			parts.push(tails);
		}
		if (this.parts.point) {
			let cx = x+width*2,
				cy = pos,
				r = width/5;
			let point = SVG('circle', true, {cx:cx,cy:cy,r:r});
			parts.push(point);
		}
		if (additional_lines_top) {
			let lines = [];
			for (let i = 1; i <= additional_lines_top; i++) {
				lines.push(SVG('line', true, {x1: x-width/4, x2: x+width+width/4, y1: top-i*width, y2: top-i*width, ...baseStyles}))
			}
			parts.push(...lines);
		} else if (additional_lines_bottom) {
			let lines = [];
			for (let i = 1; i <= additional_lines_bottom; i++) {
				lines.push(SVG('line', true, {x1: x-width/4, x2: x+width+width/4, y1: bottom+i*width, y2: bottom+i*width, ...baseStyles}))
			}
			parts.push(...lines);
		}
		parts.push(SVG('rect', true, {x:x,y:top,height:bottom-top,width:this.width(bottom-top), fill: 'transparent', stroke: 'none'}));
		this.element.innerHTML = '';
		this.element.append(...parts);
	}
}
class Measure extends MusicElement {
	elements = [];
	constructor(duration) {
		super();
		this.duration = duration || 0;
	}
	get times() {
		let lastTime = this.last(Time);
		let times = lastTime.defaultTimes;
		times = times.map(t => this.duration/t);
		let tree = [];
		this.elements.forEach(el => {
			el.duration;
		})
	}
	clone() {
		return new Measure(this.duration);
	}
	key(tone, index) {
		return this.parent.key(tone, [this.index, index]);
	}
	get selectedElements() {
		return this.elements.filter(el => el.isSelected);
	}
	unselectAll() {
		this.selectedElements.forEach(el => el.select());
	}
	async play(playPack, temp) {
		for (let i in this.elements) {
			if (this.elements[i].play) {
				await this.elements[i].play(playPack, temp);
			}
		}
	}
	last(element, index = this.elements.length-1) {
		return this.parent.last(element, [this.index, index]);
	}
	coordinates(i = 0) {
		return this.parent.coordinates([this.index, i]);
	}
	reindexing() {
		let i = -1;
		this.elements.forEach(e => {
			if (!e.chord) i++;
			e.index = i;
			e.update();
		});
	}
	append(element, index = this.elements.length) {
		try {
			switch (element.constructor.name) {
			case 'Time':
				this.duration = whole_note/element.durations.number * element.count.number;
				break;
			}
			element.parent = this;
			this.elements.splice(index, 0, element);
			this.reindexing();
			element.select();
			return true;
		} catch (err) {
			return false;
		}
	}
	alterations(tone, index) {
		let changedAlterations = {};
		for (let el of this.elements.slice(0, index)) 
			if (el.constructor.name === 'Alteration') changedAlterations[el.tone] = el.name;
		return changedAlterations[tone];
	}
	systemNotes(type, data, index) {
		return this.parent.systemNotes(type, data, [this.index, index]);
	}
	width(height) {
		let totalWidth = 0;
		for (let i in this.elements) {
			totalWidth += this.elements[i].width(height) + height/12;
		}
		return totalWidth;
	}
	get freeSpace() {
		return this.duration - this.elements.reduce((prev, cur) => prev + (cur.duration || 0), 0)
	}
	getSVG(x, top, bottom) {
		this.reindexing();
		let svgElements = [];
		svgElements.push(SVG('line', true, {x1: x, x2: x, y1: top, y2: bottom, stroke: this.color, 'stroke-width': (bottom-top)/25}));
		x += (bottom-top)/8
		for (let i of this.elements) {
			svgElements.push(i.element);
			x += i.width(bottom-top) + (bottom-top)/12;
		}
		return svgElements;
	}
}
class Key extends MusicElement {
	constructor(type, data) {
		super();
		let semitones = {
			"Do": {
				"flat": 11,
				"natural": 0,
				"sharp": 1
			},
			"Re": {
				"flat": 1,
				"natural": 2,
				"sharp": 3
			},
			"Mi": {
				"flat": 3,
				"natural": 4,
				"sharp": 5
			},
			"Fa": {
				"flat": 4,
				"natural": 5,
				"sharp": 6
			},
			"Sol": {
				"flat": 6,
				"natural": 7,
				"sharp": 8
			},
			"La": {
				"flat": 8,
				"natural": 9,
				"sharp": 10
			},
			"Si": {
				"flat": 10,
				"natural": 11,
				"sharp": 0
			}
		}
		let sharps = ["Fa", "Do", "Sol", "Re", "La", "Mi", "Si"]; // #
		let flats = ["Si", "Mi", "La", "Re", "Sol", "Do", "Fa"]; // b
		let notes = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
		let alterations = {name: "", tones: []};
		let tonality = [];
		switch (type) {
			case "tonality":
				tonality = data;
				if (data[1] === "flat" || (data[1] === "natural" && data[0] === "Fa")) {
					let tonality_in_semitones = 12 - semitones[data[0]][data[1]];
					let alterations_count = tonality_in_semitones % 2 ? (tonality_in_semitones + 6) % 12 : tonality_in_semitones;
					alterations.tones = flats.slice(0, alterations_count);
					alterations.name = "flat";
				} else {
					let tonality_in_semitones = semitones[data[0]][data[1]];
					let alterations_count = tonality_in_semitones % 2 ? (tonality_in_semitones + 6) % 12 : tonality_in_semitones;
					alterations.tones = sharps.slice(0, alterations_count);
					if (alterations.tones.length) alterations.name = "sharp";
				}
				break;
			case "alterations": 
				alterations.name = data[1];
				alterations.tones = data[1] === 'flat' ? flats.slice(0, data[0]) : sharps.slice(0, data[0]);
				if (data[1] === "sharp") {
					tonality[0] = notes[(alterations.tones.length * 4)%7];
					tonality[1] = Object.keys(semitones[tonality[0]]).find(k=>semitones[tonality[0]][k]===(data[0] * 7)%12);
				} else if (data[1] === "flat") {
					tonality[0] = notes[(28-alterations.tones.length * 4)%7];
					tonality[1] = Object.keys(semitones[tonality[0]]).find(k=>semitones[tonality[0]][k]===(60-data[0] * 7)%12);
				}
		}
		alterations.tones = alterations.tones.map((a,i) => {
			let newChild = new Alteration(alterations.name, "tone", a);
			newChild.selectable = true;
			newChild.parent = this;
			newChild.index = i;
			return newChild;
		});
		this.tonality = tonality;
		this.element = SVG('g', true);
		this.alterations = alterations;
	}
	clone() {
		return new Key("tonality", this.tonality);
	}
	systemNotes(type, data, index) {
		if (type === "position") {
			let octaves = {
				"Do": {
					0: [[3,3,3,3,2,3,2],[2,3,2,3,3,3,3]],
					2: [[3,2,3,2,3,2,3],[3,4,3,4,3,4,3]],
					4: [[4,4,4,4,3,4,3],[3,4,3,4,3,4,3]],
					6: [[4,4,4,4,3,4,3],[3,4,3,4,4,4,4]],
					8: [[4,5,4,5,4,5,4],[4,5,4,5,4,5,4]]
				},
				"Fa": {
					0: [[3,3,3,3,3,3,2],[2,3,2,3,2,3,2]],
					2: [[3,3,3,3,3,3,2],[2,3,2,3,2,3,2]],
					4: [[3,3,3,3,3,3,2],[2,3,2,3,3,3,3]]
				},
				"Sol": {
					6: [[5,5,5,5,4,5,4],[4,5,4,5,4,5,4]]
				}
			}
			let cl = this.parent.last(Clef, this.index);
			data += octaves[cl.tone.slice(0,-1)][cl.position][this.alterations.name === "sharp" ? 0 : 1][index];
		}
		return this.parent.systemNotes(type, data, this.index);
	}
	coordinates(i) {
		let c = this.parent?.coordinates?.(this.index) || this.coords;
		let x = i * (this.alterations.tones[0]?.width(c.bottom-c.top)||0);
		return {...c, x: c.x+x};
	}
	width(height) {
		return (this.alterations.tones[0]?.width(height)||0) * this.alterations.tones.length;
	}
	update() {
		this.element.innerHTML = '';
		for (let i in this.alterations.tones) {
			this.alterations.tones[i].update();
			this.element.append(this.alterations.tones[i].element);
		}
		let {x, top, bottom} = this.coords;
		this.element.append(SVG('rect', true, {x:x,y:top,height:bottom-top,width:this.width(bottom-top), fill: 'transparent', stroke: 'none'}));
	}
}
class Stave extends MusicElement {
	measures = [];
	constructor(x, y, width, height) {
		super();
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.lastOBJ = {
			time: []
		}
	}
	clone() {
		return new Stave(this.x, this.y, this.width, this.height);
	}
	get selectedElements() {
		return this.measures.map(m => m.selectedElements).reduce((prev, cur) => prev.concat(cur), []);
	}
	get elements() {
		return this.measures.reduce((prev,cur) => prev.concat(cur.elements), []);
	}
	unselectAll() {
		this.measures.forEach(m => m.unselectAll());
	}
	coordinates(i=0) {
		return {
			top: this.y,
			bottom: this.y + this.height,
			x: this.measures.slice(0, i[0]).reduce((prev,cur) => prev + cur.width(this.height), this.x) + this.measures[i[0]].elements.slice(0, i[1]).reduce((prev, cur) => prev + cur.width(this.height), this.height/8)
		}
	}
	last(element, index) {
		if (!this.measures[0] || !this.measures[0].elements[0]) return null;
		index = index || [this.measures.length-1, this.measures.at(-1)?.elements.length]
		if (this.parent) return this.parent.last(element, [this.index, ...index]);
		else {
			while (!(this.measures[index[0]]?.elements[--index[1]] instanceof element) && index[0]+1) {
				if (index[1] < 0) index[1] = this.measures[--index[0]]?.elements.length;
			}
			if (index[0] < 0) return null;
			return this.measures[index[0]].elements[index[1]];
		}
	}
	async play(playPack, temp) {
		for (let i in this.measures) {
			await this.measures[i].play(playPack, temp);
		}
	}
	get freeSpace() {
		return this.width - this.measures.reduce((prev, cur) => prev + cur.width(this.height), 0);
	}
	reindexing() {
		this.measures.forEach((m,i) => {
			m.index = i;
			m.reindexing();
		});
		this.parent?.onupdate?.();
	}
	appendMeasure() {
		let newMeasure = new Measure(this.measures.at(-1) ? this.measures.at(-1).duration : whole_note / this.lastOBJ.time[1] * this.lastOBJ.time[0]);
		newMeasure.parent = this;
		this.measures.push(newMeasure);
		this.reindexing();
	}
	systemNotes(type, data, index) {
		let lastClef = this.last(Clef, index);
		if (!lastClef) return;
		let notes = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
		let note = notes.indexOf(lastClef.tone.slice(0,-1));
		let octave = +lastClef.tone.slice(-1);
		let base = parseInt(octave*10+note, 7) + parseInt(lastClef.position, 7);
		let decimalTone;
		switch (type) {
		case 'position':
			let note = notes.indexOf(data.slice(0,-1));
			let octave = +data.slice(-1);
			decimalTone = parseInt(octave*10+note, 7);
			return base - decimalTone;
		case 'tone':
			decimalTone = base - data;
			return notes[decimalTone%7] + parseInt(decimalTone / 7);
		}
	}
	key(tone, index) {
		let lastKey = this.last(Key, index);
		if (!lastKey) return;
		let alterations = lastKey.alterations;
		return alterations.tones.map(a => a.tone).includes(tone.slice(0,-1)) ? alterations.name : "natural";
	}
	append(element) {
		try {
			let duration = element.duration || 0;
			switch (element.constructor.name) {
				case "Time":
					this.lastOBJ.time = [element.count.number, element.durations.number]
			}
			if (!this.measures.at(-1) || this.measures.at(-1).freeSpace < duration) this.appendMeasure(); 
			let result = this.measures.at(-1).append(element);
			if (!result) throw '!';
			this.parent?.onupdate?.();
			return true;
		} catch (err) {
			return false;
		}
	}
	getSVG() {
		let group = SVG('g', true);
		for (let i = 0; i < 5; i++) {
			group.append(SVG('line', true, {x1: this.x, x2: this.x + this.width, y1: this.height/4*i + this.y, y2: this.height/4*i + this.y, stroke: 'black', 'stroke-width': this.height/40}));
		}
		let x = this.x;
		for (let i in this.measures) {
			group.append(...this.measures[i].getSVG(x, this.y, this.height + this.y));
			x += this.measures[i].width(this.height);
		}
		group.append(SVG('line', true, {x1: this.x + this.width, x2: this.x + this.width, y1: this.y, y2: this.y + this.height, stroke: 'black', 'stroke-width': this.height/40}))
		return group;
	}
}
class Clef extends MusicElement {
	constructor(tone, position) {
		super();
		switch (tone) {
			case "Sol": tone += 4;break
			case "Fa": tone += 3;break
			case "Do": tone += 4
		}
		if (!['Sol4', 'Fa3', 'Do4'].includes(tone)) throw 'Illegal tone for clef.'
		this.tone = tone;
		this.position = position;
		this.element = SVG('g', true);
	}

	clone() {
		return new Clef(this.tone, this.position);
	}
	width(height) {
		if (this.tone === 'Sol4') return height/5*3;
		else if (this.tone === 'Fa3') return height/5*4;
		else if (this.tone === 'Do4') return height/5*4;
	}
	update() {
		let {bottom, x, top} = this.coords;
		let pos = top + (bottom - top)/8 * this.position;
		let width = (bottom - top)/4;
		let d;
		let baseStyles = {'stroke-width': width/5};
		switch (this.tone) {
			case 'Sol4':
				baseStyles.stroke = this.color;
				baseStyles.fill = 'none';
				d = `M${[x+width,pos]} a${[width/2,width/2]} 0 0 1 ${width} 0 a${[width*0.75,width*0.75]} 0 0 1 ${-width*1.5} 0 L${[x+width*2,top]} a${[width/4,width/4]} 0 0 0 ${-width/2} 0 V ${bottom+width/2} a${[width/4,width/4]} 0 0 1 ${-width/2} 0`;
				break;
			case 'Fa3':
				baseStyles.stroke = this.color;
				baseStyles.fill = 'none';
				d = `
					M${[x,pos]} a${[width/2,width/2]} 0 0 0 ${width} 0 M${[x,pos]} a${[width/2,width/2]} 0 0 1 ${width} 0
					M${[x,pos]} a${[width*1.25,width*1.25]} 0 0 1 ${width*2.5} 0 a${[width*1.25,width*2.5]} 0 0 1 ${[-width*1.25,width*2.5]} 
					M${[x+width*2.9,pos-width/2]} a${[width/8,width/8]} 0 0 0 ${width/4} 0 M${[x+width*2.9,pos-width/2]} a${[width/8,width/8]} 0 0 1 ${width/4} 0
					M${[x+width*2.9,pos+width/2]} a${[width/8,width/8]} 0 0 0 ${width/4} 0 M${[x+width*2.9,pos+width/2]} a${[width/8,width/8]} 0 0 1 ${width/4} 0
				`
				break;
			case 'Do4':
				baseStyles.stroke = this.color;
				baseStyles.fill = 'none';
				d = `
					M${[x,pos-width*2]} v${width*4} h${width/4} v${-width*4} h${-width/4} M${[x+width,pos-width*2]} v${width*4}
					M${[x+width*2,pos-width*2]} a${[width*0.75,width*0.75]} 0 0 1 0 ${width*1.5} v${width} a${[width*0.75,width*0.75]} 0 0 1 0 ${width*1.5}
					M${[x+width*2.9,pos-width/2]} a${[width/8,width/8]} 0 0 0 ${width/4} 0 M${[x+width*2.9,pos-width/2]} a${[width/8,width/8]} 0 0 1 ${width/4} 0
					M${[x+width*2.9,pos+width/2]} a${[width/8,width/8]} 0 0 0 ${width/4} 0 M${[x+width*2.9,pos+width/2]} a${[width/8,width/8]} 0 0 1 ${width/4} 0
				`
				break;
		}
		this.element.innerHTML = '';
		SVG(this.element, false, {}, [SVG('path', true, {d:d, ...baseStyles}), SVG('rect', true, {x:x,y:top,height:bottom-top,width:this.width(bottom-top),fill:"transparent",stroke:"none"})]);
	}

}
class Note_number {
	constructor(number) {
		this.number = '' + number;
	}
	clone() {
		return new Note_number(this.number);
	}
	width(height) {
		return height * this.number.length;
	}
	getSVG(x, top, bottom) {
		let text = SVG('text', true);
		text.append(this.number);
		SVG(text, false, {style: `fill: ${this.parent.color}; font: ${(bottom-top)/.75}px sans-serif; font-weight: 100`, 'dominant-baseline': 'hanging', x: x, y: top});
		return text;
	}
}
class Time extends MusicElement {
	constructor(count, durations) {
		super();
		this.count = new Note_number(count);
		this.durations = new Note_number(durations);
		this.count.parent = this.durations.parent = this;
		this.element = SVG('g', true);
	}
	get defaultTimes() {
		let times = +this.count.number;
		if (times > 5 && !(times % 3)) times /= 3;
		let subs = +this.count.number / times;
		if (subs === 1) subs++;
		return [times, subs]; 
	}
	clone() {
		return new Time(this.count.number, this.durations.number);
	}
	width(height) {return this.count.width(height/2)}
	update() {
		let {x, top, bottom} = this.coords;
		let height = bottom - top;
		this.element.innerHTML = '';
		this.element.append(this.count.getSVG(x, top, top + height/2), this.durations.getSVG(x, top+height/2, bottom));
		this.element.append(SVG('rect', true, {x:x,y:top,height:bottom-top,width:this.width(bottom-top),fill:"transparent",stroke:"none"}))
	}
}
class Pause extends MusicElement {
	constructor(duration) {
		super();
		if (!Number.isInteger(Math.log2(duration))) throw 'Illegal duration of the pause';
		this.duration = duration;
		this.element = SVG('g', true);
	}
	clone() {
		return new Pause(this.duration);
	}
	async play(playPack, temp) {
		await Synth.delay(this.duration / (temp / 60) * 1000);
	}
	width(height) {
		switch (this.duration) {
		case 64:
		case 32:
		case 8:
		case 4:
		case 2:
		case 1:
			return height/5*2;
		case 16:
			return height/5;
		}
	}
	update() {
		let {bottom, x, top} = this.coords;
		let width = (bottom - top) / 4;
		let d;
		let styles;
		switch (this.duration) {
		case 64:
			d = `M${[x,top+width]} v${width*0.75} h${width*2} v${-width*0.75} z`;
			styles = {stroke: 'none', fill: this.color};
			break;
		case 32:
			d = `M${[x,top+width*2]} v${-width*0.75} h${width*2} v${width*0.75} z`;
			styles = {stroke: 'none', fill: this.color};
			break;
		case 16:
			d = `
				M${[x,top+width/2]} a${[width/4,width/2]} 0 0 1 0 ${width} l${[width/4,width/2]} Q${[[x-width/4,top+width*2.25],[x+width/2,top+width*3]].join(' ')} 
				a${[Math.sqrt((width/4)**2+(-width*0.75)**2), Math.sqrt((width/4)**2+(-width*0.75)**2)]} 0 0 1 ${[width/4,-width*0.75]}
				a${[width/4,width*0.65]} 0 0 1 0 ${-width*1.3} z
			`;
			styles = {stroke: 'none', fill: this.color};
			break;
		case 8:
			d = `
				M${[x,top+width*1.5]} a${[width*0.75,width/3]} 0 0 0 ${[width*1.5,0]} 
				M${[x+width*1.5,top+width*1.5]} l${[-width/2,width*3]}
			`
			styles = {fill: 'none', stroke: this.color}
			break;
		case 4:
			d = `
				M${[x,top+width*1.5]} a${[width*0.75,width/3]} 0 0 0 ${[width*1.5,0]}
				M${[x-width/8,top+width*2.5]} a${[width*0.75,width/3]} 0 0 0 ${[width*1.5,0]}
				M${[x+width*1.5,top+width*1.5]} l${[-width/2,width*3]}
			`
			styles = {fill: 'none', stroke: this.color}
			break;
		case 2:
			d = `
				M${[x,top+width*0.5]} a${[width*0.75,width/3]} 0 0 0 ${[width*1.5,0]}
				M${[x-width/8,top+width*1.5]} a${[width*0.75,width/3]} 0 0 0 ${[width*1.5,0]}
				M${[x-width/4,top+width*2.5]} a${[width*0.75,width/3]} 0 0 0 ${[width*1.5,0]}
				M${[x+width*1.5,top+width*0.5]} l${[-width/2,width*4]}
			`
			styles = {fill: 'none', stroke: this.color}
			break;
		case 1:
			d = `
				M${[x,top+width*0.5]} a${[width*0.75,width/3]} 0 0 0 ${[width*1.5,0]}
				M${[x-width/8,top+width*1.5]} a${[width*0.75,width/3]} 0 0 0 ${[width*1.5,0]}
				M${[x-width/4,top+width*2.5]} a${[width*0.75,width/3]} 0 0 0 ${[width*1.5,0]}
				M${[x-width/2,top+width*3.5]} a${[width*0.75,width/3]} 0 0 0 ${[width*1.5,0]}
				M${[x+width*1.5,top+width*0.5]} l${[-width/2,width*4]}
			`
			styles = {fill: 'none', stroke: this.color}
			break;
		}
		this.element.innerHTML = '';
		SVG(this.element, false, {}, [SVG('path', true, {d:d, 'stroke-width': width/5, ...styles}), SVG('rect', true, {x:x,y:top,height:bottom-top,width:this.width(bottom-top),fill:"transparent",stroke:"none"})]);
	}
}
class Alteration extends MusicElement {
	#position = null;
	#tone = null;
	constructor(name, type, data) {
		super();
		if (!['natural','sharp','flat'].includes(name)) throw new Error(`Does not exist alteration '${name}'`);
		this.name = name;
		if (type === "tone") 
			this.#tone = data;
		else this.#position = data;
		this.element = SVG('g', true);
	}
	checkPos = true; 
	clone() {
		return new Alteration(this.name, "tone", this.tone);
	}
	get tone() {
		let t = this.#position !== null ? this.parent?.systemNotes("tone", this.#position, this.index) : undefined;
		return t === undefined ? this.#tone : t;
	}
	set tone(t) {
		this.#tone = t;
	}
	get position() {
		let pos = this.#tone ? this.parent?.systemNotes("position", this.#tone, this.index) : undefined;
		return this.#position === null ? pos : this.#position;
	}
	set position(pos) {
		this.#position = pos;
	}
	width(height) {
		if (this.name === "sharp") return height/5*2;
		else return height/5*1.5
	}
	update() {
		let {bottom, x, top} = this.coords;
		let width = (bottom - top) / 4;
		let pos = top + this.position * width / 2;
		let styles = {stroke: this.color, fill: 'none', 'stroke-width': width/5}
		let d;
		switch (this.name) {
		case 'sharp':
			//'♯♭'
			d = `
				M${[x+width/4,pos-width*1.25]} v${width*2.75} M${[x+width*1.25,pos-width*1.5]} v${width*2.75} 
				M${[x,pos-width/2]} L ${[x+width*1.5,pos-width*0.75]} M${[x,pos+width/2]} L ${[x+width*1.5,pos+width*0.25]}
			`;
			break;
		case 'flat':
			d = `
				M${[x,pos-width/2]} Q${[[x+width*1.5,pos-width/4],[x,pos+width/2]].join(' ')} v-${width*4}
			`
			break;
		case 'natural':
			d = `
				M${[x,pos+width/2]} v-${width*2.5} M${[x,pos+width/2]} h${width} M${[x,pos-width/2]} h${width} v${width*2.5}
			`
			break;
		}
		this.element.innerHTML = '';
		SVG(this.element, false, {}, [
			SVG('path', true, {d:d,...styles}),
			SVG('rect', true, {x:x,y:top,height:bottom-top,width:this.width(bottom-top),fill:"transparent",stroke:"none"})
		]);
	}
}
class Sheet {
	lines = [];
	temp = 30;
	activeElement = null;
	#playpack = null;
	constructor(svgContext) {
		this.svgContext = svgContext;
		svgContext.onpointerup = e => {
			if (e.target === svgContext) this.unselectAll();
		}
		let ondown = event => {
			let el = this.searchElement(this.convertPosition("px",event.offsetX), this.convertPosition("px",event.offsetY));
			this.activeElement = el;
			el.select();
			let onup = () => {
				svgContext.removeEventListener('mousemove', ondrag);
				svgContext.removeEventListener('mouseup', onup);
			}
			let ondrag = event => {
				if (el.checkPos) {
					let coo = el.coords;
					let pos = this.convertPosition("px", event.offsetY);
					let u = (coo.bottom - coo.top) / 8;
					pos -= coo.top - u/2;
					pos /= u;
					pos = Math.floor(pos);
					if (typeof el.checkPos === "function") el.checkPos(pos) ? el.position = pos : 0;
					else el.position = pos;
				}
				el.remove(true);
				el.insertTo(this.searchIndex(this.convertPosition("px", event.offsetX)));
				el.drag?.(event);
			}
			svgContext.addEventListener('mousemove', ondrag);
			svgContext.addEventListener('mouseup', onup);
		}
		let onmobileend = event => {
			this.activeElement = null;
		}
		let onmobiledrag = event => {
			if (this.activeElement ||1) {
				//event.preventDefault();
				let offsetX = event.targetTouches[0].pageX - svg.getBoundingClientRect().x;
				let offsetY = event.targetTouches[0].pageY - svg.getBoundingClientRect().y;
				this.activeElement = this.searchElement(this.convertPosition("px",offsetX), this.convertPosition("px",offsetY));
				let el = this.activeElement;
				if (el.checkPos) {
					let coo = el.coords;
					let pos = this.convertPosition("px", offsetY);
					let u = (coo.bottom - coo.top) / 8;
					pos -= coo.top - u/2;
					pos /= u;
					pos = Math.floor(pos);
					if (typeof el.checkPos === "function") el.checkPos(pos) ? el.position = pos : 0;
					else el.position = pos;
				}
				el.remove(true);
				el.insertTo(this.searchIndex(this.convertPosition("px", offsetX)));
				el.drag?.(event);
			}
		}
		svgContext.addEventListener('mousedown', ondown);
		//svgContext.addEventListener('touchend', onmobileend);
		svgContext.addEventListener('touchmove', onmobiledrag);
	}
	clone() {
		return new Sheet(this.svgContext);
	}
	get elements() {
		return this.lines.reduce((prev,cur) => prev.concat(cur.elements), []);
	}
	appendLine() {
		let st = new Stave(1, this.lines.length*10+5, this.svgContext.viewBox.baseVal.width - 2, this.svgContext.viewBox.baseVal.height / 50);
		st.parent = this;
		st.index = this.lines.length;
		this.lines.push(st);
	}
	searchElement(x,y) {
		let stave;
		let element;
		for (let st of this.lines) {
			if (st.y >= y) {
				stave = this.lines[Math.max(st.index-1,0)];;
				break;
			}
		}
		stave = stave || this.lines.at(-1);
		for (let el of stave.elements) {
			if (el.coords.x >= x) {
				element = stave.elements[Math.max(stave.elements.indexOf(el)-1,0)];
				break;
			}
		}
		element = element || stave.elements.at(-1);
		return element;
	}
	searchIndex(x,y) {
		let totalX = 0;
		let prevTotalX = 0;
		let i = -1, j = 0;
		let stave;
		for (let st of this.lines) {
			if (st.y >= y) {
				stave = this.lines[Math.max(st.index-1,0)];
				break;
			}
		}
		stave = stave || this.lines.at(-1);
		for (let m of stave.measures) {
			prevTotalX = totalX;
			totalX = m.coords.x;
			if (x <= totalX) {
				break;
			}
			i++;
		}
		totalX = 0;
		prevTotalX = 0;
		i = Math.max(Math.min(i, stave.measures.length-1), 0);
		for (let e of stave.measures[i].elements) {
			prevTotalX = totalX;
			totalX = e.coords.x;
			if (x <= totalX) {
				if ((x - prevTotalX) < (totalX - x)) j--;
				break;
			}
			j++;
		}
		j = Math.max(Math.min(j, stave.measures[i].elements.length), 0);
		return [i, j];
	} 
	getPlayPack() {
		return this.#playpack || (this.#playpack = Synth.createSynthPack());
	}
	unselectAll() {
		this.lines.forEach(l => l.unselectAll());
	}
	get selectedElements() {
		return this.lines.map(m => m.selectedElements).reduce((prev, cur) => prev.concat(cur), []);
	}
	append(element) {
		try {
			let result = true;
			if (!this.lines.at(-1) || this.lines.at(-1).freeSpace < element.width(this.lines.at(-1).height)) {
				this.appendLine();
				if (this.lines.length > 1) {
					this.lines.at(-1).lastOBJ.time = this.lines.at(-2).lastOBJ.time;
					this.lines.at(-1).appendMeasure();
					let cl = this.last(Clef)?.clone();
					let k = this.last(Key)?.clone();
					if (cl) {
						cl.selectable = true;
						cl.eventPermission = true;
						result &&= this.lines.at(-1).append(cl);
					}
					if (k) {
						k.selectable = true;
						k.eventPermission = true;
						result &&= this.lines.at(-1).append(k);
					}
				}
			}
			element.selectable = true;
			this.unselectAll();
			result &&= this.lines.at(-1).append(element);
			this?.onappend();
			if (!result) throw '!';
			return true;
		} catch (err) {
			alert(`Ops! Something went wrong...😢`);
			return false;
		}
	}
	last(element, index) {
		if (!this.lines[0] || !this.lines[0].measures[0] || !this.lines[0].measures[0].elements[0]) return null;
		index = index || [this.lines.length-1, this.lines.at(-1).measures.length-1, this.lines.at(-1).measures.at(-1).elements.length]
		while (!(this.lines[index[0]].measures[index[1]]?.elements[--index[2]] instanceof element) && index[0]+1) {
			if (index[2] < 0) {
				index[1]--;
				if (index[1] < 0) {
					if (!index[0]) return null;
					index[1] = this.lines[--index[0]].measures.length-1;
				}
				index[2] = this.lines[index[0]]?.measures[index[1]]?.elements.length
			}
		}
		if (index[0] < 0) return null;
		return this.lines[index[0]].measures[index[1]].elements[index[2]];
	}
	get lastClef() {
		return this.last(Clef);
	}
	convertPosition(type,data) {
		if (type === "px") {
			return data * this.svgContext.viewBox.baseVal.width / this.svgContext.getBoundingClientRect().width;
		} else {
			return data / this.svgContext.viewBox.baseVal.width / this.svgContext.getBoundingClientRect().width;
		}
	}
	draw() {
		let group = SVG('g', true);
		group.append(...this.lines.map(pentagrama => pentagrama.getSVG()));
		this.svgContext.innerHTML = '';
		this.svgContext.append(group);
	}
	async play(temp, duration) {
		this.temp = temp / (whole_note / duration);
		for (let i in this.lines) {
			await this.lines[i].play(this.getPlayPack(), this.temp);
		}
	}
}
export {Note, Measure, Key, Stave, Clef, Note_number, Time, Pause, Alteration, Sheet};