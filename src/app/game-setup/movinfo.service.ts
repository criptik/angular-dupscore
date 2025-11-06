import { Injectable } from '@angular/core';

interface MovInfoObj {
    desc: string;
    tot: number[];
}

@Injectable({
    providedIn: 'root'
})
export class MovInfoService {
    movMap: Map<string, MovInfoObj> = new Map();
    constructor() {
        this.addMovInfo('H0203X', '2 Table Howell, 2NS vs. 3EW at T2', [18, 21, 24, 27, 30]);
        this.addMovInfo('HCOLONEL', '3 Table Howell, no board sharing', [20, 30]);
        this.addMovInfo('H0407X', '4 Table Howell, 7 rounds, 6NS vs 3EW at T2',  [21, 28, 14]);
        this.addMovInfo('M0505X', '5 Table Mitchell, 5 rounds', [20, 25, 30]);
    }

    addMovInfo(mov: string, desc: string, tot: number[]) {
        this.movMap.set(mov, {desc, tot});
    }

    getMovInfoKeys(): string[] {
        return Array.from(this.movMap.keys());
    }

    getDesc(mov: string): string {
        return this.movMap.get(mov)?.desc ?? '';
    }
    
    getTot(mov: string): number[] {
        return this.movMap.get(mov)?.tot ?? [];
    }
    
}
