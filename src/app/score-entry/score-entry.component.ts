import { Component, Input, ViewChild, AfterViewInit, AfterContentInit } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FocusTrapFactory} from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';
import { LegalScore } from '../legal-score/legal-score.service';
import { GameDataService, BoardObj, BoardPlay, NNMap, TravOrder } from '../game-data/game-data.service';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import * as _ from 'lodash';

const nsEndBoardMarker: number = -1;


@Component({
    template: '',
    styleUrls: [],
    standalone: false
})

abstract class ScoreBaseComponent implements AfterViewInit, AfterContentInit {
    curBoardNum: number = 0;
    viewLines: string[] = [];
    nsOrder: number[] = [];
    onNS: number = 0;
    inputElement: any = 1;
    inputLine: string = ' ';
    lastInput: string = '';
    errmsg: string = '  ';
    @ViewChild('scoreInput') scoreInput!: ElementRef<HTMLInputElement>;
    @ViewChild('gotoBoardDialog', {static: true}) gotoBoardDialog!: ElementRef<HTMLDialogElement>;
    @ViewChild('boardSelect', {static: true}) boardSelect!: ElementRef<HTMLInputElement>;
    @ViewChild('unbalancedSpecialDialog') unbalancedSpecialDialog!: ElementRef<HTMLDialogElement>;
    boardsToDoMsg: string = '';
    boardSelectErrMsg: string = '';
    unbalancedSpecialErrMsg: string = '';
    
    unbalancedSpecialNSPrompt: string = '';
    unbalancedSpecialEWPrompt: string = '';
    escapedFromUnbalanced: boolean = false;

    gotoBoardForm = new FormGroup({
        boardSelect:  new FormControl(''),
    });

    unbalancedSpecialForm = new FormGroup({
        specialNS:  new FormControl(''),
        specialEW:  new FormControl(''),
    });
    
    constructor(public gameDataPtr: GameDataService,
                public _legalScore: LegalScore,
                public _router: Router,
                public _activatedRoute: ActivatedRoute,) {
    }

    ngAfterViewInit() {
    }
    
    ngOnInit() {
        this.initComponent();
    }

    ngAfterContentInit() {
    }
    
    initComponent() {
        // console.log('ngOnInit in base');
        // when this is called, parent is all setup
        // console.log(`in score-entry.ngOnInit, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
        if (!this.gameDataPtr.gameDataSetup) {
            this._router.navigate(["/status"]);
            return;
        }

        // set boardnum to first incomplete board
        const startingBoard = this.findStartingBoard();
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
        this.viewLines[1] = `   NS    SCORE    EW     CONTRACT`;
        if (false) {
            // default for unused lines
            this.nsOrder.forEach((pairnum, index) => {
                this.viewLines[index+2] = `       ${'--'.repeat(5)}  `; 
            });
        }
        // handle lines which have real ns&ew pairs (score may still be undefined)
        this.nsOrder.forEach((nsPair, index) => {
            const boardPlay = this.getBoardPlay(this.curBoardNum, nsPair);
            const ewPair: number = boardPlay.ewPair;
            // console.log(nsPair, ewPair, nsScore);
            const arrow: string = (nsPair === this.onNS ? `==>` : `   `);
            const nsPairStr: string = nsPair.toString().padStart(2,' ');
            const ewPairStr: string = Math.abs(ewPair).toString().padStart(2,' ');
            const nsScoreStr: string = p.scoreStr(boardPlay, true);
            const ewScoreStr: string = p.scoreStr(boardPlay, false);
            let rawStandardNote:string = (boardPlay.contractNote === '' ? '' : this._legalScore.contractNoteStandardize(boardPlay.contractNote)!);
            this.viewLines[index+2] = `${arrow}${nsPairStr}  ${nsScoreStr} ${ewScoreStr}  ${ewPairStr}     ${rawStandardNote}  `;
        });
        this.viewLines.push(` `); // separator line
        if (this.onNS !== nsEndBoardMarker) {
            // normal prompt for score for current boardplay
            // get boardplay for onNS
            const curBoardPlay = this.getBoardPlay(this.curBoardNum, this.onNS);
            const onEW: number = Math.abs(curBoardPlay.ewPair);
            const bdvulStr = this.getVulStr(this.curBoardNum);
            this.inputLine = `Board: ${this.curBoardNum}  NS:${this.onNS}  EW:${onEW}  Vul:${bdvulStr}  SCORE:`;
            this.viewLines.push(this.errmsg);
            this.errmsg = '  ';
            this.scoreInput?.nativeElement.focus();
        }
        else {
            // at the end of a board, initiate gotoBoard dialog
            this.endOfBoardHook();
            const defaultNextBoard = this.getBoardSelectInfo();
            
            this.gotoBoardForm.get('boardSelect')?.setValue( defaultNextBoard.toString() );            
            this.gotoBoardDialog.nativeElement.oncancel = () => {
                console.log('oncancel detected');
                // dialog was closed via escape key
                this._router.navigate(["/status"]);
            };
            this.gotoBoardDialog.nativeElement.showModal();
            this.boardSelect.nativeElement.focus();
        }
    }

    startBoard(startingBoard: number) {
        this.curBoardNum = startingBoard;
        this.buildNSOrder();
        this.lastInput = '';
        this.initializeOnNS();
    }

    onGoToBoardFormSubmit() {   
        this.boardSelectErrMsg = '';
        const boardSelectStr: string|null|undefined = this.gotoBoardForm.get(`boardSelect`)?.value;
        if (!boardSelectStr) {
            this.boardSelectErrMsg = `Board number must be in range 1 to ${this.gameDataPtr.numBoards}`;
            return;
        }
        
        const boardSelect = parseInt(boardSelectStr!);
        // console.log('boardSelect:', boardSelect, this.boardsToDoMsg);
        if (boardSelect > 0 && boardSelect <= this.gameDataPtr.numBoards) {
            this.gotoBoardDialog.nativeElement.close();
            this.startBoard(boardSelect);
            this.updateView();
        } else if (boardSelect === 0 && this.boardsToDoMsg.length === 0) {
            this.gotoBoardDialog.nativeElement.close();
            this._router.navigate(["/status"]);
        } else {
            this.boardSelectErrMsg = `Board number must be in range 1 to ${this.gameDataPtr.numBoards}`;
            return;
        }
    }

    onGoToBoardFormCancel() {
        console.log('onGoToBoardFormCancel');
        this.gotoBoardDialog.nativeElement.close();
        this._router.navigate(["/status"]);
    }
    
    checkUnbalancedSpecialInputs(): boolean {
        // check that both are legal combination.
        this.unbalancedSpecialErrMsg = '';
        const strMap: Map<string, string> = new Map<string, string> (
            [['A', 'AVE'],
             ['A+', 'AVE+'],
             ['A-', 'AVE-']]);
        const legals = Array.from(strMap.keys());
        let specialNSStr: string|null|undefined = this.unbalancedSpecialForm.get(`specialNS`)?.value;
        let specialEWStr: string|null|undefined = this.unbalancedSpecialForm.get(`specialEW`)?.value;
        [specialNSStr, specialEWStr].forEach( specialStr => {
            let ok;
            if (!specialStr) ok = false;             // cannot be empty
            else if (!isNaN(+specialStr)) ok = true;  // numbers are allowed
            else if (legals.includes(specialStr)) ok = true;  // special strings are allowed
            else ok = false;
            if (!ok) this.unbalancedSpecialErrMsg = 'Specify A, A+, A- or a number of MP for each of NS and EW';
        });
        if (this.unbalancedSpecialErrMsg !== '') return false;
        
        // now know both are legal special inputs
        // if it is a shorthand for AVE, etc. convert it now
        if (legals.includes(specialNSStr!)) specialNSStr = strMap.get(specialNSStr!) ?? '';
        if (legals.includes(specialEWStr!)) specialEWStr = strMap.get(specialEWStr!) ?? '';
        const curBoardPlay = this.getBoardPlay(this.curBoardNum, this.onNS);
        curBoardPlay.addSpecialScoreInfo(specialNSStr!, specialEWStr!);
        this.onNS = this.getNewNS(1);
        this.updateView();
        return true;
    }
    
    unbalancedSpecialFormSubmit() {
        const ok: boolean = this.checkUnbalancedSpecialInputs();
        if (ok) {
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

    isStringAllDigits(str:string) :boolean {
        return /^\d+$/.test(str);
    }

    handleNumericScore(newScore:number, curInput:string, onNSBoardPlay:BoardPlay) {
        const x = this.inputElement;
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
            // console.log(`Enter key with curInput="${curInput}"`);
            if (curInput !== '') {
                // first check for a legal contract-result note which can be used instead of a score.
                const noteScore:number|undefined = this._legalScore.contractNoteStrToDupscoreNS(curInput, this.curBoardNum);
                if (noteScore !== undefined) {
                   this.lastInput = curInput;
                    x.target.value = '';
                    // adding a contractNote as well
                    onNSBoardPlay.addScoreInfo(noteScore, curInput);
                    this.onNS = this.getNewNS(1);
                    this.updateView();
                    return;
                }
                
                if (this.checkSpecialInput(curInput, x)) return;
                if (curInput === 'S') {
                    x.target.value = '';
                    const curBoardPlay = this.getBoardPlay(this.curBoardNum, this.onNS);
                    this.unbalancedSpecialNSPrompt = `Board ${this.curBoardNum}, NS Pair ${curBoardPlay.nsPair}:`
                    this.unbalancedSpecialEWPrompt = `Board ${this.curBoardNum}, EW Pair ${curBoardPlay.ewPair}:`
                    this.unbalancedSpecialForm.get('specialNS')?.setValue('');
                    this.unbalancedSpecialForm.get('specialEW')?.setValue('');
                    this.unbalancedSpecialDialog.nativeElement.oncancel = () => {
                        // dialog was closed via escape key
                        // stay on this onNS, nothing to do?
                        this.escapedFromUnbalanced = true;
                    };
                    this.unbalancedSpecialDialog.nativeElement.showModal();
                    return;
                }
                // normal numeric score is either all digits, or explicit minus sign followed by all digits
                if (this.isStringAllDigits(curInput) || (curInput[0] == '-' && this.isStringAllDigits(curInput.slice(1)))) {
                    const newScore : number = parseInt(`${curInput}0`);
                    this.handleNumericScore(newScore, curInput, onNSBoardPlay);
                } else {
                    // Enter seen and not numeric, assume it is an invalid contract note specifier
                    x.target.value = '';
                    this.errmsg = `!! '${curInput}' is not a valid Contract/Result format !!`;
                    this.updateView();
                }
                
                
            } else {
                // here if Enter used and curInput is empty
                // if there is a this.lastInput,
                // we just call scoreEntryInput again after adjusting x.target.value to be lastInput
                // otherwise, we just ignore the Enter
                if (this.lastInput !== '') {
                    x.target.value = this.lastInput;
                    // console.log(`reusing "${this.lastInput}"`);
                    this.scoreEntryInput();
                }
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
            if (!this.isStringAllDigits(curInput.slice(0,-1))) {
                // minus sign is legal in contractNote, so keep going
                return;
            }
            // now we know there is a non-empty input
            // negative score entered
            // move - sign from end of input to beginning
            // console.log(`minus sign typed with curinput=${curInput}`);
            curInput = `-${curInput.slice(0, -1)}`;
            // console.log(`curInput is now ${curInput}`);
            const newScore : number = parseInt(`${curInput}0`);
            // console.log(`newScore is now ${newScore}`);
            this.handleNumericScore(newScore, curInput, onNSBoardPlay);
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
            if (x.target.value === '') x.target.value = key;
            // console.log(`input is now ${x.target.value}`);
        }
        else if ('XLNAS'.includes(key.toUpperCase())) {
            if (x.target.value === '' || x.target.value.toUpperCase() === key.toUpperCase()) {
                x.target.value = key.toUpperCase();
            }
        }
        
        else {
            // ignore non-numeric keys
            // console.log(`key ${key} is not a number!`);
            // x.target.value = x.target.value.slice(0, -1);
            // console.log(`input is now ${x.target.value}`);
        }
    }
    
    onScoreEntryInputKeyUp(x : any) {
        this.inputElement = x;  // save this
        // console.log('input', x);
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
        const p: GameDataService = this.gameDataPtr;
        const bdobj = this.getBoardObj(this.curBoardNum);
        if (p.travOrder === TravOrder.PAIR) {
            this.buildNSOrderPair(bdobj);
        } else if (p.travOrder === TravOrder.ROUND) {
            this.buildNSOrderRound(bdobj);
        }
    }
    
    buildNSOrderPair(bdobj: BoardObj) {    
        this.nsOrder = Array.from(bdobj.boardPlays.keys()).sort((a, b)=>{return a - b});
    }

    buildNSOrderRound(bdobj: BoardObj) {
        // build map of round to ns pair
        const roundToNSPair : NNMap  = new Map();
        Array.from(bdobj.boardPlays.values()).forEach( (bp) => {
            roundToNSPair.set(bp.round, bp.nsPair);
        });
        // console.log('roundToNSPair', roundToNSPair);
        const sortedRounds: number[] = Array.from(roundToNSPair.keys()).sort((a, b)=>{return a - b});
        // console.log('sortedRounds', sortedRounds);
        this.nsOrder = [];
        sortedRounds.forEach( (round) => {
            this.nsOrder.push(roundToNSPair.get(round)!);
        });
    }
    
    abstract endOfBoardHook():void;
    abstract findStartingBoard(): number;
    abstract getBoardSelectInfo(): number;
    abstract isEntryComponent(): boolean;
    abstract initializeOnNS(): void;
}


@Component({
    selector: 'app-score-entry',
    templateUrl: './score-entry.component.html',
    styleUrls: ['./score-entry.component.css'],
    standalone: false
})
export class ScoreEntryComponent extends ScoreBaseComponent implements AfterViewInit {
    constructor(public gameDataPtr: GameDataService,
                public _legalScore: LegalScore,
                public _router: Router,
                public _activatedRoute: ActivatedRoute,) {
        super(gameDataPtr, _legalScore, _router, _activatedRoute);
    }

    isEntryComponent() {
        return true;
    }

    initializeOnNS() {
        this.onNS = this.nsOrder[0];
    }

    endOfBoardHook() {
        const p: GameDataService = this.gameDataPtr;
        p.boardObjs.get(this.curBoardNum)?.updateAllPlaysEntered();
        const bdobj = p.boardObjs.get(this.curBoardNum) as BoardObj;
        bdobj.computeMP(p.boardTop);
        p.saveToLocalStorage();
    }

    findStartingBoard(): number {
        let startingBoard = 1; // default if nothing found below
        Array.from(this.gameDataPtr.boardObjs.values()).every( bdobj => {
            // console.log(`board ${bdobj.bdnum}, allEntered=${bdobj.allPlaysEntered}`);
            if (!bdobj.allPlaysEntered) {
                startingBoard = bdobj.bdnum;
            }
            return bdobj.allPlaysEntered;
        });
        return startingBoard;
    }
    
    getBoardSelectInfo(): number {
        const p: GameDataService = this.gameDataPtr;
        // build the modal dialog box info
        let defaultNextBoard: number = 0;
        this.boardsToDoMsg = '';
        // console.log('boardObjs len: ', Array.from(p.boardObjs.values()).length);
        Array.from(p.boardObjs.values()).forEach( bdobj => {
            // the 2nd crazy check below was because on at least one platform
            // the two table game with 18 boards thought there was a board 19 and 20
            if (!bdobj.allPlaysEntered && (bdobj.bdnum <= p.numBoards)) {
                this.boardsToDoMsg += ` ${bdobj.bdnum}`;
                if (defaultNextBoard === 0) defaultNextBoard = bdobj.bdnum;
            }
        });
        return defaultNextBoard;
    }
}


@Component({
    selector: 'app-review-entry',
    templateUrl: './score-entry.component.html',
    styleUrls: ['./score-entry.component.css'],
    standalone: false
})
export class ScoreReviewComponent extends ScoreBaseComponent implements AfterViewInit {
    constructor(public gameDataPtr: GameDataService,
                public _legalScore: LegalScore,
                public _router: Router,
                public _activatedRoute: ActivatedRoute,) {
        super(gameDataPtr, _legalScore, _router, _activatedRoute);
    }

    isEntryComponent() {
        return false;
    }

    initializeOnNS() {
        this.onNS = nsEndBoardMarker;
    }

    endOfBoardHook() {
    }

    findStartingBoard() {
        // in review mode, always start with board 1
        return 1;
    }

    override getBoardSelectInfo(): number {
        return (this.curBoardNum !== this.gameDataPtr.numBoards ? this.curBoardNum+1 : 0);
    }
    
}


@Directive({
    selector: '[autofocus]',
    standalone: false
})
export class AutofocusDirective {
    constructor(private elem : ElementRef) {
        // console.log('autofocus directive constructor');
    }
    
    ngAfterContentInit() {
        // console.log('in ngAfterContentInit');
        this.elem.nativeElement.focus();
    }
}


