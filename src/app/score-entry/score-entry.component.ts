import { Component, Input } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FocusTrapFactory} from '@angular/cdk/a11y';
import { LegalScore, Vul } from './legalscore';
import { GameDataComponent, BoardObj, BoardPlay } from '../game-data/game-data.component';

@Component({
    selector: 'app-score-entry',
    templateUrl: './score-entry.component.html',
    styleUrls: ['./score-entry.component.css']
})


export class ScoreEntryComponent {
    @Input() gameDataPtr: GameDataComponent;
    viewLines: string[] = [];
    nsOrder: number[] = [];
    onNS: number;
    inputLine: string = ' ';
    lastInput: string = '';
    legalScoreObj : LegalScore = new LegalScore();
    errmsg: string = '  ';
    
    constructor(private http: HttpClient) {
        this.gameDataPtr = new GameDataComponent(this.http); //dummy
        this.onNS = 4;  // for testing
        console.log(`gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
    }

    ngOnInit() {
        // when this is called, we assume the parent is all setup
        console.log(`in ngOnInit, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
        this.buildNSOrder();
        this.updateView();
    }
    
    updateView() {
        this.viewLines = [];
        this.viewLines[0] = `Section:A  Board:${this.gameDataPtr.boardNum}  Vul:${this.gameDataPtr.boardVul}`;
        this.viewLines[1] = `   NS    SCORE    EW`;
        // default for unused lines
        [...Array(this.gameDataPtr.numPairs).keys()].forEach(pair => {
            this.viewLines[pair+2] = `      ${'--'.repeat(5)}  `; 
        });
        var onEW = 0;
        // handle lines which have real ns&ew pairs (score may still be undefined)
        const bdnum = this.gameDataPtr.boardNum;
        const playInfos = this.gameDataPtr.boardObjs.get(bdnum)?.playInfo as Map<number, BoardPlay>;
        Array.from(playInfos.keys()).forEach((nsPair:number) => {
            const playInfo = playInfos.get(nsPair) as BoardPlay;
            const ewPair = playInfo.ewPair as number;
            // console.log(nsPair, ewPair, nsScore);
            var arrow: string = `   `;
            if (nsPair === this.onNS) {
                arrow = `==>`;
                onEW = ewPair;
            }
            this.viewLines[nsPair+1] = `${arrow}${nsPair.toString().padStart(2,' ')}  ${this.scoreStr(playInfo, true)} ${this.scoreStr(playInfo, false)}  ${ewPair.toString().padStart(2,' ')}    `;
        });
        this.viewLines.push(` `);
        this.viewLines.push(this.errmsg);
        this.errmsg = '  '; 
        this.inputLine = `Board: ${this.gameDataPtr.boardNum}  NS:${this.onNS}  EW:${onEW}  VUL:${this.gameDataPtr.boardVul}     SCORE:`;
        // console.log(this.viewLines);
    }

    scoreStr(playInfo: BoardPlay, forNS: boolean): string {
        var str = ' ';
        if (playInfo?.nsScore === -2) str = ' ? ';
        else if (playInfo?.nsScore !== -1) {
            // normal ScoreObj with a score
            const score = playInfo.nsScore;
            if (score === 0 && forNS) str = 'PASS';
            else if (score > 0 && forNS) str = `${score}`;
            else if (score < 0 && !forNS) str = `${-1*score}`;
        }
        else {
            // a "special" playInfo, with strings in the kindNS and kindEW
            str = (forNS ? playInfo?.kindNS : playInfo?.kindEW);
        }
        return str.padStart(4, ' ');
    }

    checkScoreLegality(newScore:number) {
        console.log(`legalscore = ${this.legalScoreObj.checkNSScoreLegal(newScore, Vul.V, Vul.V)}`); 
        return this.legalScoreObj.checkNSScoreLegal(newScore, Vul.V, Vul.V);
    }

    checkSpecialInput(curInput: string, x:any) : boolean {
        var foundSpecial:boolean = false;
        // get pointer to playInfo for onNS board
        const playInfo = this.gameDataPtr.boardObjs.get(this.gameDataPtr.boardNum)?.playInfo.get(this.onNS) as BoardPlay;
        if (curInput === 'X') {
            playInfo.addScoreInfo(-2);
            foundSpecial = true;
        }
        if (curInput === 'N') {
            playInfo.addScoreInfo(-1, 'NP ');
            foundSpecial = true;
        }
        if (curInput === 'L') {
            playInfo.addScoreInfo(-1, 'LATE');
            foundSpecial = true;
        }
        if (curInput === 'A') {
            playInfo.addScoreInfo(-1, 'AVE', 'AVE');
            foundSpecial = true;
        }
        if (curInput === 'A+') {
            playInfo.addScoreInfo(-1, 'AVE+', 'AVE-');
            foundSpecial = true;
        }
        if (curInput === 'A-') {
            playInfo.addScoreInfo(-1, 'AVE-', 'AVE+');
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
        const onNSPlayInfo = this.gameDataPtr.boardObjs.get(this.gameDataPtr.boardNum)?.playInfo.get(this.onNS) as BoardPlay;
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
                    onNSPlayInfo.addScoreInfo(newScore);
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
                onNSPlayInfo.addScoreInfo(newScore);
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
                onNSPlayInfo.addScoreInfo(newScore);
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
        const bdobj = this.gameDataPtr.boardObjs.get(this.gameDataPtr.boardNum) as BoardObj;
        this.nsOrder = Array.from(bdobj.playInfo.keys()).sort();
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


