import { Component } from '@angular/core';
import { GameDataService, BoardObj, Pair } from '../game-data/game-data.service';
import {Router, ActivatedRoute} from "@angular/router";
import { LegalScore, ContractNoteOutput } from '../legal-score/legal-score.service';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { readAssetText } from '../testutils/testutils';
import { HttpClient } from '@angular/common/http';
import { PairpairTableComponent } from './tables/pairpair-table/pairpair-table.component';
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


class MpRec {
    total: number = 0;
    boards: number = 0;
    
    bumpMp(mp: number) {
        this.total += mp;
        this.boards++;
    }
}
const debug: boolean = false;

// the following string includes some app-suit-colorizer stuff
// which helps when we export to clipboard
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

#travellers {
    display: block;
}
`;

const scriptStr = `
<script>
function toggler(onId) {
     const ids = ['travellers', 'pairVsPair'];
     ids.forEach( (offId) => {
         const elem = document.getElementById(offId);
         elem.style.display = "none";
     });
     const onElem = document.getElementById(onId);
     onElem.style.display = "block";
 }
</script>
`;

const buttonsStr = '';
// const buttonsStr = `
//     <button type="button" onclick="toggler('travellers')">
//         Travellers
//     </button>
//     <button type="button" onclick="toggler('pairVsPair')">
//         PairVsPair
//     </button>
// `;

@Component({
    selector: 'app-game-summary',
    templateUrl: './game-summary.component.html',
    styles: [compCssStr],
    standalone: false
})
export class GameSummaryComponent {
    summaryText: string = '';
    size: string = 'short';
    testing: boolean = false;
    hasContractNotes: boolean = false;
    allBoardOutputArray: Array<BoardInfo> = [];
    @ViewChild('reportDiv') reportDivRef! : ElementRef;
    fullyEnteredBoards: number = 0;
    shortSummTableInfos: ShortSummTableInfo[] = [];
    @ViewChild(PairpairTableComponent) private pairpairTableComponent!: PairpairTableComponent;

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
        
        // this.buildPairVsPairPcts();
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
            // always output summary data
            // NS pairs includes all pairs in howell mode
            // EW pairs will be empty except in mitchell mode
            this.shortSummTableInfos = [];
            this.summaryText = `${p.groupName} for ${p.gameDate}`;
            if (p.isHowell) {
                this.outputShortSummary('All Pairs', p.pairIdsNS, pairMpRecs, boardsScoredTop);
            } else {
                this.outputShortSummary('NS Pairs', p.pairIdsNS, pairMpRecs, boardsScoredTop);
                this.outputShortSummary('EW Pairs', p.pairIdsEW, pairMpRecs, boardsScoredTop);
            }
            // only do per-board data in long mode
            if (this.size === 'long') {
                this.outputPerBoardData();
            }
        }
    }

    // TODO: how to make this use colors
    async onClipButtonClick(x:any) {
        // Access the native HTML element
        const divElement: HTMLDivElement = this.reportDivRef.nativeElement;
        const htmlContent = divElement.innerHTML;
        // add in the script and css stuff
        // combine my css with each child css
        const totalCssStr = `
               ${compCssStr}
               ${this.pairpairTableComponent.getCompCssStr()}
        `;

        const newHtmlContent = `${scriptStr}<style>${totalCssStr.replaceAll('20px', '15px')}</style>${buttonsStr}${htmlContent}`;
        console.log(newHtmlContent);
        const type = "text/html";
        const blob = new Blob([newHtmlContent], { type });
        const data = [new ClipboardItem({ [type]: blob })];
        // console.log(data);
        navigator.clipboard.write(data);
    }

    toggler(onId: string) {
        const ids: string[] = ['travellers', 'pairVsPair'];
        ids.forEach( (offId) => {
            const elem = document.getElementById(offId)!;
            elem.style.display = "none";
        });
        const onElem: HTMLElement = document.getElementById(onId)!;
        onElem.style.display = "block";
    }

}
