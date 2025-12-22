import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { GameDataService, BoardObj, Pair } from '../../../game-data/game-data.service';
import * as _ from 'lodash';

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
.names {
    text-align: left;
    padding-left: 4ch;
}
#pairVsPair {
    display: none;
}
`;

@Component({
    selector: 'pairpair-table',
    templateUrl: './pairpair-table.component.html',
    styles: [compCssStr],
    standalone: false
})

export class PairpairTableComponent {
    pairVsPairInfo: string[][] = [];

    constructor(private gameDataPtr: GameDataService,) {
    }
    
    getCompCssStr() {
        return compCssStr;
    }
    
    ngOnInit() {
        this.buildPairVsPairPcts()
    }
    
    ngOnChanges() {
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
                        const ewIdx = Math.abs(ewPair) - 1;
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
        const numPairCols: number = (p.isHowell ? p.numPairs : p.numPairs/2);
        _.range(numPairCols).forEach( (n) => {
            const pairnum = n+1;
            hdrRow.push(pairnum.toFixed(0));
        });
        this.pairVsPairInfo.push(hdrRow);
        
        // each pair's data row
        _.range(numPairCols).forEach( (n) => {
            const dataRow: string[] = [];
            const pairNumA = n+1;
            dataRow.push(pairNumA.toFixed(0));
            const pairObj: Pair | undefined = p.pairNameMap.get(pairNumA);
            const pairIdStr: string = `${p.pairnumToString(pairNumA, true).padStart(4,' ')}`;
            const nameStr: string = (pairObj ? pairObj.shortString() : '');
            dataRow.push(nameStr);
            _.range(numPairCols).forEach( (m) => {
                const pairNumB = m+1;
                const mps = mpArray[n][m];
                const numBoards = boardCountArray[n][m];
                if (numBoards == 0) {
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
    

}
