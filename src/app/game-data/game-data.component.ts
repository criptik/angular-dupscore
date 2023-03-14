import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

export class ScoreObj {
    score:number;
    kindNS:string;
    kindEW:string;
    constructor(score: number, kindNS: string = '', kindEW: string=kindNS) {
        this.score = score;
        this.kindNS = kindNS;
        this.kindEW = kindEW;
    }
}

class BoardPlay {
    ns: number;
    ew: number;
    round: number;

    constructor(ns: number, ew: number, round: number) {
        this.ns = ns;
        this.ew = ew;
        this.round = round;
    }
    
}

class BoardObj {
    bdnum: number;
    playInfo: BoardPlay[] = [];

    constructor(bdnum: number) {
        this.bdnum = bdnum;
    }
    
}

@Component({
    selector: 'app-game-data',
    templateUrl: './game-data.component.html',
    styleUrls: ['./game-data.component.css']
})
export class GameDataComponent {
    // for current testing, just set some data here
    // later these will be derived from the game setup info and the .MOV file
    
    numPairs: number = 8;
    boardNum: number = 4;
    boardVul: string = 'BOTH';
    scoreObjs : Map<number, ScoreObj> = new Map();
    nsewMap: Map<number, number> = new Map();
    boardObjs: Map<number, BoardObj> = new Map();
    abuf: ArrayBuffer = new ArrayBuffer(0);
    
    constructor(private http: HttpClient) {
        // temporary for testing
        this.scoreObjs.set(3, new ScoreObj(1100));
        this.scoreObjs.set(6, new ScoreObj(-1100));
        this.scoreObjs.set(8, new ScoreObj(0));
        // this nsewMap stuff in particular will be set up by reading .MOV file
        this.nsewMap.set(5, 2);
        this.nsewMap.set(3, 4);
        this.nsewMap.set(6, 1);
        this.nsewMap.set(8, 7);
        // test file access
    }

    
    ngOnInit() {
        this.http.get('assets/HCOLONEL.MOV', { responseType: 'blob' })
        .subscribe(async res => {
            const reader = new FileReader();
            reader.readAsDataURL(res);
            this.abuf = await res.arrayBuffer();

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
            // console.log(this.boardObjs.get(1).playInfo);
            
            console.log(`tables = ${numtables}, rounds=${numrounds}, datsiz=${datsiz}`);
            _.range(1,numtables+1).forEach(itable => {
                _.range(1,numrounds+1).forEach(iround => {
                    // console.log(`T${itable}, R${iround}`, ui8ary[idx], ui8ary[idx+1], ui8ary[idx+2]);
                    const ns = ui8ary[idx+0];
                    const ew = ui8ary[idx+1];
                    const boardset = ui8ary[idx+2];
                    _.range(1, boardsPerRound+1).forEach(idxbd => {
                        const bdnum = (boardset-1)*boardsPerRound + idxbd;
                        const bp = new BoardPlay(ns, ew, iround);
                        // console.log(`bp=${bp.ns}, ${bp.ew}, ${bp.round}, bdnum=${bdnum}`);
                        this.boardObjs.get(bdnum)?.playInfo.push(bp);
                        // console.log(this.boardObjs[bdnum-1].playInfo);
                    });
                    
                    idx+=3;
                });
            });
            console.log(this.boardObjs);
        });
    }
}
