import { Component } from '@angular/core';
import { GameDataService, BoardObj, Pair } from '../game-data/game-data.service';
import {Router, ActivatedRoute} from "@angular/router";
import { LegalScore, ContractNoteOutput } from '../legal-score/legal-score.service';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { readAssetText } from '../testutils/testutils';
import { HttpClient } from '@angular/common/http';
import { PairpairTableComponent } from './tables/pairpair-table/pairpair-table.component';
import { TravellersTableComponent } from './tables/travellers-table/travellers-table.component';
import { ShortsummTableComponent } from './tables/shortsumm-table/shortsumm-table.component';
import * as _ from 'lodash';

export class MpRec {
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
    size: string = 'short';
    testing: boolean = false;
    @ViewChild('reportDiv') reportDivRef! : ElementRef;
    fullyEnteredBoards: number = 0;
    @ViewChild(PairpairTableComponent)  pairpairTableComponent!: PairpairTableComponent;
    @ViewChild(TravellersTableComponent) travellersTableComponent!: TravellersTableComponent;
    @ViewChild(ShortsummTableComponent) shortsummTableComponent!: ShortsummTableComponent;

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

    ngOnInit() {
        const p: GameDataService = this.gameDataPtr;
        if (!p.gameDataSetup) return;

        if (!this.testing) {
            this.route.params.subscribe( params => {
                this.size = params['size'] ?? 'short';
            });
        }
        // console.log(`Summary ngOnInit ${this.size}`);

        // go thru all board objs to determine fullyEnteredBoards
        this.fullyEnteredBoards = 0;
        Array.from(p.boardObjs.values()).forEach( boardObj => {
            if (boardObj.allPlaysEntered) this.fullyEnteredBoards++;
        });
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
               ${this.shortsummTableComponent.getCompCssStr()}
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
