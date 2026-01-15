import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';
import { ScoreEntryComponent } from './score-entry.component';
import { readAssetText } from '../testutils/testutils';
import { GameDataService, BoardObj, BoardPlay, TravOrder, SCORE_EMPTY, SCORE_SPECIAL } from '../game-data/game-data.service';
import { LegalScore, Suit, Dstate, ContractNoteOutput } from '../legal-score/legal-score.service';
import { lastValueFrom } from 'rxjs';
import { GameDataComponent } from '../game-data/game-data.component';
import * as _ from 'lodash';

describe('ScoreEntryComponent', () => {
    let component: ScoreEntryComponent;
    let fixture: ComponentFixture<ScoreEntryComponent>;
    let httpClient: HttpClient;
    let gameDataService: GameDataService;
    let legalScoreService: LegalScore;
    let httpTestingController: HttpTestingController;
    
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ScoreEntryComponent,
                DeleterDialogComponent,
            ],
            providers: [
                provideRouter([]),
                provideHttpClient(),
            ],
            imports: [
                RouterTestingModule.withRoutes([
                    { path: 'status', component: GameDataComponent }, 
                ]), 
                ReactiveFormsModule,
            ],
            
        }).compileComponents();
        
        gameDataService = TestBed.inject(GameDataService);
        legalScoreService = TestBed.inject(LegalScore);
        httpClient = TestBed.inject(HttpClient);
        fixture = TestBed.createComponent(ScoreEntryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    
    
    
    describe('NSOrder vs. TravOrder testing', () => {
        type ExpObj = {
            movName: string;
            numBoards: number;
            numRounds: number;
            numTables: number;
            roundOrderPairings: number[][][];
        }

        
        let tableTests: Array<ExpObj> = [
            {movName: 'HCOLONEL', numBoards: 20, numRounds:10, numTables:3, roundOrderPairings : [
                [[6,1], [5,4], [3,2]],
                [[6,1], [4,2], [5,3]],
                [[4,3], [6,2], [1,5]],
                [[6,2], [5,3], [1,4]],
                [[5,4], [6,3], [2,1]],
                [[2,5], [6,3], [1,4]],
                [[1,5], [6,4], [3,2]],
                [[2,5], [3,1], [6,4]],
                [[4,3], [2,1], [6,5]],
                [[3,1], [4,2], [6,5]],
            ]},
            {movName: 'H0407X', numBoards: 21, numRounds:7, numTables:4, roundOrderPairings : [
                [[8,1], [5,6], [2,4], [3,7]],
                [[8,2], [6,7], [3,5], [4,1]],
                [[8,3], [7,1], [4,6], [5,2]],
                [[6,3], [8,4], [1,2], [5,7]],
                [[7,4], [8,5], [2,3], [6,1]],
                [[7,2], [1,5], [8,6], [3,4]],
                [[4,5], [1,3], [2,6], [8,7]],
            ]},
            {movName: 'M0505X', numBoards: 20, numRounds:5, numTables:5, roundOrderPairings : [
                [[1,1], [5,4], [4,2], [3,5], [2,3]],
                [[2,2], [1,5], [5,3], [4,1], [3,4]],
                [[3,3], [2,1], [1,4], [5,2], [4,5]],
                [[4,4], [3,2], [2,5], [1,3], [5,1]],
                [[5,5], [4,3], [3,1], [2,4], [1,2]],
            ]},
        ];

        tableTests.forEach( (obj:ExpObj) => {
            describe(`testing for ${obj.numTables}-table ${obj.movName}`, () => {
                // to save time, we only create the game once.
                let createdGame: boolean;
                let lastGameCreated: GameDataService;
                createdGame = false;
                beforeEach( async () => {
                    if (!createdGame) {
                        await gameDataService.createGame(
                            'TempTest',       // game name
                            obj.movName,
                            obj.numBoards,    // boards
                            0,                // no phantom Pair for now
                            TravOrder.PAIR,   // travorder will actually be set below
                            new Date(Date.now()),
                            'temp for testing',
                        );
                        createdGame = true;
                        lastGameCreated = gameDataService;
                    }
                    else {
                        // retrieve last one we crated to reuse
                        // and have to tell score-entry compoment about this
                        gameDataService = lastGameCreated;
                        component.gameDataPtr = gameDataService;
                    }
                });
                
                it(`should have created Game`, () => {
                    expect(gameDataService.numBoards).toBe(obj.numBoards);
                    expect(gameDataService.numRounds).toBe(obj.numRounds);
                });

                // iterate over the 2 possible traveller orders
                [TravOrder.PAIR, TravOrder.ROUND].forEach( (travOrder) => {
                    const boardsPerRound = obj.numBoards/obj.numRounds;
                    _.range(1, obj.numBoards+1, boardsPerRound).forEach( (bdnum) => {
                        it(`should have expected Pairing Order for travOrder=${travOrder}, bdnum ${bdnum}`, () => {
                            gameDataService.travOrder = travOrder;
                            // extract the rendered pairings from score-entry component's viewLines
                            component.ngOnInit();
                            component.startBoard(bdnum);
                            component.updateView();
                            const renderedPairings = component.viewLines.slice(2, 2+obj.numTables).map( (line) => {
                                const matchArray: RegExpMatchArray | null =   line.match(/\d+/g);
                                return matchArray!.map( (numstr) => parseInt(numstr));
                            });
                            // console.log(`rendered=${renderedPairings[0]}`);
                            
                            let expectedPairings: number[][];
                            const objPairings: number[][] = obj.roundOrderPairings[(bdnum-1)/boardsPerRound];
                            if (travOrder === TravOrder.ROUND) {
                                expectedPairings = objPairings;
                            } else {
                                // travellers ordered by pair #, just sort the round ordering by ns pair
                                expectedPairings = [...objPairings].sort((a, b)=>{return a[0] - b[0]});
                            }
                            // console.log(`in test, bdnum=${bdnum}, travOrder=${travOrder}, rendered= ${renderedPairings.flat()}, expected=${expectedPairings}`);
                            expect(renderedPairings.flat()).toEqual(expectedPairings.flat());
                        });
                    });
                });
            });
        });
    });

    describe('ContractNote  score entry', () => {

        const conractNoteTests: Array<[string, number|undefined, number|undefined]> = [
            ['6HN=',    980, 1430],
            ['7H**S-1', -200, -400],
            ['5HE+2',   -510, -710],
            ['5HE7',    -510, -710],
            ['5HE8',    undefined, undefined],
            ['8SS=',    undefined, undefined],
            ['3NW=',    -400,  -600],
            ['3NT*W4',  -650,  -950],
            ['3NTW-4',   200,   400],
            ['3NT*W-1',  100,   200],
            ['5CN=',     400,   600],
            ['3NTW-10', undefined, undefined],
            ['3NTW+5',  undefined, undefined],
            ['3NTW2',   undefined, undefined],
            ['3NW8',    undefined, undefined],
            ['3EW=',    undefined, undefined],
            ['3HD=',    undefined, undefined],
            ['3nw=',    -400,  -600],
            ['2SN3',     140,   140],
            ['2SN+1',    140,   140],
            ['2SE3',    -140,  -140],
            ['1NT**N7', 1760,  3160],
            ['7NT**N7', 2280,  2980],
            ['PO',         0,     0],
            ['PASS',       0,     0],
        ];

        
        conractNoteTests.forEach( ([str, expScoreNSNonvul, expScoreNSVul]) => {
            // pick boards with neither vul and both vul
            [true, false].forEach( (isDeclVul) => {
                const expScoreNS = (isDeclVul ? expScoreNSVul : expScoreNSNonvul);
                it(`should correctly parse ${str} to get score ${expScoreNS} when declVul=${isDeclVul}`, () => {
                    const score:number|undefined = legalScoreService.contractNoteStrToDupscoreNSGivenVul(str, isDeclVul);
                    expect(score).toBe(expScoreNS);
                });
            });
        });
    });

    describe('Score Entry Input Tests', () => {
        // to save time, we only create the game once.
        let createdGame: boolean;
        let lastGameCreated: GameDataService;
        createdGame = false;
        let bp13: BoardPlay = BoardPlay.emptyInstance();
        let bp15: BoardPlay = BoardPlay.emptyInstance();
        let bp16: BoardPlay = BoardPlay.emptyInstance();
        
        beforeEach( async () => {
            if (!createdGame) {
                await gameDataService.createGame(
                    'TempTest',       // game name
                    'HCOLONEL',
                    20,    // boards
                    0,                // no phantom Pair for now
                    TravOrder.PAIR,   // travorder will actually be set below
                    new Date(Date.now()),
                    'temp for testing',
                );
                createdGame = true;
                lastGameCreated = gameDataService;
            }
            else {
                // retrieve last one we crated to reuse
                // and have to tell score-entry compoment about this
                gameDataService = lastGameCreated;
                component.gameDataPtr = gameDataService;
            }

            const c = component;
            c.curBoardNum = 1;
            c.buildNSOrder();
            c.inputElement = {key:'', target:{value:''}};
            c.onNS = 3;  // NS pairs on board 1 are 3,5,6
            bp13 = c.getBoardPlay(1, 3);
            bp15 = c.getBoardPlay(1, 5);
            bp16 = c.getBoardPlay(1, 6);
            [bp13, bp15, bp16].forEach( (bp) => {
                bp.addEmptyScoreInfo();
            });

        });
                
        it(`should have created Game`, () => {
            expect(gameDataService.numBoards).toBe(20);
            expect(gameDataService.numRounds).toBe(10);
        });

        function getCurBoardPlay() {
            const c = component;
            return(c.getBoardPlay(c.curBoardNum, c.onNS));
        }


        function notSpecialKey(str: string) {
            // true if a single alphanumeric character
            return (str.length === 1);
            // return /^[a-z0-9\-]$/i.test(str);
        }
        
        function processKeys(keys: string[]): void {
            const c = component;
            keys.forEach( (key) => {
                if (notSpecialKey(key)) {
                    // append key to value string
                    c.inputElement.target.value += key;
                    // console.log(`target value is now ${c.inputElement.target.value}`);
                }
                c.inputElement.key = key;
                c.scoreEntryInput();
            });
        }
        
        const tests: any[] = [
            {title: 'repeat positive input', keys:[...'42-', ...'45', 'Enter', 'Enter'],   expScores:[-420, 450, 450]},
            {title: 'repeat negative input', keys:[...'42', 'Enter', ...'45-', 'Enter'],   expScores:[420, -450, -450]},
            {title: 'repeat input twice',    keys:[...'42', 'Enter', 'Enter', 'Enter'],    expScores:[420, 420, 420]},
            {title: 'repeat negative input twice',    keys:[...'42-', 'Enter', 'Enter'],    expScores:[-420, -420, -420]},
            {title: 'second entry only',      keys:['ArrowDown', ...'45', 'Enter', 'ArrowDown'],   expScores:[SCORE_EMPTY, 450, SCORE_EMPTY]},
            {title: 'first and last entry',   keys:[...'42-', 'ArrowDown', ...'45', 'Enter'],   expScores:[-420, SCORE_EMPTY, 450]},
            {title: 'down and up arrows overwrite', keys:[...'42-', 'Enter', 'ArrowUp', 'ArrowUp', 'X', 'Enter'],   expScores:[SCORE_EMPTY, -420, SCORE_EMPTY]},
            {title: 'illegal score handling', keys:[...'62-'],   expScores:[SCORE_EMPTY, SCORE_EMPTY, SCORE_EMPTY], errmsg: `!! -620 is not possible on this board !!` },
            {title: 'AVE+ for NS', keys:[...'A+', 'Enter'],   expScores:[SCORE_SPECIAL, SCORE_EMPTY, SCORE_EMPTY], expKinds:[{ns:'AVE+', ew:'AVE-'} ] },
            {title: 'AVE- for NS', keys:[...'A-', 'Enter'],   expScores:[SCORE_SPECIAL, SCORE_EMPTY, SCORE_EMPTY], expKinds:[{ns:'AVE-', ew:'AVE+'} ] },
            {title: 'AVE+ for NS and AVE for both', keys:[...'A+', 'Enter', ...'A', 'Enter'],
                                                    expScores:[SCORE_SPECIAL, SCORE_SPECIAL, SCORE_EMPTY],
                                                    expKinds:[{ns:'AVE+', ew:'AVE-'}, {ns:'AVE', ew:'AVE'}] },
        ];
        tests.forEach( (test) => {
            it(test.title, () => {
                const c = component;
                processKeys(test.keys);
                const bps = [bp13, bp15, bp16]; 
                _.range(3).forEach( (idx) => {
                    expect(bps[idx].nsScore).toBe(test.expScores[idx]);
                    if (bps[idx].nsScore === SCORE_SPECIAL) {
                        expect(bps[idx].kindNS).toBe(test.expKinds[idx].ns);
                        expect(bps[idx].kindEW).toBe(test.expKinds[idx].ew);
                    }
                });
                if (test.errmsg !== undefined) {
                    expect(c.viewLines[6]).toBe(test.errmsg);
                }
            });
        });
    });
});
    
