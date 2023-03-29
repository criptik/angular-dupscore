import { Component } from '@angular/core';
import { GameDataService, BoardObj } from '../game-data/game-data.service';
import * as _ from 'lodash';

class MpRec {
    total: number = 0;
    boards: number = 0;
    
    bumpMp(mp: number) {
        this.total += mp;
        this.boards++;
    }
}


@Component({
    selector: 'app-game-summary',
    templateUrl: './game-summary.component.html',
    styleUrls: ['./game-summary.component.css']
})
export class GameSummaryComponent {
    summaryText: string = '';

    constructor(private gameDataPtr: GameDataService) {
        // console.log(`Summary Constructor`);
    }

    outputPairMpRecs(pairMpRecs: Map<number, MpRec>) {
        // testing , show records
        Array.from(pairMpRecs.entries()).forEach( ([pairId, mpRec]) => {
            this.summaryText += `
            pair: ${pairId}, mps:${mpRec.total.toFixed(2)}, boards:${mpRec.boards}`;
        });
    }
    

    ngOnInit() {
        // console.log(`Summary ngOnInit`);
        const p: GameDataService = this.gameDataPtr;
        if (!p.gameDataSetup) return;

        // go thru all board objs
        let fullyEnteredBoards = 0;
        
        const pairMpRecs: Map<number, MpRec> = new Map();
        p.pairIds.forEach( pairId => pairMpRecs.set(pairId, new MpRec()));
        
        Array.from(p.boardObjs.values()).forEach( boardObj => {
            if (boardObj.allPlaysEntered) fullyEnteredBoards++;
            // for each pair, get totals of mps and number of boards
            Array.from(boardObj.pairToMpMap.entries()).forEach( ([pairId, mp]) => {
                // console.log(`board ${boardObj.bdnum}, pair ${pairId}, ${mp}`);
                const mpRec = pairMpRecs.get(pairId) as MpRec;
                mpRec.bumpMp(mp);
            });
        });

        this.summaryText = `${fullyEnteredBoards} Boards have been fully scored...`;
        this.outputPairMpRecs(pairMpRecs);
        
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
        this.summaryText += `
        =====================`;
        this.outputPairMpRecs(pairMpRecs);
    }
}
