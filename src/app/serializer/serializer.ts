import {Pair, Person, BoardObj, BoardPlay, GameDataService} from '../game-data/game-data.service';
// import * as _ from 'lodash';

export type StringStringTuple = [string, string];

export class SerializerClass {
    debug: boolean = false;

    realToMiniMap: Map<string, string>;
    miniToRealMap: Map<string, string>;
    excludedClasses: string[];
    serializedClassNames: string[];
    
    constructor(realToMiniTupleAry: StringStringTuple[], excludedClasses:string[] = []) {
        this.realToMiniMap = new Map<string, string>(realToMiniTupleAry);
        this.miniToRealMap = new Map<string, string>();
        Array.from(this.realToMiniMap.entries()).forEach( ([key, valstr]) => {
            this.miniToRealMap.set(valstr, key);
        });
        this.serializedClassNames = Array.from(this.realToMiniMap.keys());
        this.excludedClasses = excludedClasses;
        this.dbglog(this.realToMiniMap.toString());
        this.dbglog(this.miniToRealMap.toString());
    }

    dbglog(str: string) {
        if (this.debug) console.log(str);
    }
    
    realToMini(real: string): string {
        return this.realToMiniMap.get(real)!;
    }

    miniToReal(mini: string): string {
        return this.miniToRealMap.get(mini)!;
    }
    
    serialize(classInstance: any): string {
        const jsonStr = JSON.stringify(classInstance, (key, value) => {
            if (key === 'http') return undefined;
            if (value && typeof(value) === "object") {
                const valConsName = value.constructor.name;
                if (valConsName === 'Map') {
                    value.__type = 'Map';
                    const valarray = Array.from(value.entries());
                    value.__entries = valarray;
                    this.dbglog(`__entries: ${valarray}`);
                }
                else if (this.excludedClasses.includes(valConsName)) {
                    this.dbglog(`excluding ${valConsName}`);
                    return undefined;
                }
                else {
                    value.__type = this.miniToReal(value.constructor.name);
                }
                
                this.dbglog(`serialize: key=${key}, value=${value}, __type=${value.__type}`);
            }
            return value;
        }, );
        // console.log(jsonStr);
        return jsonStr;
    }

    deserialize (jsonString: string) {
        return JSON.parse(jsonString, (key, value) => {
            if (value && typeof (value) === "object" && value.__type) {
                const vtype: string = value?.__type;
                if (vtype === 'Map') {
                    value = new Map(value.__entries);
                    delete value.__entries;
                } else if (this.serializedClassNames.includes(vtype)) {
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
