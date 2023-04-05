import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GameDataService } from '../game-data/game-data.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-names-entry',
    templateUrl: './names-entry.component.html',
    styleUrls: ['./names-entry.component.css']
})
export class NamesEntryComponent implements AfterViewInit {
    @ViewChild('nameEntryDialog') nameEntryDialog!: ElementRef<HTMLDialogElement>;
    @ViewChild('lastName1') lastName1!: ElementRef<HTMLInputElement>;
    @ViewChild('firstName1') firstName1!: ElementRef<HTMLInputElement>;
    @ViewChild('lastName2') lastName2!: ElementRef<HTMLInputElement>;
    @ViewChild('firstName2') firstName2!: ElementRef<HTMLInputElement>;
    nameEntryDialogHeader: string = '';
    pairNumArray: number[] = [];
    
    constructor(private gameDataPtr: GameDataService,
                private _router: Router,
                private _activatedRoute: ActivatedRoute,)  {
    }

    ngOnInit() {
        // when this is called, parent is all setup
        // console.log(`in score-entry.ngOnInit, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
        if (!this.gameDataPtr.gameDataSetup) {
            this._router.navigate(["/status"]);
            return;
        }
        this.pairNumArray = _.range(1, this.gameDataPtr.numPairs+1);
    }

    ngAfterViewInit() {
    }

    onClick() {
        this.nameEntryDialogHeader = 'Names for Pair 1';
        this.nameEntryDialog.nativeElement.showModal();
    }
    
    onLastName1InputKeyUp(x: any) {
    }
    onFirstName1InputKeyUp(x: any) {
    }
    onLastName2InputKeyUp(x: any) {
    }
    onFirstName2InputKeyUp(x: any) {
    }
    
}

