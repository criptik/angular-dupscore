import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GameDataService, Person, Pair } from '../game-data/game-data.service';
import { SerializerService } from '../serializer/serializer.service';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as _ from 'lodash';

@Component({
    selector: 'app-names-entry',
    templateUrl: './names-entry.component.html',
    styleUrls: ['./names-entry.component.css']
})
export class NamesEntryComponent implements AfterViewInit {
    @ViewChild('nameEntryDialog') nameEntryDialog!: ElementRef<HTMLDialogElement>;
    nameEntryDialogHeader: string = '';
    pairNumArray: number[] = [];
    pairNameStrArray: string[] = [];

    locStorageKey: string = 'dupscore-Names';
    
    allNames :Person[] = [];
    

    allNamesSeed: Person[] = [
        new Person('Tom', 'Deneau'),
        new Person('Gul', 'Deneau'),
        new Person('Kamala', 'Harris'),
        new Person('Joe', 'Biden'),
        new Person('Amy', 'Seitz'),
        new Person('Dan', 'Seitz'),
        new Person('Sandy', 'Worley'),
        new Person('Dennis', 'Worley'),
        new Person('McMillen', 'Evelyn'),
        new Person('Roebuck', 'Ernie'),
        new Person('McColl', 'Kathy'),
        new Person('McColl', 'Joel'),
        new Person('Hamman', 'Mary Dee'),
        new Person('Davis', 'David'),
    ];
    
    allLastNames: string[] = [];
    nameCompletion: string[] = [];
    lastFirstMap: Map<string, string[]> = new Map();
    exactArrays: Map<number, string[]> = new Map();
    
    nameEntryForm = new FormGroup({
        lastName1:  new FormControl(),
        firstName1:  new FormControl(),
        lastName2:  new FormControl(),
        firstName2:  new FormControl(),
    });

    constructor(private gameDataPtr: GameDataService,
                private _router: Router,
                private _activatedRoute: ActivatedRoute,
                private _serializer: SerializerService, )  {
        // console.log(this.allNames);
        // console.log(this._serializer.serialize(this.allNames));
    }

    parseNumberFrom(str: string): number {
        return (parseInt(str.replace(/\D/g, '')));
    }
    
    
    onNameButtonClick(x: any) {
        // console.log('target.id', x.target.id);
        // parse number from id which is nameXX
        const pairnum = this.parseNumberFrom(x.target.id);
        this.nameEntryDialogHeader = `Names for Pair ${pairnum}`;
        this.nameEntryForm.get('lastName1')?.valueChanges.subscribe( curInput => this.genLastNameCompletionList(curInput, 1) );
        this.nameEntryForm.get('lastName2')?.valueChanges.subscribe( curInput => this.genLastNameCompletionList(curInput, 2) );
        this.nameEntryForm.get('firstName1')?.valueChanges.subscribe( curInput => this.genFirstNameCompletionList(curInput, 1) );
        this.nameEntryForm.get('firstName2')?.valueChanges.subscribe( curInput => this.genFirstNameCompletionList(curInput, 2) );

        this.nameEntryDialog.nativeElement.showModal();
    }

    updatePairNameStrArray() {
        this.pairNameStrArray = this.pairNumArray.map( pairnum => {
            const pairObj: Pair | undefined = this.gameDataPtr.pairNameMap.get(pairnum);
            const nameStr: string = (pairObj ? pairObj.fullString() : '');
            return nameStr;
        });
    }

    fillAllNames() {
        const jsonStr: string = window.localStorage.getItem(this.locStorageKey) ?? '';
        if (jsonStr === '') {
            this.allNames = this.allNamesSeed;
        }
        else {
            this.allNames = this._serializer.deserialize(jsonStr, ['Person']);
        }
        this.cleanupAllNames();
    }
    
    ngOnInit() {
        // when this is called, parent is all setup
        // console.log(`in score-entry.ngOnInit, gameDataSetup = ${this.gameDataPtr.gameDataSetup}`)
        if (!this.gameDataPtr.gameDataSetup) {
            this._router.navigate(["/status"]);
            return;
        }

        // read in the Name DataBase, or seed if not there
        this.fillAllNames();
        
        this.pairNumArray = _.range(1, this.gameDataPtr.numPairs+1);
        this.updatePairNameStrArray();
        
        // for testing name completion
        this.allLastNames = _.uniq(this.allNames.map( person => person.last));
        // console.log('allLast', this.allLastNames);
        this.lastFirstMap = new Map();
        this.allNames.forEach( (person) => {
            const anow = this.lastFirstMap.get(person.last) ?? [];
            anow.push(person.first);
            this.lastFirstMap.set(person.last, anow);
        });
        // console.log('lastFirstMap', this.lastFirstMap);
        
    }

    ngAfterViewInit() {
    }

    genLastNameCompletionList(curInput: string, id: number) {
        // console.log('genLastNameCompletionList', curInput, id);
        if (curInput === null) return;
        if (curInput.length >= 2) {
            const completionList: string[] = this.allLastNames.filter( name =>
                name.toUpperCase().startsWith(curInput.toUpperCase()));
            this.nameCompletion = completionList;
            // keep track of the cases where there is only one entry
            const exactArray: string[] = this.exactArrays.get(id) ?? [];
            // console.log('exact', exactArray, completionList[0]);
            if (completionList.length === 1 && !exactArray.includes(completionList[0]) && curInput !== completionList[0]) {
                const control = (id === 1 ? this.nameEntryForm.get('lastName1') : this.nameEntryForm.get('lastName2'));
                control?.setValue(completionList[0] as never);
                exactArray.push(completionList[0]);
                this.exactArrays.set(id, exactArray);
            }
        }
        else {
            this.nameCompletion = [];
        }
    }
    
    onLastNameFocus(x: any) {
        // console.log('onLastNameFocus', x);
        this.genLastNameCompletionList(x.target.value, this.parseNumberFrom(x.target.id));
    }
    
    genFirstNameCompletionList(curInput: string, id: number) {
        if (curInput === null) return;
        const lastName: string = (id === 1 ? this.nameEntryForm.value.lastName1 : this.nameEntryForm.value.lastName2);
        this.nameCompletion = this.lastFirstMap.get(lastName) ?? [];
    }
    
    onFirstNameFocus(x: any) {
        this.genFirstNameCompletionList(x.target.value, this.parseNumberFrom(x.target.id));
    }

    addToAllNames(player: Person) {
        // add it if it is not already there
        const notIn: boolean = this.allNames.every( (curPerson) => !curPerson.matches(player));
        if (notIn) {
            this.allNames.push(player);
        }
    }

    cleanupAllNames() {
        this.allNames = this.allNames.filter( person => person.last !== null && person.first !== null);
        // console.log(this.allNames);
    }
    
    onNameEntryFormSubmit() {
        // here we will copy out the fields
        const pairnum = this.parseNumberFrom(this.nameEntryDialogHeader);
        const playerA: Person = new Person(this.nameEntryForm.value.firstName1, this.nameEntryForm.value.lastName1);
        const playerB: Person = new Person(this.nameEntryForm.value.firstName2, this.nameEntryForm.value.lastName2);
        const newPair = new Pair(playerA, playerB);
        this.addToAllNames(playerA);
        this.addToAllNames(playerB);
        this.gameDataPtr.pairNameMap.set(pairnum, newPair);
        // console.log(newPair);
        // clear form fields
        this.nameEntryForm.reset();
        this.nameEntryDialog.nativeElement.close();
        this.updatePairNameStrArray();
        this.cleanupAllNames();
        window.localStorage.setItem(this.locStorageKey, this._serializer.serialize(this.allNames));
    }
}

