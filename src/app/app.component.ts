import { Component } from '@angular/core';
import { GameDataService } from './game-data/game-data.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {
    
    constructor(public gameDataPtr: GameDataService) {
    }
    
}
