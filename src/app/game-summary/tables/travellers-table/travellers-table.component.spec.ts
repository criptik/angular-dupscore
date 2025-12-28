import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { GameDataService, BoardObj, BoardPlay } from '../../../game-data/game-data.service';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { readAssetText, ignoreWhiteSpace } from '../../../testutils/testutils';
import * as _ from 'lodash';

import { TravellersTableComponent, BoardInfo, BPInfo } from './travellers-table.component';

describe('TravellersTableComponent', () => {
    let component: TravellersTableComponent;
    let fixture: ComponentFixture<TravellersTableComponent>;
    let gameDataService: GameDataService;
    let httpClient: HttpClient;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TravellersTableComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(),
            ],
        }).compileComponents();
        
        gameDataService = TestBed.inject(GameDataService);
        httpClient = TestBed.inject(HttpClient);
        fixture = TestBed.createComponent(TravellersTableComponent);
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
                        // component.size = 'long';
                        // component.testing = true;
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
                        // component.size = 'long';
                        // component.testing = true;
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
                        // component.size = 'long';
                        // component.testing = true;
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
