import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SerializerService {
    debug: boolean = false;

    constructor() { }

    dbglog(str: string) {
        if (this.debug) console.log(str);
    }

    serialize(classInstance: any, excludedClasses:string[] = []): string {
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
                    const newobj = eval(`new ${vtype}()`);
                    value = Object.assign(newobj, value);
                }
                delete value.__type;
            }
            return value;
        });
    }
}
