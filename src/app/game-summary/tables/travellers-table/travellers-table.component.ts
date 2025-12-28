import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { GameDataService, BoardObj, Pair } from '../../../game-data/game-data.service';
import { LegalScore, ContractNoteOutput } from '../../../legal-score/legal-score.service';
import * as _ from 'lodash';

export interface BPInfo {
    nsPair: number;
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
.names {
    text-align: left;
    padding-left: 4ch;
}
.cred {
    color:red;
}
.suit {
    font-size: 110%;
}
`;

@Component({
    selector: 'travellers-table',
    templateUrl: './travellers-table.component.html',
    styles: [compCssStr],
    standalone: false
})
export class TravellersTableComponent {
    allBoardOutputArray: Array<BoardInfo> = [];
    hasContractNotes: boolean = false;

    constructor(private gameDataPtr: GameDataService,
                private _legalScore: LegalScore,) {
    }

    getCompCssStr() {
        return compCssStr;
    }
    
    ngOnInit() {
        this.outputPerBoardData()
    }
    
    ngOnChanges() {
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
                bpInfo.nsPair = nsPair;
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
        // assign to the class vairable that template uses
        this.allBoardOutputArray = allBoardOutputArray;
        // console.log(JSON.stringify(allBoardOutputArray));
    }

    checkForContractNotes(): boolean {
        const p: GameDataService = this.gameDataPtr;
        return Array.from(p.boardObjs.values()).some( boardObj => {
            return Array.from(boardObj.boardPlays.values()).some( bp => {
                return (bp.contractNote !== '');
            });
        });
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

}
