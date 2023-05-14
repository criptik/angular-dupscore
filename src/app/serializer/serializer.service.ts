import { Injectable } from '@angular/core';
import {Pair, Person, BoardObj, BoardPlay, GameDataService} from '../game-data/game-data.service';

@Injectable({
    providedIn: 'root'
})
export class SerializerService {
    debug: boolean = false;
    // testp: Person;
    
    constructor() {
        // this.testp = Function('return new Person('a','b');')
    }

    dbglog(str: string) {
        if (this.debug) console.log(str);
    }

    serialize(classInstance: any, excludedClasses:string[] = []): string {
        // console.log('in serialize', classInstance, excludedClasses);
        return JSON.stringify(classInstance, (key, value) => {
            if (key === 'http') return undefined;
            if (value && typeof(value) === "object") {
                value.__type = value.constructor.name;
                if (value.__type === 'Map') {
                    const valarray = Array.from(value.entries());
                    value.__entries = valarray;
                    this.dbglog(`__entries: ${valarray}`);
                }
                else if (excludedClasses.includes(value.__type)) {
                    this.dbglog(`skipping ${value.__type}`);
                    return undefined;
                }

                this.dbglog(`serialize: key=${key}, value=${value}, type=${typeof(value)}`);
                this.dbglog(`consname=${value.constructor.name}`);
            }
            return value;
        }, ' ');
    }

    deserialize (jsonString: string, includedClasses:string[] = []) {
        return JSON.parse(jsonString, (key, value) => {
            if (value && typeof (value) === "object" && value.__type) {
                const vtype: string = value?.__type;
                if (vtype === 'Map') {
                    value = new Map(value.__entries);
                    delete value.__entries;
                } else if (includedClasses.includes(vtype)) {
                    let newobj: Object;
                    switch (vtype) {
                        case 'Person':
                            newobj = new Person('x','y');
                            break;
                        case 'Pair':
                            newobj = new Pair(new Person('x','y'), new Person('x','y'));
                            break;
                        case 'BoardObj':
                            newobj = new BoardObj(1);
                            break;
                        case 'BoardPlay':
                            newobj = new BoardPlay(1,2,3);
                            break;
                        case 'GameDataService':
                            newobj = {};
                            break;
                        default:
                            newobj = {};
                    }
                    // console.log('includedClass', value.__type, newobj);
                    delete value.__type;
                    value = Object.assign(newobj, value);
                }
            }
            return value;
        });
    }
}
