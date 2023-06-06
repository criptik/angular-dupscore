import { Component } from '@angular/core';
import { GameDataService } from './game-data/game-data.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {
    
    constructor(
        public gameDataPtr: GameDataService,
        private _router: Router) {    
        if (!this.gameDataPtr.gameDataSetup) {
            this._router.navigate(["/setup"]);
        }
        
    }

    onAClick(event: any) {
        console.log('onAClick', event);
    }
    
}
