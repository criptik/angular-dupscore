import { Component } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { FocusTrapFactory} from '@angular/cdk/a11y';

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
    nsOrder: number[] = [];
    lastInput: string = '';
    
    constructor() {
        // temporary for testing
        this.nsScore.set(3, 1100);
        this.nsScore.set(6, -1100);
        this.nsScore.set(8, 0);
        this.nsewMap.set(5, 2);
        this.nsewMap.set(3, 4);
        this.nsewMap.set(6, 1);
        this.nsewMap.set(8, 7);
        
        this.onNS = 3;

        this.buildNSOrder();
        this.updateView();
    }

    updateView() {
        this.viewLines = [];
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
        // console.log(this.viewLines);
    }

    scoreStr(score: number | undefined, forNS: boolean): string {
        var str = ' ';
        if (score === undefined) str = ' ? ';
        else if (score === 0 && forNS) str = 'PASS';
        else if (score > 0 && forNS) str = `${score}`;
        else if (score < 0 && !forNS) str = `${-1*score}`;
        return str.padStart(4, ' ');
    }

    onInputKeyUp(x : any) {
        const key: string = x.key;
        var curInput: string = x.target.value;
        console.log(`key=${key}, curInput=${curInput}`);
        if (key === 'ArrowDown' && curInput === '') {
            this.onNS = this.getNewNS(1);
            // console.log(`new onNS = ${this.onNS}`);
            this.updateView();
        }
        else if (key === 'ArrowUp' && curInput === '') {
            this.onNS = this.getNewNS(-1);
            // console.log(`new onNS = ${this.onNS}`);
            this.updateView();
        }
        else if (key === 'Enter') {
            if (curInput !== '') {
                // score entered
                const newScore : number = parseInt(`${curInput}0`);
                this.lastInput = curInput;
                x.target.value = '';
                this.nsScore.set(this.onNS, newScore);
                this.updateView();
            } else if (this.lastInput != '') {
                const newScore : number = parseInt(`${this.lastInput}0`);
                this.lastInput = curInput;
                x.target.value = '';
                this.nsScore.set(this.onNS, newScore);
                this.updateView();
            }
            this.onNS = this.getNewNS(1);
            // console.log(`new onNS = ${this.onNS}`);
            this.updateView();
        }
        else if (key === '-') {
            if (curInput !== '') {
                // negative score entered
                // move - sign from end of input to beginning
                curInput = `-${curInput.slice(0, -1)}`;
                const newScore : number = parseInt(`${curInput}0`);
                this.lastInput = curInput;
                x.target.value = '';
                this.nsScore.set(this.onNS, newScore);
                this.updateView();
            } else if (this.lastInput != '') {
                const newScore : number = parseInt(`-${this.lastInput}0`);
                this.lastInput = curInput;
                x.target.value = '';
                this.nsScore.set(this.onNS, newScore);
                this.updateView();
            }
            this.onNS = this.getNewNS(1);
            // console.log(`new onNS = ${this.onNS}`);
            this.updateView();
        }
        
        else if (isFinite(parseInt(key))) {
            console.log(`key ${key} is a number!`);
            console.log(`input is now ${x.target.value}`);
        }
        else {
            // ignore non-numeric keys
            console.log(`key ${key} is not a number!`);
            x.target.value = x.target.value.slice(0, -1);
            console.log(`input is now ${x.target.value}`);
        }
    }

    getNewNS(dir: number) : number {
        const idx = this.nsOrder.indexOf(this.onNS);
        const newidx = idx + dir;
        if (newidx < 0 || newidx >= this.nsOrder.length) return this.onNS;
        else return this.nsOrder[newidx];
    }
    
    buildNSOrder() {
        this.nsOrder = Array.from(this.nsewMap.keys()).sort();
    }


}

@Directive({
  selector: '[autofocus]'
})
export class AutofocusDirective {
  constructor(private input: ElementRef) {}

  ngAfterViewInit() {
    this.input.nativeElement.focus();
  }
}

