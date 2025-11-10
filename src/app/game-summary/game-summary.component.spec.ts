import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';
import { GameDataService, BoardObj } from '../game-data/game-data.service';
import { readAssetText } from '../testutils/testutils';
import * as _ from 'lodash';

import { GameSummaryComponent } from './game-summary.component';

describe('GameSummaryComponent', () => {
    let component: GameSummaryComponent;
    let fixture: ComponentFixture<GameSummaryComponent>;
    let gameDataService: GameDataService;
    let httpClient: HttpClient;
    let httpTestingController: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                GameSummaryComponent,
                DeleterDialogComponent,
            ],
            providers: [
                provideRouter([]),
                provideHttpClient(),
            ],
            imports: [
                RouterTestingModule,
                ReactiveFormsModule,
            ],
        }).compileComponents();
        gameDataService = TestBed.inject(GameDataService);
        httpClient = TestBed.inject(HttpClient);
        fixture = TestBed.createComponent(GameSummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    
    describe('3 Table Reports', () => {
        // run all this stuff with both the old (withMpMap) and new (withoutMpMap) json files.
        const jsonInputTypes: Array<string> = ['WithMpMap', 'NoMpMap'];
        jsonInputTypes.forEach( (jsonInputType) => {
            let jsonStr3Table: string;
            describe(`3 Table Reports ${jsonInputType}`, () => {
                beforeEach(  async () =>  {
                    jsonStr3Table = await readAssetText(`testAssets/3table/sample${jsonInputType}.json`, httpClient);
                });

                describe('3 Table Short Reports', () => {
                    let  expectedShort3Table: string;
                    let  expectedShort3Table3NP: string;
                    beforeEach(  async () =>  {
                        expectedShort3Table = await readAssetText('testAssets/3table/expectedShortSummary.txt', httpClient);
                        expectedShort3Table3NP = await readAssetText('testAssets/3table/expectedShortSummary2.txt', httpClient);
                    });
                    function jsonToShortReport(jsonStr: string, modifyBoard5:boolean = false) {
                        const p: GameDataService = gameDataService;
                        p.doDeserialize(jsonStr);
                        if (modifyBoard5) {
                            const board5: BoardObj = p.boardObjs.get(5)!;
                            Array.from(board5.boardPlays.values()).forEach ( (bp) => {
                                bp.addSpecialScoreInfo('NP');
                            });
                            board5.computeMP(p.boardTop);
                        }
                
                        component.size = 'short';
                        component.ngOnInit();
                    }
            
                    it('should have read in files', () => {
                        expect(jsonStr3Table.length).not.toBe(0);
                        expect(expectedShort3Table.length).not.toBe(0);
                        expect(expectedShort3Table3NP.length).not.toBe(0);
                    });

                    it('should produce a correct short report', () => {
                        jsonToShortReport(jsonStr3Table, false);
                        expect(component.summaryText.trim()).toBe(expectedShort3Table.trim());
                    });
            
            
                    it('should produce a correct short report after board 5 marked 3 NP', () => {
                        jsonToShortReport(jsonStr3Table, true);
                        expect(component.summaryText.trim()).toBe(expectedShort3Table3NP.trim());
                    });

                });

                describe('3 Table Board Details', () => {
                    let expectedDetails3Table: string;
                    let boardDetailsArray: RegExpMatchArray;
                    beforeEach(  async () =>  {
                        expectedDetails3Table = await readAssetText('testAssets/3table/expectedDetails.txt', httpClient);
                        boardDetailsArray =  expectedDetails3Table.match(/   RESULTS OF BOARD.+?-{2,}/sg)!;
                    });
            
                    it('details to be read in', () => {
                        expect(expectedDetails3Table.length).not.toBe(0);
                    });
                    
                    function jsonToOneBoardDetails(jsonStr: string, bdnum: number) : string {
                        const p: GameDataService = gameDataService;
                        p.doDeserialize(jsonStr);
                        component.size = 'long';
                        component.ngOnInit();
                        let pbt: Array<string> = [];
                        const boardObj: BoardObj = p.boardObjs.get(bdnum)!;
                        if (boardObj!.areAnyPlaysEntered()) {
                            component.outputOneBoardText(pbt, boardObj);
                        }
                        return pbt.join('\n');
                    }
                    
                    // check detailed report for each of the 20 boards in 3-table game
                    
                    _.range(2).forEach( (n) => {
                        it(`should produce a correct detailed report for board ${n+1}`, () => {
                            const details: string = jsonToOneBoardDetails(jsonStr3Table, n+1);
                            expect(details.trim()).toBe(boardDetailsArray[n].trim());
                        });
                    });

                    // now set board 5 to be [AVE,AVE,-100]
                    let expectedDetails3TableBd5AveAve: string;
                    let expectedDetails3TableBd5AveNP: string;
                    beforeEach(  async () => {
                        expectedDetails3TableBd5AveAve = await readAssetText('testAssets/3table/detailsBd5AveAve.txt', httpClient);
                        expectedDetails3TableBd5AveNP = await readAssetText('testAssets/3table/detailsBd5AveNP.txt', httpClient);
                    });
                    it('should produce a correct detailed report for board 5 when set to AVE, AVE, -100', () => {
                        const p: GameDataService = gameDataService;            
                        p.doDeserialize(jsonStr3Table);
                        const board5: BoardObj = p.boardObjs.get(5)!;
                        const bpArray = Array.from(board5.boardPlays.values());
                        bpArray[0].addSpecialScoreInfo('AVE');
                        bpArray[1].addSpecialScoreInfo('AVE');
                        const boardTop = 2;  // 3 pairs per board in this game
                        board5.computeMP(boardTop);
                        // now generate the board 5 details
                        component.ngOnInit();
                        let pbt: Array<string> = [];
                        const boardObj: BoardObj = p.boardObjs.get(5)!;
                        if (boardObj!.areAnyPlaysEntered()) {
                            component.outputOneBoardText(pbt, boardObj);
                        }
                        const details5:string = pbt.join('\n');
                        expect(details5.trim()).toBe(expectedDetails3TableBd5AveAve.trim());
                    });
                    it('should produce a correct detailed report for board 5 when set to AVE, NP, -100', () => {
                        const p: GameDataService = gameDataService;            
                        p.doDeserialize(jsonStr3Table);
                        const board5: BoardObj = p.boardObjs.get(5)!;
                        const bpArray = Array.from(board5.boardPlays.values());
                        bpArray[0].addSpecialScoreInfo('AVE');
                        bpArray[1].addSpecialScoreInfo('NP');
                        const boardTop = 2;  // 3 pairs per board in this game
                        board5.computeMP(boardTop);
                        // now generate the board 5 details
                        component.ngOnInit();
                        let pbt: Array<string> = [];
                        const boardObj: BoardObj = p.boardObjs.get(5)!;
                        if (boardObj!.areAnyPlaysEntered()) {
                            component.outputOneBoardText(pbt, boardObj);
                        }
                        const details5:string = pbt.join('\n');
                        expect(details5.trim()).toBe(expectedDetails3TableBd5AveNP.trim());
                    });
                });
            });
        });
    }); // end of 3-table
});
