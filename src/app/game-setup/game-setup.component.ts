import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { GameDataService } from '../game-data/game-data.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-game-setup',
    templateUrl: './game-setup.component.html',
    styleUrls: ['./game-setup.component.css']
})
export class GameSetupComponent {
    @ViewChild('newGameDialog') newGameDialog!: ElementRef<HTMLDialogElement>;
    @ViewChild('loadGameDialog') loadGameDialog!: ElementRef<HTMLDialogElement>;
    totBoardsArray: number[] = [];
    existingGameList: string[] = [];

    // interface newGameFields {
    //     gameName: string;
    //     movement: string;
    //     totBoards: string;
    // }
    
    newGameForm = new FormGroup({
        gameName:  new FormControl(),
        movement:  new FormControl(),
        totBoards: new FormControl(),
    });

    loadGameForm = new FormGroup({
        loadGameName:  new FormControl(),
    });
    
    movMap: Map<string, number[]> = new Map([
        ['HCOLONEL', [20, 30]],
        ['H0407X',   [21, 28, 14]],
        ['M0505X',   [20, 25, 30]],
    ]);

    movInfoStr: string = '';
    
    constructor(private gameDataPtr: GameDataService) {    
    }

    async onNewGameFormSubmit() {
        console.log('onNewGameFormSubmit',
                    this.newGameForm.value,
                    this.newGameForm.value.movement,
        );
        this.newGameDialog.nativeElement.close();
        await this.gameDataPtr.Initialize(
            this.newGameForm.value.gameName,
            this.newGameForm.value.movement,
            parseInt(this.newGameForm.value.totBoards)
        );
    }

    onLoadGameFormSubmit() {
        console.log('onLoadGameFormSubmit');
        this.loadGameDialog.nativeElement.close();
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
        this.newGameForm.get('movement')?.valueChanges.subscribe( mov => {
            console.log('valueChanges', mov, this.newGameForm.value);
            setTimeout(() => {
                console.log('after tick', this.newGameForm.value)   //shows the latest 
            });
            this.totBoardsArray = this.movMap.get(mov) ?? [];
            this.newGameForm.get('totBoards')?.setValue(this.totBoardsArray[0].toString());
        });
    }

    loadGameSetup() {
        // get list of existing games
        const existingGameList: string[] = [];
        _.range(window.localStorage.length).forEach( n => {
            const key: string = window.localStorage.key(n) ?? '';
            if (key.startsWith('game-')) {
                const fname = key.slice(5);
                existingGameList.push(fname);
            }
        });
        this.existingGameList = existingGameList.sort();
        this.loadGameForm.get('loadGameName')?.setValue(this.existingGameList[0]);
        this.loadGameDialog.nativeElement.showModal();
    }

    gameTypeButtonClick(event: any) {
        console.log('click', event.target.id);
        if (event.target.id === 'gameNew') {
            this.newGameSetup();
        }
        if (event.target.id === 'gameLoad') {
            this.loadGameSetup();
        }
    }
}
