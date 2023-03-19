import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

const SCORE_EMPTY: number = -2;
const SCORE_SPECIAL: number = -1;

export class BoardPlay {
    // static info
    nsPair: number;
    ewPair: number;
    round: number;
    // result info
    nsScore:number;
    kindNS:string = '';
    kindEW:string = '';
    nsMP: number|null = null;
    ewMP: number|null = null;
    
    constructor(nsPair: number, ewPair: number, round: number) {
        this.nsPair = nsPair;
        this.ewPair = ewPair;
        this.round = round;
        this.nsScore = SCORE_EMPTY;  // symbol for empty
    }

    addScoreInfo(nsScore: number, kindNS: string = '', kindEW: string = kindNS) {
        this.nsScore = nsScore;
        this.kindNS = kindNS;
        this.kindEW = kindEW;
    }
    
}

type NNMap = Map<number, number>;

export class BoardObj {
    bdnum: number;
    boardPlays: Map<number, BoardPlay>  = new Map();
    mpMap: Map<number, number> = new Map();
    allPlaysEntered: boolean = false;

    constructor(bdnum: number) {
        this.bdnum = bdnum;
    }

    updateAllPlaysEntered() {
        Array.from(this.boardPlays.values()).forEach( (bp: BoardPlay) => {
            if (bp.nsScore === SCORE_EMPTY) {
                this.allPlaysEntered = true;
                return;
            }
        });
        this.allPlaysEntered = true;
    }
    
    getCbMap(ary: number[]) {
        const cbmap: NNMap = new Map();
        ary.forEach( n => {
            const curval = cbmap.get(n);
            cbmap.set(n, (curval === undefined ? 1 : curval + 1));
        });
        return cbmap;    
    }
    
    matchpointsCountBy(cbmap: NNMap, testval: number): number {
        const cbkeys: number[] = Array.from(cbmap.keys());
        return(cbkeys.reduce((mp:number, key:number) => {
            const countForKey: number|undefined  = cbmap.get(key);
            if (countForKey === undefined) return 0;
            else {
                return mp + (key < testval ? countForKey : (key == testval ? (countForKey - 1)*0.5 : 0));
            }
        }, 0));
    }

    mpMapFromCb(cbmap: NNMap): NNMap {
        const cbkeys: number[] = Array.from(cbmap.keys());
        const mpmap: NNMap = new Map();
        cbkeys.forEach( key => {
            mpmap.set(key, this.matchpointsCountBy(cbmap, key)); 
        });
        return mpmap;
    }

    computeMP() {
        // gather the nsScores from the BoardPlays that have numeric results
        const scores: number[] = [];
        Array.from(this.boardPlays.values()).forEach( (bp: BoardPlay) => {
            if (bp.kindNS === '') {
                scores.push(bp.nsScore);
            }
        });
        const cbmap = this.getCbMap(scores);
        this.mpMap = this.mpMapFromCb(cbmap);
    }
}

@Injectable({
    providedIn: 'root',
})
export class GameDataService {

    // for current testing, just set some data here
    // later these will be derived from the game setup info and the .MOV file
    
    numPairs: number = 6;   // should come from the .MOV file
    boardVul: string = 'NS VUL';
    boardObjs: Map<number, BoardObj> = new Map();
    abuf: ArrayBuffer = new ArrayBuffer(0);
    gameDataSetup: boolean = false;
    
    constructor(private http: HttpClient) {
        // console.log('in game-data.service constructor');
    }

    Initialize() {
        // console.log('in Initialize');
        this.http.get('assets/HCOLONEL.MOV', { responseType: 'blob' }).subscribe(async res => {
            //  console.log('in subscribe');
            const reader = new FileReader();
            reader.readAsDataURL(res);
            this.abuf = await res?.arrayBuffer();
            
            // now set up ui8ary, datstart
            console.log(`this.abuf=${this.abuf}, len=${this.abuf.byteLength}`);
            const ui8ary : Uint8Array = new Uint8Array(this.abuf);
            const asStr:string = new TextDecoder('utf-8').decode(ui8ary);
            const datstart = asStr.lastIndexOf('\x21\x22\x23\x24')+4;
            const datsiz = this.abuf.byteLength - datstart;
            // console.log(`ui8ary=${ui8ary}`);
            console.log(`datstart=${datstart}`);
            var idx = datstart;
            const numtables = 3;
            const boardsPerRound = 2;
            const numrounds = (datsiz / numtables) / 3;
            const numboards = numrounds * boardsPerRound;
            // create the BoardInfo objects
            _.range(1, numboards+1).forEach(bdnum => {
                this.boardObjs.set(bdnum, new BoardObj(bdnum));
            });
            // console.log(this.boardObjs.get(1).boardPlays);
            
            console.log(`tables = ${numtables}, rounds=${numrounds}, datsiz=${datsiz}`);
            _.range(1,numtables+1).forEach(itable => {
                _.range(1,numrounds+1).forEach(iround => {
                    // console.log(`T${itable}, R${iround}`, ui8ary[idx], ui8ary[idx+1], ui8ary[idx+2]);
                    const nsPair = ui8ary[idx+0];
                    const ewPair = ui8ary[idx+1];
                    const boardset = ui8ary[idx+2];
                    _.range(1, boardsPerRound+1).forEach(idxbd => {
                        const bdnum = (boardset-1)*boardsPerRound + idxbd;
                        const bp = new BoardPlay(nsPair, ewPair, iround);
                        this.boardObjs.get(bdnum)?.boardPlays.set(nsPair, bp);
                    });
                    
                    idx+=3;
                });
            });
            
            // now set a variable so the html knows it is safe to invoke
            this.gameDataSetup = true;
            console.log(`gameData is now setup`);
        });
    }

}


