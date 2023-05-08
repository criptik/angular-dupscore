import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FocusTrapFactory} from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';
import { LegalScore } from '../legal-score/legal-score.service';
import { GameDataService, BoardObj, BoardPlay } from '../game-data/game-data.service';
import { FormGroup, FormControl } from '@angular/forms';
import * as _ from 'lodash';

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
    errmsg: string = '  ';
    @ViewChild('scoreInput') scoreInput!: ElementRef<HTMLInputElement>;
    @ViewChild('gotoBoardDialog') gotoBoardDialog!: ElementRef<HTMLDialogElement>;
    @ViewChild('unbalancedSpecialDialog') unbalancedSpecialDialog!: ElementRef<HTMLDialogElement>;
    boardsToDoMsg: string = '';
    boardSelectErrMsg: string = '';
    unbalancedSpecialErrMsg: string = '';
    
    unbalancedSpecialNSPrompt: string = '';
    unbalancedSpecialEWPrompt: string = '';
    dialogClosedBySubmit: boolean = false;
    escapedFromUnbalanced: boolean = false;

    gotoBoardForm = new FormGroup({
        boardSelect:  new FormControl(''),
    });

    unbalancedSpecialForm = new FormGroup({
        specialNS:  new FormControl(''),
        specialEW:  new FormControl(''),
    });
    
    constructor(private gameDataPtr: GameDataService,
                private _legalScore: LegalScore,
                private _router: Router,
                private _activatedRoute: ActivatedRoute,)  {
        // console.log(`in constructor, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
    }

    ngAfterViewInit() {
        // console.log(this.specialNS, this.specialEW);
    }
    
    ngOnInit() {
        // when this is called, parent is all setup
        // console.log(`in score-entry.ngOnInit, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
        if (!this.gameDataPtr.gameDataSetup) {
            this._router.navigate(["/status"]);
            return;
        }

        // set boardnum to first incomplete board
        let startingBoard = 1; // default if nothing found below
        Array.from(this.gameDataPtr.boardObjs.values()).every( bdobj => {
            // console.log(`board ${bdobj.bdnum}, allEntered=${bdobj.allPlaysEntered}`);
            if (!bdobj.allPlaysEntered) {
                startingBoard = bdobj.bdnum;
            }
            return bdobj.allPlaysEntered;
        });
        this.startBoard(startingBoard);
        this.updateView();
    }

    getVulStr(bdnum: number): string {
        const bdobj: BoardObj = this.getBoardObj(bdnum);
        const vulNS = bdobj.vulNS;
        const vulEW = bdobj.vulEW;
        if (!vulNS && !vulEW) return 'NONE';
        if (vulNS && !vulEW) return 'N-S';
        if (!vulNS && vulEW) return 'E-W';
        else return 'BOTH';
    }
    
    updateView() {
        const p: GameDataService = this.gameDataPtr;
        this.viewLines = [];
        const bdvulStr = this.getVulStr(this.curBoardNum);
        this.viewLines[0] = `Section:A  Board:${this.curBoardNum}  Vul:${bdvulStr}`;
        this.viewLines[1] = `   NS    SCORE    EW`;
        // default for unused lines
        [...Array(p.numNSPairs).keys()].forEach(pair => {
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
            this.viewLines[nsPair+1] = `${arrow}${nsPair.toString().padStart(2,' ')}  ${p.scoreStr(boardPlay, true)} ${p.scoreStr(boardPlay, false)}  ${Math.abs(ewPair).toString().padStart(2,' ')}    `;
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
            this.scoreInput?.nativeElement.focus();
        }
        else {
            // at the end of a board, initiate gotoBoard dialog
            p.boardObjs.get(this.curBoardNum)?.updateAllPlaysEntered();
            const bdobj = p.boardObjs.get(this.curBoardNum) as BoardObj;
            bdobj.computeMP(p.boardTop);
            p.saveToLocalStorage();
            // build the modal dialog box info
            let defaultNextBoard: number = 0;
            this.boardsToDoMsg = '';
            // console.log('boardObjs len: ', Array.from(p.boardObjs.values()).length);
            Array.from(p.boardObjs.values()).forEach( bdobj => {
                if (!bdobj.allPlaysEntered) {
                    this.boardsToDoMsg += ` ${bdobj.bdnum}`;
                    if (defaultNextBoard === 0) defaultNextBoard = bdobj.bdnum;
                }
            });
            
            this.gotoBoardForm.get('boardSelect')?.setValue( defaultNextBoard.toString() );            
            this.dialogClosedBySubmit = false;
            this.gotoBoardDialog.nativeElement.onclose = () => {
                if (!this.dialogClosedBySubmit) {
                    // dialog was closed via escape key
                    this._router.navigate(["/status"]);
                }
            };
            this.gotoBoardDialog.nativeElement.showModal();
        }
    }

    startBoard(startingBoard: number) {
        this.curBoardNum = startingBoard;
        this.buildNSOrder();
        this.onNS = this.nsOrder[0];
        this.lastInput = '';
    }
    
    onGoToBoardFormSubmit() {   
        this.boardSelectErrMsg = '';
        const boardSelectStr: string|null|undefined = this.gotoBoardForm.get(`boardSelect`)?.value;
        if (!boardSelectStr) {
            this.boardSelectErrMsg = `Board number must be in range 1 to ${this.gameDataPtr.numBoards}`;
            return;
        }
        
        const boardSelect = parseInt(boardSelectStr!);
        this.startBoard(boardSelect);
        if (boardSelect > 0 && boardSelect <= this.gameDataPtr.numBoards) {
            this.dialogClosedBySubmit = true;
            this.gotoBoardDialog.nativeElement.close();
            this.updateView();
        } else if (boardSelect === 0 && this.boardsToDoMsg.length === 0) {
            this.dialogClosedBySubmit = true;
            this.gotoBoardDialog.nativeElement.close();
            this._router.navigate(["/status"]);
        } else {
            this.boardSelectErrMsg = `Board number must be in range 1 to ${this.gameDataPtr.numBoards}`;
            return;
        }
    }

    checkUnbalancedSpecialInputs(): boolean {
        // check that both are legal combination.
        this.unbalancedSpecialErrMsg = '';
        const strMap: Map<string, string> = new Map<string, string> (
            [['A', 'AVE'],
             ['A+', 'AVE+'],
             ['A-', 'AVE-']]);
        const legals = Array.from(strMap.keys());
        const specialNSStr: string|null|undefined = this.unbalancedSpecialForm.get(`specialNS`)?.value;
        const specialEWStr: string|null|undefined = this.unbalancedSpecialForm.get(`specialEW`)?.value;
        if (!specialNSStr || !legals.includes(specialNSStr) ||
            !specialEWStr || !legals.includes(specialEWStr) ) {
            this.unbalancedSpecialErrMsg = 'Specify A, A+, A- for each of NS and EW';
            return false;
        }

        // now know both are legal special inputs
        const strNS: string = strMap.get(specialNSStr!) ?? '';
        const strEW: string = strMap.get(specialEWStr!) ?? '';
        const curBoardPlay = this.getBoardPlay(this.curBoardNum, this.onNS);
        curBoardPlay.addSpecialScoreInfo(strNS, strEW);
        this.onNS = this.getNewNS(1);
        this.updateView();
        return true;
    }
    
    unbalancedSpecialFormSubmit() {
        const ok: boolean = this.checkUnbalancedSpecialInputs();
        if (ok) {
            this.dialogClosedBySubmit = true;
            this.unbalancedSpecialDialog.nativeElement.close();
        }
        else {
            this.unbalancedSpecialErrMsg = 'Special code needed for NS and EW';
            return;
        }
    }

    checkScoreLegality(newScore:number) {
        const bdobj: BoardObj = this.getBoardObj(this.curBoardNum);
        const vulNS = bdobj.vulNS;
        const vulEW = bdobj.vulEW;
        return this._legalScore.checkNSScoreLegal(newScore, vulNS, vulEW);
    }

    getBoardPlays(bdnum: number): Map<number, BoardPlay> {
        const boardPlays = this.getBoardObj(bdnum).boardPlays as Map<number, BoardPlay>;
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
            boardPlay.addEmptyScoreInfo();
            foundSpecial = true;
        }
        if (curInput === 'N') {
            boardPlay.addSpecialScoreInfo('NP ');
            foundSpecial = true;
        }
        if (curInput === 'L') {
            boardPlay.addSpecialScoreInfo( 'LATE');
            foundSpecial = true;
        }
        if (curInput === 'A') {
            boardPlay.addSpecialScoreInfo( 'AVE', 'AVE');
            foundSpecial = true;
        }
        if (curInput === 'A+') {
            boardPlay.addSpecialScoreInfo( 'AVE+', 'AVE-');
            foundSpecial = true;
        }
        if (curInput === 'A-') {
            boardPlay.addSpecialScoreInfo( 'AVE-', 'AVE+');
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
                    this.unbalancedSpecialForm.get('specialNS')?.setValue('');
                    this.unbalancedSpecialForm.get('specialEW')?.setValue('');
                    this.dialogClosedBySubmit = false;
                    this.unbalancedSpecialDialog.nativeElement.onclose = () => {
                        if (!this.dialogClosedBySubmit) {
                            // dialog was closed via escape key
                            // stay on this onNS, nothing to do?
                            this.escapedFromUnbalanced = true;
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
            if (!this.escapedFromUnbalanced) {
                this.onNS = nsEndBoardMarker;
            }
            this.escapedFromUnbalanced = false;
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

    getBoardObj(forBoardNum: number): BoardObj {
        const bdobj = this.gameDataPtr.boardObjs.get(forBoardNum) as BoardObj;
        return bdobj;
    }
    
    buildNSOrder() {
        const bdobj = this.getBoardObj(this.curBoardNum);
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


