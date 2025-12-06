import { Component } from '@angular/core';
import { GameDataService, BoardObj, TravOrder } from './game-data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MovInfoService } from '../game-setup/movinfo.service';
import { AppComponent } from '../app.component';

@Component({
    selector: 'app-game-data',
    templateUrl: './game-data.component.html',
    styleUrls: ['./game-data.component.css'],
    standalone: false
})
export class GameDataComponent {
    statusText: string[] = ['Not Initialized', 'Yet'];
    serializeText: string = '';
    
    constructor(private gameDataPtr: GameDataService,
                private _router: Router,
                private _app: AppComponent,
                private _movInfo: MovInfoService) {
    // console.log(`in gameDataComponent.constructor, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`);
    }

    async ngOnInit() {
        const p: GameDataService = this.gameDataPtr;
        // temporarily we just automatically invoke the setup the first time
        if (!p.gameDataSetup) {
            this._router.navigate(["/setup"]);
        }
        const countBoardsScored = Array.from(p.boardObjs.values()).reduce ((tot, boardObj) => {
            return tot + (boardObj.allPlaysEntered ? 1 : 0);
        }, 0);
        const movName: string = p.movFileName.replace('.MOV', '');
        this.statusText = [
            `Gamefile ${p.gameFileName}`,
            `${p.groupName} for ${p.gameDate}`,
            `Movement: ${this._movInfo.getDesc(movName)}`,
            `${p.numTables} Tables, ${p.numPairs} Pairs, (Top on Board is ${p.boardTop})`,
        ];
        if (p.phantomPair !== 0) this.statusText.push(`Phantom Pair at Pair ${p.pairnumToString(p.phantomPair)}`);
        this.statusText = this.statusText.concat([`${p.numBoards} Boards, (${p.numRounds} Rounds, ${p.boardsPerRound} Boards Per Round)`,
                                                  `Travellers Ordered by ${p.travOrder === TravOrder.PAIR ? 'Pair' : 'Round'}`,
                                                 `${p.pairNameMap.size} Pair Names Entered out of ${p.numPairs}`,
                                                 `${countBoardsScored === 0 ? 'No' : countBoardsScored} Board${countBoardsScored === 1 ? '' : 's'} Scored so far`,
        ]);
        this._app.clearHighlights();

        // this.serializeText = this.gameDataPtr?.doSerialize();
        // console.log(this.serializeText);
        // this.gameDataPtr?.doDeserialize(this.serializeText);
    }

} 
