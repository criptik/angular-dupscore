import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FocusTrapFactory} from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';
import { LegalScore } from './legalscore';
import { GameDataService, BoardObj, BoardPlay } from '../game-data/game-data.service';

const nsEndBoardMarker: number = -1;

@Component({
    selector: 'app-score-entry',
    templateUrl: './score-entry.component.html',
    styleUrls: ['./score-entry.component.css']
})

export class ScoreEntryComponent implements AfterViewInit {
    curBoardNum: number = 0;
    viewLines: string[] = [];
    nsOrder: number[] = [];
    onNS: number = 0;
    inputElement: any = 1;
    inputLine: string = ' ';
    lastInput: string = '';
    legalScoreObj : LegalScore = new LegalScore();
    errmsg: string = '  ';
    @ViewChild('gotoBoardDialog') gotoBoardDialog!: ElementRef<HTMLDialogElement>;
    @ViewChild('boardSelect') boardSelect!: ElementRef<HTMLInputElement>;
    @ViewChild('unbalancedSpecialDialog') unbalancedSpecialDialog!: ElementRef<HTMLDialogElement>;
    @ViewChild('specialNS') specialNS!: ElementRef<HTMLInputElement>;
    @ViewChild('specialEW') specialEW!: ElementRef<HTMLInputElement>;
    boardsToDoMsg: string = '';
    specialNSStr: string = '';
    specialEWStr: string = '';
    unbalancedSpecialNSPrompt: string = '';
    unbalancedSpecialEWPrompt: string = '';
    dialogClosedByEnter: boolean = false;
    
    constructor(private gameDataPtr: GameDataService,
                private _router: Router,
                private _activatedRoute: ActivatedRoute,)  {
        // console.log(`in constructor, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
    }

    ngAfterViewInit() {
    }
    
    ngOnInit() {
        // when this is called, parent is all setup
        // console.log(`in score-entry.ngOnInit, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
        if (!this.gameDataPtr.gameDataSetup) {
            this._router.navigate(["/status"]);
            return;
        }

        // set boardnum to first incomplete board
        this.curBoardNum = 1;  // default if nothing found below
        Array.from(this.gameDataPtr.boardObjs.values()).every( bdobj => {
            // console.log(`board ${bdobj.bdnum}, allEntered=${bdobj.allPlaysEntered}`);
            if (!bdobj.allPlaysEntered) {
                this.curBoardNum = bdobj.bdnum;
            }
            return bdobj.allPlaysEntered;
        });

        this.buildNSOrder();
        this.onNS = this.nsOrder[0];
        // console.log(this.nsOrder);
        this.updateView();
    }

    getVulStr(bdnum: number): string {
        const bdobj: BoardObj = this.gameDataPtr.boardObjs.get(bdnum) as BoardObj;
        const vulNS = bdobj.vulNS;
        const vulEW = bdobj.vulEW;
        if (!vulNS && !vulEW) return 'NONE';
        if (vulNS && !vulEW) return 'N-S';
        if (!vulNS && vulEW) return 'E-W';
        else return 'BOTH';
    }
    
    updateView() {
        this.viewLines = [];
        const bdvulStr = this.getVulStr(this.curBoardNum);
        this.viewLines[0] = `Section:A  Board:${this.curBoardNum}  Vul:${bdvulStr}`;
        this.viewLines[1] = `   NS    SCORE    EW`;
        // default for unused lines
        [...Array(this.gameDataPtr.numPairs).keys()].forEach(pair => {
            this.viewLines[pair+2] = `       ${'--'.repeat(5)}  `; 
        });
        let onEW = 0;
        // handle lines which have real ns&ew pairs (score may still be undefined)
        const boardPlays = this.getBoardPlays(this.curBoardNum);
        Array.from(boardPlays.values()).forEach((boardPlay: BoardPlay) => {
            const ewPair: number = boardPlay.ewPair;
            const nsPair: number = boardPlay.nsPair;
            // console.log(nsPair, ewPair, nsScore);
            let arrow: string = `   `;
            if (nsPair === this.onNS) {
                arrow = `==>`;
                onEW = ewPair;
            }
            this.viewLines[nsPair+1] = `${arrow}${nsPair.toString().padStart(2,' ')}  ${this.scoreStr(boardPlay, true)} ${this.scoreStr(boardPlay, false)}  ${ewPair.toString().padStart(2,' ')}    `;
        });
        this.viewLines.push(` `); 
        if (this.onNS !== nsEndBoardMarker) {
            // normal prompt for score for current boardplay
            // get boardplay for onNS
            const curBoardPlay = this.getBoardPlay(this.curBoardNum, this.onNS);
            const onEW: number = curBoardPlay.ewPair;
            const bdvulStr = this.getVulStr(this.curBoardNum);
            this.inputLine = `Board: ${this.curBoardNum}  NS:${this.onNS}  EW:${onEW}  Vul:${bdvulStr}  SCORE:`;
            this.viewLines.push(this.errmsg);
            this.errmsg = '  ';
        }
        else {
            // at the end of a board, initiate gotoBoard dialog
            this.gameDataPtr.boardObjs.get(this.curBoardNum)?.updateAllPlaysEntered();
            const bdobj = this.gameDataPtr.boardObjs.get(this.curBoardNum) as BoardObj;
            bdobj.computeMP(this.gameDataPtr.boardTop);
            // build the modal dialog box info
            let defaultNextBoard: number = 0;
            this.boardsToDoMsg = '';
            Array.from(this.gameDataPtr.boardObjs.values()).forEach( bdobj => {
                if (!bdobj.allPlaysEntered) {
                    this.boardsToDoMsg += ` ${bdobj.bdnum}`;
                    if (defaultNextBoard === 0) defaultNextBoard = bdobj.bdnum;
                }
            });
            
            this.boardSelect.nativeElement.value = (defaultNextBoard === 0) ? '1' : defaultNextBoard.toString();            
            this.dialogClosedByEnter = false;
            this.gotoBoardDialog.nativeElement.onclose = () => {
                if (!this.dialogClosedByEnter) {
                    // dialog was closed via escape key
                    this._router.navigate(["/status"]);
                }
            };
            this.gotoBoardDialog.nativeElement.showModal();
        }
    }


    onGoToBoardInputKeyUp(x : any) {   
        const key: string = x.key;
        let curInput: string = x.target.value;
        console.log(`boardSelect: key=${key}, curinput=${curInput}`);
        if (key === 'Enter') {
            const inputNum = parseInt(curInput);
            x.target.value = '';
            if (inputNum > 0 && inputNum <= this.gameDataPtr.numBoards) {
                this.curBoardNum = inputNum;
                this.buildNSOrder();
                this.onNS = this.nsOrder[0];
                this.dialogClosedByEnter = true;
                this.gotoBoardDialog.nativeElement.close();
                this.updateView();
            }
        }
    }

    checkUnbalancedSpecialInputs(): boolean {
        console.log(`checkUnbalanced: NS=${this.specialNSStr}, EW=${this.specialEWStr}`);
        if (this.specialNSStr === '') {
            this.specialNS.nativeElement.focus();
            return false;
        }
        if (this.specialEWStr === '') {
            this.specialEW.nativeElement.focus();
            return false;
        }
        const strMap: Map<string, string> = new Map<string, string> (
            [['A', 'AVE'],
             ['A+', 'AVE+'],
             ['A-', 'AVE-'],
            ]
        );
        const legals = Array.from(strMap.keys());
        if (!legals.includes(this.specialNSStr)) {
            this.specialNS.nativeElement.value = '';
            return false;
        }
        if (!legals.includes(this.specialEWStr)) {
            this.specialEW.nativeElement.value = '';
            return false;
        }
        
        // now know both are legal special inputs
        this.specialNS.nativeElement.value = '';
        this.specialEW.nativeElement.value = '';
        const strNS = strMap.get(this.specialNSStr);
        const strEW = strMap.get(this.specialEWStr);
        console.log('strs', strNS, strEW);
        const curBoardPlay = this.getBoardPlay(this.curBoardNum, this.onNS);
        curBoardPlay.addScoreInfo(-1, strNS, strEW);
        this.onNS = this.getNewNS(1);
        this.updateView();
        return true;
    }
    
    onSpecialNSInputKeyUp(x : any) {   
        console.log('nsinputkeyup', this.specialNS, this.specialEW);
        const key: string = x.key;
        let curInput: string = x.target.value;
        console.log(`SpecialNS: key=${key}, curinput=${curInput}`);
        if (key === 'Enter') {
            this.specialNSStr = curInput;
            const ok = this.checkUnbalancedSpecialInputs();
            if (ok) this.unbalancedSpecialDialog.nativeElement.close();
        }
        else if (key === 'Escape') {
            // dialog was closed via escape key
            this.unbalancedSpecialDialog.nativeElement.close();
        }
    }

    onSpecialEWInputKeyUp(x : any) {
        const key: string = x.key;
        let curInput: string = x.target.value;
        console.log(`SpecialEW: key=${key}, curinput=${curInput}`);
        if (key === 'Enter') {
            this.specialEWStr = curInput;
            const ok = this.checkUnbalancedSpecialInputs();
            if (ok) this.unbalancedSpecialDialog.nativeElement.close();
        }
        else if (key === 'Escape') {
            // dialog was closed via escape key
            this.unbalancedSpecialDialog.nativeElement.close();
        }
    }

    scoreStr(boardPlay: BoardPlay, forNS: boolean): string {
        let str = ' ';
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
        const bdobj: BoardObj = this.gameDataPtr.boardObjs.get(this.curBoardNum) as BoardObj;
        const vulNS = bdobj.vulNS;
        const vulEW = bdobj.vulEW;
        return this.legalScoreObj.checkNSScoreLegal(newScore, vulNS, vulEW);
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
        let foundSpecial:boolean = false;
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

    scoreEntryInput() {
        const x = this.inputElement;
        const key: string = x.key;
        let curInput: string = x.target.value;
        const onNSBoardPlay = this.getBoardPlay(this.curBoardNum, this.onNS);
        // console.log(`key=${key}, curInput=${curInput}, lastInput=${this.lastInput}`);
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
                if (curInput === 'S') {
                    x.target.value = '';
                    const curBoardPlay = this.getBoardPlay(this.curBoardNum, this.onNS);
                    this.unbalancedSpecialNSPrompt = `Board ${this.curBoardNum}, NS Pair ${curBoardPlay.nsPair}:`
                    this.unbalancedSpecialEWPrompt = `Board ${this.curBoardNum}, EW Pair ${curBoardPlay.ewPair}:`
                    this.dialogClosedByEnter = false;
                    this.unbalancedSpecialDialog.nativeElement.onclose = () => {
                        if (!this.dialogClosedByEnter) {
                            // dialog was closed via escape key
                            // stay on this onNS, nothing to do?
                            return;
                        }
                    };
                    this.unbalancedSpecialDialog.nativeElement.showModal();
                    return;
                }
                
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
                this.errmsg = `!! ${newScore} is not possible on this board !!`;
            }
        }
        else if (key === 'Escape') {
            this.onNS = nsEndBoardMarker;
            this.updateView();
        }
        
        else if (isFinite(parseInt(key))) {
            // numeric keys always ok
            // console.log(`key ${key} is a number!`);
            // console.log(`input is now ${x.target.value}`);
        }
        else if ('XLNAS'.includes(key.toUpperCase()) && x.target.value.toUpperCase() === key.toUpperCase()) {
            x.target.value = key.toUpperCase()
        }
        
        else {
            // ignore non-numeric keys
            // console.log(`key ${key} is not a number!`);
            x.target.value = x.target.value.slice(0, -1);
            // console.log(`input is now ${x.target.value}`);
        }
    }
    
    onScoreEntryInputKeyUp(x : any) {
        this.inputElement = x;  // save this
        // ignore if gameData not set up yet
        if (!this.gameDataPtr.gameDataSetup) return;

        // the associated input element is only used for
        // score entries for a particular boardplay
        this.scoreEntryInput();
        return;
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
    constructor(private elem : ElementRef) {
        // console.log('autofocus diretive constructor');
    }
    
    ngAfterContentInit() {
        // console.log('in ngAfterContentInit');
        this.elem.nativeElement.focus();
    }
}


