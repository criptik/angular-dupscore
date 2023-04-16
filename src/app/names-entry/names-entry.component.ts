import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Directive, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GameDataService, Person, Pair } from '../game-data/game-data.service';
import { SerializerService } from '../serializer/serializer.service';
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
    
    constructor(private gameDataPtr: GameDataService,
                private _router: Router,
                private _activatedRoute: ActivatedRoute,
                private _serializer: SerializerService, )  {
        // console.log(this.allNames);
        // console.log(this._serializer.serialize(this.allNames));
    }

    onMyCompleterKeyUp(x: any) {
    }

    parseNumberFrom(str: string): number {
        return (parseInt(str.replace(/\D/g, '')));
    }
    
    
    onNameButtonClick(x: any) {
        // console.log('target.id', x.target.id);
        // parse number from id which is nameXX
        const pairnum = this.parseNumberFrom(x.target.id);
        this.nameEntryDialogHeader = `Names for Pair ${pairnum}`;
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
        console.log(this.allNames);
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

    genLastNameCompletionList(x: any) {
        if (x.target.value.length >= 2) {
            const completionList = this.allLastNames.filter( name => name.toUpperCase().startsWith(x.target.value.toUpperCase()));
            this.nameCompletion = completionList;
            // keep track of the cases where there is only one entry
            const exactArray: string[] = x.target.exactArray ?? [];
            // console.log('exact', exactArray, completionList[0]);
            if (completionList.length === 1 && !exactArray.includes(completionList[0])) {
                x.target.value = completionList[0];
                exactArray.push(completionList[0]);
                x.target.exactArray = exactArray;
            }
        }
        else {
            this.nameCompletion = [];
        }
    }
    
    onLastNameInputKeyUp(x: any) {
        const key: string = x.key;
        this.genLastNameCompletionList(x);
    }

    onLastNameFocus(x: any) {
        this.genLastNameCompletionList(x);
    }
    
    genFirstNameCompletionList(x: any) {
        const idx = this.parseNumberFrom(x.target.name);
        const lastName = (idx === 1 ? this.lastName1.nativeElement.value : this.lastName2.nativeElement.value);
        this.nameCompletion = this.lastFirstMap.get(lastName) ?? [];
    }
    
    onFirstNameInputKeyUp(x: any) {
        const key: string = x.key;
        this.genFirstNameCompletionList(x);
    }

    onFirstNameFocus(x: any) {
        this.genFirstNameCompletionList(x);
    }

    addToAllNames(player: Person) {
        // add it if it is not already there
        const notIn: boolean = this.allNames.every( (curPerson) => !curPerson.matches(player));
        if (notIn) {
            this.allNames.push(player);
        }
    }
    
    onDialogOKClick(x: any) {
        // here we will copy out the fields
        const pairnum = this.parseNumberFrom(this.nameEntryDialogHeader);
        const playerA: Person = new Person(this.firstName1.nativeElement.value, this.lastName1.nativeElement.value);
        const playerB: Person = new Person(this.firstName2.nativeElement.value, this.lastName2.nativeElement.value);
        const newPair = new Pair(playerA, playerB);
        this.addToAllNames(playerA);
        this.addToAllNames(playerB);
        this.gameDataPtr.pairNameMap.set(pairnum, newPair);
        // console.log(newPair);
        this.nameEntryDialog.nativeElement.close();
        this.updatePairNameStrArray();
        window.localStorage.setItem(this.locStorageKey, this._serializer.serialize(this.allNames));
    }
}

