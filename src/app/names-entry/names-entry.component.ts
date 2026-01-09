import { Component, Input, ViewChild, AfterViewInit, OnInit, NgModule } from '@angular/core';
import { Directive, ElementRef} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GameDataService, Person, Pair } from '../game-data/game-data.service';
import { NameDataService } from '../name-data/name-data.service';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule,
         AbstractControl, ValidationErrors, ValidatorFn, NgControl } from '@angular/forms';
import {trigger, state, style, animate, transition} from '@angular/animations';
import * as _ from 'lodash';

interface PairNameObj {
    pairnum: number;
    nameStr: string;
};

@Component({
    selector: 'app-names-entry',
    templateUrl: './names-entry.component.html',
    styleUrls: ['./names-entry.component.css'],
    standalone: false
})

export class NamesEntryComponent implements AfterViewInit {
    @ViewChild('nameEntryDialog') nameEntryDialog!: ElementRef<HTMLDialogElement>;
    nameEntryDialogHeader: string = '';
    pairNameStrArray: PairNameObj[][] = [];

    allNames: Person[] = [];
    allUnusedNames: Person[] = [];
    swapPairFirst: number = 0;
    swapPairStartMsg: string = 'Use Right-click to swap Pairs...';
    swapPairMsg: string = this.swapPairStartMsg;
    
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
    formWarnMsgAry: string[] = [];
    blankPair: Pair = new Pair(new Person('', ''), new Person('', ''));
    curInputsSeen: string[] = [];
    
    constructor(public   gameDataPtr: GameDataService,
                private  nameDataPtr: NameDataService,
                private _router: Router,
                private _activatedRoute: ActivatedRoute,)  {

    }

    pairnumFromId(str: string): number {
        return (parseInt(str.replace(/[a-zA-Z ]/g, '')));
    }

    clearMsgArrays() {
        this.formErrorMsgAry = [];
        this.formWarnMsgAry = [];
    }
    
    
    onNameButtonClick(x: any) {
        this.swapPairFirst = 0;
        // console.log('target.id', x.target.id);
        // parse number from id which is nameXX
        this.clearMsgArrays();
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
            this.swapPairMsg = `Right-click on pair to swap with pair ${this.gameDataPtr.pairnumToString(pairnum)}`;
            // console.log(`setting swapPairFirst to ${this.swapPairFirst}`);
        }
        else {
            this.swapPairs(this.swapPairFirst, pairnum);
            this.swapPairFirst = 0;
            this.swapPairMsg = this.swapPairStartMsg;
        }
        return false;
    }
    
    // returns pair number if Person name already in pairMap
    personAlreadyInPairNameMap(checkPerson: Person): number {
        let result = 0;
        const notIn: boolean = Array.from(this.gameDataPtr.pairNameMap.entries()).every( ([pairnum, pair]) => {
            if ((pair.A.matches(checkPerson) || pair.B.matches(checkPerson)) && (pairnum != this.nameEntryFormPairnum)) {
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
        this.pairNameStrArray = [];
        this.gameDataPtr.pairIdsNS.forEach( (pairnum, idx) => {
            const rowArray: PairNameObj[] = [];
            // always at least one button in each row
            const pairObj: Pair | undefined = this.gameDataPtr.pairNameMap.get(pairnum);
            const nameStr: string = (pairObj ? pairObj.fullString() : '');
            rowArray.push({pairnum, nameStr});
            // for Mitchell games, put two pair buttons in each row
            if (!this.gameDataPtr.isHowell) {
                const pairnumEW = this.gameDataPtr.pairIdsEW[idx];
                const pairObj: Pair | undefined = this.gameDataPtr.pairNameMap.get(pairnumEW);
                const nameStr: string = (pairObj ? pairObj.fullString() : '');
                rowArray.push({pairnum: pairnumEW, nameStr:nameStr});
            }
            this.pairNameStrArray.push(rowArray);
        });
        this.gameDataPtr.saveToLocalStorage();
        // console.log(this.pairNameStrArray);
    }

    fillAllNames() {
        this.allNames = this.nameDataPtr.getAllNamesList();
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
        this.clearMsgArrays();
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
        this.clearMsgArrays();
        this.genFirstNameCompletionList(x.target.value, this.pairnumFromId(x.target.id));
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
            // check against other pair names already entered but don't check against this pair
            // for now we will make this a warning and clear out the other usage
            const matchPairNum: number = this.personAlreadyInPairNameMap(checkPerson);
            if (matchPairNum !== 0) {
                const warnstr: string = `WARNING: ${checkPerson.toString()} was already in use in pair ${matchPairNum}
Pair ${matchPairNum} usage has been cleared out.
You should fix up Pair ${matchPairNum}`;
                alert(warnstr);
                const otherPair = this.gameDataPtr.pairNameMap.get(matchPairNum)!;
                if (otherPair.A.matches(checkPerson)) {
                    otherPair.A = Person.emptyInstance();
                }
                if (otherPair.B.matches(checkPerson)) {
                    otherPair.B = Person.emptyInstance();
                }
            }
        } // for n
        return (Array.from(formErrorMessages.keys()));
    }

    alreadyInAllNames(newPerson: Person): boolean {
        return this.allNames.some(person => person.matches(newPerson));
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
        const origAllNamesLength = this.allNames.length;
        [playerA, playerB].forEach( player => {
            if (!this.alreadyInAllNames(player)) this.allNames.push(player);
        });
        if (this.allNames.length !== origAllNamesLength) {
            this.nameDataPtr.setAllNamesList(this.allNames);
        }
        
        // console.log(newPair);
        // clear form fields
        this.nameEntryForm.reset();
        this.nameEntryDialog.nativeElement.close();
        this.updatePairNameStrArray();
    }

    onEnterKey(x: any) {
        // console.log('Enter', x);
        x.preventDefault();
    }

    absPairnum(pairnum: number): number {
        return Math.abs(pairnum);
    }

}


@Directive({
    selector: '[formControlName]',
    standalone: false
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


