import { TestBed } from '@angular/core/testing';

import { LegalScore } from './legal-score.service';

describe('LegalScore', () => {
    let service: LegalScore;
    
    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LegalScore);
        service.debug = false;
    });
    
    it('should be created', () => {
        expect(service).toBeTruthy();
    });


    // array of checkResults tests
    const NV:boolean = false;
    const V: boolean = true;
    function vulstr(ns: boolean, ew: boolean): string {
        return(ns && ew ? 'BOTH' : ns && !ew ? 'NS' : !ns && ew ? 'EW' : 'NONE')
    }

    // seed testAry with some specific unusual cases, then other common ones are added below
    const testAry: Array<Array<any>> = [
        [110,   NV, NV,   true],
        [1200,  NV, NV,   true],  // 5minor xx making 7, 5major xx making 6, 3Nxx making 5
        [1300,  NV, NV,   false],
        [1300,  NV,  V,   true],  // ew could get -13 vulnerable
        [-1300,  V,  V,   true],  // ns could get -13 vulnerable
        [-1300,  NV, V,   false], 
        [ 350,   V,  V,   false],
        [ 0,     V,  V,   true],
        [ 0,    NV,  NV,   true],
    ];

    const nonVulOnlyScores: Array<number> = [420, 430, 460, -50];
    const vulOnlyScores: Array<number> = [620];  // note: 630 can be gotten when NV, eg: 3Hx making 4
    // similar problems with 660
    // and of course -100 easily possible when NV
    

    nonVulOnlyScores.forEach( (score:number) => {
        testAry.push([score, NV, NV, true]);
        testAry.push([score, NV, V, true]);
        testAry.push([score, V, NV, false]);
        testAry.push([score, V, V, false]);
        // add negative score from the EW side
        testAry.push([-1*score, NV, NV, true]);
        testAry.push([-1*score, V, NV, true]);
        testAry.push([-1*score, V, V, false]);
        testAry.push([-1*score, NV, V, false]);
    });
    
    vulOnlyScores.forEach( (score:number) => {
        testAry.push([score, V, NV, true]);
        testAry.push([score, V, V, true]);
        testAry.push([score, NV, NV, false]);
        testAry.push([score, NV, V, false]);
        // add negative score from the EW side
        testAry.push([-1*score, NV, V, true]);
        testAry.push([-1*score, V, V, true]);
        testAry.push([-1*score, V, NV, false]);
        testAry.push([-1*score, NV, NV, false]);
    });
    
    testAry.forEach( ([score, nsVul, ewVul, exp]) => {
        it(`Check for ${score} for Vul:${vulstr(nsVul, ewVul)} should be ${exp}`, () => {
            const result = service.checkResult(  score, nsVul, ewVul, exp);
            expect(result).toBe(exp);
            if (result !== exp && service.debug) {
                console.log(service.legalScoresNotVul.size);
                console.log(service.legalScoresVul.size);
                console.table(Array.from(service.legalScoresNotVul.values()).sort((a:number, b:number) => a-b));
                console.table(Array.from(service.legalScoresVul.values()).sort((a:number, b:number) => a-b));
            }
        });
    });
    
});
