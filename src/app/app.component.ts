import { Component } from '@angular/core';
import { GameDataService } from './game-data/game-data.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {

    menuLayout: any[]  = [
        {text: 'Game',  path: '',  needsGame: false, sub: [
            {text: 'New',  path: '/setup/new'},
            {text: 'Load', path: '/setup/load'},
            {text: 'Delete', path: '/setup/delete'}, ]}, 
        {text: 'Status',  path: '/status',  needsGame: true},
        {text: 'Players',  path: '/names',  needsGame: true},
        {text: 'Score Entry',  path: '/score',  needsGame: true},
        {text: 'Score Review',  path: '/score-review',  needsGame: true},
        {text: 'Summary',       path: '/report/short',  needsGame: true},
        {text: 'Report',        path: '/report/long',  needsGame: true},
        {text: 'NameData',  path: '',  needsGame: false, sub: [
            {text: 'Import',  path: '/namedata/import'},
            {text: 'Edit',    path: '/namedata/edit'},
            {text: 'Delete',  path: '/namedata/delete'}, ]}, 
    ];
    
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
