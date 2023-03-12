import * as _ from "lodash";

enum Suit {CD, HS, NT};
export enum Vul {N, V};
enum Dstate {'N', 'D', 'R'};

export class LegalScore {
    legalScoresNotVul : Set<any> = new Set<any>();
    legalScoresVul : Set<any> = new Set<any>();
    scoreMapNotVul = new Map<number, any>();
    scoreMapVul = new Map<number, any>();
    debug : boolean = false;

    constructor() {
        this.buildScoreSet(this.legalScoresNotVul, Vul.N);
        this.buildScoreSet(this.legalScoresVul, Vul.V);
        if (this.debug) {
            console.log(this.legalScoresNotVul.size);
            console.log(this.legalScoresVul.size);
            console.table(Array.from(this.legalScoresNotVul.values()).sort((a:number, b:number) => a-b));
            console.table(Array.from(this.legalScoresVul.values()).sort((a:number, b:number) => a-b));
            // tests
            this.checkNSScoreLegal(110, Vul.N, Vul.N);
            this.checkNSScoreLegal(1200, Vul.N, Vul.N);
            this.checkNSScoreLegal(1300, Vul.N, Vul.N);
            this.checkNSScoreLegal(1300, Vul.N, Vul.V);
            this.checkNSScoreLegal(420, Vul.V, Vul.V);
            this.checkNSScoreLegal(350, Vul.V, Vul.V);
            this.checkNSScoreLegal(650, Vul.V, Vul.V);
        }
    }


    keyStrs(e : any) : string[] {
        return Object.keys(e).filter(k => !isFinite(Number(k)));
    }

    dupDown(downtricks: number, vul: Vul, dstate: Dstate) {
        if (dstate === Dstate.N) {
            return (-1 * downtricks * (vul === Vul.N ? 50 : 100));
        }
        else {
            var downscore;
            const downArray = (vul === Vul.N ?
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
             vul : Vul, ) {
        var firstTrickVal;
        var trickVal;
        trickVal = (suit === Suit.CD ? 20 : 30); 
        firstTrickVal = (suit === Suit.NT ? 40 : trickVal); 
        if (madetricks < contricks + 6) return this.dupDown(contricks + 6 - madetricks, vul, dstate);
        var trickScore = firstTrickVal + (contricks > 1 ? contricks - 1 : 0) * trickVal;
        trickScore *= (dstate === Dstate.D ? 2 : dstate === Dstate.R ? 4 : 1);
        const gameBonus = (vul === Vul.V ? 500 : 300);
        var score = (trickScore >= 100 ? trickScore + gameBonus : trickScore + 50);
        const overtricks = madetricks-6-contricks;
        const dblOvertrickMul = (vul === Vul.N ? 100 : 200);
        const rdblOvertrickMul = 2 * dblOvertrickMul;
        const overtrickMul = (dstate === Dstate.N ? trickVal : dstate === Dstate.D ? dblOvertrickMul : rdblOvertrickMul);
        score += overtricks * overtrickMul;
        // insult
        score += (dstate === Dstate.D ? 50 : dstate === Dstate.R ? 100 : 0);
        const smallSlamBonus = (vul === Vul.V ? 750 : 500);
        const grandSlamBonus = (vul === Vul.V ? 1500 : 1000);
        if (contricks === 6 && madetricks >= 12) score += smallSlamBonus;
        if (contricks === 7 && madetricks >= 13) score += grandSlamBonus;
        
        // console.log(suit, contricks, dstate, madetricks, vul, `score = ${score}`);
        return score;
    }

    buildScoreSet(scoreSet:Set<any>, forVul : Vul) {
        const scoreMap : Map<number, any> = (forVul === Vul.N ? this.scoreMapNotVul : this.scoreMapVul);
        
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
    
    checkNSScoreLegal(score: number, nsvul:Vul, ewvul:Vul) : boolean {
        const nsSet = (nsvul === Vul.N ? this.legalScoresNotVul : this.legalScoresVul);
        const ewSet = (ewvul === Vul.N ? this.legalScoresNotVul : this.legalScoresVul);
        const nsMap = (nsvul === Vul.N ? this.scoreMapNotVul : this.scoreMapVul);
        const ewMap = (ewvul === Vul.N ? this.scoreMapNotVul : this.scoreMapVul);
        const retval: boolean = (nsSet.has(score) || ewSet.has(-1*score));
        if (this.debug) console.log(score, nsvul, ewvul, retval, nsMap.get(score), ewMap.get(-1*score));
        // console.log(score, nsvul, ewvul, retval);
        return retval;
    }
} // end of class



