import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { GameDataService } from '../game-data/game-data.service';

@Component({
    selector: 'app-game-setup',
    templateUrl: './game-setup.component.html',
    styleUrls: ['./game-setup.component.css']
})
export class GameSetupComponent {
    @ViewChild('newGameDialog') newGameDialog!: ElementRef<HTMLDialogElement>;
    totBoardsArray: number[] = [];
    totBoardsSelect: string = "";
    gameNameInput: string = "";
    
    newGameForm = new FormGroup({
        gameName:  new FormControl(),
        movement:  new FormControl(),
        totBoards: new FormControl(),
    })

    movMap: Map<string, number[]> = new Map([
        ['HCOLONEL', [20, 30]],
        ['H0407X',   [21, 28, 14]],
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

    gameTypeButtonClick(event: any) {
        console.log('click', event.target.id);
        if (event.target.id === 'gameNew') {
            // seed the filename with today's date, etc.
            const now = new Date();
            const year: number = now.getFullYear() % 100;
            const mon: number = now.getMonth() + 1;
            const day: number = now.getDate();
            const hourCode = 'NMAE'[Math.floor(now.getHours() / 6)]
            this.gameNameInput = `${year}${mon.toString().padStart(2,'0')}${day.toString().padStart(2,'0')}${hourCode}`;
            this.newGameDialog.nativeElement.showModal();
            this.newGameForm.get('movement')?.valueChanges.subscribe( mov => {
                console.log('valueChanges', mov, this.newGameForm.value);
                setTimeout(() => {
                    console.log('after tick', this.newGameForm.value)   //shows the latest 
                });
                this.totBoardsArray = this.movMap.get(mov) ?? [];
                this.totBoardsSelect = this.totBoardsArray[0].toString();
            });
        }
    }

    
}
