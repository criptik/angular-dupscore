import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

const debug: boolean = false;
function dbglog(str: string) {
    if (debug) console.log(str);
}


function serialize(classInstance: GameDataService): string {
    return JSON.stringify(classInstance, (key, value) => {
        if (key === 'http') return undefined;
        if (value && typeof(value) === "object") {
            value.__type = value.constructor.name;
            if (value.__type === 'Map') {
                const valarray = Array.from(value.entries());
                value.__entries = valarray;
                dbglog(`__entries: ${valarray}`);
            }
            else if (['InjectionToken',
                      'R3Injector',
            ].includes(value.__type)) {
                dbglog(`skipping ${value.__type}`);
                return undefined;
            }

            dbglog(`serialize: key=${key}, value=${value}, type=${typeof(value)}`);
            dbglog(`consname=${value.constructor.name}`);
        }
        return value;
    }, ' ');
}

function deserialize (jsonString: string) {
    const classes: string[] = [
        'BoardObj',
        'BoardPlay',
        'GameDataService',
    ];
    return JSON.parse(jsonString, (key, value) => {
        if (value && typeof (value) === "object" && value.__type) {
            const vtype: string = value?.__type;
            if (vtype === 'Map') {
                value = new Map(value.__entries);
                delete value.__entries;
            } else if (classes.includes(vtype)) {
                const newobj = eval(`new ${vtype}()`);
                value = Object.assign(newobj, value);
            }
            delete value.__type;
        }
        return value;
    });
}


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
    vulNS: boolean;
    vulEW: boolean;
    dealer: string; 
    boardPlays: Map<number, BoardPlay>  = new Map();
    allPlaysEntered: boolean = false;
    pairToMpMap: NNMap = new Map();  // maps a pair to a mp amt

    
    constructor(bdnum: number) {
        const vulNSVals = [0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0];
        const vulEWVals = [0,0,1,1, 0,1,1,0, 1,1,0,0, 1,0,0,1];
        this.bdnum = bdnum;
        this.vulNS = vulNSVals[(bdnum-1) % 16] === 1;
        this.vulEW = vulEWVals[(bdnum-1) % 16] === 1;
        // for now, we don't really need to show the dealer
        // but we'll compute it anyway
        this.dealer = 'NESW'.charAt((this.bdnum) % 4);
    }

    updateAllPlaysEntered() {
        this.allPlaysEntered = Array.from(this.boardPlays.values()).every( (bp: BoardPlay) => {
            return (bp.nsScore !== SCORE_EMPTY);
        });
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
                return mp + (key < testval ? countForKey : (key === testval ? (countForKey - 1)*0.5 : 0));
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

    buildPairToMpMap(mpMap: NNMap, boardTop: number) {
        Array.from(this.boardPlays.values()).forEach( (bp: BoardPlay) => {
            const nsPair = bp.nsPair;
            const ewPair = bp.ewPair;
            const nsScore = bp.nsScore;
            if (nsScore !== SCORE_EMPTY && bp.kindNS === '') {
                const nsMps = mpMap.get(nsScore) as number;
                const ewMps = boardTop - nsMps;
                this.pairToMpMap.set(nsPair, nsMps);
                this.pairToMpMap.set(ewPair, ewMps);
            }
        });
        console.log(this.pairToMpMap);
    }

    getSpecialMP(kind: string, boardTop: number): number {
        if (kind === 'AVE') return boardTop * 0.5;
        if (kind === 'AVE+') return boardTop * 0.6;
        if (kind === 'AVE-') return boardTop * 0.4;
        // unknown, return -1;
        return -1;
    }
    
    computeMP(boardTop: number) {
        // gather the nsScores from the BoardPlays that have numeric results
        const scores: number[] = [];
        let actualPlays: number = 0;
        let expectedPlays: number = 0;
        let specialMap: NNMap = new Map();
        
        Array.from(this.boardPlays.values()).forEach( (bp: BoardPlay) => {
            expectedPlays++;
            // normal results to be matchpointed
            if (bp.nsScore !== SCORE_EMPTY && bp.kindNS === '') {
                scores.push(bp.nsScore);
                actualPlays++;
            }
            // other kinds of scores like A+, A-, etc. can be computed right now
            else if (bp.nsScore === SCORE_SPECIAL) {
                const mpNS = this.getSpecialMP(bp.kindNS, boardTop);
                const mpEW = this.getSpecialMP(bp.kindEW, boardTop);
                if (mpNS !== -1) specialMap.set(bp.nsPair, mpNS);
                if (mpEW !== -1) specialMap.set(bp.ewPair, mpEW);
                // console.log('special: ', bp.kindNS, bp.kindEW, mpNS, mpEW, this.pairToMpMap); 
            }
            
        });
            // shortcircuit if not enough scores to matter
        if (actualPlays <= 1) {
            this.pairToMpMap = new Map();
        }
        else {
            const cbmap = this.getCbMap(scores);
            // console.log(`board ${this.bdnum}, cbmap=`, cbmap);
            const mpMap = this.mpMapFromCb(cbmap);
            // console.log(`board ${this.bdnum}, mpMap=`, mpMap);
            this.buildPairToMpMap(mpMap, actualPlays-1);  // boardTop based on actualPlays
        }

        // factoring up via Neuberg for 2 or more results
        if (actualPlays < expectedPlays) {
            const A = actualPlays;
            const E = expectedPlays;
            Array.from(this.pairToMpMap.entries()).forEach( ([pairId, mps]) => {
                const newMps = (mps + 0.5) * E/A - 0.5;
                // console.log(`neuberg: mps:${mps} ${E}/${A} newmps:${newMps}`);
                this.pairToMpMap.set(pairId, newMps);
            });
            // console.log(`factored pairToMpMap ${this.pairToMpMap}`);
        }
        if (actualPlays > 1) {
            // merge in special scores (after Neuberg stuff)
            Array.from(specialMap.entries()).forEach( ([pairId, mps]) => {
                this.pairToMpMap.set(pairId, mps);
            });
        }
    }
}

@Injectable({
    providedIn: 'root',
})
export class GameDataService {

    // for current testing, just set some data here
    // later these will be derived from the game setup info and the .MOV file

    // movFileName: string = 'HCOLONEL.MOV';
    movFileName: string = 'H0407X.MOV';
    // user will eventually specify the boards per round
    boardsPerRound: number = 2;
    // other stuff is derived from the .MOV file
    numPairs: number = 0;
    numTables: number = 0;
    numRounds: number = 0;
    numBoards: number = 0;
    
    boardTop: number = 0; 
    boardObjs: Map<number, BoardObj> = new Map();
    pairIds: number[] = [];
    gameDataSetup: boolean = false;
    
    constructor(private http: HttpClient) {
        // console.log('in game-data.service constructor');
    }

    parseAbuf(abuf: ArrayBuffer) {
        // now set up ui8ary, datstart
        console.log(`abuf=${abuf}, len=${abuf.byteLength}`);
        const ui8ary : Uint8Array = new Uint8Array(abuf);
        const asStr:string = new TextDecoder('utf-8').decode(ui8ary);
        // stuff from the beginning of the .mov file
        this.numTables = ui8ary[3];
        this.numPairs = 2 * this.numTables;
        // for now, build up pairIds array;  fix for mitchell.
        this.pairIds = _.range(1, this.numPairs+1);
        this.boardTop = this.numPairs/2 - 1;

        // find the round info
        const pattern = '\x21\x22\x23\x24';
        const datstart = asStr.lastIndexOf(pattern) + pattern.length;
        const datsiz = abuf.byteLength - datstart;
        console.log(`rounds|boardsets=${ui8ary[4]}`);
        console.log(`datstart=${datstart}`);
        let idx = datstart;
        this.numRounds = (datsiz / this.numTables) / 3;
        const bprmap: NNMap = new Map([[10, 2], [7, 3], [3, 6]]);
        this.boardsPerRound = bprmap.get(this.numRounds) as number;
        this.numBoards = this.numRounds * this.boardsPerRound;
        // create the BoardInfo objects
        _.range(1, this.numBoards+1).forEach(bdnum => {
            const bdobj = new BoardObj(bdnum);
            this.boardObjs.set(bdnum, bdobj);
        });
        // console.log(this.boardObjs.get(1).boardPlays);
        // inspect the triplets to determine the maximum pair #
        
        
        console.log(`tables = ${this.numTables}, rounds=${this.numRounds}, numBoards=${this.numBoards}, datsiz=${datsiz}`);
        _.range(1,this.numTables+1).forEach(itable => {
            _.range(1,this.numRounds+1).forEach(iround => {
                // console.log(`T${itable}, R${iround}`, ui8ary[idx], ui8ary[idx+1], ui8ary[idx+2]);
                const nsPair = ui8ary[idx+0];
                const ewPair = ui8ary[idx+1];
                const boardset = ui8ary[idx+2];
                _.range(1, this.boardsPerRound+1).forEach(idxbd => {
                    const bdnum = (boardset-1)*this.boardsPerRound + idxbd;
                    const bp = new BoardPlay(nsPair, ewPair, iround);
                    this.boardObjs.get(bdnum)?.boardPlays.set(nsPair, bp);
                });
                
                idx+=3;
            });
        });
    }
    
    Initialize2() {
        this.http.get(`assets/${this.movFileName}`, { responseType: 'blob', observe: 'response' }).subscribe(async res => {
            // console.log('in subscribe, res=', res, typeof res);
            const reader = new FileReader();
            reader.onloadend = (x) => {
                const abuf: ArrayBuffer = reader.result as ArrayBuffer;
                console.log('onloadend', abuf, abuf.byteLength);
            }
            // console.log('before read');
            reader.readAsArrayBuffer(res.body as Blob);
        });
    }

    async Initialize() {
        console.log('in Initialize');
        this.http.get(`assets/${this.movFileName}`, { responseType: 'blob', observe: 'response' }).subscribe(async res => {
            // console.log('in subscribe, res=', res, typeof res);
            // const reader = new FileReader();
            // const awres: Blob = res.body as Blob;
            // reader.readAsDataURL(awres);
            // console.log('awres', awres, typeof awres);
            // console.log('awres.text', await awres.slice(0));
            const abuf: ArrayBuffer = await res.body?.arrayBuffer() as ArrayBuffer;
            // console.log(`before parseAbuf`);
            this.parseAbuf(abuf);
            
            // now set a variable so the other users know we are setup
            this.gameDataSetup = true;
            console.log(`gameData is now setup`);
        });
        // wait for gameDataSetup
        while (!this.gameDataSetup) {
            // console.log(`wait a bit`);
            await new Promise(resolve => setTimeout(resolve, 300));
        };
    }

    doSerialize(): string {
        return serialize(this);
    }
    doDeserialize(JSONStr: string) {
        const newobj: GameDataService = deserialize(JSONStr);
        // console.log('new deserialized:', newobj);
        newobj.http = this.http;
        Object.assign(this, newobj);
    }

}

