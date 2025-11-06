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
import { GameDataService, BoardObj } from '../game-data/game-data.service';
import { lastValueFrom } from 'rxjs';
import { GameDataComponent } from '../game-data/game-data.component';
import * as _ from 'lodash';

describe('ScoreEntryComponent', () => {
    let component: ScoreEntryComponent;
    let fixture: ComponentFixture<ScoreEntryComponent>;
    let httpClient: HttpClient;
    let gameDataService: GameDataService;
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
            roundNSOrderArray: Array<Array<number>>;
        }
        
        let tableTests: Array<ExpObj> = [
            {movName: 'HCOLONEL', numBoards: 20, numRounds:10, roundNSOrderArray : [
                [6,5,3],
                [6,4,5],
                [4,6,1],
                [6,5,1],
                [5,6,2],
                [2,6,1],
                [1,6,3],
                [2,3,6],
                [4,2,6],
                [3,4,6],
            ]},
            {movName: 'H0407X', numBoards: 21, numRounds:7, roundNSOrderArray : [
                [8,5,2,3],
                [8,6,3,4],
                [8,7,4,5],
                [6,8,1,5],
                [7,8,2,6],
                [7,1,8,3],
                [4,1,2,8],
            ]},
            {movName: 'M0505X', numBoards: 20, numRounds:5, roundNSOrderArray : [
                [1,5,4,3,2],
                [2,1,5,4,3],
                [3,2,1,5,4],
                [4,3,2,1,5],
                [5,4,3,2,1],
            ]},
        ];

        tableTests.forEach( (obj:ExpObj) => {
            describe(`testing for ${obj.movName}`, () => {
                // to save time, we only create the game once.
                let createdGame: boolean;
                let lastGameCreated: GameDataService;
                createdGame = false;
                beforeEach( async () => {
                    if (!createdGame) {
                        await gameDataService.createGame(
                            'TempTest',    // game name
                            obj.movName,
                            obj.numBoards, // boards
                            0,             // no phantom Pair for now
                            1,  // travorder will actually be set below
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
                
                [1, 2].forEach( (travOrder) => {
                    const boardsPerRound = obj.numBoards/obj.numRounds;
                    _.range(1, obj.numBoards+1, boardsPerRound).forEach( (bdnum) => {
                        it(`should have expected NSOrder for travOrder=${travOrder}, bdnum ${bdnum}`, () => {
                            gameDataService.travOrder = travOrder;
                            component.curBoardNum = bdnum;
                            component.buildNSOrder();
                            let expectedNSOrder;
                            if (travOrder === 2) {
                                expectedNSOrder = obj.roundNSOrderArray[(bdnum-1)/boardsPerRound];
                                } else {
                                    expectedNSOrder = [...obj.roundNSOrderArray[(bdnum-1)/boardsPerRound]].sort((a, b)=>{return a - b});
                                }
                            // console.log(`in test, nsOrder for ${gameDataService.movFileName}, travOrder=${travOrder}, bdnum=${bdnum}`, component.nsOrder, 'expected', expectedNSOrder);
                            expect(component.nsOrder).toEqual(expectedNSOrder);
                        });
                    });
                });
            });
        });
    });
});
    
