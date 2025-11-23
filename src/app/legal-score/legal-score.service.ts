import { Injectable } from '@angular/core';
import { GameDataService, BoardObj } from '../game-data/game-data.service';
import * as _ from "lodash";

export enum Suit {CD, HS, NT};
export enum Dstate {'N', 'D', 'R'};  // undoubled, doubled, redoubled
export interface ContractNoteOutput {
    level: string,
    conlevel: number;
    suit:  string,
    dblstr: string,
    decl: string,
    resStr: string,
    tricks: number,
};
        
@Injectable({
    providedIn: 'root'
})

export class LegalScore {
    legalScoresNotVul : Set<any> = new Set<any>();
    legalScoresVul : Set<any> = new Set<any>();
    scoreMapNotVul = new Map<number, any>();
    scoreMapVul = new Map<number, any>();
    debug : boolean = false;

    constructor(public gameDataPtr: GameDataService) {
        this.buildScoreSet(this.legalScoresNotVul, false);
        this.buildScoreSet(this.legalScoresVul, true);
        // console.log('this.legalScoresNotVul', Array.from(this.legalScoresNotVul));
    }


    keyStrs(e : any) : string[] {
        return Object.keys(e).filter(k => !isFinite(Number(k)));
    }

    dupDown(downtricks: number, vul: boolean, dstate: Dstate) {
        if (dstate === Dstate.N) {
            return (-1 * downtricks * (!vul ? 50 : 100));
        }
        else {
            let downscore;
            const downArray = (!vul ?
                               [0, 100, 300, 500, 800, 1100, 1400, 1700, 2000, 2300, 2600, 2900, 3200, 3500]
                             : [0, 200, 500, 800, 1100, 1400, 1700, 2000, 2300, 2600, 2900, 3200, 3500, 3800]); 
            downscore = -1 * downArray[downtricks];
            if (dstate === Dstate.R) downscore *= 2;
            return downscore;
        }
    }

    suitStrToSuit(str: string): Suit {
        if ('CD'.includes(str)) return Suit.CD;
        if ('HS'.includes(str)) return Suit.HS;
        return Suit.NT;
    }

    dblStrToDstate(str: string): Dstate {
        if (str === '*') return Dstate.D;
        if (str === '**') return Dstate.R;
        return Dstate.N;
    }
    
    
    dupscore(suit: Suit,
             conlevel: number,
             dstate : Dstate,
             madetricks : number, 
             vul : boolean, ) {
        const trickVal = (suit === Suit.CD ? 20 : 30); 
        const firstTrickVal = (suit === Suit.NT ? 40 : trickVal); 
        if (madetricks < conlevel + 6) return this.dupDown(conlevel + 6 - madetricks, vul, dstate);
        let trickScore = firstTrickVal + (conlevel > 1 ? conlevel - 1 : 0) * trickVal;
        trickScore *= (dstate === Dstate.D ? 2 : dstate === Dstate.R ? 4 : 1);
        const gameBonus = (vul ? 500 : 300);
        let score = (trickScore >= 100 ? trickScore + gameBonus : trickScore + 50);
        const overtricks = madetricks-6-conlevel;
        const dblOvertrickMul = (vul ? 200 : 100);
        const rdblOvertrickMul = 2 * dblOvertrickMul;
        const overtrickMul = (dstate === Dstate.N ? trickVal : dstate === Dstate.D ? dblOvertrickMul : rdblOvertrickMul);
        score += overtricks * overtrickMul;
        // insult
        score += (dstate === Dstate.D ? 50 : dstate === Dstate.R ? 100 : 0);
        const smallSlamBonus = (vul ? 750 : 500);
        const grandSlamBonus = (vul ? 1500 : 1000);
        if (conlevel === 6 && madetricks >= 12) score += smallSlamBonus;
        if (conlevel === 7 && madetricks >= 13) score += grandSlamBonus;
        
        // console.log(suit, conlevel, dstate, madetricks, vul, `score = ${score}`);
        return score;
    }

    buildScoreSet(scoreSet:Set<any>, forVul : boolean) {
        const scoreMap : Map<number, any> = (forVul ? this.scoreMapVul : this.scoreMapNotVul);

        // 0 (Pass-out) is always possible
        scoreSet.add(0);
        
        // do all the positives (made contracts)
        [Suit.CD, Suit.HS, Suit.NT].forEach (suit => {
            _.range(1,8).forEach (conlevel => {
                [Dstate.N, Dstate.D, Dstate.R].forEach (dstate => {
                    _.range(conlevel+6,14).forEach (madetricks => {
                        const score = this.dupscore(suit, conlevel, dstate, madetricks, forVul);
                        scoreSet.add(score);
                        if (this.debug) scoreMap.set(score, [suit, conlevel, dstate, madetricks, forVul]);
                    });
                });
            });
        });
        
        // now down values (suit doesn't matter)
        [Dstate.N, Dstate.D, Dstate.R].forEach (dstate => {
            _.range(0, 13).forEach (madetricks => {
                const score = this.dupscore(Suit.NT, 7, dstate, madetricks, forVul);
                scoreSet.add(score);
                if (this.debug) scoreMap.set(score, [Suit.NT, 7, dstate, madetricks, forVul]);
            });
        });
    }
    
    checkNSScoreLegal(score: number, nsvul:boolean, ewvul:boolean) : boolean {
        const nsSet = (!nsvul ? this.legalScoresNotVul : this.legalScoresVul);
        const ewSet = (!ewvul ? this.legalScoresNotVul : this.legalScoresVul);
        const nsMap = (!nsvul ? this.scoreMapNotVul : this.scoreMapVul);
        const ewMap = (!ewvul ? this.scoreMapNotVul : this.scoreMapVul);
        const retval: boolean = (nsSet.has(score) || ewSet.has(-1*score));
        if (this.debug) console.log(score, nsvul, ewvul, retval, nsMap.get(score), ewMap.get(-1*score));
        // console.log(score, nsvul, ewvul, retval);
        return retval;
    }
    
    parseContractNoteStr(conResultStr: string) : Partial<ContractNoteOutput> | undefined {
        conResultStr = conResultStr.toUpperCase();
        let cleanGroups: Partial<ContractNoteOutput> = {}
        if (conResultStr === 'PO' || conResultStr === 'PASS') {
            cleanGroups.conlevel = 0;
            return cleanGroups;
        }
        
        const regex:RegExp = /(?<level>[1-7])(?<suit>S|H|D|C|N|NT)(?<dblstr>\*{0,2})(?<decl>N|S|E|W)(?<resStr>=|\+[1-6]|\-\d+|[1-7])/;
        const matchOutput:RegExpMatchArray|null = regex.exec(conResultStr);
        if (matchOutput && matchOutput.groups) {
            const cleanGroups: Partial<ContractNoteOutput> = matchOutput!.groups;
            // see if the regex parsed but values are not legal
            // level will always be legal (1-7)
            cleanGroups.conlevel = parseInt(cleanGroups!.level!);
            // suit will always be legal, but map 'N' to 'NT'
            if (cleanGroups.suit == 'N') cleanGroups.suit = 'NT';
            // dblstr and decl will always be legal
            // resStr legality depends on the contract
            const resStr: string = cleanGroups!.resStr!;
            if (resStr.startsWith('+') || resStr.startsWith('-')) {
                let tricks = cleanGroups.conlevel + 6 + parseInt(resStr);
                if (tricks > 13) return undefined;
                if (tricks < 0) return undefined;
                cleanGroups.tricks = tricks;
            }
            else if (resStr === '=') {
                cleanGroups.tricks = cleanGroups.conlevel + 6;
            }
            else {
                //resStr is just a number from 1-7, which indicates the level made
                const madeLevel = parseInt(resStr);
                if (madeLevel < cleanGroups.conlevel) return undefined;
                cleanGroups.tricks = madeLevel + 6;
            }
            // console.log(cleanGroups);
            return cleanGroups;
        }
        else { 
            return undefined;
        }
    }

    contractNoteStrToDupscoreNSGivenVul(contractNoteStr:string, isDeclVul:boolean) : number | undefined {
        const contractNoteOutput:Partial<ContractNoteOutput>|undefined = this.parseContractNoteStr(contractNoteStr); 
        let score:number|undefined = undefined;
        if (contractNoteOutput === undefined) {
            return(undefined);
        }
        // special case for pass-out
        else if (contractNoteOutput!.conlevel === 0) {
            score = 0;
            return score;
        }
        else {
            // compute score
            const madeTricks: number = contractNoteOutput!.tricks!;
            const conlevel: number =  contractNoteOutput!.conlevel!;
            const consuit: Suit = this.suitStrToSuit(contractNoteOutput!.suit!);
            const condstate: Dstate = this.dblStrToDstate(contractNoteOutput!.dblstr!);
            score = this.dupscore(
                consuit,
                conlevel,
                condstate,
                madeTricks,
                isDeclVul 
            );
            if ('EW'.includes(contractNoteOutput!.decl!)) {
                score = score * -1;
            }
            
            if (false) {
                console.log('params:',
                            consuit,
                            conlevel,
                            condstate,
                            madeTricks,
                            isDeclVul 
                );
            }
        }
        return score;
    }
    
    contractNoteStrToDupscoreNS(contractNoteStr:string, bdnum:number) : number | undefined {
        const contractNoteOutput:Partial<ContractNoteOutput>|undefined = this.parseContractNoteStr(contractNoteStr); 
        let score:number|undefined = undefined;
        if (contractNoteOutput === undefined) {
            return(undefined);
        }
        else {
            // compute vul from bdnum
            const bdobj = this.gameDataPtr.boardObjs.get(bdnum) as BoardObj;
            // console.log(`bdobj for bdnum=${bdnum}`, bdobj);
            const vulNS = bdobj.vulNS;
            const vulEW = bdobj.vulEW;
            const isDeclVul:boolean = ('NS'.includes(contractNoteOutput!.decl!) ? vulNS : vulEW);
            // compute score
            score = this.contractNoteStrToDupscoreNSGivenVul(contractNoteStr, isDeclVul);
        }
        return score;
    }
    
    genSuitChar(suitStr:string) : string {
        if (suitStr === 'S') return '\u2660';
        if (suitStr === 'H') return '\u2665';
        if (suitStr === 'D') return '\u2666';
        if (suitStr === 'C') return '\u2663';
        return suitStr;
    }
    
    contractNoteStandardize(contractNoteStr:string) : string | undefined {
        const contractNoteOutput:Partial<ContractNoteOutput>|undefined = this.parseContractNoteStr(contractNoteStr); 
        if (contractNoteOutput === undefined) {
            return(undefined);
        }
        // special case for pass-out
        else if (contractNoteOutput!.conlevel === 0) {
            return 'PASSED';
        }
        else {
            // slight difference for made vs. down
            const madeTricks: number = contractNoteOutput!.tricks!;
            const conlevel: number =  contractNoteOutput!.conlevel!;
            const decl: string = contractNoteOutput!.decl!;
            const suitChar: string = this.genSuitChar(contractNoteOutput!.suit!);
            const dblstr = contractNoteOutput!.dblstr!;
            console.log(`standardize: "${conlevel}", "${suitChar}",  "${dblstr}", "${decl}"`);
            const conPart: string = `${conlevel}${suitChar}${dblstr} ${decl}`;
            let resultPart: string = '';
            if (madeTricks < conlevel + 6) {
                resultPart = ` ${madeTricks - (conlevel + 6)}`;
            }
            else {
                resultPart = ` ${madeTricks - 6}`;
            }
            const standardNote:string = `${conPart}${resultPart}`;
            return standardNote;
        }
    }
    

} // end of class



