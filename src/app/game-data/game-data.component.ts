import { Component } from '@angular/core';
import { GameDataService, BoardObj } from './game-data.service';

@Component({
     selector: 'app-game-data',
     templateUrl: './game-data.component.html',
     styleUrls: ['./game-data.component.css']
})
export class GameDataComponent {
    gameDataPtrPublic: GameDataService;
    statusText: string[] = ['Not Initialized', 'Yet'];
    serializeText: string = '';
    
    constructor(private gameDataPtr: GameDataService) {
        // console.log(`in gameDataComponent.constructor, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`);
        this.gameDataPtrPublic = gameDataPtr;
    }

    async ngOnInit() {
        const p: GameDataService = this.gameDataPtr;
        // temporarily we just automatically invoke the setup the first time
        if (!p.gameDataSetup) {
            // console.log(`in gameDataComponent.ngOnInit before Initialize, gameDataSetup = ${p.gameDataSetup}`);
            const prom = await this.gameDataPtr.Initialize();
            // console.log(`in gameDataComponent.ngOnInit after Initialize, prom=${prom}, gameDataSetup = ${p.gameDataSetup}`);
        }
        const countBoardsScored = Array.from(p.boardObjs.values()).reduce ((tot, boardObj) => {
            return tot + (boardObj.allPlaysEntered ? 1 : 0);
        }, 0);
        
        this.statusText = [
        `Movement File: ${p.movFileName}`,
        `${p.numTables} Tables, ${p.numPairs} Pairs, (Top on Board is ${p.boardTop})`,
        `${p.numBoards} Boards, (${p.numRounds} Rounds, ${p.boardsPerRound} Boards Per Round)`,
        `${countBoardsScored === 0 ? 'No' : countBoardsScored} Board${countBoardsScored === 1 ? '' : 's'} Scored so far`,
        ];
        // movFileName: string = 'HCOLONEL.MOV';
        // movFileName: string = 'H0407X.MOV';
        // // user will eventually specify the boards per round
        // boardsPerRound: number = 2;
        // // other stuff is derived from the .MOV file
        // numPairs: number = 0;
        // numTables: number = 0;
        // numRounds: number = 0;
        // numBoards: number = 0;
        // 
        // boardTop: number = 0; 
        this.serializeText = this.gameDataPtr?.doSerialize();
        // console.log(this.serializeText);
        this.gameDataPtr?.doDeserialize(this.serializeText);
    }

} 
