import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SerializerService } from '../serializer/serializer.service';
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

    addSpecialScoreInfo(kindNS: string, kindEW: string = kindNS) {
        this.nsScore = SCORE_SPECIAL;
        this.kindNS = kindNS;
        this.kindEW = kindEW;
    }

    addEmptyScoreInfo() {
        this.nsScore = SCORE_EMPTY;
        this.kindNS = '';
        this.kindEW = '';
    }

    
    isScoreEmpty() {
        return(this.nsScore === SCORE_EMPTY);
    }
    
    isScoreSpecial() {
        return(this.nsScore === SCORE_SPECIAL);
    }

    isScoreNormal() {
        return(!this.isScoreEmpty() && !this.isScoreSpecial());
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
            return (!bp.isScoreEmpty());
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
            if (bp.isScoreNormal()) {
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
        // the following two init to dummy but we only look at it if there is one "normal" score
        let singleBoardNS: number = 0;
        let singleBoardEW: number = 0;
        
        Array.from(this.boardPlays.values()).forEach( (bp: BoardPlay) => {
            expectedPlays++;
            // normal results to be matchpointed
            if (bp.isScoreNormal()) {
                scores.push(bp.nsScore);
                actualPlays++;
                singleBoardNS = bp.nsPair;
                singleBoardEW = bp.ewPair;
            }
            // other kinds of scores like A+, A-, etc. can be computed right now
            else if (bp.isScoreSpecial()) {
                const mpNS = this.getSpecialMP(bp.kindNS, boardTop);
                const mpEW = this.getSpecialMP(bp.kindEW, boardTop);
                if (mpNS !== -1) specialMap.set(bp.nsPair, mpNS);
                if (mpEW !== -1) specialMap.set(bp.ewPair, mpEW);
                // console.log('special: ', bp.kindNS, bp.kindEW, mpNS, mpEW, this.pairToMpMap); 
            }
        });
        // shortcircuit if not enough scores to matter
        this.pairToMpMap = new Map();
        if (actualPlays === 0) {
            // nothing to do here
        }
        else if (actualPlays === 1) {
            // having only 1 non-special score the single score is treated
            // a bit like a special score with both NS and EW getting 60% of top
            // note that latestBoardPlay contains the single "actual" play
            specialMap.set(singleBoardNS, 0.6 * boardTop);
            specialMap.set(singleBoardEW, 0.6 * boardTop);
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
        // merge in special scores if any (after Neuberg stuff)
        console.log(`specialMap, board ${this.bdnum}`, specialMap);
        Array.from(specialMap.entries()).forEach( ([pairId, mps]) => {
            this.pairToMpMap.set(pairId, mps);
        });
    }
}

export class Person {
    last: string;
    first: string;
    constructor (first: string, last: string) {
        this.first = first;
        this.last = last;
    }

    matches(otherPerson: Person) {
        // console.log(`matching ${this.toString()} vs. ${otherPerson.toString()}`);
        return (this.first === otherPerson.first && this.last === otherPerson.last);
    }

    toString() {
        return `${this.first} ${this.last}`;
    }
    
}

export class Pair {
    A: Person;
    B: Person;
    constructor (A: Person, B: Person) {
        this.A = A;
        this.B = B;
    }

    fullString(): string {
        return `${this.A.toString()} - ${this.B.toString()}`;
    }
    
    shortString(): string {
        return `${this.A.last}-${this.B.last}`;
    }
}

@Injectable({
    providedIn: 'root',
})
export class GameDataService {

    // for current testing, just set some data here
    // later these will be derived from the game setup info and the .MOV file

    gameFileName: string = '';
    movFileName: string = '';
    // user will eventually specify the boards per round
    boardsPerRound: number = 0;
    // other stuff is derived from the .MOV file
    numPairs: number = 0;
    numNSPairs: number = 0;
    numTables: number = 0;
    numRounds: number = 0;
    numBoards: number = 0;
    
    boardTop: number = 0; 
    boardObjs: Map<number, BoardObj> = new Map();
    pairIdsNS: number[] = [];
    pairIdsEW: number[] = [];
    pairIds: number[] = [];
    gameDataSetup: boolean = false;
    earlyGameDataSetup: boolean = false;
    pairNameMap: Map<number, Pair> = new Map();
    isHowell: boolean = true;
    phantomPair: number = 0;
    
    constructor(
        private http: HttpClient,
        private _serializer: SerializerService,
    ) {
        // console.log('in game-data.service constructor');
        // const str: string = this.doSerialize();
        // console.log('serialized:', str);
        // const newobj: GameDataService = this._serializer.deserialize(str, [
        //     'Pair',
        //     'Person',
        //     'BoardObj',
        //     'BoardPlay',
        //     'GameDataService',
        // ]);
        // console.log('new deserialized:', newobj);
    }

    parseAbufEarly(abuf: ArrayBuffer) {
        // stuff from the beginning of the .mov file
        const ui8ary : Uint8Array = new Uint8Array(abuf);
        this.isHowell = (ui8ary[2] === 1);
        this.numTables = ui8ary[3];
        this.numPairs = 2 * this.numTables;
        this.numNSPairs = (this.isHowell ? this.numPairs : this.numPairs/2);
        // for now, build up pairIds array
        this.pairIdsNS = _.range(1, this.numNSPairs+1);
        this.pairIdsEW = (this.isHowell ? [] : this.pairIdsNS.map( id => -1*id));
        this.pairIds = this.pairIdsNS.concat(this.pairIdsEW);
        console.log('end of early');
        this.earlyGameDataSetup = true;
    }
    
    parseAbuf(abuf: ArrayBuffer, totBoards: number) {
        // now set up ui8ary, datstart
        console.log(`abuf=${abuf}, len=${abuf.byteLength}`);
        // stuff from the beginning of the .mov file
        const ui8ary : Uint8Array = new Uint8Array(abuf);
        const asStr:string = new TextDecoder('utf-8').decode(ui8ary);
        this.parseAbufEarly(ui8ary);
        this.boardTop = this.numPairs/2 - 1;
        if (this.phantomPair !== 0) this.boardTop--;
        
        // find the round info
        const pattern = '\x21\x22\x23\x24';
        const datstart = asStr.lastIndexOf(pattern) + pattern.length;
        const datsiz = abuf.byteLength - datstart;
        console.log(`rounds|boardsets=${ui8ary[4]}`);
        console.log(`datstart=${datstart}`);
        let idx = datstart;
        this.numRounds = (datsiz / this.numTables) / 3;
        this.numBoards = totBoards;
        this.boardsPerRound = this.numBoards / this.numRounds;
        
        // create the BoardInfo objects
        _.range(1, this.numBoards+1).forEach(bdnum => {
            const bdobj = new BoardObj(bdnum);
            this.boardObjs.set(bdnum, bdobj);
        });
        
        // inspect the triplets to get the boardPlays for each boardObj
        console.log(`tables = ${this.numTables}, rounds=${this.numRounds}, numBoards=${this.numBoards}, datsiz=${datsiz}`);
        _.range(1,this.numTables+1).forEach(itable => {
            _.range(1,this.numRounds+1).forEach(iround => {
                // console.log(`T${itable}, R${iround}`, ui8ary[idx], ui8ary[idx+1], ui8ary[idx+2]);
                const nsPair = ui8ary[idx+0];
                // EW pair marked as negative if it is Mitchell
                const ewPair = ui8ary[idx+1] * (this.isHowell ? 1 : -1);
                const boardset = ui8ary[idx+2];
                // ignore triplet if phantomPair is in this one
                if (nsPair !== this.phantomPair && ewPair !== this.phantomPair) {
                    _.range(1, this.boardsPerRound+1).forEach(idxbd => {
                        const bdnum = (boardset-1)*this.boardsPerRound + idxbd;
                        const bp = new BoardPlay(nsPair, ewPair, iround);
                        this.boardObjs.get(bdnum)?.boardPlays.set(nsPair, bp);
                    });
                }                
                idx+=3;
            });
        });
    }

    // not used but kept here for reference
    // Initialize2() {
    //     this.http.get(`assets/${this.movFileName}`, { responseType: 'blob', observe: 'response' }).subscribe(async res => {
    //         // console.log('in subscribe, res=', res, typeof res);
    //         const reader = new FileReader();
    //         reader.onloadend = (x) => {
    //             const abuf: ArrayBuffer = reader.result as ArrayBuffer;
    //             console.log('onloadend', abuf, abuf.byteLength);
    //         }
    //         // console.log('before read');
    //         reader.readAsArrayBuffer(res.body as Blob);
    //     });
    // }

    async Initialize(gameName: string, movement: string, totBoards: number, phantomPair: number) {
        console.log('in Initialize');
        this.gameFileName = gameName;
        this.movFileName = `${movement}.MOV`;
        this.phantomPair = phantomPair;
        
        this.http.get(`assets/${this.movFileName}`, { responseType: 'blob', observe: 'response' }).subscribe(async res => {
            const abuf: ArrayBuffer = await res.body?.arrayBuffer() as ArrayBuffer;
            this.parseAbuf(abuf, totBoards);
            
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

    async parseEarly(movement: string) {
        this.movFileName = `${movement}.MOV`;
        this.earlyGameDataSetup = false;
        this.http.get(`assets/${this.movFileName}`, { responseType: 'blob', observe: 'response' }).subscribe(async res => {
                const abuf: ArrayBuffer = await res.body?.arrayBuffer() as ArrayBuffer;
            this.parseAbufEarly(abuf);
        });
        // wait for gameDataSetup
        while (!this.earlyGameDataSetup) {
            console.log(`wait a bit`);
            await new Promise(resolve => setTimeout(resolve, 300));
        };
    }
    
    // testing, try to serialize and deserialize
    testSerAndDeser() {
        const jsonStr = this.doSerialize();
        // console.log('jsonStr', jsonStr);
        this.doDeserialize(jsonStr);
        console.log('deserialized', this);
    }
    
    doSerialize(): string {
        return this._serializer.serialize(this, ['SerializerService', 'InjectionToken', 'R3Injector']);
    }
    doDeserialize(JSONStr: string) {
        const newobj: Object = this._serializer.deserialize(JSONStr, [
            'Pair',
            'Person',
            'BoardObj',
            'BoardPlay',
            'GameDataService',
        ]);
        // console.log('new deserialized:', newobj);
        // newobj.http = this.http;
        // newobj._serializer = this._serializer;
        Object.assign(this, newobj);
    }

    saveToLocalStorage() {
        window.localStorage.setItem(`game-${this.gameFileName}`, this.doSerialize());
    }

    getFromLocalStorage(gameFileName: string) {
        const jsonStr: string = window.localStorage.getItem(`game-${gameFileName}`) ?? '';
        // console.log(jsonStr);
        console.log('jsonStr.length=', jsonStr.length);
        this.doDeserialize(jsonStr);
    }

    pairnumToString(pairnum: number): string {
        if (pairnum === 0) return 'None';
        if (this.isHowell) return `${pairnum}`;
        if (pairnum > 0) return `NS ${pairnum}`;
        else return `EW ${-1*pairnum}`;
    }

    scoreStr(boardPlay: BoardPlay, forNS: boolean): string {
        let str = ' ';
        if (boardPlay.isScoreEmpty()) str = ' ? ';
        else if (!boardPlay.isScoreSpecial()) {
            // normal ScoreObj with a score
            const score = boardPlay.nsScore;
            if (score === 0 && forNS) str = 'PASS';
            else if (score > 0 && forNS) str = `${score}`;
            else if (score < 0 && !forNS) str = `${-1*score}`;
        }
        else {
            // a "special" boardPlays, with strings in the kindNS and kindEW
            str = (forNS ? boardPlay?.kindNS : boardPlay?.kindEW);
        }
        return str.padStart(4, ' ');
    }

}


