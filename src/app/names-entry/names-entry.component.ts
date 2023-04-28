import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { Directive, ElementRef} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GameDataService, Person, Pair } from '../game-data/game-data.service';
import { SerializerService } from '../serializer/serializer.service';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule,
         AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {trigger, state, style, animate, transition} from '@angular/animations';
import * as _ from 'lodash';

@Component({
    selector: 'app-names-entry',
    templateUrl: './names-entry.component.html',
    styleUrls: ['./names-entry.component.css'],
})

export class NamesEntryComponent implements AfterViewInit {
    @ViewChild('nameEntryDialog') nameEntryDialog!: ElementRef<HTMLDialogElement>;
    @ViewChild('swapPairsDialog') swapPairsDialog!: ElementRef<HTMLDialogElement>;
    nameEntryDialogHeader: string = '';
    pairNameStrArrayNS: string[] = [];
    pairNameStrArrayEW: string[] = [];

    locStorageKey: string = 'dupscore-Names';
    
    allNames :Person[] = [];
    swapPairFirst: number = 0;

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
    exactArraysLastName: Map<number, string[]> = new Map();
    exactArraysFirstName: Map<number, string[]> = new Map();

    nameEntryForm = new FormGroup({
        lastName1:  new FormControl(''),
        firstName1:  new FormControl(''),
        lastName2:  new FormControl(''),
        firstName2:  new FormControl(''),
    });
    nameEntryFormPairnum: number = 0;
    
    swapPairsForm = new FormGroup({
        pair1:  new FormControl(),
        pair2:  new FormControl(),
    });

    formErrorMsgAry: string[] = [];
    blankPair: Pair = new Pair(new Person('', ''), new Person('', ''));


    constructor(public   gameDataPtr: GameDataService,
                private _router: Router,
                private _activatedRoute: ActivatedRoute,
                private _serializer: SerializerService, )  {

        // this.nameEntryForm.setValidators(this.notInUseValidator);
    }

    pairnumFromId(str: string): number {
        return (parseInt(str.replace(/[a-zA-Z ]/g, '')));
    }
    
    
    onNameButtonClick(x: any) {
        this.swapPairFirst = 0;
        // console.log('target.id', x.target.id);
        // parse number from id which is nameXX
        const pairnum = this.pairnumFromId(x.target.id);
        const pairText:string = this.gameDataPtr.pairnumToString(pairnum);
        this.nameEntryDialogHeader = `Names for Pair ${pairText}`;
        this.nameEntryFormPairnum = pairnum;
        // seed form if names already exist for that pair
        const checkPair: Pair = this.gameDataPtr.pairNameMap.get(pairnum) ?? this.blankPair;
        // console.log(x.target.id, pairnum, checkPair);
        this.nameEntryForm.get('lastName1')?.setValue( checkPair.A.last );
        this.nameEntryForm.get('firstName1')?.setValue( checkPair.A.first );
        this.nameEntryForm.get('lastName2')?.setValue( checkPair.B.last );
        this.nameEntryForm.get('firstName2')?.setValue( checkPair.B.first );
        
        this.nameEntryForm.get('lastName1')?.valueChanges.subscribe( curInput => this.genLastNameCompletionList(curInput, 1) );
        this.nameEntryForm.get('lastName2')?.valueChanges.subscribe( curInput => this.genLastNameCompletionList(curInput, 2) );
        this.nameEntryForm.get('firstName1')?.valueChanges.subscribe( curInput => this.genFirstNameCompletionList(curInput, 1) );
        this.nameEntryForm.get('firstName2')?.valueChanges.subscribe( curInput => this.genFirstNameCompletionList(curInput, 2) );

        this.nameEntryDialog.nativeElement.showModal();
    }

    swapPairs(firstPair: number, secondPair: number) {
        console.log(`swapping pairs ${firstPair}, ${secondPair}`);
        const pairA: Pair|undefined = this.gameDataPtr.pairNameMap.get(firstPair);
        const pairB: Pair|undefined = this.gameDataPtr.pairNameMap.get(secondPair);
        if (pairA) {
            this.gameDataPtr.pairNameMap.set(secondPair, pairA);
        }
        else {
            this.gameDataPtr.pairNameMap.delete(secondPair);
        }
        if (pairB) {
            this.gameDataPtr.pairNameMap.set(firstPair, pairB);
        }
        else {
            this.gameDataPtr.pairNameMap.delete(firstPair);
        }
        this.updatePairNameStrArray();
    }
    
    onNameButtonRightClick(x: any) {
        const pairnum = this.pairnumFromId(x.target.id);
        if (this.swapPairFirst === 0) {
            this.swapPairFirst = pairnum;
            // console.log(`setting swapPairFirst to ${this.swapPairFirst}`);
        }
        else {
            this.swapPairs(this.swapPairFirst, pairnum);
            this.swapPairFirst = 0;
        }
        return false;
    }
    
    // returns pair number if Person name already in pairMap
    personAlreadyInPairNameMap(checkPerson: Person): number {
        let result = 0;
        const notIn: boolean = Array.from(this.gameDataPtr.pairNameMap.entries()).every( ([pairnum, pair]) => {
            if (pair.A.matches(checkPerson) || pair.B.matches(checkPerson)) {
                result = pairnum;
                return false;
            }
            else {
                return true;
            }
        });
        return result;
    }
    
    updatePairNameStrArray() {
        this.pairNameStrArrayNS = this.gameDataPtr.pairIdsNS.map( pairnum => {
            const pairObj: Pair | undefined = this.gameDataPtr.pairNameMap.get(pairnum);
            const nameStr: string = (pairObj ? pairObj.fullString() : '');
            return nameStr;
        });
        this.pairNameStrArrayEW = this.gameDataPtr.pairIdsEW.map( pairnum => {
            const pairObj: Pair | undefined = this.gameDataPtr.pairNameMap.get(pairnum);
            const nameStr: string = (pairObj ? pairObj.fullString() : '');
            return nameStr;
        });
        // console.log(this.pairNameStrArray);
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

        // to speed up testing
        if (false) {
            const playerA: Person = new Person('Tom', 'Deneau');
            const playerB: Person = new Person('Gul', 'Deneau');
            const newPair = new Pair(playerA, playerB);
            this.gameDataPtr.pairNameMap.set(1, newPair);
            const playerA2: Person = new Person('Joe', 'Biden');
            const playerB2: Person = new Person('Kamala', 'Harris');
            const newPair2 = new Pair(playerA2, playerB2);
            this.gameDataPtr.pairNameMap.set(4, newPair2);
        }
        this.updatePairNameStrArray();
    }

    ngAfterViewInit() {
    }

    handleExactCompletionList(id: number, lastFirstStr: string, curInput: string,
                              completionList: string[], savedExactArrays: Map<number, string[]>) {
        // keep track of the cases where there is only one entry
        const exactArray: string[] = savedExactArrays.get(id) ?? [];
        // console.log('exact', exactArray, completionList[0]);
        if (completionList.length === 1 && !exactArray.includes(completionList[0]) && curInput !== completionList[0]) {
            // const control = (id === 1 ? this.nameEntryForm.get('lastName1') : this.nameEntryForm.get('lastName2'));
            const control = this.nameEntryForm.get(`${lastFirstStr}Name${id}`);
            control?.setValue(completionList[0] as never);
            // console.log('set Exact', control, completionList[0]);
            exactArray.push(completionList[0]);
            savedExactArrays.set(id, exactArray);
        }
    }        

    genLastNameCompletionList(curInput: string|null, id: number) {
        console.log('genLastNameCompletionList', curInput, id);
        this.nameCompletion = [];
        if (curInput === null) return;
        if (curInput.length < 2) return;

        const completionList: string[] = this.allLastNames.filter( name =>
            name.toUpperCase().startsWith(curInput.toUpperCase()));
        this.nameCompletion = completionList;
        this.handleExactCompletionList(id, 'last', curInput, completionList, this.exactArraysLastName)
    }
    
    onLastNameFocus(x: any) {
        // console.log('onLastNameFocus', this.nameEntryForm.errors);
        this.genLastNameCompletionList(x.target.value, this.pairnumFromId(x.target.id));
    }
    
    genFirstNameCompletionList(curInput: string|null, id: number) {
        this.nameCompletion = [];
        if (curInput === null) return;
        const lastName: string|null|undefined = this.nameEntryForm.get(`lastName${id}`)?.value;
        if (!lastName) return;
        let completionList: string[] = this.lastFirstMap.get(lastName) ?? [];
        completionList = completionList.filter( name =>
            name.toUpperCase().startsWith(curInput.toUpperCase()));

        // console.log('firstNameCompletionList', completionList);
        this.nameCompletion = completionList;
        this.handleExactCompletionList(id, 'first', curInput, completionList, this.exactArraysFirstName)
    }
    
    onFirstNameFocus(x: any) {
        this.genFirstNameCompletionList(x.target.value, this.pairnumFromId(x.target.id));
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

    // called on submit
    validateForm (): string[] {
        const formErrorMessages = new Set<string>();
        for (let n = 1; n <=2; n++) {
            const first: string | null | undefined = this.nameEntryForm.get(`firstName${n}`)?.value;
            const last: string | null | undefined = this.nameEntryForm.get(`lastName${n}`)?.value;
            if (!first || !last) {
                formErrorMessages.add(`First and Last Name Required for Player ${n}`);
                continue;
            }
            // build person to check against other names
            const checkPerson = new Person(first!, last!);
            // check against other person in form
            const m = (n === 1 ? 2 : 1);
            const otherFirst: string | null | undefined = this.nameEntryForm.get(`firstName${m}`)?.value;
            const otherLast: string | null | undefined = this.nameEntryForm.get(`lastName${m}`)?.value;
            if (otherFirst && otherLast) {
                const otherPersonInPair = new Person(otherFirst!, otherLast!);
                if (checkPerson.matches(otherPersonInPair)) {
                    formErrorMessages.add('Each name in pair must be unique');
                }
            }
                // check against other pair names already entered
            const matchPairNum: number = this.personAlreadyInPairNameMap(checkPerson);
            if (matchPairNum !== 0) {
                const errorstr: string = `${checkPerson.toString()} already in use in pair ${matchPairNum}`;
                // console.log(errorstr);
                formErrorMessages.add(errorstr);
            }
        } // for n
        return (Array.from(formErrorMessages.keys()));
    }
    
    onNameEntryFormSubmit() {
        // first validate, and if any errors, don't submit
        this.formErrorMsgAry = this.validateForm();
        if (this.formErrorMsgAry.length > 0) {
            return;
        }

        // here we will copy out the fields
        const pairnum = this.nameEntryFormPairnum;
        const playerA: Person = new Person(this.nameEntryForm.value.firstName1!, this.nameEntryForm.value.lastName1!);
        const playerB: Person = new Person(this.nameEntryForm.value.firstName2!, this.nameEntryForm.value.lastName2!);
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
        this.gameDataPtr.saveToLocalStorage();
    }

    onSwapPairsButtonClick(x: any) {
        this.swapPairsDialog.nativeElement.showModal();
    }
    
    onSwapPairsFormSubmit() {
        const pair1: number|null|undefined = this.swapPairsForm.get('pair1')?.value;
        const pair2: number|null|undefined = this.swapPairsForm.get('pair2')?.value;
        if (!pair1 || !pair2) return;
        const pairAry: number[] = _.range(1, this.gameDataPtr.numPairs + 1);
        if (!pairAry.includes(pair1) || !pairAry.includes(pair2)) return;
    }

    // notInUseValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => { 

}


