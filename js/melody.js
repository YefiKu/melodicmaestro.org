/*
Clef: {
    tone: 3,
    line: 1 
};
Time: {
    numerator: 4,
    denominator: 2
};
Key: {
    tonality: [3, 6],
    alterations: {
        mode: 1,
        tones: [3,0,4,1,5,2]
    }
};
Note: {
    tones: ['04','34','54'],
    positions: 'omk',
    duration: 1,
    points: 0
};
Pause: {
    duration: 2,
    points: 1
}
Alteration: {
    mode: -2,
    tone: 6,
    position: 'i'
}
*/

class Melody {
    data = {};
    constructor(data) {
        if (typeof data === "string") {
            this.data = this.decode(data);
        } else {
            this.data = data || this.data;
        }
    }
    clone() {
        return new Melody();
    }
    exec(melodyPart, i1, pos1, i2, pos2) {
        if (melodyPart) {
            if (i1 !== undefined) {
                if (pos1) this.data.splice(i1+(pos1+1)/2, 0, melodyPart);
                else this.data[i1] = melodyPart;
            } else this.data.push(melodyPart);
        } else if (i1 !== undefined) {
            if (i2 !== undefined) {
                let m = this.data[i1];
                this.data.splice(i1, 1);
                if (pos2) this.data.splice(i2+(pos2+1)/2, 0, m);
                else this.data[i2] = m;
            } else this.data.splice(i1, 1);
        }
    }
    decode(str) {
        /*
        const paramCodes = {
            d: [64,32,16,8,4,2,1],
            a: ["double-flat", "half-one-flat", "flat", "half-flat", "natural", "half-sharp", "sharp", "half-one-sharp", "double-sharp"]
        }
        */
        let melodyData = [];
        for (let a = 0; a < str.length;) {
            let i = str.slice(a, str.indexOf(';', a));
            switch(i[0]) {
                case 'c':
                    melodyData.push({name: "clef", tone: i[1], line: +i[2]});
                    break;
                case 't':
                    melodyData.push({name: "time", numerator: i[1], denominator: i[2]});
                    break;
                case 'k':
                    melodyData.push({name: "key", tonality: [i[1], +i[2]]});
                    break;
                case 'n':
                    melodyData.push({name: "note", duration: +i[1], position: [parseInt(i[3], 36)-14], points: +i[2]});
                    break;
                case 'p':
                    melodyData.push({name: "pause", duration: +i[1], points: +i[2]});
                    break;
                case 'a':
                    melodyData.push({name: "alteration", mode: i[2]-4, position: parseInt(i[1], 36)-14});
                    break;
            }
            a+=i.length+1;
        }
        return melodyData;
    }
    encode(melodyData) {
        /*
        const paramCodes = {
            d: [64,32,16,8,4,2,1],
            t: ["Do","Re","Mi","Fa","Sol","La","Si"],
            a: ["natural", "double-flat", "half-one-flat", "flat", "half-flat", "half-sharp", "sharp", "half-one-sharp", "double-sharp"]
        }
        */
        let str = '';
        for (let e of melodyData) {
            switch (e.name) {
                case "clef":
                    str += `c${e.tone}${e.line}`;
                    break;
                case "key":
                    str += `k${e.tonality[0]}${e.tonality[1]}`;
                    break;
                case "time":
                    str += `t${e.count.number}${e.durations.number}`;
                    break;
                case "note":
                    str += `n${e.duration}${e.points}${(e.position+14).toString(36)}`;
                    break;
                case "pause":
                    str += `p${e.duration}${e.points}`;
                    break;
                case "alteration":
                    str += `a${(e.position+14).toString(36)}${e.mode+4}`;
            }
            str+=';'
        }
        return str;
    }
}
//export {Melody};