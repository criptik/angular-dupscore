import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { GameDataService, BoardObj, BoardPlay } from '../../../game-data/game-data.service';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { readAssetText, ignoreWhiteSpace } from '../../../testutils/testutils';
import * as _ from 'lodash';

import { ShortsummTableComponent } from './shortsumm-table.component';

describe('ShortsummTableComponent', () => {
    let component: ShortsummTableComponent;
    let fixture: ComponentFixture<ShortsummTableComponent>;
    let gameDataService: GameDataService;
    let httpClient: HttpClient;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ShortsummTableComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(),
            ],
        }).compileComponents();
        
        gameDataService = TestBed.inject(GameDataService);
        httpClient = TestBed.inject(HttpClient);
        fixture = TestBed.createComponent(ShortsummTableComponent);
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
                            Array.from(board5.boardPlays.values()).forEach ( (bp: BoardPlay) => {
                                bp.addSpecialScoreInfo('NP');
                            });
                            board5.computeMP(p.boardTop);
                        }
                
                        // component.size = 'short';
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
            });
        });
    });

});
