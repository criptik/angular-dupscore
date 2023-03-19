import { Component } from '@angular/core';
import { GameDataService } from '../game-data.service';

@Component({
     selector: 'app-game-data',
     templateUrl: './game-data.component.html',
     styleUrls: ['./game-data.component.css']
})
export class GameDataComponent {
    gameDataPtrPublic: GameDataService;
    
    constructor(private gameDataPtr: GameDataService) {
        // console.log(`in gameDataComponent.constructor, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`);
        this.gameDataPtrPublic = gameDataPtr;
    }

    async ngOnInit() {
        // console.log(`in gameDataComponent.ngOnInit before Initialize, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`);
        await this.gameDataPtr.Initialize();
        // console.log(`in gameDataComponent.ngOnInit after Initialize, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`);
    }
} 
