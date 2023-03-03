import { Component } from '@angular/core';

const undefScore: number = -1;


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {
    myTitle:string = 'my-app';
    myPhrase:string = 'this is funny';
    numPairs: number = 10;
    myLines: string[] = [];
    headerLine: string = `  NS    SCORE    EW`;
    undefStr: string = '. .';
    scoreLineArray: ScoreLine[] = [
        new ScoreLine(5,2,-1),
        new ScoreLine(3,4, 1100),
        new ScoreLine(6,1,-1100),
        new ScoreLine(8,7, 0),
    ];

    constructor() {
        this.updateView();
    }

    updateView() {
        [...Array(this.numPairs).keys()].forEach(pair => {
            this.myLines[pair+1] = `      ${'--'.repeat(5)}   `; 
        });
        this.scoreLineArray.forEach(line => {
            this.myLines[line.nsPair] = `  ${line.nsPair.toString().padStart(2,' ')}  ${this.scoreStr(line.score, true)} ${this.scoreStr(line.score, false)}  ${line.ewPair.toString().padStart(2,' ')}    `;
            console.log(this.myLines[line.nsPair]);
        });
        
    }

    scoreStr(score: number, forNS: boolean): string {
        var str = ' ';
        if (score === undefScore) str = ' ? ';
        else if (score === 0 && forNS) str = 'PASS';
        else if (score > 0 && forNS) str = `${score}`;
        else if (score < 0 && !forNS) str = `${-1*score}`;
        return str.padStart(4, ' ');
    }
}

interface ScoreLine {
    constructor : Function,
    nsPair : number,
    ewPair : number,
    score  : number,
}

class ScoreLine {
    constructor(nsPair : number,
                ewPair : number,
                score : number = undefScore) {
        this.nsPair = nsPair;
        this.ewPair = ewPair;
        this.score = score;
    }
}



