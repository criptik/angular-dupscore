import { Component } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { FocusTrapFactory} from '@angular/cdk/a11y';
import { LegalScore, Vul } from './legalscore'


class ScoreObj {
    score:number;
    kindNS:string;
    kindEW:string;
    constructor(score: number, kindNS: string = '', kindEW: string=kindNS) {
        this.score = score;
        this.kindNS = kindNS;
        this.kindEW = kindEW;
    }
}

@Component({
    selector: 'app-score-entry',
    templateUrl: './score-entry.component.html',
    styleUrls: ['./score-entry.component.css']
})


export class ScoreEntryComponent {
    numPairs: number = 8;
    viewLines: string[] = [];
    boardNum: number = 4;
    boardVul: string = 'BOTH';
    onNS: number;
    inputLine: string = ' ';
    nsScore : Map<number, ScoreObj> = new Map();
    nsewMap: Map<number, number> = new Map();
    nsOrder: number[] = [];
    lastInput: string = '';
    legalScoreObj : LegalScore = new LegalScore();
    errmsg: string = '  ';
    
    constructor() {
        // temporary for testing
        this.nsScore.set(3, new ScoreObj(1100));
        this.nsScore.set(6, new ScoreObj(-1100));
        this.nsScore.set(8, new ScoreObj(0));
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
            const scoreObj: ScoreObj | undefined  = this.nsScore.get(nsPair);
            // console.log(nsPair, score);
            const arrow: string = (nsPair === this.onNS ? `==>` : `   `);
            this.viewLines[nsPair+1] = `${arrow}${nsPair.toString().padStart(2,' ')}  ${this.scoreStr(scoreObj, true)} ${this.scoreStr(scoreObj, false)}  ${ewPair.toString().padStart(2,' ')}    `;
        });
        this.viewLines.push(` `);
        this.viewLines.push(this.errmsg);
        this.errmsg = '  '; 
        const onEW = this.nsewMap.get(this.onNS) as number;
        this.inputLine = `Board: ${this.boardNum}  NS:${this.onNS}  EW:${onEW}  VUL:${this.boardVul}     SCORE:`;
        // console.log(this.viewLines);
    }

    scoreStr(scoreObj: ScoreObj | undefined, forNS: boolean): string {
        var str = ' ';
        if (scoreObj === undefined) str = ' ? ';
        else if (scoreObj?.kindNS === '') {
            // normal ScoreObj with a score
            const score = scoreObj.score;
            if (score === 0 && forNS) str = 'PASS';
            else if (score > 0 && forNS) str = `${score}`;
            else if (score < 0 && !forNS) str = `${-1*score}`;
        }
        else {
            // a "special" scoreObj, with strings in the kindNS and kindEW
            str = (forNS ? scoreObj.kindNS : scoreObj.kindEW);
        }
        return str.padStart(4, ' ');
    }

    checkScoreLegality(newScore:number) {
        console.log(`legalscore = ${this.legalScoreObj.checkNSScoreLegal(newScore, Vul.V, Vul.V)}`); 
        return this.legalScoreObj.checkNSScoreLegal(newScore, Vul.V, Vul.V);
    }

    checkSpecialInput(curInput: string, x:any) : boolean {
        var foundSpecial:boolean = false;
        
        if (curInput === 'X') {
            this.nsScore.delete(this.onNS);
            foundSpecial = true;
        }
        if (curInput === 'N') {
            this.nsScore.set(this.onNS, new ScoreObj(-1, 'NP '));
            foundSpecial = true;
        }
        if (curInput === 'L') {
            this.nsScore.set(this.onNS, new ScoreObj(-1, 'LATE'));
            foundSpecial = true;
        }
        if (curInput === 'A') {
            this.nsScore.set(this.onNS, new ScoreObj(-1, 'AVE', 'AVE'));
            foundSpecial = true;
        }
        if (curInput === 'A+') {
            this.nsScore.set(this.onNS, new ScoreObj(-1, 'AVE+', 'AVE-'));
            foundSpecial = true;
        }
        if (curInput === 'A-') {
            this.nsScore.set(this.onNS, new ScoreObj(-1, 'AVE-', 'AVE+'));
            foundSpecial = true;
        }
        
        if (foundSpecial) {
            x.target.value = '';
            this.lastInput = '';
            this.onNS = this.getNewNS(1);
            this.updateView();
        }
        return foundSpecial;

    }
                
    onInputKeyUp(x : any) {
        const key: string = x.key;
        var curInput: string = x.target.value;
        console.log(`key=${key}, curInput=${curInput}`);
        if (key === 'Shift') return;
        if (key === 'ArrowDown' && curInput === '') {
            this.onNS = this.getNewNS(1);
            this.lastInput = '';
            // console.log(`new onNS = ${this.onNS}`);
            this.updateView();
        }
        else if (key === 'ArrowUp' && curInput === '') {
            this.onNS = this.getNewNS(-1);
            this.lastInput = '';
            // console.log(`new onNS = ${this.onNS}`);
            this.updateView();
        }
        else if (key === 'Enter') {
            if (curInput !== '') {
                if (this.checkSpecialInput(curInput, x)) return;
                // score entered
                const newScore : number = parseInt(`${curInput}0`);
                if (this.checkScoreLegality(newScore)) {
                    this.lastInput = curInput;
                    x.target.value = '';
                    this.nsScore.set(this.onNS, new ScoreObj(newScore));
                    this.onNS = this.getNewNS(1);
                    this.updateView();
                }
                else {
                    x.target.value = '';
                    this.errmsg = `!! ${newScore} is not possible on this board !!`;
                    this.updateView();
                }
            } else if (this.lastInput !== '') {
                const newScore : number = parseInt(`${this.lastInput}0`);
                this.lastInput = curInput;
                x.target.value = '';
                this.nsScore.set(this.onNS, new ScoreObj(newScore));
                this.onNS = this.getNewNS(1);
                this.updateView();
            }
        }
        else if (key === '+') {
            // A+ is a legal input
            if (curInput === 'A+') return;
        }
        else if (key === '-') {
                if (curInput === '-') {
                x.target.value = '';
                return;
            }
            if (curInput === 'A-') {
                // a legal combo for ns=avg-, ew=avg+
                return;
            }
            // now we know there is a non-empty input
            // negative score entered
            // move - sign from end of input to beginning
            curInput = `-${curInput.slice(0, -1)}`;
            const newScore : number = parseInt(`${curInput}0`);
            if (this.checkScoreLegality(newScore)) {
                this.lastInput = curInput;
                x.target.value = '';
                this.nsScore.set(this.onNS, new ScoreObj(newScore));
                this.onNS = this.getNewNS(1);
                // console.log(`new onNS = ${this.onNS}`);
                this.updateView();
            }
            else {
                x.target.value = '';
                this.viewLines[this.viewLines.length - 1] = `!! ${newScore} is not possible on this board !!`;
            }
        }
            
        else if (isFinite(parseInt(key))) {
            // numeric keys always ok
            console.log(`key ${key} is a number!`);
            console.log(`input is now ${x.target.value}`);
        }
        else if ('XLNA'.includes(key.toUpperCase()) && x.target.value.toUpperCase() === key.toUpperCase()) {
            x.target.value = key.toUpperCase()
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


