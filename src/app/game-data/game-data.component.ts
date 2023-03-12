import { Component } from '@angular/core';


export class ScoreObj {
    score:number;
    kindNS:string;
    kindEW:string;
    constructor(score: number, kindNS: string = '', kindEW: string=kindNS) {
        this.score = score;
        this.kindNS = kindNS;
        this.kindEW = kindEW;
    }
}


@Component({
    selector: 'app-game-data',
    templateUrl: './game-data.component.html',
    styleUrls: ['./game-data.component.css']
})
export class GameDataComponent {
    // for current testing, just set some data here
    // later these will be derived from the game setup info and the .MOV file
    
    numPairs: number = 8;
    boardNum: number = 4;
    boardVul: string = 'BOTH';
    nsScore : Map<number, ScoreObj> = new Map();
    nsewMap: Map<number, number> = new Map();

    constructor() {
        // temporary for testing
        this.nsScore.set(3, new ScoreObj(1100));
        this.nsScore.set(6, new ScoreObj(-1100));
        this.nsScore.set(8, new ScoreObj(0));
        this.nsewMap.set(5, 2);
        this.nsewMap.set(3, 4);
        this.nsewMap.set(6, 1);
        this.nsewMap.set(8, 7);
    }
    
}
