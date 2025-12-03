import { Component } from '@angular/core';
import { GameDataService, BoardObj, Pair } from '../game-data/game-data.service';
import {Router, ActivatedRoute} from "@angular/router";
import { LegalScore, ContractNoteOutput } from '../legal-score/legal-score.service';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { readAssetText } from '../testutils/testutils';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

export interface BPInfo {
    conText: string;
    decl: string;
    resText: string;
    nsScore: string;
    ewScore: string;
    nsMP: string;
    ewMP: string;
    nameText: string;
};
    
export interface BoardInfo {
    bdnum: number;
    bpInfoArray: Array<BPInfo>;
}

class MpRec {
    total: number = 0;
    boards: number = 0;
    
    bumpMp(mp: number) {
        this.total += mp;
        this.boards++;
    }
}
const debug: boolean = false;

const compCssStr = `
.report, pre {
    font-size: 20px;
    font-family: monospace;
}
table {
    border: none;
    border-spacing: 0;
    font-size: 20px;
    white-space: nowrap;
    padding: none;
    margin: none;
}

table, tr, th, td {
    border: none;
    border-spacing: 0;
    border-collapse: collapse;
}
.pairtable table, .pairtable tr, .pairtable th, .pairtable td {
    border: 1px solid black;
    border-spacing: 0;
    border-collapse: collapse;
}
td {
    padding: none;
}

.context {
    text-align: left;
    width: 3.5ch;
    padding-right: 0.1ch;
}
.decl {
    text-align: left;
    min-width: 1ch;
    padding-right: 0.1ch;
}
.restext {
    text-align: right;
    padding-right: 3ch;
    padding-left: 0.5ch;
    width: 2ch;
}
.nsscore {
    text-align: right;
    width: 4ch;
    padding-right: 2ch;
}
.ewscore {
    text-align: right;
    width: 4ch;
    padding-right: 3ch;
}
.nsmp {
    text-align: right;
    width: 4ch;
    padding-right: 2ch;
}
.ewmp {
    text-align: right;
    width: 4ch;
    padding-right: 2ch;
}
.names {
    text-align: left;
    padding-left: 4ch;
}
.hdrl {
    text-align: left;
}
.hdrr {
    text-align: right;
}
.hdrc {
    text-align: center;
}
.endsep {
    text-align: left;
    padding-top: 0ch;
}
.thpct {
    text-align: center;
    width: 4ch;
    padding-left: 2ch;
}
.tdpct {
    text-align: right;
    width: 4ch;
    padding-left: 2ch;
    padding-top: 1ch;
}
`;

@Component({
    selector: 'app-game-summary',
    templateUrl: './game-summary.component.html',
    styles: [compCssStr]
})
export class GameSummaryComponent {
    summaryText: string = '';
    size: string = 'short';
    testing: boolean = false;
    hasContractNotes: boolean = false;
    allBoardOutputArray: Array<BoardInfo> = [];
    @ViewChild('reportDiv') reportDivRef! : ElementRef;
    fullyEnteredBoards: number = 0;
    pairVsPairInfo: string[][] = [];
    
    constructor(private gameDataPtr: GameDataService,
                private _router: Router,    
                private route: ActivatedRoute,
                private _legalScore: LegalScore,
                private _http: HttpClient,) {
            // console.log(`Summary Constructor`);
        this._router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
        };
    }

    outputShortSummary(pbt: string[], groupName: string, gameDate: Date, headerText: string, forPairs: number[], pairMpRecs: Map<number, MpRec>, boardsScoredTop: number) {
        if (forPairs.length === 0) return;
        // console.log('gameDate=', gameDate);
        const p: GameDataService = this.gameDataPtr;
        const aryMpRecEntries = Array.from(pairMpRecs.entries());
        const sortedEntries  = aryMpRecEntries.sort((a, b) => {
            const mpRecA: MpRec = a[1];
            const mpRecB: MpRec = b[1];
            return (mpRecA.total < mpRecB.total ? 1: -1)
        });

        pbt.push(`${groupName} for ${gameDate}`);
        pbt.push(`Summary for ${headerText}`);
        pbt.push(`  Place    Pct    Score   Pair`);
        
        // testing , show records
        let place = 1;
        sortedEntries.forEach( ([pairId, mpRec]) => {
            if (forPairs.includes(pairId)) { 
                const mpTotalStr: string = mpRec.total.toFixed(2).padStart(5,' ');
                const pctStr: string = ((100*mpRec.total/boardsScoredTop).toFixed(2) + '%').padStart(7, ' ');
                const pairObj: Pair | undefined = p.pairNameMap.get(pairId);
                const pairIdStr: string = `${p.pairnumToString(pairId, true).padStart(4,' ')}`;
                const nameStr: string = (pairObj ? pairObj.shortString() : '');
                pbt.push(`  ${place.toString().padStart(4,' ')}   ${pctStr}  ${mpTotalStr}  ${pairIdStr} ${nameStr}`);
                place++;
            }
        });
        pbt.push(' ');
    }

    getPairNameText(nsPair: number,  ewPair: number) {
        const p: GameDataService = this.gameDataPtr;
        const pairObjNS: Pair | undefined = p.pairNameMap.get(nsPair);
        const pairObjEW: Pair | undefined = p.pairNameMap.get(ewPair);
        const nameTextNS: string = `${(pairObjNS ? pairObjNS.shortString() : '')}`;
        const nameTextEW: string = `${(pairObjEW ? pairObjEW.shortString() : '')}`;
        const nameText: string = `${p.pairnumToString(nsPair, false)}-${nameTextNS} vs. ${p.pairnumToString(ewPair, false)}-${nameTextEW}`;
        return nameText;
    }

    // object which contains info needed by renderer template
    getOneBoardInfo(boardObj: BoardObj): BoardInfo {
        const p: GameDataService = this.gameDataPtr;
        const boardPlayEntriesAry = Array.from(boardObj.boardPlays.entries());
        // for each pair, get totals of mps and number of boards
        const sortedBoardPlayEntriesAry = boardPlayEntriesAry.sort((a, b) => {
            const nsPairA: number = a[0];
            const nsPairB: number = b[0];
            const mpA: number = boardObj.pairToMpMap.get(nsPairA)!;
            const mpB: number = boardObj.pairToMpMap.get(nsPairB)!;
            // each should have an entry in the boardObj.pairToMpMap;
            if (mpA === undefined && mpB === undefined) return 1;
            if (mpA === undefined) return -1;
            if (mpB === undefined) return 1;
            return (mpA < mpB ? 1: -1)
        });

        // console.log('sortedEntries', sortedBoardPlayEntriesAry);
        let bpInfoArray = [] as Array<BPInfo>;
        sortedBoardPlayEntriesAry.forEach( ([nsPair, bp]) => {
            if (bp.hasScore()) {
                const ewPair = bp.ewPair;
                const bpInfo = {} as BPInfo;
                bpInfo.nsScore = `${p.scoreStr(bp, true)}`.trim();
                bpInfo.ewScore = `${p.scoreStr(bp, false)}`.trim();
                // console.log(`outputOneBoard, board #${boardObj.bdnum}`, nsPair, ewPair);
                const nsMP: number | undefined = boardObj.pairToMpMap.get(nsPair);
                const ewMP: number | undefined = boardObj.pairToMpMap.get(ewPair);
                bpInfo.nsMP = (nsMP === undefined ? '' : nsMP!.toFixed(2));
                bpInfo.ewMP = (ewMP === undefined ? '' : ewMP!.toFixed(2));
                bpInfo.nameText = this.getPairNameText(nsPair, ewPair);
                const cnout = (this.hasContractNotes ? this._legalScore.parseContractNoteStr(bp.contractNote)! : undefined);
                if (cnout !== undefined && bp.nsScore !== 0) {
                    bpInfo.conText = cnout.conText as string;
                    bpInfo.decl = cnout.decl as string;
                    const resStr: string = cnout.resText as string;
                    bpInfo.resText = resStr!.padStart(2, ' ');
                } else {
                    bpInfo.conText = '';
                    bpInfo.decl = '';
                    bpInfo.resText = '';
                }
                bpInfoArray.push(bpInfo);
            }
        });
        // if any NP or Late boardplays, show them here
        // console.log(`board ${boardObj.bdnum}, ${boardObj.npOrLateArray.length}`);
        boardObj.npOrLateArray.forEach( (bp) => {
            const nsPair = bp.nsPair;
            const ewPair = bp.ewPair;
            const bpInfo = {} as BPInfo;
            bpInfo.nsScore = `NP`;
            bpInfo.ewScore = `NP`;
            bpInfo.nsMP = '';
            bpInfo.ewMP = '';
            bpInfo.nameText = this.getPairNameText(nsPair, ewPair);
            bpInfo.conText = bpInfo.decl = bpInfo.resText = '';
            bpInfoArray.push(bpInfo);
        });
        // console.log(`Board ${boardObj.bdnum}: ${bpInfoArray[0]}`);
        return {bdnum: boardObj.bdnum, bpInfoArray: bpInfoArray};
    }

    checkForContractNotes(): boolean {
        const p: GameDataService = this.gameDataPtr;
        return Array.from(p.boardObjs.values()).some( boardObj => {
            return Array.from(boardObj.boardPlays.values()).some( bp => {
                return (bp.contractNote !== '');
            });
        });
    }
    
    outputPerBoardData() {
        const p: GameDataService = this.gameDataPtr;

        let allBoardOutputArray: Array<BoardInfo> = [];
        // see if any boardplay in the whole game has contract Notes
        this.hasContractNotes = this.checkForContractNotes();
        
        Array.from(p.boardObjs.values()).forEach( boardObj => {
            if (boardObj.areAnyPlaysEntered()) {
                allBoardOutputArray.push(this.getOneBoardInfo(boardObj));
            }
        });
        // assign to the class viarable that template uses
        this.allBoardOutputArray = allBoardOutputArray;
        // console.log(JSON.stringify(allBoardOutputArray));
        
        this.buildPairVsPairPcts();
    }

    buildPairVsPairPcts() {
        const p: GameDataService = this.gameDataPtr;
        p.computeMPAllBoards();
        const mpArray: number[][] = Array.from({ length: p.numPairs }, () => Array(p.numPairs).fill(0));
        const boardCountArray: number[][] = Array.from({ length: p.numPairs }, () => Array(p.numPairs).fill(0));
        // console.log('p.numPairs:', p.numPairs);
        if (true) {
            Array.from(p.boardObjs.values()).forEach( boardObj => {
                Array.from(boardObj.boardPlays.values()).forEach( bp => {
                    // get the ns and ew pairs for each boardPlay
                    const nsPair = bp.nsPair;
                    const ewPair = bp.ewPair;
                    // todo: correct these for Mitchell
                    // get the mps for that pair from the boardObj.pairToMpMap
                    const nsMps: number|undefined = boardObj.pairToMpMap.get(nsPair);
                    const ewMps: number|undefined = boardObj.pairToMpMap.get(ewPair);
                    if (nsMps !== undefined && ewMps !== undefined) {
                        const nsIdx = nsPair - 1;
                        const ewIdx = ewPair - 1;
                        mpArray[nsIdx][ewIdx] += nsMps;
                        mpArray[ewIdx][nsIdx] += ewMps;
                        boardCountArray[nsIdx][ewIdx]++;
                        boardCountArray[ewIdx][nsIdx]++;
                        // console.log(nsPair, ewPair, mpArray[nsIdx], mpArray[ewIdx]);
                    }
                });
            });
        }
        // build string info for table to be rendered
        // header line
        const hdrRow: string[] = [];
        _.range(p.numPairs).forEach( (n) => {
            const pairnum = n+1;
            hdrRow.push(pairnum.toFixed(0));
        });
        this.pairVsPairInfo.push(hdrRow);
        
        // each pair's data row
        _.range(p.numPairs).forEach( (n) => {
            const dataRow: string[] = [];
            const pairNumA = n+1;
            dataRow.push(pairNumA.toFixed(0));
            const pairObj: Pair | undefined = p.pairNameMap.get(pairNumA);
            const pairIdStr: string = `${p.pairnumToString(pairNumA, true).padStart(4,' ')}`;
            const nameStr: string = (pairObj ? pairObj.shortString() : '');
            dataRow.push(nameStr);
            _.range(p.numPairs).forEach( (m) => {
                const pairNumB = m+1;
                const mps = mpArray[n][m];
                const numBoards = boardCountArray[n][m];
                if (pairNumA === pairNumB) {
                    dataRow.push('');
                } else if (numBoards == 0) {
                    dataRow.push('--');
                } else {
                    const pctVal: number = (100*mps/(numBoards * p.boardTop));
                    const pctStr: string = `${pctVal.toFixed(0)}%`;
                    dataRow.push(pctStr);
                }                
            });
            this.pairVsPairInfo.push(dataRow);
        });
        // console.log(this.pairVsPairInfo);
    }
    
    
    
    ngOnInit() {
        const p: GameDataService = this.gameDataPtr;
        if (!p.gameDataSetup) return;

        if (!this.testing) {
            this.route.params.subscribe( params => {
                this.size = params['size'] ?? 'short';
            });
        }
        // console.log(`Summary ngOnInit ${this.size}`);

        // set allBoardOutput as empty in case we are only doing short mode
        this.allBoardOutputArray = [];

        // go thru all board objs
        this.fullyEnteredBoards = 0;
        
        const pairMpRecs: Map<number, MpRec> = new Map();
        p.pairIds.forEach( pairId => pairMpRecs.set(pairId, new MpRec()));

        let boardsScored = 0;
        Array.from(p.boardObjs.values()).forEach( boardObj => {
            boardObj.computeMP(p.boardTop);
            if (boardObj.allPlaysEntered) this.fullyEnteredBoards++;
            if (Array.from(boardObj.pairToMpMap.keys()).length > 0) boardsScored ++;
            
            // for each pair, get totals of mps and number of boards
            Array.from(boardObj.pairToMpMap.entries()).forEach( ([pairId, mp]) => {
                // console.log(`board ${boardObj.bdnum}, pair ${pairId}, ${mp}`);
                const mpRec = pairMpRecs.get(pairId) as MpRec;
                mpRec.bumpMp(mp);
            });
        });

        // compute Top overall score to get percentages
        const boardsScoredTop = boardsScored * p.boardTop;

        // find out which pair has played the most boards
        let maxBoards = 0;
        Array.from(pairMpRecs.entries()).forEach( ([pairId, mpRec]) => {
            maxBoards = Math.max(mpRec.boards, maxBoards);
        });
        // now go back and factor other pairs scores up to that amount of boards
        Array.from(pairMpRecs.entries()).forEach( ([pairId, mpRec]) => {
            if (mpRec.boards !== 0) {
                mpRec.total *= (maxBoards / mpRec.boards);
                mpRec.boards = maxBoards;
            }
        });
        
        // show records
        if (this.fullyEnteredBoards !== 0) {
            let pbt = [];
            pbt.push(`${this.fullyEnteredBoards} Boards have been fully scored...\n`);
            
            // always output summary data
            // NS pairs includes all pairs in howell mode
            // EW pairs will be empty except in mitchell mode
            const headerText = (p.isHowell ? 'All Pairs' : 'NS Pairs');
            this.outputShortSummary(pbt, p.groupName, p.gameDate, headerText, p.pairIdsNS, pairMpRecs, boardsScoredTop);
            this.outputShortSummary(pbt, p.groupName, p.gameDate, 'EW Pairs', p.pairIdsEW, pairMpRecs, boardsScoredTop);
            // only do per-board data in long mode
            if (this.size === 'long') {
                this.outputPerBoardData();
            }
            pbt.push('\n');
            this.summaryText = pbt.join('\n');
            // this.summaryText = pbt;
        }
    }

    // TODO: how to make this use colors
    async onClipButtonClick(x:any) {
        // Access the native HTML element
        const divElement: HTMLDivElement = this.reportDivRef.nativeElement;
        const htmlContent = divElement.innerHTML;
        // add in the css stuff
        const newHtmlContent = `<style>${compCssStr.replaceAll('20px', '15px')}</style>${htmlContent}`;
        // console.log(newHtmlContent);
        const type = "text/html";
        const blob = new Blob([newHtmlContent], { type });
        const data = [new ClipboardItem({ [type]: blob })];
        // console.log(data);
        navigator.clipboard.write(data);
    }
}
