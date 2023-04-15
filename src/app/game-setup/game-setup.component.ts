import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'


@Component({
    selector: 'app-game-setup',
    templateUrl: './game-setup.component.html',
    styleUrls: ['./game-setup.component.css']
})
export class GameSetupComponent {
    @ViewChild('newGameDialog') newGameDialog!: ElementRef<HTMLDialogElement>;
    totBoardsArray: number[] = [];
    totBoardsSelect: string = "";
    
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
    
    onNewGameFormSubmit() {
        console.log('onNewGameFormSubmit',
                    this.newGameForm.value,
                    this.newGameForm.value.movement,
        );
        this.newGameDialog.nativeElement.close();
        
    }

    gameTypeButtonClick(event: any) {
        console.log('click', event.target.id);
        if (event.target.id === 'gameNew') {
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
