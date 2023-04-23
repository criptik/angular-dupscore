import { Component } from '@angular/core';
import { GameDataService, BoardObj } from './game-data.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-game-data',
    templateUrl: './game-data.component.html',
    styleUrls: ['./game-data.component.css']
})
export class GameDataComponent {
    statusText: string[] = ['Not Initialized', 'Yet'];
    serializeText: string = '';
    
    constructor(private gameDataPtr: GameDataService,
                private _router: Router) {
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
        
        this.statusText = [
            `Movement File: ${p.movFileName}`,
        `${p.numTables} Tables, ${p.numPairs} Pairs, (Top on Board is ${p.boardTop})`,
        ];
        if (p.phantomPair !== 0) this.statusText.push(`Phantom Pair at Pair ${p.pairnumToString(p.phantomPair)}`);
        this.statusText = this.statusText.concat([`${p.numBoards} Boards, (${p.numRounds} Rounds, ${p.boardsPerRound} Boards Per Round)`,
                                                 `${p.pairNameMap.size} Pair Names Entered out of ${p.numPairs}`,
                                                 `${countBoardsScored === 0 ? 'No' : countBoardsScored} Board${countBoardsScored === 1 ? '' : 's'} Scored so far`,
        ]);
        

        // this.serializeText = this.gameDataPtr?.doSerialize();
        // console.log(this.serializeText);
        // this.gameDataPtr?.doDeserialize(this.serializeText);
    }

} 
