import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { GameDataService, BoardObj, Pair } from '../../../game-data/game-data.service';
import { LegalScore, ContractNoteOutput } from '../../../legal-score/legal-score.service';
import { MpRec } from '../../game-summary.component'
import * as _ from 'lodash';

export interface ShortSummRowInfo {
    place: string;
    mpTotalStr: string;
    pctStr: string;
    pairIdStr: string;
    nameStr: string;
}

export interface ShortSummTableInfo {
    hdr: string;
    rows: ShortSummRowInfo[];
}

const compCssStr = `
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
td {
    padding: none;
}
.shortSummTitleLine {
    text-align: left;
}
.shortSummPlace {
    text-align: right;
    width: 4ch;
}
.shortSummMps {
    text-align: right;
    width: 9ch;
}
.shortSummPct {
    text-align: right;
    width: 9ch;
}
.shortSummPairId {
    text-align: right;
    width: 4ch;
    padding-left: 2ch;
}
.shortSummName {
    text-align: left;
    padding-left: 2ch;
}
.shortSummPlaceHdr {
    text-align: center;
    width: 4ch;
}
.shortSummMpsHdr {
    text-align: right;
    width: 9ch;
}
.shortSummPctHdr {
    text-align: right;
    width: 9ch;
}
.shortSummPairIdHdr {
    text-align: left;
    width: 4ch;
    padding-left: 2ch;
}
`;

@Component({
    selector: 'shortsumm-table',
    templateUrl: './shortsumm-table.component.html',
    styles: [compCssStr],
    standalone: false
})
export class ShortsummTableComponent {
    shortSummTableInfos: ShortSummTableInfo[] = [];
    summaryText: string = '';
    pairMpRecs: Map<number, MpRec> = new Map();
    boardsScoredTop: number = 0;

    constructor(private gameDataPtr: GameDataService,
                private _legalScore: LegalScore,) {
    }

    getCompCssStr() {
        return compCssStr;
    }
    
    ngOnInit() {
        const p: GameDataService = this.gameDataPtr;

        p.pairIds.forEach( pairId => this.pairMpRecs.set(pairId, new MpRec()));

        let boardsScored = 0;
        Array.from(p.boardObjs.values()).forEach( boardObj => {
            // check for crazy case where boards 19 and 20 showed up in 2-table 18-board game
            if (boardObj.bdnum <= p.numBoards) {
                boardObj.computeMP(p.boardTop);
                if (Array.from(boardObj.pairToMpMap.keys()).length > 0) boardsScored ++;
                
                // for each pair, get totals of mps and number of boards
                Array.from(boardObj.pairToMpMap.entries()).forEach( ([pairId, mp]) => {
                    // console.log(`board ${boardObj.bdnum}, pair ${pairId}, ${mp}`);
                    const mpRec = this.pairMpRecs.get(pairId) as MpRec;
                    mpRec.bumpMp(mp);
                });
            }
        });

        // compute Top overall score to get percentages
        this.boardsScoredTop = boardsScored * p.boardTop;

        // find out which pair has played the most boards
        let maxBoards = 0;
        Array.from(this.pairMpRecs.entries()).forEach( ([pairId, mpRec]) => {
            maxBoards = Math.max(mpRec.boards, maxBoards);
        });
        // now go back and factor other pairs scores up to that amount of boards
        Array.from(this.pairMpRecs.entries()).forEach( ([pairId, mpRec]) => {
            if (mpRec.boards !== 0) {
                mpRec.total *= (maxBoards / mpRec.boards);
                mpRec.boards = maxBoards;
            }
        });


        // always output summary data
        // NS pairs includes all pairs in howell mode
        // EW pairs will be empty except in mitchell mode
        this.shortSummTableInfos = [];
        this.summaryText = `${p.groupName} for ${p.gameDate}`;
        if (p.isHowell) {
            this.outputShortSummary('All Pairs', p.pairIdsNS, this.pairMpRecs, this.boardsScoredTop);
        } else {
            this.outputShortSummary('NS Pairs', p.pairIdsNS, this.pairMpRecs, this.boardsScoredTop);
            this.outputShortSummary('EW Pairs', p.pairIdsEW, this.pairMpRecs, this.boardsScoredTop);
        }
    }
    
    ngOnChanges() {
    }

    outputShortSummary(headerText: string, forPairs: number[], pairMpRecs: Map<number, MpRec>, boardsScoredTop: number) {
        if (forPairs.length === 0) return;
        const p: GameDataService = this.gameDataPtr;
        const aryMpRecEntries = Array.from(pairMpRecs.entries());
        const sortedEntries  = aryMpRecEntries.sort((a, b) => {
            const mpRecA: MpRec = a[1];
            const mpRecB: MpRec = b[1];
            return (mpRecA.total < mpRecB.total ? 1: -1)
        });

        const shortSummTableInfo = {} as ShortSummTableInfo;
        shortSummTableInfo.hdr = `Summary for ${headerText}`;
        shortSummTableInfo.rows = [];
        
        // testing , show records
        let place = 1;
        sortedEntries.forEach( ([pairId, mpRec]) => {
            if (forPairs.includes(pairId)) {
                const shortSummRowInfo = {} as ShortSummRowInfo;
                shortSummRowInfo.place = place.toString();
                shortSummRowInfo.mpTotalStr = mpRec.total.toFixed(2);
                shortSummRowInfo.pctStr = ((100*mpRec.total/boardsScoredTop).toFixed(2) + '%');
                const pairObj: Pair | undefined = p.pairNameMap.get(pairId);
                shortSummRowInfo.pairIdStr = `${p.pairnumToString(pairId, true)}`;
                shortSummRowInfo.nameStr = (pairObj ? pairObj.shortString() : '');
                shortSummTableInfo.rows.push(shortSummRowInfo);
                place++;
            }
        });
        this.shortSummTableInfos.push(shortSummTableInfo);
    }


}
