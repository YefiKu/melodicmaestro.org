import {Note, Stave, Key, Note_number, Measure, Clef, Time, Pause, Alteration, Sheet} from './music_elements.js';
Music = {Note:Note,Clef:Clef,Time:Time,Pause:Pause,Alteration:Alteration};
/*const*/ sheet = new Sheet(document.querySelector('svg.sheet'));
sheet.appendLine();
sheet.lines[0].appendMeasure();
setInterval(function() {
	let FILEDATA = JSON.parse(localStorage.getItem('FILEDATA'));
	if (FILEDATA?.id) {
		let elements = [];
		for (let l of sheet.lines) {
			for (let m of l.measures) {
				for (let el of m.elements) {
					elements.push(el);
				}
			}
		}
		let u = `/files?action=upload&id=${FILEDATA.id}&data=${encodeCMWF(elements)}`;
		try {
			fetch(u, {method: 'POST'});
		} catch (err) {}
	}
}, 2000);
let duration = 16;
let alteration = " ";
let tone = "La4";
let buffer = [];
let commands = {
	copy() {
		buffer.push(sheet.selectedElements.map(e => e.clone()));
	},
	paste() {
		buffer.at(-1).forEach(el => sheet.append(el.clone()));
	},
	selectAll() {
		for (let l of sheet.lines) {
			for (let m of l.measures) {
				for (let el of m.elements) {
					if (el.isSelected) continue 
					else el.select();
				}
			}
		}
	},
	cut() {
		buffer.push(sheet.selectedElements.map(e => e.clone()));
		sheet.selectedElements.forEach(el => el.remove());
		sheet.lines.at(-1)?.measures.at(-1)?.elements.at(-1)?.select();
	},
	delete() {
		sheet.selectedElements.forEach(el => el.remove());
		sheet.lines.at(-1)?.measures.at(-1)?.elements.at(-1)?.select();
	},
	play() {
		if (audioContext) sheet.play(120, 16);
	},
	share() {
		let url = new URL(location.href);
		url.searchParams.delete('n');
		url.searchParams.set('d', encodeCMWF(sheet.selectedElements));
		editor.querySelector('.modal.sharelink .href u').innerText = url.href;
		editor.querySelector('.modal.sharelink .href').href = url.href;
		openModal('sharelink');
	}
}
document.onkeydown = e => {
	if (document.querySelector('.openedTabs > .editor') && document.activeElement.tagName !== "INPUT") {
		let key = e.key.toLowerCase();
		let keys_for_notes = {'a': "Do4",'s': "Re4", 'd': "Mi4",'f': "Fa4",'g': "Sol4",'h': "La4",'j': "Si4",'k': "Do5"};
		let keys_for_durations = {'z': 64, 'x': 32, 'c': 16, 'v': 8, 'b': 4, 'n': 2, 'm': 1};
		let keys_for_alterations = {',': 'flat', '.': 'sharp', ' ': 'natural'};
		if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
			if (key in keys_for_notes) {
				tone = keys_for_notes[key];
				sheet.append(new Note(duration, "tone", keys_for_notes[key])); // Appending
			} else if (key in keys_for_durations) {
				duration = keys_for_durations[key];
			} else if (key in keys_for_alterations) {
				alteration = keys_for_alterations[key];
				sheet.append(new Alteration(alteration, "tone", tone)); // Appending
			} else if (key === 'p') {
				commands.play();
			} else if (key === 'l') {
				sheet.append(new Pause(duration)); // Appending
			} else if (key === 'backspace' || key === 'delete') {
				commands.delete();
			}
		} else if (!e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) {
			if (key === 'c') {
				commands.copy();
			} else if (key === 'v') {
				commands.paste();
			} else if (key === 'x') {
				commands.cut();
			} else if (key === 'a') {
				commands.selectAll();
				e.preventDefault();
			} else if (key === "k") {
				commands.share();
				e.preventDefault();
			} else if (key === "s") {
				
				e.preventDefault();
			}
		}
		sheet.draw();
	}
}
sheet.draw();
let pictures = {
	draw(svg, data) {
		if (typeof data != 'string') {
			svg.setAttribute('viewBox', `0 0 ${Math.max(data.width(5) + 1, 8)} 9`);
			data.parent?.coordinates ? data.parent.coordinates = null : 0;
			data.coords = {x:0.5,top:2.5,bottom:7.5}
			svg.append(data.element);
			return svg;
		} else {
			svg.setAttribute('viewBox', `0 0 8 9`);
			let p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			p.setAttribute('d',data);
			svg.append(p);
		}
	},
	clef(str) {
		let args = str.split(',');
		return new Clef(args[0], +args[1]);
	},
	key(str) {
		let args = str.split(',');
		let ks = new Key(args[0], [args[1], args[2]]);
		let data = new Stave(0, 0, 100, 4);
		data.append(new Clef("Sol4", 6));
		data.append(ks);
		return ks;
	},
	time(str) {
		let args = str.split(',');
		return new Time(...args);
	},
	note(str) {
		let args = str.split(',');
		duration = +args[0];
		let n = new Note(+args[0], "position", 7);
		return n;
	},
	pause(str) {
		duration = +str;
		return new Pause(+str);
	},
	alteration(str) {
		let a = new Alteration(str, "positon", 6);
		return a;
	}
}
let programs = {
	main(element) {
		element.querySelectorAll('svg.icon').forEach(svg => {
			pictures.draw(svg, pictures[svg.classList[0].split('-')[0]](svg.classList[0].split('-')[1]));
			if (svg.classList[0].split('-')[0] !== 'image') {
				svg.onclick = () => {
					sheet.append(pictures[svg.classList[0].split('-')[0]](svg.classList[0].split('-')[1]));
					sheet.draw();
				}
			}
		})
	},
	tonality(element) {
		let aName = 'sharp', aCount = 1;
		let tonalityIndication = element.querySelector('svg.icon.tonalityIndication');
		element.querySelectorAll('svg.icon').forEach(svg => {
			pictures.draw(svg, pictures[svg.classList[0].split('-')[0]](svg.classList[0].split('-')[1]));
			switch (svg.classList[0].split('-')[0]) {
				case "key":
					svg.onclick = () => {
						element.parentNode.classList.remove('visible');
						sheet.append(new Key("alterations", [aCount, aName]));
						sheet.draw();
					}
					break;
				case "alteration":
					svg.onclick = () => {
						aName = svg.classList[0].split('-')[1];
						element.querySelector('svg.alteration-sharp').classList.remove('selected');
						element.querySelector('svg.alteration-flat').classList.remove('selected');
						svg.classList.add('selected');
						tonalityIndication.innerHTML = '';
						pictures.draw(tonalityIndication, pictures.key(`alterations,${aCount},${aName}`));

					}
					break;
			}
		})
		element.querySelector("input.num").onbeforeinput = e => {
			let nextValue = e.target.value + e.data;
			if (+nextValue > 7 || +nextValue < 0 || Number.isNaN(+e.data)) e.preventDefault();
		}
		element.querySelector("input.num").onchange = e => {
			aCount = +e.target.value || 0;
			if (aCount) {
				element.querySelector('svg.alteration-sharp.icon').classList.remove('disabled');
				element.querySelector('svg.alteration-flat.icon').classList.remove('disabled');
			} else {
				element.querySelector('svg.alteration-sharp.icon').classList.add('disabled');
				element.querySelector('svg.alteration-flat.icon').classList.add('disabled');
			}
			tonalityIndication.innerHTML = '';
			pictures.draw(tonalityIndication, pictures.key(`alterations,${aCount},${aName}`));
		}
	},
	time(element) {
		let num = 4;
		let den = 4;
		document.getElementById('numerator').onbeforeinput = e => {
			let nextValue = e.target.value + e.data;
			if (+nextValue > 16 || +nextValue < 1 || Number.isNaN(+e.data)) e.preventDefault();
		}
		document.getElementById('numerator').onchange = e => {
			num = e.target.value;
			element.querySelector('.icon').innerHTML = '';
			pictures.draw(element.querySelector('.icon'), pictures.time(`${num},${den}`));
		}
		document.getElementById('denominator').onchange = e => {
			den = e.target.value;
			element.querySelector('.icon').innerHTML = '';
			pictures.draw(element.querySelector('.icon'), pictures.time(`${num},${den}`));
		}
		document.getElementById('denominator').onbeforeinput = e => {
			let nextValue = e.target.value + e.data;
			if (+nextValue > 16 || !Number.isInteger(Math.log2(+nextValue )) || +nextValue < 1 || Number.isNaN(+e.data)) e.preventDefault();
		}
		pictures.draw(element.querySelector('.icon'), pictures.time(`${num},${den}`));
		element.querySelector('.icon').onclick = e => {
			element.parentNode.classList.remove('visible');
			sheet.append(new Time(num, den));
			sheet.draw();
		}
	}
}
// A new "Compressed Music Writing Format" (.cmwf)
function decodeCMWF(str) {
	const paramCodes = {
		d: [64,32,16,8,4,2,1],
		t: ["Do","Re","Mi","Fa","Sol","La","Si"],
		a: ["natural", "double-flat", "half-one-flat", "flat", "half-flat", "half-sharp", "sharp", "half-one-sharp", "double-sharp"]
	}
	let elements = [];
	for (let a = 0; a < str.length;) {
		let i = '';
		switch(str[a]) {
			case 'c':
				i = str.slice(a, a+3);
				elements.push(new Clef(paramCodes.t[i[1]], i[2]));
				a+=3;
				break;
			case 't':
				i = str.slice(a, a+3);
				elements.push(new Time(i[1], paramCodes.d[i[2]]));
				a+=3;
				break;
			case 'k':
				i = str.slice(a,a+3);
				elements.push(new Key("tonality", [paramCodes.t[i[1]], paramCodes.a[i[2]]]));
				a+=3;
				break;
			case 'n':
				i = str.slice(a, a+4)
				elements.push(new Note(paramCodes.d[i[1]], "position", parseInt(i[3], 36)-14, +i[2]));
				a+=4;
				break;
			case 'p':
				i = str.slice(a,a+3)
				elements.push(new Pause(paramCodes.d[i[1]], +i[2]));
				a+=3;
				break;
			case 'a':
				i = str.slice(a,a+3);
				elements.push(new Alteration(paramCodes.a[i[2]], "position",parseInt(i[1], 36)-14));
				a+=3;
				break;
		}
	}
	return elements;
}
function encodeCMWF(elements) {
	const paramCodes = {
		d: [64,32,16,8,4,2,1],
		t: ["Do","Re","Mi","Fa","Sol","La","Si"],
		a: ["natural", "double-flat", "half-one-flat", "flat", "half-flat", "half-sharp", "sharp", "half-one-sharp", "double-sharp"]
	}
	let str = '';
	for (let e of elements) {
		switch (e.constructor.name) {
			case "Clef":
				str += `c${paramCodes.t.indexOf(e.tone.slice(0,-1))}${e.position}`;
				break;
			case "Key":
				str += `k${paramCodes.t.indexOf(e.tonality[0])}${paramCodes.a.indexOf(e.tonality[1])}`;
				break;
			case "Time":
				str += `t${e.count.number}${e.durations.number}`;
				break;
			case "Note":
				str += `n${paramCodes.d.indexOf(e.duration)}0${(e.position+14).toString(36)}`;
				break;
			case "Pause":
				str += `p${paramCodes.d.indexOf(e.duration)}0`;
				break;
			case "Alteration":
				str += `a${(e.position+14).toString(36)}${paramCodes.a.indexOf(e.name)}`;
		}
	}
	return str;
}
document.querySelectorAll('.editor .program').forEach(p => programs[p.dataset.program]?.(p));
document.querySelectorAll('.command').forEach(c => c.onclick = () => commands[c.dataset.command]() + sheet.draw());
document.querySelectorAll('.editor .openProgram').forEach(p => {
	p.onclick = () => {
		openModal(p.dataset.program);
	}
})
let refreshEditor = async () => {
	let searchObj = new URLSearchParams(location.search);
	if (location.hash.slice(1) === "editor") {
		let FILEDATA = JSON.parse(localStorage.getItem('FILEDATA'));
		const nameOfFile = document.querySelector('.editor .name#name input');
		if (FILEDATA && FILEDATA.id) {
			FILEDATA = await fetch(`files?id=${FILEDATA.id}`, {method: 'POST'}).then(res => res.blob()).then(blob => blob.text());
			FILEDATA = JSON.parse(FILEDATA);
			localStorage.setItem('FILEDATA', JSON.stringify(FILEDATA));
			nameOfFile.value = FILEDATA.name;
			decodeCMWF(FILEDATA.data).forEach(e => sheet.append(e));
			sheet.draw();
		} else {
			nameOfFile.value = searchObj.has('n') ? decodeURI(searchObj.get('n')) : 'Untitled';
			searchObj.has('d') ? decodeCMWF(searchObj.get('d')).forEach(e => sheet.append(e)) : 0;
		}
		sheet.draw();
	} else {
		localStorage.setItem('FILEDATA', null);
		sheet.lines.length = 1;
		sheet.lines[0].measures.length = 1;
		sheet.lines[0].measures[0].elements = [];
		sheet.draw();
	}
}
window.addEventListener("hashchange", refreshEditor);
window.addEventListener("load", refreshEditor);