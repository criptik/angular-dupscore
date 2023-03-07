import * as _ from "lodash";

enum Suit {CD, HS, NT};
enum Vul {N, V};
enum Dstate {'N', 'D', 'R'};


if (false) {
    console.log(Vul);
    console.log(Dstate);
    console.log(typeof Dstate);
    console.log(typeof Dstate.R);

    console.log(Object.values(Dstate));
    console.log(Object.keys(Dstate));
    var x: Vul = Vul.N;
    console.log(x);
    x = Vul['V'];
    console.log(x);
    console.log(x === Vul.N);
    console.log(x === Vul.V);
    console.log(keyStrs(Dstate));
    keyStrs(Dstate).forEach (k => {
        console.log(`${k} => ${Dstate[k]}`);
        if (Dstate[k] === Dstate.D) console.log(k);
    });
}


function keyStrs (e) : string[] {
    return Object.keys(e).filter(k => !isFinite(Number(k)));
}

function dupDown(downtricks: number, vul: Vul, dstate: Dstate) {
    if (dstate === Dstate.N) {
        return (-1 * downtricks * (vul === Vul.N ? 50 : 100));
    }
    else {
        var downscore;
        const downArray = (vul === Vul.N ?
                           [100, 300, 500, 800, 1100, 1400, 1700, 2000, 2300, 2600, 2900, 3200, 3500]
                         : [200, 500, 800, 1100, 1400, 1700, 2000, 2300, 2600, 2900, 3200, 3500, 3800]); 
        downscore = -1 * downArray[downtricks];
        if (dstate === Dstate.R) downscore *= 2;
        return downscore;
    }
}

function dupscore(suit: Suit,
                  contricks: number,
                  dstate : Dstate,
                  madetricks : number, 
                  vul : Vul, ) {
    var firstTrickVal;
    var trickVal;
    trickVal = (suit === Suit.CD ? 20 : 30); 
    firstTrickVal = (suit === Suit.NT ? 40 : trickVal); 
    if (madetricks < contricks + 6) return dupDown(contricks + 6 - madetricks, vul, dstate);
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

function buildScoreSet(scoreSet:Set<any>, forVul : Vul) {
    // do all the positives (made contracts)
    keyStrs(Suit).forEach (ksuit => {
        // console.log(ksuit);
        _.range(1,8).forEach (contricks => {
            keyStrs(Dstate).forEach (kds => {
                _.range(contricks+6,14).forEach (madetricks => {
                    const score = dupscore(Suit[ksuit], contricks, Dstate[kds], madetricks, forVul);
                    // scoreSet.add(score);
                    scoreSet.add([score,Suit[ksuit],contricks,Dstate[kds], madetricks]);
                });
            });
        });
    });
    
    // now down values (suit doesn't matter)
    keyStrs(Dstate).forEach (kds => {
        _.range(0, 14).forEach (madetricks => {
            const score = dupscore(Suit.NT, 7, Dstate[kds], madetricks, forVul);
            scoreSet.add([score,Suit.NT, 7, Dstate[kds], madetricks, forVul]);
        });
    });
}

var legalScoresNotVul = new Set<any>();
buildScoreSet(legalScoresNotVul, Vul.N);

var legalScoresVul = new Set<any>();
buildScoreSet(legalScoresVul, Vul.V);

console.log(legalScoresNotVul.size);
console.log(legalScoresVul.size);
console.table(Array.from(legalScoresNotVul.values()).sort((a:number, b:number) => a-b));
console.table(Array.from(legalScoresVul.values()).sort((a:number, b:number) => a-b));




