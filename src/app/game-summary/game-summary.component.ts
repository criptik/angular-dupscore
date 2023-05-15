import { Component } from '@angular/core';
import { GameDataService, BoardObj, Pair } from '../game-data/game-data.service';
import {Router, ActivatedRoute} from "@angular/router";
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
    summaryText: string = '';
    size: string = 'short';
    
    constructor(private gameDataPtr: GameDataService,
                private _router: Router,    
                private route: ActivatedRoute,) {
            // console.log(`Summary Constructor`);
        this._router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
        };
    }

    outputShortSummary(pbt: string[], headerText: string, forPairs: number[], pairMpRecs: Map<number, MpRec>, boardsScoredTop: number) {
        if (forPairs.length === 0) return;
        const p: GameDataService = this.gameDataPtr;
        const aryMpRecEntries = Array.from(pairMpRecs.entries());
        const sortedEntries  = aryMpRecEntries.sort((a, b) => {
            const mpRecA: MpRec = a[1];
            const mpRecB: MpRec = b[1];
            return (mpRecA.total < mpRecB.total ? 1: -1)
        });

        pbt.push(`Summary for ${headerText}`);
        pbt.push(`  Place    Pct   Score   Pair`);
        
        // testing , show records
        let place = 1;
        sortedEntries.forEach( ([pairId, mpRec]) => {
            if (forPairs.includes(pairId)) { 
                const mpTotalStr: string = mpRec.total.toFixed(2).padStart(5,' ');
                const pctStr: string = ((100*mpRec.total/boardsScoredTop).toFixed(1) + '%').padStart(6, ' ');
                const pairObj: Pair | undefined = p.pairNameMap.get(pairId);
                const pairIdStr: string = `${p.pairnumToString(pairId, true).padStart(4,' ')}`;
                const nameStr: string = (pairObj ? pairObj.shortString() : '');
                pbt.push(`  ${place.toString().padStart(4,' ')}   ${pctStr}  ${mpTotalStr}  ${pairIdStr} ${nameStr}`);
                place++;
            }
        });
        pbt.push(' ');
    }

    outputOneBoardText(pbt: string[], boardObj: BoardObj) {
        const p: GameDataService = this.gameDataPtr;
        pbt.push(`  `);
        pbt.push(`   RESULTS OF BOARD ${boardObj.bdnum}`); 
        pbt.push(`  `);
        pbt.push(`    SCORES       MATCHPOINTS    NAMES`);
        pbt.push(`   N-S   E-W     N-S    E-W`);
        
        // for each pair, get totals of mps and number of boards
        const boardPlayEntriesAry = Array.from(boardObj.boardPlays.entries());
        const sortedBoardPlayEntriesAry = boardPlayEntriesAry.sort((a, b) => {
            const nsPairA: number = a[0];
            const nsPairB: number = b[0];
            const mpA: number = boardObj.pairToMpMap.get(nsPairA)!;
            const mpB: number = boardObj.pairToMpMap.get(nsPairB)!;
            // each should have an entry in the boardObj.pairToMpMap;
            return (mpA < mpB ? 1: -1)
        });
        sortedBoardPlayEntriesAry.forEach( ([nsPair, boardPlay]) => {
            if (!boardPlay.isScoreEmpty()) {
                const ewPair = boardPlay.ewPair;
                const scoreText: string = `${p.scoreStr(boardPlay, true)}  ${p.scoreStr(boardPlay, false)}`;
                const nsMP = boardObj.pairToMpMap.get(nsPair)!;
                const ewMP = boardObj.pairToMpMap.get(ewPair)!;
                // console.log(`outputOneBoard, board #${boardObj.bdnum}`, nsPair, ewPair, nsMP, ewMP);
                const mpText: string = `${nsMP.toFixed(2).padStart(5,' ')}  ${ewMP.toFixed(2).padStart(5,' ')}`;
                const pairObjNS: Pair | undefined = p.pairNameMap.get(nsPair);  
                const pairObjEW: Pair | undefined = p.pairNameMap.get(ewPair);
                const nameTextNS: string = `${(pairObjNS ? pairObjNS.shortString() : '')}`;
                const nameTextEW: string = `${(pairObjEW ? pairObjEW.shortString() : '')}`;
                const nameText: string = `${p.pairnumToString(nsPair, false)}-${nameTextNS} vs. ${p.pairnumToString(ewPair, false)}-${nameTextEW}`;
                pbt.push(`  ${scoreText}    ${mpText}    ${nameText}`);
            }
        });
        pbt.push(`----------------------------------------------------------------------`);
    }
    
    outputPerBoardData(pbt: string[]) {
        const p: GameDataService = this.gameDataPtr;
        pbt.push(`  `);

        Array.from(p.boardObjs.values()).forEach( boardObj => {
            if (boardObj.areAnyPlaysEntered()) {
                this.outputOneBoardText(pbt, boardObj);
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
        console.log('size', this.size);

        // go thru all board objs
        let fullyEnteredBoards = 0;
        
        const pairMpRecs: Map<number, MpRec> = new Map();
        p.pairIds.forEach( pairId => pairMpRecs.set(pairId, new MpRec()));

        let boardsScored = 0;
        Array.from(p.boardObjs.values()).forEach( boardObj => {
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
            this.outputShortSummary(pbt, headerText, p.pairIdsNS, pairMpRecs, boardsScoredTop);
            this.outputShortSummary(pbt, 'EW Pairs', p.pairIdsEW, pairMpRecs, boardsScoredTop);
            // only do per-board data in long mode
            if (this.size === 'long') {
                this.outputPerBoardData(pbt);
            }
            this.summaryText = pbt.join('\n');
        }
    }
}
