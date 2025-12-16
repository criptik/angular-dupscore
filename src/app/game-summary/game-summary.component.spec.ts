import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';
import { GameDataService, BoardObj } from '../game-data/game-data.service';
import { readAssetText } from '../testutils/testutils';
import * as _ from 'lodash';

import { GameSummaryComponent, BoardInfo, BPInfo } from './game-summary.component';

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
    
    function ignoreWhiteSpace(str: string): string {
        return str.replace(/\s/g, '');
    }
    
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
                    // json for the shortSummTableInfos stuff
                    function toJSON(obj: any): string {
                        const fields = ['hdr', 'rows', 'place', 'mpTotalStr', 'pctStr', 'pairIdStr', 'nameStr'];
                        return(JSON.stringify(obj, fields, 1));
                    }

                    let  expectedShort3TableJSON: string;
                    let  expectedShort3Table3NPJSON: string;
                    beforeEach(  async () =>  {
                        expectedShort3TableJSON = await readAssetText('testAssets/3table/expectedShort3Table.JSON', httpClient);
                        expectedShort3Table3NPJSON = await readAssetText('testAssets/3table/expectedShort3Table3NP.JSON', httpClient);
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
                        expect(expectedShort3TableJSON.length).not.toBe(0);
                        expect(expectedShort3Table3NPJSON.length).not.toBe(0);
                    });

                    it('should produce a correct short report', () => {
                        jsonToShortReport(jsonStr3Table, false);
                        const shortSummTableInfosJSON: string = toJSON(component.shortSummTableInfos);
                        // console.log(shortSummTableInfosJSON);
                        expect(ignoreWhiteSpace(shortSummTableInfosJSON)).toBe(ignoreWhiteSpace(expectedShort3TableJSON));
                    });
                    
                    
                    it('should produce a correct short report after board 5 marked 3 NP', () => {
                        jsonToShortReport(jsonStr3Table, true);
                        const shortSummTableInfos3NPJSON: string = toJSON(component.shortSummTableInfos);
                        // console.log(shortSummTableInfos3NPJSON);
                        expect(ignoreWhiteSpace(shortSummTableInfos3NPJSON)).toBe(ignoreWhiteSpace(expectedShort3Table3NPJSON));
                    });

                });

                describe('3 Table Board Details', () => {
                    let expectedAllBoardDetails3TableJSON: string;
                    let boardDetailsJSONArray: RegExpMatchArray;
                    beforeEach(  async () =>  {
                        expectedAllBoardDetails3TableJSON = await readAssetText('testAssets/3table/expectedAllBoardDetails3Table.JSON', httpClient);
                        const regex = /{\s*"bdnum".+?}\s*]\s*}/gs;
                        boardDetailsJSONArray =  expectedAllBoardDetails3TableJSON.match(regex)!;
                    });
            
                    it('details to be read in', () => {
                        expect(expectedAllBoardDetails3TableJSON.length).not.toBe(0);
                        expect(boardDetailsJSONArray.length).toBe(20);
                    });

                    function toJSON(obj: any): string {
                        const fields = ['bdnum', 'bpInfoArray', 'conText', 'decl', 'resText', 'nsScore', 'ewScore', 'nsMP', 'ewMP', 'nameText'];
                        return(JSON.stringify(obj, fields, 1));
                    }

                    
                    function jsonToOneBoardDetails(jsonStr: string, bdnum: number) : string {
                        const p: GameDataService = gameDataService;
                        p.doDeserialize(jsonStr);
                        component.size = 'long';
                        component.testing = true;
                        // console.log('calling ngOnInit');
                        component.ngOnInit();
                        // console.log('allBoardInfo', toJSON(component.allBoardOutputArray));
                        
                        let pbt: Array<string> = [];
                        const boardObj: BoardObj = p.boardObjs.get(bdnum)!;
                        if (boardObj!.areAnyPlaysEntered()) {
                            component.hasContractNotes = false;  // for these tests
                            const boardInfo: BoardInfo = component.getOneBoardInfo(boardObj);
                            const boardInfoJson: string = toJSON(boardInfo);
                            return boardInfoJson;
                        }
                        else {
                            return '';
                        }
                    }
                    
                    // check detailed report for each of the 20 boards in 3-table game
                    
                    _.range(20).forEach( (n) => {
                        it(`should produce a correct detailed report for board ${n+1}`, () => {
                            const detailsJSON: string = jsonToOneBoardDetails(jsonStr3Table, n+1);
                            expect(ignoreWhiteSpace(detailsJSON)).toBe(ignoreWhiteSpace(boardDetailsJSONArray[n]));
                        });
                    });

                    // now set board 5 to be [AVE,AVE,-100]
                    let expectedDetails3TableBd5AveAveJSON: string;
                    let expectedDetails3TableBd5AveNPJSON: string;
                    beforeEach(  async () => {
                        expectedDetails3TableBd5AveAveJSON = await readAssetText('testAssets/3table/detailsBd5AveAve.JSON', httpClient);
                        expectedDetails3TableBd5AveNPJSON = await readAssetText('testAssets/3table/detailsBd5AveNP.JSON', httpClient);
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
                        component.size = 'long';
                        component.testing = true;
                        component.ngOnInit();
                        // get the boardInfo for board 5
                        const boardInfo5: BoardInfo = component.getOneBoardInfo(board5);
                        const boardInfo5JSON: string = toJSON(boardInfo5);
                        expect(ignoreWhiteSpace(expectedDetails3TableBd5AveAveJSON)).toBe(ignoreWhiteSpace(boardInfo5JSON));
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
                        component.size = 'long';
                        component.testing = true;
                        component.ngOnInit();
                        // get the boardInfo for board 5
                        const boardInfo5: BoardInfo = component.getOneBoardInfo(board5);
                        const boardInfo5JSON: string = toJSON(boardInfo5);
                        expect(ignoreWhiteSpace(expectedDetails3TableBd5AveNPJSON)).toBe(ignoreWhiteSpace(boardInfo5JSON));
                    });
                });
            });
        });
    }); // end of 3-table
});
