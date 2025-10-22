import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';
import { GameDataService, BoardObj } from '../game-data/game-data.service';
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
        let jsonStr3Table: string = '';
        
        beforeEach( (done) => {
            httpClient.get('testAssets/3table/sample.json', { responseType: 'text' })!
                      .subscribe(data => {
                          jsonStr3Table = data;
                          done();
                      });
        });
        
        describe('3 Table Short Reports', () => {
            let expectedShort3Table: string = '';
            let expectedShort3Table2: string = '';
            beforeEach( (done) => {
                httpClient.get('testAssets/3table/expectedShortSummary.txt', { responseType: 'text' })!
                          .subscribe(data => {
                              expectedShort3Table = data;
                              done();
                          });
            });
            beforeEach( (done) => {
                httpClient.get('testAssets/3table/expectedShortSummary2.txt', { responseType: 'text' })!
                          .subscribe(data => {
                              expectedShort3Table2 = data;
                              done();
                          });
            });
            
            function jsonToShortReport(jsonStr: string, shouldComputeMP: boolean, modifyBoard5:boolean = false) {
                const p: GameDataService = gameDataService;
                p.doDeserialize(jsonStr);
                if (modifyBoard5) {
                    const board5: BoardObj = p.boardObjs.get(5)!;
                    Array.from(board5.boardPlays.values()).forEach ( (bp) => {
                        bp.addSpecialScoreInfo('NP');
                    });
                    board5.computeMP(p.boardTop);
                }
                
                if (shouldComputeMP) {
                    // go thru and recompute the MPs (this should not change anything)
                    const boardTop = 2;  // 3 pairs per board for this file
                    p.computeMPAllBoards();
                }
                component.size = 'short';
                component.ngOnInit();
            }
            
            it('should have read in files', () => {
                console.log('jsonLength', jsonStr3Table.length);
                expect(jsonStr3Table.length).not.toBe(0);
                expect(expectedShort3Table.length).not.toBe(0);
            });

            it('should produce a correct short report', () => {
                jsonToShortReport(jsonStr3Table, false);
                expect(component.summaryText.trim()).toBe(expectedShort3Table.trim());
            });
            
            
            it('should produce a correct short report after computeMP', () => {
                jsonToShortReport(jsonStr3Table,true);
                expect(component.summaryText.trim()).toBe(expectedShort3Table.trim());
            });

            it('should produce a correct short report after board 5 marked 3 NP', () => {
                jsonToShortReport(jsonStr3Table, false, true);
                expect(component.summaryText.trim()).toBe(expectedShort3Table2.trim());
            });

        });

        describe('3 Table Board Details', () => {
            let expectedDetails3Table: string = '';
            let boardDetailsArray: RegExpMatchArray;

            beforeEach( (done) => {
                httpClient.get('testAssets/3table/expectedDetails.txt', { responseType: 'text' })!
                          .subscribe(data => {
                              expectedDetails3Table = data;
                              boardDetailsArray = expectedDetails3Table.match(/   RESULTS OF BOARD.+?-{2,}/sg)!;
                              // console.log('boardDetailsArray:', boardDetailsArray);
                              done();
                          });
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

            _.range(4,5).forEach( (n) => {
                it(`should produce a correct detailed report for board ${n+1}`, () => {
                    const details: string = jsonToOneBoardDetails(jsonStr3Table, n+1);
                    expect(details.trim()).toBe(boardDetailsArray[n].trim());
                });
            });

            // now set board 5 to be [AVE,AVE,-100]
            it(`should produce a correct detailed report for board 5 when set to AVE, AVE, -100`, () => {
                const p: GameDataService = gameDataService;            
                p.doDeserialize(jsonStr3Table);
                console.log(`should produce a correct detailed report for board 5 when set to AVE, AVE, -100`);
                const board5: BoardObj = p.boardObjs.get(5)!;
                const bpArray = Array.from(board5.boardPlays.values());
                bpArray[0].addSpecialScoreInfo('AVE');
                bpArray[1].addSpecialScoreInfo('AVE');
                const boardTop = 2;  // 3 pairs per board for this file
                board5.computeMP(boardTop);
                // now generate the board 5 details
                component.ngOnInit();
                console.log('summaryText in AVE,AVE,-100', component.summaryText);
                let pbt: Array<string> = [];
                // debugging, show full perBoard
                // component.outputPerBoardData(pbt);
                // console.log('full perBoard', pbt.join('\n'));

                pbt = [];
                const boardObj: BoardObj = p.boardObjs.get(5)!;
                if (boardObj!.areAnyPlaysEntered()) {
                    component.outputOneBoardText(pbt, boardObj);
                }
                const details5:string = pbt.join('\n');
                expect(details5.trim()).toBe(`RESULTS OF BOARD 5
  
    SCORES       MATCHPOINTS    NAMES
   N-S   E-W     N-S    E-W
         100     1.20   1.20    1-Jones-Jones vs. 5-Royal-Royal
   AVE   AVE     1.00   1.00    4-Boyer-Boyer vs. 3-Dent-Dent
   AVE   AVE     1.00   1.00    6-Hays-Hays vs. 2-Worth-Worth
----------------------------------------------------------------------`);
            });
        });
    }); // end of 3-table
});
