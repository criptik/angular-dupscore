import * as _ from "lodash";

enum Suit {CD, HS, NT};
enum Dstate {'N', 'D', 'R'};  // undoubled, doubled, redoubled

export class LegalScore {
    legalScoresNotVul : Set<any> = new Set<any>();
    legalScoresVul : Set<any> = new Set<any>();
    scoreMapNotVul = new Map<number, any>();
    scoreMapVul = new Map<number, any>();
    debug : boolean = false;

    constructor() {
        this.buildScoreSet(this.legalScoresNotVul, false);
        this.buildScoreSet(this.legalScoresVul, true);
        if (this.debug) {
            //console.log(this.legalScoresNotVul.size);
            //console.log(this.legalScoresVul.size);
            //console.table(Array.from(this.legalScoresNotVul.values()).sort((a:number, b:number) => a-b));
            //console.table(Array.from(this.legalScoresVul.values()).sort((a:number, b:number) => a-b));
            // tests
            console.assert(this.checkNSScoreLegal(110, false, false));
            console.assert(this.checkNSScoreLegal(1200, false, false));
            console.assert(!this.checkNSScoreLegal(1300, false, false));
            console.assert(this.checkNSScoreLegal(1300, false, true));
            console.assert(!this.checkNSScoreLegal(420, true, true));
            console.assert(this.checkNSScoreLegal(350, true, true));
            console.assert(this.checkNSScoreLegal(650, true, true));
        }
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

    dupscore(suit: Suit,
             contricks: number,
             dstate : Dstate,
             madetricks : number, 
             vul : boolean, ) {
        const trickVal = (suit === Suit.CD ? 20 : 30); 
        const firstTrickVal = (suit === Suit.NT ? 40 : trickVal); 
        if (madetricks < contricks + 6) return this.dupDown(contricks + 6 - madetricks, vul, dstate);
        let trickScore = firstTrickVal + (contricks > 1 ? contricks - 1 : 0) * trickVal;
        trickScore *= (dstate === Dstate.D ? 2 : dstate === Dstate.R ? 4 : 1);
        const gameBonus = (vul ? 500 : 300);
        let score = (trickScore >= 100 ? trickScore + gameBonus : trickScore + 50);
        const overtricks = madetricks-6-contricks;
        const dblOvertrickMul = (vul ? 200 : 100);
        const rdblOvertrickMul = 2 * dblOvertrickMul;
        const overtrickMul = (dstate === Dstate.N ? trickVal : dstate === Dstate.D ? dblOvertrickMul : rdblOvertrickMul);
        score += overtricks * overtrickMul;
        // insult
        score += (dstate === Dstate.D ? 50 : dstate === Dstate.R ? 100 : 0);
        const smallSlamBonus = (vul ? 750 : 500);
        const grandSlamBonus = (vul ? 1500 : 1000);
        if (contricks === 6 && madetricks >= 12) score += smallSlamBonus;
        if (contricks === 7 && madetricks >= 13) score += grandSlamBonus;
        
        // console.log(suit, contricks, dstate, madetricks, vul, `score = ${score}`);
        return score;
    }

    buildScoreSet(scoreSet:Set<any>, forVul : boolean) {
        const scoreMap : Map<number, any> = (forVul ? this.scoreMapVul : this.scoreMapNotVul);
        
        // do all the positives (made contracts)
        [Suit.CD, Suit.HS, Suit.NT].forEach (suit => {
            _.range(1,8).forEach (contricks => {
                [Dstate.N, Dstate.D, Dstate.R].forEach (ds => {
                    _.range(contricks+6,14).forEach (madetricks => {
                        const score = this.dupscore(suit, contricks, ds, madetricks, forVul);
                        scoreSet.add(score);
                        if (this.debug) scoreMap.set(score, [suit, contricks, ds, madetricks, forVul]);
                    });
                });
            });
        });
        
        // now down values (suit doesn't matter)
        [Dstate.N, Dstate.D, Dstate.R].forEach (ds => {
            _.range(0, 13).forEach (madetricks => {
                const score = this.dupscore(Suit.NT, 7, ds, madetricks, forVul);
                scoreSet.add(score);
                if (this.debug) scoreMap.set(score, [Suit.NT, 7, ds, madetricks, forVul]);
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
} // end of class



