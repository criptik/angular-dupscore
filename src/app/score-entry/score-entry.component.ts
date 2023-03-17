import { Component, Input } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FocusTrapFactory} from '@angular/cdk/a11y';
import { LegalScore, Vul } from './legalscore';
import { GameDataComponent, BoardObj, BoardPlay } from '../game-data/game-data.component';

var nsEndBoardMarker: number = -1;

@Component({
    selector: 'app-score-entry',
    templateUrl: './score-entry.component.html',
    styleUrls: ['./score-entry.component.css']
})


export class ScoreEntryComponent {
    @Input() gameDataPtr: GameDataComponent;
    testStartBoardNum: number = 5;
    curBoardNum: number = 5;
    viewLines: string[] = [];
    nsOrder: number[] = [];
    onNS: number = 0;
    inputElement: any = 1;
    inputLine: string = ' ';
    lastInput: string = '';
    legalScoreObj : LegalScore = new LegalScore();
    errmsg: string = '  ';
    
    constructor(private http: HttpClient) {
        this.gameDataPtr = new GameDataComponent(this.http); //dummy
        console.log(`gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
    }

    ngOnInit() {
        // when this is called, we assume the parent is all setup
        console.log(`in ngOnInit, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
        // temporary stuff for testing
        const testBoardPlays  = this.gameDataPtr.boardObjs.get(this.testStartBoardNum)?.boardPlays;
        
        testBoardPlays?.get(1)?.addScoreInfo(1100);   // ns pair 1 on testBoardNum 
        testBoardPlays?.get(6)?.addScoreInfo(-1100);  // ns pair 6 etc.
        // for now leave other ns pair 4 empty
        console.log(testBoardPlays);

        this.curBoardNum = 1;
        this.buildNSOrder();
        this.onNS = this.nsOrder[0];
        console.log(this.nsOrder);
        this.updateView();
    }
    
    updateView() {
        this.viewLines = [];
        this.viewLines[0] = `Section:A  Board:${this.curBoardNum}  Vul:${this.gameDataPtr.boardVul}`;
        this.viewLines[1] = `   NS    SCORE    EW`;
        // default for unused lines
        [...Array(this.gameDataPtr.numPairs).keys()].forEach(pair => {
            this.viewLines[pair+2] = `      ${'--'.repeat(5)}  `; 
        });
        var onEW = 0;
        // handle lines which have real ns&ew pairs (score may still be undefined)
        const boardPlays = this.getBoardPlays(this.curBoardNum);
        Array.from(boardPlays.keys()).forEach((nsPair:number) => {
            const boardPlay = boardPlays.get(nsPair) as BoardPlay;
            const ewPair = boardPlay.ewPair as number;
            // console.log(nsPair, ewPair, nsScore);
            var arrow: string = `   `;
            if (nsPair === this.onNS) {
                arrow = `==>`;
                onEW = ewPair;
            }
            this.viewLines[nsPair+1] = `${arrow}${nsPair.toString().padStart(2,' ')}  ${this.scoreStr(boardPlay, true)} ${this.scoreStr(boardPlay, false)}  ${ewPair.toString().padStart(2,' ')}    `;
        });
        // build incomplete board list
        if (this.onNS === nsEndBoardMarker) {
            this.gameDataPtr.boardObjs.get(this.curBoardNum)?.updateAllPlaysEntered();
            this.errmsg = 'Boards To Score: ';
            Array.from(this.gameDataPtr.boardObjs.keys()).forEach( bdnum => {
                if (!this.gameDataPtr.boardObjs.get(bdnum)?.allPlaysEntered) {
                    this.errmsg += ` ${bdnum}`;
                }
            });
        }
        this.viewLines.push(` `);
        this.viewLines.push(this.errmsg);
        this.errmsg = '  '; 
        if (this.onNS === nsEndBoardMarker) {
            // temporary for testing
            const bdobj = this.gameDataPtr.boardObjs.get(this.curBoardNum) as BoardObj;
            bdobj.computeMP();
            console.log(bdobj.mpMap);
            this.inputLine = `Go To Board: `;
            this.inputElement.target.value = `${this.curBoardNum+1}`;
        }
        else {
            this.inputLine = `Board: ${this.curBoardNum}  NS:${this.onNS}  EW:${onEW}  VUL:${this.gameDataPtr.boardVul}     SCORE:`;
        }
        // console.log(this.viewLines);
    }

    scoreStr(boardPlay: BoardPlay, forNS: boolean): string {
        var str = ' ';
        if (boardPlay?.nsScore === -2) str = ' ? ';
        else if (boardPlay?.nsScore !== -1) {
            // normal ScoreObj with a score
            const score = boardPlay.nsScore;
            if (score === 0 && forNS) str = 'PASS';
            else if (score > 0 && forNS) str = `${score}`;
            else if (score < 0 && !forNS) str = `${-1*score}`;
        }
        else {
            // a "special" boardPlays, with strings in the kindNS and kindEW
            str = (forNS ? boardPlay?.kindNS : boardPlay?.kindEW);
        }
        return str.padStart(4, ' ');
    }

    checkScoreLegality(newScore:number) {
        console.log(`legalscore = ${this.legalScoreObj.checkNSScoreLegal(newScore, Vul.V, Vul.V)}`); 
        return this.legalScoreObj.checkNSScoreLegal(newScore, Vul.V, Vul.V);
    }

    getBoardPlays(bdnum: number): Map<number, BoardPlay> {
        const boardPlays = this.gameDataPtr.boardObjs.get(bdnum)?.boardPlays as Map<number, BoardPlay>;
        return boardPlays;
    }
    
    getBoardPlay(bdnum: number, nsPair: number): BoardPlay {
        const boardPlay = this.getBoardPlays(bdnum).get(nsPair) as BoardPlay;
        return boardPlay;
    }

    checkSpecialInput(curInput: string, x:any) : boolean {
        var foundSpecial:boolean = false;
        // get pointer to boardPlays for onNS board
        const boardPlay = this.getBoardPlay(this.curBoardNum, this.onNS);
        if (curInput === 'X') {
            boardPlay.addScoreInfo(-2);
            foundSpecial = true;
        }
        if (curInput === 'N') {
            boardPlay.addScoreInfo(-1, 'NP ');
            foundSpecial = true;
        }
        if (curInput === 'L') {
            boardPlay.addScoreInfo(-1, 'LATE');
            foundSpecial = true;
        }
        if (curInput === 'A') {
            boardPlay.addScoreInfo(-1, 'AVE', 'AVE');
            foundSpecial = true;
        }
        if (curInput === 'A+') {
            boardPlay.addScoreInfo(-1, 'AVE+', 'AVE-');
            foundSpecial = true;
        }
        if (curInput === 'A-') {
            boardPlay.addScoreInfo(-1, 'AVE-', 'AVE+');
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

    goToBoardInput() {
        const x = this.inputElement;
        const key: string = x.key;
        var curInput: string = x.target.value;
        if (key === 'Enter') {
            this.curBoardNum = parseInt(curInput);
            x.target.value = '';
            this.buildNSOrder();
            this.onNS = this.nsOrder[0];
            this.updateView();
            return;
        }
        else if (isFinite(parseInt(key))) {
            // numeric keys always ok
            console.log(`goToBoard key ${key} is a number!`);
            console.log(`input is now ${x.target.value}`);
        }
        else {
            // ignore anything else
            x.target.value = '';
            console.log(`input is now ${x.target.value}`);
        }
        
    }
    
    onInputKeyUp(x : any) {
        this.inputElement = x;  // save this
        const key: string = x.key;
        var curInput: string = x.target.value;
        // check for special situation
        if (this.onNS === nsEndBoardMarker) {
            this.goToBoardInput();
            return;
        }
        else {
            this.scoreEntryInput();
            return;
        }
    }
    
    scoreEntryInput() {    
        const x = this.inputElement;
        const key: string = x.key;
        var curInput: string = x.target.value;
        const onNSBoardPlay = this.getBoardPlay(this.curBoardNum, this.onNS);
        console.log(`key=${key}, curInput=${curInput}, lastInput=${this.lastInput}`);
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
                    onNSBoardPlay.addScoreInfo(newScore);
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
                this.lastInput = this.lastInput;
                x.target.value = '';
                onNSBoardPlay.addScoreInfo(newScore);
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
                onNSBoardPlay.addScoreInfo(newScore);
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
        if (newidx < 0) return this.onNS;
        if (newidx >= this.nsOrder.length) return nsEndBoardMarker;  // special code for end of board scores
        else return this.nsOrder[newidx];
    }
    
    buildNSOrder() {
        const bdobj = this.gameDataPtr.boardObjs.get(this.curBoardNum) as BoardObj;
        this.nsOrder = Array.from(bdobj.boardPlays.keys()).sort();
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


