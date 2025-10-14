import { TestBed } from '@angular/core/testing';

import { LegalScore } from './legal-score.service';

describe('LegalScore', () => {
    let service: LegalScore;
    
    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LegalScore);
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
    
    const testAry: Array<Array<any>> = [
        [50,   V,  V,    false],
        [50,   NV, V,    false],
        [50,   V,  NV,   true],
        [50,   NV, NV,   true],
        [-50,   V,  V,    false],
        [-50,   V,  NV,   false],
        [-50,   NV, V,    true],
        [-50,   NV, NV,   true],
        [110,   NV, NV,   true],
        [1200,  NV, NV,   true],  // 5minor xx making 7, 5major xx making 6, 3Nxx making 5
        [1300,  NV, NV,   false],
        [1300,  NV,  V,   true],  // ew could get -13 vulnerable
        [-1300,  V,  V,   true],  // ns could get -13 vulnerable
        [-1300,  NV, V,   false], 
        [ 420,   V,  V,   false],
        [ 420,   V, NV,   false],
        [ 420,   NV,  V,  true],
        [ 420,   NV, NV,  true],
        [ 620,   NV,  V,   false],
        [ 620,   NV, NV,   false],
        [ 620,   V,  V,  true],
        [ 620,   V, NV,  true],
        [ 350,   V,  V,   false],
        [ 0,     V,  V,   true],
        [ 0,    NV,  NV,   true],
    ];
    
    testAry.forEach( ([score, nsVul, ewVul, exp]) => {
        it(`Score of ${score} for Vul:${vulstr(nsVul, ewVul)} should be ${exp}`, () => {
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
