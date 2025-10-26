import {Pair, Person, BoardObj, BoardPlay, GameDataService} from '../game-data/game-data.service';
// import * as _ from 'lodash';

interface SeriClass {
    emptyInstance(): any;
    name?: string;
}

export type SeriClassLiteral = {[index: string]: SeriClass};

export class SerializerClass {
    debug: boolean = false;

    sourceToRuntimeMap: Map<string, string>;
    runtimeToSourceMap: Map<string, string>;
    sourceToClassMap: Map<string, SeriClass>;
    excludedClasses: string[];
    serializedSourceClassNames: string[];
    serializedRuntimeClassNames: string[];
    
    constructor(seriClassLiteral: SeriClassLiteral, excludedClasses:string[] = []) {
        this.sourceToRuntimeMap = new Map<string, string>();
        this.runtimeToSourceMap = new Map<string, string>();
        this.sourceToClassMap = new Map<string, SeriClass>();
        Array.from(Object.entries(seriClassLiteral)).forEach( ([sourceName, clz]) => {
            const runtimeName: string = clz['name']!;
            this.sourceToRuntimeMap.set(sourceName, runtimeName);
            this.sourceToClassMap.set(sourceName, clz);
            this.runtimeToSourceMap.set(runtimeName, sourceName);
        });
        this.serializedSourceClassNames = Array.from(this.sourceToRuntimeMap.keys());
        this.serializedRuntimeClassNames = Array.from(this.runtimeToSourceMap.keys());
        this.excludedClasses = excludedClasses;
        if (this.debug) {
            console.log(this.sourceToRuntimeMap);
            console.log(this.runtimeToSourceMap);
            console.log(this.sourceToClassMap);
            console.log('excludedClasses:', excludedClasses);
        }
        
    }

    setDebug(bval: boolean) {
        this.debug = bval;
    }
    
    dbglog(str: string) {
        if (this.debug) console.log(str);
    }
    
    sourceToRuntime(source: string): string {
        return this.sourceToRuntimeMap.get(source)!;
    }

    runtimeToSource(runtime: string): string {
        return this.runtimeToSourceMap.get(runtime)!;
    }
    
    serialize(classInstance: any): string {
        const jsonStr = JSON.stringify(classInstance, (key, value) => {
            if (key === 'http') return undefined;
            if (value && typeof(value) === "object") {
                const valConsName = value.constructor.name;
                this.dbglog(`handling ${valConsName}`);
                if (this.excludedClasses.includes(valConsName)) {
                    this.dbglog(`excluding ${valConsName}`);
                    return undefined;
                }
                if (valConsName === 'Map') {
                    value.__type = 'Map';
                    const valarray = Array.from(value.entries());
                    value.__entries = valarray;
                    this.dbglog(`__entries: ${valarray}`);
                }
                else if (valConsName === 'Array') {
                    value.__type = 'Array';
                }
                else if (this.serializedRuntimeClassNames.includes(valConsName)) {
                    value.__type = this.runtimeToSource(valConsName);
                }
                else {
                    // a class that is not excluded and is not Array or Map
                    // and is not in our included list?
                    // this should probably be a serious error
                    value.__type = valConsName;
                    if (this.debug) {
                        console.log(`class ${valConsName} seen but not excluded?`);
                        console.log(value);
                    }
                }
                this.dbglog(`serialize: key=${key}, value=${value}, __type=${value.__type}`);
            }
            return value;
        }, );
        if (this.debug) console.log('jsonStr = ', jsonStr);
        return jsonStr;
    }

    deserialize (jsonString: string) {
        return JSON.parse(jsonString, (key, value) => {
            if (value && typeof (value) === "object" && value.__type) {
                const vtype: string = value?.__type;
                if (vtype === 'Map') {
                    value = new Map(value.__entries);
                    delete value.__entries;
                } else if (this.serializedSourceClassNames.includes(vtype)) {
                    const clz: SeriClass = this.sourceToClassMap.get(vtype)!;
                    const newobj: Object = clz.emptyInstance();
                    // console.log('includedClass', value.__type, newobj);
                    delete value.__type;
                    value = Object.assign(newobj, value);
                }
            }
            return value;
        });
    }
}
