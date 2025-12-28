import { Component } from '@angular/core';
import { GameDataService, BoardObj, Pair } from '../game-data/game-data.service';
import {Router, ActivatedRoute} from "@angular/router";
import { LegalScore, ContractNoteOutput } from '../legal-score/legal-score.service';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { readAssetText } from '../testutils/testutils';
import { HttpClient } from '@angular/common/http';
import { PairpairTableComponent } from './tables/pairpair-table/pairpair-table.component';
import { TravellersTableComponent } from './tables/travellers-table/travellers-table.component';
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
    @ViewChild('reportDiv') reportDivRef! : ElementRef;
    fullyEnteredBoards: number = 0;
    shortSummTableInfos: ShortSummTableInfo[] = [];
    @ViewChild(PairpairTableComponent) private pairpairTableComponent!: PairpairTableComponent;
    @ViewChild(TravellersTableComponent) private travellersTableComponent!: TravellersTableComponent;

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

    ngOnInit() {
        const p: GameDataService = this.gameDataPtr;
        if (!p.gameDataSetup) return;

        if (!this.testing) {
            this.route.params.subscribe( params => {
                this.size = params['size'] ?? 'short';
            });
        }
        // console.log(`Summary ngOnInit ${this.size}`);

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
        }
    }

    async onClipButtonClick(x:any) {
        // Access the native HTML element
        const divElement: HTMLDivElement = this.reportDivRef.nativeElement;
        const htmlContent = divElement.innerHTML;
        // add in the script and css stuff
        // combine my css with each child css
        const totalCssStr = `
               ${compCssStr}
               ${this.pairpairTableComponent.getCompCssStr()}
               ${this.travellersTableComponent.getCompCssStr()}
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
