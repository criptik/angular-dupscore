import { Component } from '@angular/core';
import { GameDataService, BoardObj, Pair } from '../game-data/game-data.service';
import {Router, ActivatedRoute} from "@angular/router";
import { LegalScore } from '../legal-score/legal-score.service';
import * as _ from 'lodash';

class MpRec {
    total: number = 0;
    boards: number = 0;
    
    bumpMp(mp: number) {
        this.total += mp;
        this.boards++;
    }
}
const debug: boolean = false;

@Component({
    selector: 'app-game-summary',
    templateUrl: './game-summary.component.html',
    styleUrls: ['./game-summary.component.css']
})
export class GameSummaryComponent {
    summaryText: string[] = [];
    size: string = 'short';
    testString: string = 'abc\u2665def\n';
    
    constructor(private gameDataPtr: GameDataService,
                private _router: Router,    
                private route: ActivatedRoute,
                private _legalScore: LegalScore,) {
            // console.log(`Summary Constructor`);
        this._router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
        };
    }

    outputShortSummary(pbt: string[], groupName: string, gameDate: Date, headerText: string, forPairs: number[], pairMpRecs: Map<number, MpRec>, boardsScoredTop: number) {
        if (forPairs.length === 0) return;
        console.log('gameDate=', gameDate);
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
    
    outputOneBoardText(pbt: string[], boardObj: BoardObj, hasContractNotes: boolean) {
        const p: GameDataService = this.gameDataPtr;
        const boardPlayEntriesAry = Array.from(boardObj.boardPlays.entries());
        const indentNum: number = (hasContractNotes ? 12 : 3);
        const indent:string = ' '.repeat(indentNum);
        pbt.push(`  `);
        pbt.push(`${indent}RESULTS OF BOARD ${boardObj.bdnum}`); 
        pbt.push(`  `);
        pbt.push(`${indent} SCORES       MATCHPOINTS    NAMES`);
        pbt.push(`${indent}N-S   E-W     N-S    E-W`);
        
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
        sortedBoardPlayEntriesAry.forEach( ([nsPair, bp]) => {
            if (bp.hasScore()) {
                const ewPair = bp.ewPair;
                const scoreText: string = `${p.scoreStr(bp, true)}  ${p.scoreStr(bp, false)}`;
                const nsMP = boardObj.pairToMpMap.get(nsPair)!;
                const ewMP = boardObj.pairToMpMap.get(ewPair)!;
                // console.log(`outputOneBoard, board #${boardObj.bdnum}`, nsPair, ewPair, nsMP, ewMP);
                if (nsMP !== undefined && ewMP !== undefined) {
                    const mpText: string = `${nsMP.toFixed(2).padStart(5,' ')}  ${ewMP.toFixed(2).padStart(5,' ')}`;
                    const nameText = this.getPairNameText(nsPair, ewPair);
                    let bpline: string = `  ${scoreText}    ${mpText}    ${nameText}`;
                    if (hasContractNotes && bp.contractNote && bp.contractNote! !== '') {
                        const standardNote:string = this._legalScore.contractNoteStandardize(bp.contractNote)!;
                        bpline = `${standardNote.padEnd(indentNum-3, ' ')}${bpline}`;
                    } else {
                        bpline = `${''.padEnd(indentNum-3, ' ')}${bpline}`;
                    }
                    pbt.push(bpline);
                }
            }
        });
        // if any NP or Late boardplays, show them here
        // console.log(`board ${boardObj.bdnum}, ${boardObj.npOrLateArray.length}`);
        boardObj.npOrLateArray.forEach( (bp) => {
            const scoreText = '  NP   NP';
            const mpText = '             ';
            const nameText = this.getPairNameText(bp.nsPair, bp.ewPair);
            pbt.push(`  ${scoreText}    ${mpText}    ${nameText}`);
        });
        pbt.push(`----------------------------------------------------------------------`);
    }
    
    outputPerBoardData(pbt: string[]) {
        const p: GameDataService = this.gameDataPtr;
        pbt.push(`  `);

        // see if any boardplay in the whole game has contract Notes
        const hasContractNotes:boolean =
            Array.from(p.boardObjs.values()).some( boardObj => {
                return Array.from(boardObj.boardPlays.values()).some( bp => {
                    return (bp.contractNote !== '');
                });
            });
        
        Array.from(p.boardObjs.values()).forEach( boardObj => {
            if (boardObj.areAnyPlaysEntered()) {
                this.outputOneBoardText(pbt, boardObj, hasContractNotes);
            }
        });
    }
                
                
    ngOnInit() {
        // console.log(`Summary ngOnInit`);
        const p: GameDataService = this.gameDataPtr;
        if (!p.gameDataSetup) return;

        this.route.params.subscribe( params => {
            this.size = params['size'] ?? 'short';
        });
        // console.log('size', this.size);

        // go thru all board objs
        let fullyEnteredBoards = 0;
        
        const pairMpRecs: Map<number, MpRec> = new Map();
        p.pairIds.forEach( pairId => pairMpRecs.set(pairId, new MpRec()));

        let boardsScored = 0;
        Array.from(p.boardObjs.values()).forEach( boardObj => {
            boardObj.computeMP(p.boardTop);
            if (boardObj.allPlaysEntered) fullyEnteredBoards++;
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
        if (fullyEnteredBoards !== 0) {
            let pbt = [];
            pbt.push(`${fullyEnteredBoards} Boards have been fully scored...\n`);
            
            // always output summary data
            // NS pairs includes all pairs in howell mode
            // EW pairs will be empty except in mitchell mode
            const headerText = (p.isHowell ? 'All Pairs' : 'NS Pairs');
            this.outputShortSummary(pbt, p.groupName, p.gameDate, headerText, p.pairIdsNS, pairMpRecs, boardsScoredTop);
            this.outputShortSummary(pbt, p.groupName, p.gameDate, 'EW Pairs', p.pairIdsEW, pairMpRecs, boardsScoredTop);
            // only do per-board data in long mode
            if (this.size === 'long') {
                this.outputPerBoardData(pbt);
            }
            pbt.push('\n');
            // this.summaryText = pbt.join('\n');
            this.summaryText = pbt;
        }
    }

    // TODO: how to make this use colors
    onClipButtonClick(x:any) {
        navigator.clipboard.writeText(this.summaryText.join('\n'));
    }
}
