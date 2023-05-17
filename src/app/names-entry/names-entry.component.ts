import { Component, Input, ViewChild, AfterViewInit, OnInit, NgModule } from '@angular/core';
import { Directive, ElementRef} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GameDataService, Person, Pair } from '../game-data/game-data.service';
import { SerializerClass, StringStringTuple } from '../serializer/serializer';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule,
         AbstractControl, ValidationErrors, ValidatorFn, NgControl } from '@angular/forms';
import {trigger, state, style, animate, transition} from '@angular/animations';
import * as _ from 'lodash';


@Component({
    selector: 'app-names-entry',
    templateUrl: './names-entry.component.html',
    styleUrls: ['./names-entry.component.css'],
})

export class NamesEntryComponent implements AfterViewInit {
    @ViewChild('nameEntryDialog') nameEntryDialog!: ElementRef<HTMLDialogElement>;
    nameEntryDialogHeader: string = '';
    pairNameStrArrayNS: string[] = [];
    pairNameStrArrayEW: string[] = [];

    locStorageKey: string = 'dupscore-Names';
    
    allNames :Person[] = [];
    allUnusedNames: Person[] = [];
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
        new Person('Evelyn', 'McMillen'),
        new Person('Ernie', 'Roebuck'),
        new Person('Kathy', 'McColl', ),
        new Person('Joel', 'McColl'),
        new Person('Mary Dee', 'Hamman'),
        new Person('David', 'Davis'),
    ];
    
    allUnusedLastNames: string[] = [];
    nameCompletion: string[] = [];
    lastFirstMap: Map<string, string[]> = new Map();
    // exactArraysLastName: Map<number, string[]> = new Map();
    // exactArraysFirstName: Map<number, string[]> = new Map();

    nameEntryForm = new FormGroup({
        lastName1:  new FormControl(''),
        firstName1:  new FormControl(''),
        lastName2:  new FormControl(''),
        firstName2:  new FormControl(''),
    });
    nameEntryFormPairnum: number = 0;
    
    formErrorMsgAry: string[] = [];
    blankPair: Pair = new Pair(new Person('', ''), new Person('', ''));
    curInputsSeen: string[] = [];
    _serializer: SerializerClass;
    
    constructor(public   gameDataPtr: GameDataService,
                private _router: Router,
                private _activatedRoute: ActivatedRoute,)  {

        this._serializer = new SerializerClass([['Person', Person.name]], );
    }

    pairnumFromId(str: string): number {
        return (parseInt(str.replace(/[a-zA-Z ]/g, '')));
    }
    
    
    onNameButtonClick(x: any) {
        this.swapPairFirst = 0;
        // console.log('target.id', x.target.id);
        // parse number from id which is nameXX
        this.formErrorMsgAry = [];
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
        window.localStorage.removeItem(this.locStorageKey);
        const jsonStr: string = window.localStorage.getItem(this.locStorageKey) ?? '';
        if (jsonStr === '') {
            this.allNames = this.allNamesSeed;
        }
        else {
            this.allNames = this._serializer.deserialize(jsonStr);
        }
        this.cleanupAllNames();
        // initialize unused names
        this.allUnusedNames = this.allNames;
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
        this.updatePairNameStrArray();        
    }

    ngAfterViewInit() {
    }

    handleExactCompletionList(id: number, lastFirstStr: string, curInput: string, completionList: string[]) {
        // keep track of the cases where there is only one entry
        const listTop: string = completionList[0];
        // the curInputsSeen logic is to prevent being unable to erase?
        if (completionList.length === 1 && curInput !== listTop && !this.curInputsSeen.includes(curInput)) {
            const control = this.nameEntryForm.get(`${lastFirstStr}Name${id}`);
            control?.setValue(listTop as never);
            (<any> control).nativeElement.setSelectionRange(curInput.length, listTop.length);
            (<any> control).nativeElement.focus();
            // console.log('set Exact', curInput, listTop);
            this.curInputsSeen.push(curInput);
        }
    }        

    personAlreadyInCurrentForm(checkPerson: Person): boolean {
        const playerA: Person = new Person(this.nameEntryForm.value.firstName1!, this.nameEntryForm.value.lastName1!);
        const playerB: Person = new Person(this.nameEntryForm.value.firstName2!, this.nameEntryForm.value.lastName2!);
        return (checkPerson.matches(playerA) || checkPerson.matches(playerB));
    }
    
    buildUnusedNameLists() {
        this.curInputsSeen = [];
        this.allUnusedNames = this.allNames.filter( (checkPerson) => {
            const pairNameMapNum: number = this.personAlreadyInPairNameMap(checkPerson);
            const inCurrentForm: boolean = this.personAlreadyInCurrentForm(checkPerson);
            // console.log(checkPerson, pairNameMapNum, inCurrentForm);
            return(pairNameMapNum === 0  && !inCurrentForm);
        });
        // console.log('allUnusedNames', this.allUnusedNames);
        this.allUnusedLastNames = _.uniq(this.allUnusedNames.map( person => person.last));
        // console.log('allUnusedLast', this.allUnusedLastNames);
        this.lastFirstMap = new Map();
        this.allUnusedNames.forEach( (person) => {
            const anow = this.lastFirstMap.get(person.last) ?? [];
            anow.push(person.first);
            this.lastFirstMap.set(person.last, anow);
        });
        // console.log('lastFirstMap', this.lastFirstMap);
    }
    
    genLastNameCompletionList(curInput: string|null, id: number) {
        // console.log('genLastNameCompletionList', curInput, id);
        // console.log(this.allUnusedLastNames);
        const curInputStr: string = curInput ?? '';
        this.nameCompletion = [];
        if (curInputStr === '' && id === 2) {
            // attempt to seed with same last name since couples often play
            const lastName1 = this.nameEntryForm.value.lastName1;
            if (lastName1 && this.allUnusedLastNames.includes(lastName1)) {
                this.handleExactCompletionList(id, 'last', '', [lastName1!]);
                return;
            }
        }
        if (curInputStr.length < 2) return;

        const completionList: string[] = this.allUnusedLastNames.filter( name =>
            name.toUpperCase().startsWith(curInputStr.toUpperCase()));
        this.nameCompletion = completionList;
        this.handleExactCompletionList(id, 'last', curInputStr, completionList)
    }
    
    onLastNameFocus(x: any) {
        this.buildUnusedNameLists();
        this.formErrorMsgAry = [];
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
        this.handleExactCompletionList(id, 'first', curInput, completionList)
    }
    
    onFirstNameFocus(x: any) {
        this.buildUnusedNameLists();
        this.formErrorMsgAry = [];
        this.genFirstNameCompletionList(x.target.value, this.pairnumFromId(x.target.id));
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

    onEnterKey(x: any) {
        // console.log('Enter', x);
        x.preventDefault();
    }
}


@Directive({
    selector: '[formControlName]'
})
export class NativeElementInjectorDirective implements OnInit {
    constructor (private el: ElementRef,
                 private control : NgControl) {
    }
    
    ngOnInit(){
        (this.control.control as any).nativeElement = this.el.nativeElement;
        // console.log(this.control);
    }
}


