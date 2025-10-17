import { TestBed } from '@angular/core/testing';
import { Injectable, InjectionToken } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import * as _ from 'lodash';

import { GameDataService, BoardObj, BoardPlay} from './game-data.service';

describe('GameDataService', () => {
    let service: GameDataService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
            ],
        }).compileComponents();
        service = TestBed.inject(GameDataService);
    });
    
    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    const testAry:Array< { scores: Array<any>; mps: Array<any> } > = [
        {scores: [100, 110, 120],  mps: [0, 1, 2], },
        {scores: [100, 120, 110],  mps: [0, 2, 1], },
        {scores: [100, 100, 110],  mps: [0.5, 0.5, 2], },
        {scores: [100, 110, 110],  mps: [0, 1.5, 1.5], },
        {scores: [110, 110, 110],  mps: [1.0, 1.0, 1.0], },
        {scores: [110, 110, 110, 110],  mps: [1.5, 1.5, 1.5, 1.5], },
        {scores: [110, 120, 130, 140],  mps: [0, 1, 2, 3], },
        {scores: [140, 130, 120, 110],  mps: [3, 2, 1, 0], },
        {scores: [140, 130, 120, 0],  mps: [3, 2, 1, 0], },
        {scores: [140, 130, 130, 'NP'],  mps: [2.83, 0.83, 0.83, undefined], },
        {scores: [140, 130, 130, 'AVE'],  mps: [2.83, 0.83, 0.83, 1.5], },
        {scores: [140, 130, 130, ['AVE+', 'AVE-'] ],  mps: [2.83, 0.83, 0.83, 1.8], },
        {scores: [140, 130, 130, ['AVE-', 'AVE+'] ],  mps: [2.83, 0.83, 0.83, 1.2], },
        {scores: [140, 130, 130, ['AVE-', 'AVE-'] ],  mps: [2.83, 0.83, 0.83, 1.2], },
        {scores: [140, 130, 130, [1.1, 1.9] ],  mps: [2.83, 0.83, 0.83, 1.1], },
        {scores: [100, 110, 'NP'],  mps: [0.25, 1.75, undefined], },
        {scores: [100, 110, 'AVE'],  mps: [0.25, 1.75, 1.0], },
    ];

    // const mappy: Map<number, string> = new Map();
    // mappy.set(1, 'a');
    // mappy.set(2, 'b');
    // console.log('mappy stringify', JSON.stringify(mappy));
    // console.log('mappy entries ', [...mappy.entries()]);
    // console.log('mappy entries stringify ', mappy.entries());
    testAry.forEach ( (obj) => {
        const bdObj: BoardObj = new BoardObj(1);
        const siz: number = obj.scores.length;
        let round = 1;
        obj.scores.forEach( (score) => {
            const nspair = round;
            const ewpair = nspair + siz;
            const bp = new BoardPlay(nspair, ewpair, round);
            if (typeof(score) === 'number') {
                bp.addScoreInfo(score);
            }
            else if (typeof(score) === 'string') {
                bp.addSpecialScoreInfo(score);
            }
            // if unbalanced special it will be an array
            else if (typeof(score) === 'object') {  
                bp.addSpecialScoreInfo(score[0], score[1]);
            }
            // console.log('new bp:', bp);
            // console.log('stringify new bp:', JSON.stringify(bp));
            bdObj.boardPlays.set(nspair, bp);
            // console.log(round, 'bdObj.boardPlays entries:', [... bdObj.boardPlays.entries()]);
            round += 1;
        });
        // compute MPs
        bdObj.computeMP(siz - 1);
        
        it(`for ${obj.scores} checking ${obj.mps}:`, () => {
            let ok = true;
            
            _.range(siz).forEach( (n) => {
                let mapval: any = bdObj.pairToMpMap.get(n+1);
                if (mapval !== undefined) {
                    mapval = mapval.toFixed(2);
                }
                
                ok = ok && (mapval == obj.mps[n]);
            });
            expect(ok).toBe(true);
            if (!ok) {
                console.log(`${obj.scores} => pairToMpMap`, [... bdObj.pairToMpMap.entries()]);
            }
        });
    });
    
});
