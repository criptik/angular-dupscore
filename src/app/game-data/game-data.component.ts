import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

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
        this.nsScore = -2;  // symbol for empty
    }

    addScoreInfo(nsScore: number, kindNS: string = '', kindEW: string = kindNS) {
        this.nsScore = nsScore;
        this.kindNS = kindNS;
        this.kindEW = kindEW;
    }
    
}

export class BoardObj {
    bdnum: number;
    playInfo: Map<number, BoardPlay>  = new Map();

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
    
    numPairs: number = 6;
    boardNum: number = 5;
    boardVul: string = 'BOTH';
    boardObjs: Map<number, BoardObj> = new Map();
    abuf: ArrayBuffer = new ArrayBuffer(0);
    gameDataSetup: boolean = false;
    
    constructor(private http: HttpClient) {
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
                    const nsPair = ui8ary[idx+0];
                    const ewPair = ui8ary[idx+1];
                    const boardset = ui8ary[idx+2];
                    _.range(1, boardsPerRound+1).forEach(idxbd => {
                        const bdnum = (boardset-1)*boardsPerRound + idxbd;
                        const bp = new BoardPlay(nsPair, ewPair, iround);
                        this.boardObjs.get(bdnum)?.playInfo.set(nsPair, bp);
                    });
                    
                    idx+=3;
                });
            });

            // temporary for testing
            const testBoardPlay  = this.boardObjs.get(this.boardNum)?.playInfo;
            
            testBoardPlay?.get(1)?.addScoreInfo(1100);   // ns pair 5 
            testBoardPlay?.get(6)?.addScoreInfo(-1100);  // ns pair 6
            // for now leave other ns pair 4 empty
            console.log(testBoardPlay);
            // now set a variable so the html knows it is safe to invoke
            this.gameDataSetup = true;
            console.log(`gameData is now setup`);
        });
    }
}
