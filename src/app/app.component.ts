import { Component } from '@angular/core';
import { GameDataService } from './game-data/game-data.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {

    title: string = "dupscore";
    
    highlightClass: string = 'highlight';
    
    menuLayout: any[]  = [
        {text: 'Game',  path: '',  needsGame: false, sub: [
            {text: 'New',  path: '/setup/new'},
            {text: 'Load', path: '/setup/load'},
            {text: 'Delete', path: '/setup/delete'}, ]}, 
        {text: 'Status',  path: '/status',  needsGame: true},
        {text: 'Players',  path: '/names',  needsGame: true},
        {text: 'Score Entry',  path: '/score',  needsGame: true},
        {text: 'Score Review',  path: '/score-review',  needsGame: true},
        {text: 'Leaders',       path: '/report/short',  needsGame: true},
        {text: 'Report',        path: '/report/long',  needsGame: true},
        {text: 'NameData',  path: '',  needsGame: false, sub: [
            {text: 'Import',  path: '/namedata/import'},
            {text: 'Delete',  path: '/namedata/delete'}, ]}, 
    ];

    latestButtonMouseOver: HTMLElement|null = null;
    
    constructor(
        public gameDataPtr: GameDataService,
        private _router: Router) {    
        if (!this.gameDataPtr.gameDataSetup) {
            this._router.navigate(["/setup"]);
        }
    }

    clearHighlights() {
        const elems = document.querySelectorAll('.navbar a, .navbar button');
        elems.forEach( elem => {
            elem.classList.remove(this.highlightClass);
        });
    }
    
    onLinkClick(event: any) {
        const elem = event.srcElement;
        // console.log('onLinkClick', elem.id, event);
        this.clearHighlights();
        elem.classList.add(this.highlightClass);
        console.log('after add', elem.id, elem.classList);
    }

    onSubLinkClick(event: any) {
        const elem = event.srcElement;
        // console.log('onSubLinkClick', event);
        this.clearHighlights();
        elem.classList.add(this.highlightClass);
        // also add to the most recent button mouse over seen (which opened our subnav)
        this.latestButtonMouseOver!.classList.add(this.highlightClass);
    }

    onButtonMouseOver(event: any) {
        const elem = event.srcElement;
        this.latestButtonMouseOver = elem;
        this.clearHighlights();
        // console.log('onButtonMouseOver', event);
    }
}
