import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';
import { ScoreEntryComponent } from './score-entry.component';
import { readAssetText } from '../testutils/testutils';
import { GameDataService, BoardObj, TravOrder } from '../game-data/game-data.service';
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
            ['2SN3',    140,   140],
            ['2SN+1',   140,   140],
            ['2SE3',    -140,  -140],
            ['1NT**N7', 1760,  3160],
            ['7NT**N7', 2280,  2980],
        ];

        
        conractNoteTests.forEach( ([str, expScoreNSNonvul, expScoreNSVul]) => {
            // pick boards with neither vul and both vul
            [true, false].forEach( (isDeclVul) => {
                const expScoreNS = (isDeclVul ? expScoreNSVul : expScoreNSNonvul);
                it(`should correctly parse ${str} to get score ${expScoreNS}`, () => {
                    const score:number|undefined = legalScoreService.contractNoteStrToDupscoreNSGivenVul(str, isDeclVul);
                    expect(score).toBe(expScoreNS);
                });
            });
        });
    });
});
    
