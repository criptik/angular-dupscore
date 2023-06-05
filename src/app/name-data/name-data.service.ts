import { Injectable } from '@angular/core';
import { Person, Pair } from '../game-data/game-data.service';
import { SerializerClass, SeriClassLiteral } from '../serializer/serializer';

@Injectable({
    providedIn: 'root'
})
export class NameDataService {
    locStorageKey: string = 'dupscore-Names';
    allNames :Person[] = [];
    _serializer: SerializerClass;

    constructor() {
        // console.log('name-data-service constructor');
        this._serializer = new SerializerClass({Person}, );
        // this._serializer.setDebug(true);
        // read in the Name DataBase
        this.fillAllNames();
    }

    fillAllNames() {
        const jsonStr: string = window.localStorage.getItem(this.locStorageKey) ?? '';
        // console.log(jsonStr);
        if (jsonStr !== '') {
            this.allNames = this._serializer.deserialize(jsonStr);
        }
        this.cleanupAllNames();
    }

    cleanupAllNames() {
        this.allNames = this.allNames.filter( person => person.last !== null && person.first !== null);
        // console.log(this.allNames);
    }
    
    getAllNamesList(): Person[] {
        return this.allNames;
    }

    setAllNamesList(allNames: Person[]) {
        this.allNames = allNames;
        this.saveAllNames();
    }

    saveAllNames() {
        window.localStorage.setItem(this.locStorageKey, this._serializer.serialize(this.allNames));
    }
    

}
