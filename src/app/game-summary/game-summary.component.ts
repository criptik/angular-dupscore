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

    outputPairMpRecs(pairMpRecs: Map<number, MpRec>, boardsScoredTop: number) {
        const aryMpRecEntries = Array.from(pairMpRecs.entries());
        const sortedEntries  = aryMpRecEntries.sort((a, b) => {
            return (a[1].total < b[1].total ? 1: -1)
        });

        this.summaryText += `
  Place    Pct   Score   Pair`;
        
        // testing , show records
        let place = 1;
        sortedEntries.forEach( ([pairId, mpRec]) => {
            const mpTotalStr: string = mpRec.total.toFixed(2).padStart(5,' ');
            const pctStr: string = ((100*mpRec.total/boardsScoredTop).toFixed(1) + '%').padStart(6, ' ');
            const pairObj: Pair | undefined = this.gameDataPtr.pairNameMap.get(pairId);  
            const nameStr: string = (pairObj ? pairObj.shortString() : '');
            this.summaryText += `
  ${place.toString().padStart(4,' ')}   ${pctStr}  ${mpTotalStr}   ${pairId.toString().padStart(4,' ')} ${nameStr}`;
            if (debug) this.summaryText += `   boards:${mpRec.boards}`;
                place++;
        });
    }
    
    outputPerBoardData() {
        const p: GameDataService = this.gameDataPtr;
        const pbt: string[] = [];
        pbt.push(`  `);

        Array.from(p.boardObjs.values()).forEach( boardObj => {
            pbt.push(`  `);
            pbt.push(`   RESULTS FOR BOARD ${boardObj.bdnum}`);
            pbt.push(`  `);
            pbt.push(`    SCORES            MATCHPOINTS    NAMES`);
            pbt.push(`   N-S   E-W          N-S    E-W`);
            
            // for each pair, get totals of mps and number of boards
            Array.from(boardObj.boardPlays.entries()).forEach( ([nsPair, boardPlay]) => {
                const scoreStr: string = '';
                pbt.push(`  ${p.scoreStr(boardPlay, true)}  ${p.scoreStr(boardPlay, false)}             ${nsPair}NS vs. ${boardPlay.ewPair}EW => ${boardPlay.nsScore}, ${boardPlay.kindNS}, ${boardPlay.kindEW}`);
            });
        });
        pbt.forEach( line => {
            this.summaryText += `${line}
`;
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

        this.summaryText = `${fullyEnteredBoards} Boards have been fully scored...`;
        if (debug) this.outputPairMpRecs(pairMpRecs, boardsScoredTop);
        
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

       
        // testing , show records
        if (fullyEnteredBoards !== 0) {
            this.outputPairMpRecs(pairMpRecs, boardsScoredTop);
            if (this.size === 'long') {
                this.outputPerBoardData();
            }
        }
    }
}
