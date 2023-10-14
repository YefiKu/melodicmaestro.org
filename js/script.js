import {Note, Stave, Key, Note_number, Measure, Clef, Time, Pause, Alteration, Sheet} from './music_elements.js';
//Music = {Note:Note,Clef:Clef,Time:Time,Pause:Pause,Alteration:Alteration};
class Editor {
	buffer = [];
	history = [];
	file = null;
	constructor() {
		this.sheet = new Sheet(document.querySelector('svg.sheet'));

		this.sheet.appendLine();
		this.sheet.lines[0].appendMeasure();
		document.onkeydown = e => {
			if (document.querySelector('.openedTabs > .editor') && document.activeElement.tagName !== "INPUT") {
				let key = e.key.toLowerCase();
				let keys_for_notes = {'a': "Do4",'s': "Re4", 'd': "Mi4",'f': "Fa4",'g': "Sol4",'h': "La4",'j': "Si4",'k': "Do5"};
				let keys_for_durations = {'z': 64, 'x': 32, 'c': 16, 'v': 8, 'b': 4, 'n': 2, 'm': 1};
				let keys_for_alterations = {',': 'flat', '.': 'sharp', ' ': 'natural'};
				if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
					if (key in keys_for_notes) {
						this.sheet.append(new Note(this.current.duration, "tone", this.current.tone = keys_for_notes[key])); // Appending
					} else if (key in keys_for_durations) {
						this.current.duration = keys_for_durations[key];
					} else if (key in keys_for_alterations) {
						this.sheet.append(new Alteration(this.current.alteration = keys_for_alterations[key], "tone", tone)); // Appending
					} else if (key === 'p') {
						this.commands.play();
					} else if (key === 'l') {
						this.sheet.append(new Pause(this.current.duration)); // Appending
					} else if (key === 'backspace' || key === 'delete') {
						this.commands.delete();
					}
				} else if (!e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) {
					if (key === 'c') {
						this.commands.copy();
					} else if (key === 'v') {
						this.commands.paste();
					} else if (key === 'x') {
						this.commands.cut();
					} else if (key === 'a') {
						this.commands.selectAll();
						e.preventDefault();
					} else if (key === "k") {
						this.commands.share();
						e.preventDefault();
					} else if (key === "s") {
						this.commands.save();
						e.preventDefault();
					} else if (key === "z") {
						this.commands.undo();
						e.preventDefault();
					} else if (key === "y") {
						this.commands.redo();
						e.preventDefault();
					}
				}
				this.sheet.draw();
			}
		}
		this.sheet.onappend = () => this.changed.data = true;
		this.sheet.draw();
	}
	start() {
		this.file = +localStorage.getItem('FILEDATA');

		this.saveId = setInterval(() => {
			if (this.changed.data || this.changed.name) {
				if (this.file.id) {
					if (this.changed.data) this.fetch.upload(this.cmnf.encode(this.sheet.elements));
					if (this.changed.name) {
						let filename = document.querySelector('.editor .name#name input').value;
						this.fetch.move(this.file.path.split('/').slice(0, -1).concat(filename).join('/'))
					}
					this.changed = {
						name: false,
						data: false
					}
				}
			}
		}, 2000);
	}
	stop() {
		this.file = null;
		this.sheet.lines = [];
		clearInterval(this.saveId);
	}
	programs = {
		main: element => {
			element.querySelectorAll('svg.icon').forEach(svg => {
				this.pictures.draw(svg, this.pictures[svg.classList[0].split('-')[0]](svg.classList[0].split('-')[1]));
				if (svg.classList[0].split('-')[0] !== 'image') {
					svg.onclick = () => {
						this.sheet.append(this.pictures[svg.classList[0].split('-')[0]](svg.classList[0].split('-')[1]));
						this.sheet.draw();
					}
				}
			})
		},
		tonality: element => {
			let aName = 'sharp', aCount = 1;
			let tonalityIndication = element.querySelector('svg.icon.tonalityIndication');
			element.querySelectorAll('svg.icon').forEach(svg => {
				this.pictures.draw(svg, this.pictures[svg.classList[0].split('-')[0]](svg.classList[0].split('-')[1]));
				switch (svg.classList[0].split('-')[0]) {
					case "key":
						svg.onclick = () => {
							element.parentNode.classList.remove('visible');
							this.sheet.append(new Key("alterations", [aCount, aName]));
							this.sheet.draw();
						}
						break;
					case "alteration":
						svg.onclick = () => {
							aName = svg.classList[0].split('-')[1];
							element.querySelector('svg.alteration-sharp').classList.remove('selected');
							element.querySelector('svg.alteration-flat').classList.remove('selected');
							svg.classList.add('selected');
							tonalityIndication.innerHTML = '';
							this.pictures.draw(tonalityIndication, this.pictures.key(`alterations,${aCount},${aName}`));
	
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
				this.pictures.draw(tonalityIndication, this.pictures.key(`alterations,${aCount},${aName}`));
			}
		},
		time: element => {
			let num = 4;
			let den = 4;
			document.getElementById('numerator').onbeforeinput = e => {
				let nextValue = e.target.value + e.data;
				if (+nextValue > 16 || +nextValue < 1 || Number.isNaN(+e.data)) e.preventDefault();
			}
			document.getElementById('numerator').onchange = e => {
				num = e.target.value;
				element.querySelector('.icon').innerHTML = '';
				this.pictures.draw(element.querySelector('.icon'), this.pictures.time(`${num},${den}`));
			}
			document.getElementById('denominator').onchange = e => {
				den = e.target.value;
				element.querySelector('.icon').innerHTML = '';
				this.pictures.draw(element.querySelector('.icon'), this.pictures.time(`${num},${den}`));
			}
			document.getElementById('denominator').onbeforeinput = e => {
				let nextValue = e.target.value + e.data;
				if (+nextValue > 16 || !Number.isInteger(Math.log2(+nextValue )) || +nextValue < 1 || Number.isNaN(+e.data)) e.preventDefault();
			}
			this.pictures.draw(element.querySelector('.icon'), this.pictures.time(`${num},${den}`));
			element.querySelector('.icon').onclick = e => {
				element.parentNode.classList.remove('visible');
				this.sheet.append(new Time(num, den));
				this.sheet.draw();
			}
		}
	}
	changed = {
		name: false,
		data: false
	}
	current = {
		duration: 16,
		alteration: " ",
		tone: "La4"
	}
	commands = {
		copy: () => {
			this.buffer.push(this.sheet.selectedElements.map(e => e.clone()));
		},
		paste: () => {
			this.buffer.at(-1).forEach(el => this.sheet.append(el.clone()));
		},
		selectAll: () => {
			for (let el of this.sheet.elements) {
				if (el.isSelected) continue;
				else el.select();
			}
		},
		cut: () => {
			this.buffer.push(this.sheet.selectedElements.map(e => e.clone()));
			this.sheet.selectedElements.forEach(el => el.remove());
			this.sheet.elements.at(-1)?.select();
		},
		delete: () => {
			this.sheet.selectedElements.forEach(el => el.remove());
			this.sheet.elements.at(-1)?.select();
		},
		play: () => {
			if (audioContext) this.sheet.play(120, 16);
		},
		share: () => {
			let url = new URL(location.href);
			url.searchParams.delete('n');
			url.searchParams.set('d', this.cmnf.encode(this.sheet.selectedElements));
			document.querySelector('.editor .modal.sharelink .href u').innerText = url.href;
			document.querySelector('.editor .modal.sharelink .href').href = url.href;
			openModal('sharelink');
		},
		save: () => {
			let format = 'text/cmnf';
			document.querySelector('.editor .modal.save td.cmnf').onclick = () => format = 'text/cmnf';
			document.querySelector('.editor .modal.save td.musicxml').onclick = () => format = 'application/vnd.recordare.musicxml';
			document.querySelector('.editor .modal.save td button').onclick = () => {
	
			}
		},
		undo: () => {

		},
		redo: () => {

		}
	}
	pictures = {
		draw: (svg, data) => {
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
		clef: str => {
			let args = str.split(',');
			return new Clef(args[0], +args[1]);
		},
		key: str => {
			let args = str.split(',');
			let ks = new Key(args[0], [args[1], args[2]]);
			let data = new Stave(0, 0, 100, 4);
			data.append(new Clef("Sol4", 6));
			data.append(ks);
			return ks;
		},
		time: str => {
			let args = str.split(',');
			return new Time(...args);
		},
		note: str => {
			let args = str.split(',');
			return new Note(this.current.duration = +args[0], "position", 7);
		},
		pause: str => {
			return new Pause(this.current.duration = +str);
		},
		alteration: str => {
			return new Alteration(str, "positon", 6);
		}
	}
	cmnf = {
		decode: str => {
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
		},
		encode: elements => {
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
		},
		play: cmnf => {
			this.cmnf.decode(cmnf).forEach(el => this.sheet.append(el));
			this.sheet.play(120, 16);
		}
	}
	fetch = {
		upload: data => {
			return fetch(`/files?action=upload&id=${this.file.id}&data=${data}`,{method: "POST"});
		},
		move: path => {
			return fetch(`/files?action=move&id=${this.file.id}&path=${path}`,{method: "POST"});
		},
		download: (options = {}) => {
			return fetch('/files', {method:"POST"}).then(res => res.json()).then(items => items.filter(i => Object.keys(options).every(key => options[key] === i[key])));
		}
	}
}
let editor;
let refreshEditor = async () => {
	let searchObj = new URLSearchParams(location.search);
	if (location.hash.slice(1) === "editor") {
		editor.start();
		const nameOfFile = document.querySelector('.editor .name#name input');
		if (editor.file) {
			editor.file = (await editor.fetch.download({type: "file", id: editor.file}))[0];
			nameOfFile.value = editor.file.path.split('/').at(-1);
			editor.cmnf.decode(editor.file.data).forEach(e => editor.sheet.append(e));
			editor.sheet.draw();
		} else {
			nameOfFile.value = searchObj.has('n') ? decodeURI(searchObj.get('n')) : 'Untitled';
			searchObj.has('d') ? decodeCMNF(searchObj.get('d')).forEach(e => editor.sheet.append(e)) : 0;
		}
		editor.sheet.draw();
	} else {
		localStorage.setItem('FILEDATA', null);
		editor.sheet.lines = [];
		editor.stop();
	}
	document.querySelector('.editor .name#name input').onchange = () => editor.changed.name = true;
}
function refreshLibrary() {
	if (location.hash.slice(1) === "library") {
		const list = document.querySelector('ul.list');
		list.innerHTML = '';
		//let data = {};
		fetch('/files', {method: 'POST'}).then(response => response.json()).then(items => {
			items.forEach(item => {
				let li = document.createElement('li');
				list.append(li);
				let innerHTML = '';
				if (item.type === "file") {
					innerHTML = `
						<div class='text'>${item.path.split('/').at(-1)}</div>
						<img class='icon play' src='images/play.svg'/>
						<div class=open-item-options>
							<img class=icon src='images/dots.svg'/>
						</div>
					`;
					li.classList.add('yellow', 'file');
					li.onclick = e => {
						if (e.target.tagName == "LI") {
							localStorage.setItem('FILEDATA', item.id);
							openTab('editor', 'left');
						}
					}
				} else if (item.type === "folder") {
					innerHTML = `
						<img class='icon' src='images/folder.svg'/>
						<div class='text'>${item.path.split('/').at(-1)}</div>
						<div class=open-item-options>
							<img class=icon src='images/dots.svg'/>
						</div>
					`;
					li.classList.add("blue", 'folder');
				}
				innerHTML += `
					<div class=item-options>
						<div>
							<img class="icon rename" src='images/rename.svg'/>
							<img class="icon delete" src='images/delete.svg'/>
						</div>
					</div>
				`;
				li.innerHTML = innerHTML;
				item.type === "file" && (li.querySelector('img.icon.play').onclick = function() {
					if (this.src.includes("play.svg")) {
						this.src = "images/pause.svg";
						editor.cmnf.play(item.data);
					}
					else this.src = "images/play.svg";
				})
				li.querySelector('.item-options .rename').onclick = () => {
					let newPath = prompt("Enter a new directory:", item.path);
					if (!newPath || newPath === item.path) return;
					fetch(`/${item.type}s?action=move&id=${item.id}&path=${newPath}`, { method: 'POST' }).then(() => refreshLibrary(), () => alert("Error!"));
				}
				li.querySelector('.item-options .delete').onclick = () => {
					let toDelete = confirm("Are you sure?");
					if (!toDelete) return;
					fetch(`/${item.type}s?action=delete&id=${item.id}`, { method: 'POST' }).then(() => refreshLibrary(), () => alert("Error!"));
				}
			});
		});
	}
}
window.addEventListener('hashchange', refreshLibrary);
window.addEventListener("hashchange", refreshEditor);
window.addEventListener("load", () => {
	// __ Editor ______________________________________________________________________________ //
	editor = new Editor();
	document.querySelector('.createScore').onclick = () => {
		let nameOfFile = prompt("Name of file:", "Untitled");
		if (!nameOfFile) return;
		fetch(`/files?action=create&path=${nameOfFile}`, {method: 'POST'}).then(() => {
			refreshLibrary();
		})
	}
	document.querySelectorAll('.editor .program').forEach(p => editor.programs[p.dataset.program]?.(p));
	document.querySelectorAll('.command').forEach(c => c.onclick = () => editor.commands[c.dataset.command]() + editor.sheet.draw());
	document.querySelectorAll('.editor .openProgram').forEach(p => {
		p.onclick = () => {
			openModal(p.dataset.program);
		}
	});
	refreshEditor();
	// __ Library ______________________________________________________________________________ //
	const library = document.querySelector('body .tab.library');
	const list = library.querySelector('ul.list');
	library.addEventListener('click', e => {
		if ([...list.querySelectorAll('.open-item-options')].find(el => el.contains(e.target))) {
			let has = e.target.parentNode.parentNode.classList.contains("setting");
			list.querySelectorAll('li.setting').forEach(settingLi => settingLi.classList.remove('setting'));
			!has ? e.target.parentNode.parentNode.classList.add("setting") : 0;
		} else {
			list.querySelectorAll('li.setting').forEach(settingLi => settingLi.classList.remove('setting'));
		}
	})
	refreshLibrary();
});