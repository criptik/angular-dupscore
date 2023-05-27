import { Component, Input, ViewChild, AfterViewInit, AfterContentInit, AfterContentChecked } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { GameDataService } from '../game-data/game-data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MovInfoService } from './movinfo.service';
import * as _ from 'lodash';

    @Component({
    selector: 'app-game-setup',
    templateUrl: './game-setup.component.html',
    styleUrls: ['./game-setup.component.css']
})
export class GameSetupComponent  implements AfterViewInit {
    @ViewChild('newGameDialog') newGameDialog!: ElementRef<HTMLDialogElement>;
    @ViewChild('loadGameDialog') loadGameDialog!: ElementRef<HTMLDialogElement>;
    @ViewChild('deleteGameDialog') deleteGameDialog!: ElementRef<HTMLDialogElement>;
    totBoardsArray: number[] = [];
    phantomPairArray: number[] = [];
    existingGameList: string[] = [];

    newGameForm = new FormGroup({
        gameName:  new FormControl(),
        movement:  new FormControl(),
        totBoards: new FormControl(),
        phantomPair: new FormControl(),
    });

    loadGameForm = new FormGroup({
        loadGameName:  new FormControl(),
    });

    deleteGameForm = new FormGroup({
    });

    
    movInfoKeys: string[] = [];
    action: string = '';

    deleteButtonMsg: string = '';
    
    constructor(
        public gameDataPtr: GameDataService,
        private _router: Router,
        private _route: ActivatedRoute,
        public _movInfo: MovInfoService) {
        this._router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
        };
        this.fillDeleteGameForm();
        this.gameDataPtr.gameDataSetup = false;
        this._route.params.subscribe( params => {
            this.action = params['action'] ?? '';
        });
        console.log('action:', this.action);
    }

    buildExistingGameList() {
        // get list of existing games
        const existingGameList: string[] = [];
        _.range(window.localStorage.length).forEach( n => {
            const key: string = window.localStorage.key(n) ?? '';
            if (key.startsWith('game-')) {
                const fname = key.slice(5);
                existingGameList.push(fname);
            }
        });
        this.existingGameList = existingGameList.sort().reverse();
    }
    
    ngAfterViewInit() {
        if (this.action === 'new') this.newGameSetup();
        else if (this.action === 'load') this.loadGameSetup();
        else if (this.action === 'delete') this.deleteGameSetup();
    }
    
    async onNewGameFormSubmit() {
        console.log('onNewGameFormSubmit',
                    this.newGameForm.value,
                    this.newGameForm.value.movement,
                    this.newGameForm.value.totBoards,
                    this.newGameForm.value.phantomPair,
        );
        this.newGameDialog.nativeElement.close();
        
        await this.gameDataPtr.createGame(
            this.newGameForm.value.gameName,
            this.newGameForm.value.movement,
            parseInt(this.newGameForm.value.totBoards),
            parseInt(this.newGameForm.value.phantomPair),
        );
        this._router.navigate(["/status"]);
    }

    onLoadGameFormSubmit() {
        // console.log('onLoadGameFormSubmit');
        this.gameDataPtr.getFromLocalStorage(this.loadGameForm.value.loadGameName);
        this.loadGameDialog.nativeElement.close();
        this._router.navigate(["/status"]);
    }
    
    onDeleteGameFormSubmit() {
        const formVal = this.deleteGameForm.value as {[key: string]: boolean};
        const keys: string[]  = Array.from(Object.keys(formVal));
        // console.log('onDeleteGameFormSubmit', keys);
        let numDeleted = 0;
        keys.forEach( (key) => {
            if (formVal[key]) {
                window.localStorage.removeItem(`game-${key}`);
                numDeleted++;
            }
        });
            
        this.deleteGameDialog.nativeElement.close();
        if (numDeleted === 0) {
            this._router.navigate(["/status"]);
        }
        else {
            this.deleteGameSetup();
        }
        
    }

    newGameSetup() {
        // seed the filename with today's date, etc.
        const now = new Date();
        const year: number = now.getFullYear() % 100;
        const mon: number = now.getMonth() + 1;
        const day: number = now.getDate();
        const hourCode = 'NMAE'[Math.floor(now.getHours() / 6)]
        this.newGameForm.get('gameName')?.setValue(
            `${year}${mon.toString().padStart(2,'0')}${day.toString().padStart(2,'0')}${hourCode}`);
        this.newGameDialog.nativeElement.showModal();
        this.newGameForm.get('movement')?.valueChanges.subscribe( async mov => {
            // console.log('valueChanges', mov, this.newGameForm.value);
            setTimeout(() => {
                console.log('after tick', this.newGameForm.value)   //shows the latest 
            });

            // get total boards choices and set default to first element
            this.totBoardsArray = this._movInfo.getTot(mov);
            this.newGameForm.get('totBoards')?.setValue(this.totBoardsArray[0].toString());
            // build phantomPair Option List
            // parse enough to get numPairs and isHowell
            await this.gameDataPtr.parseEarly(mov);

            this.phantomPairArray = [0].concat(this.gameDataPtr.pairIds);
            // console.log('phantomPairArray', this.phantomPairArray);
            this.newGameForm.get('phantomPair')?.setValue(0);
        });
    }

    loadGameSetup() {
        this.buildExistingGameList();
        this.loadGameForm.get('loadGameName')?.setValue(this.existingGameList[0]);
        this.loadGameDialog.nativeElement.showModal();
    }

    deleteGameSetup() {
        this.fillDeleteGameForm();
        // console.log('before', this.deleteGameForm);
        this.deleteGameDialog.nativeElement.showModal();
    }

    fillDeleteGameForm() {
        this.buildExistingGameList();
        this.existingGameList.forEach( name => {
            this.deleteGameForm.addControl(name, new FormControl(false));
        });
        this.deleteButtonMsg = 'Back';
    }

    onCheckChanged(e: any) {
        // console.log('onCheckChanged');
        const formVal = this.deleteGameForm.value as {[key: string]: boolean};
        const keys: string[]  = Array.from(Object.keys(formVal));
        let numChecked = 0;
        keys.forEach( (key) => {
            if (formVal[key]) {
                numChecked++;
            }
        });
        this.deleteButtonMsg = (numChecked === 0 ? 'Back' : 'Delete Checked Games');
    }
    
}
