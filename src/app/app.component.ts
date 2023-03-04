import { Component } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {
    myTitle:string = 'my-app';
    myPhrase:string = 'this is funny';
    numPairs: number = 8;
    viewLines: string[] = [];
    boardNum: number = 4;
    boardVul: string = 'BOTH';
    onNS: number;
    inputLine: string = ' ';
    nsScore : Map<number, number> = new Map();
    nsewMap: Map<number, number> = new Map();
    
    constructor() {
        // temporary for testing
        this.nsScore.set(3, 1100);
        this.nsScore.set(6, -1100);
        this.nsScore.set(8, 0);
        this.nsewMap.set(5, 2);
        this.nsewMap.set(3, 4);
        this.nsewMap.set(6, 1);
        this.nsewMap.set(8, 7);
        
        this.onNS = 6;
        this.updateView();
    }

    updateView() {
        this.viewLines[0] = `Section:A  Board:${this.boardNum}  Vul:${this.boardVul}`;
        this.viewLines[1] = `   NS    SCORE    EW`;
        // default for unused lines
        [...Array(this.numPairs).keys()].forEach(pair => {
            this.viewLines[pair+2] = `      ${'--'.repeat(5)}  `; 
        });
        // handle lines which have real ns&ew pairs (score may still be undefined)
        Array.from(this.nsewMap.keys()).forEach((nsPair:number) => {
            const ewPair = this.nsewMap.get(nsPair) as number;
            const score: number | undefined  = this.nsScore.get(nsPair);
            const arrow: string = (nsPair === this.onNS ? `==>` : `   `);
            this.viewLines[nsPair+1] = `${arrow}${nsPair.toString().padStart(2,' ')}  ${this.scoreStr(score, true)} ${this.scoreStr(score, false)}  ${ewPair.toString().padStart(2,' ')}    `;
        });
        this.viewLines.push(` `);
        this.viewLines.push(` `);
        const onEW = this.nsewMap.get(this.onNS) as number;
        this.inputLine = `Board: ${this.boardNum}  NS:${this.onNS}  EW:${onEW}  VUL:${this.boardVul}     SCORE:`;
        
    }

    scoreStr(score: number | undefined, forNS: boolean): string {
        var str = ' ';
        if (score === undefined) str = ' ? ';
        else if (score === 0 && forNS) str = 'PASS';
        else if (score > 0 && forNS) str = `${score}`;
        else if (score < 0 && !forNS) str = `${-1*score}`;
        return str.padStart(4, ' ');
    }
}

