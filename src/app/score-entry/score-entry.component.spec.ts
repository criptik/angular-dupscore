import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';
import { ScoreEntryComponent } from './score-entry.component';
import { AssetFileReader } from '../testutils/testutils';
import { GameDataService, BoardObj } from '../game-data/game-data.service';
import { lastValueFrom } from 'rxjs';
import { GameDataComponent } from '../game-data/game-data.component';


// class AssetFileReader {
//     path: string;
//     str: string = '';
//     constructor(str: string, path: string) {
//         this.str = str;
//         this.path = path;
//         console.log('in constructor', path);
//     }
//     
//     static async create(path: string, httpClient: HttpClient) {
//         // Perform asynchronous operations here, e.g., fetching data
//         console.log('in Create');
//         const str = await lastValueFrom(httpClient.get(path, { responseType: 'text' }));
//         return new AssetFileReader(str, path);
//     }
// }
// 
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
    
    
    
    describe('3 Table TravOrder by Round Entries', () => {
        const jsonStr3Table: AssetFileReader = new AssetFileReader(`testAssets/3table/sampleNoMpMap.json`);
        beforeEach(  async () => {
            await jsonStr3Table.get(httpClient);
            // AssetFileReader.create(`testAssets/3table/sampleNoMpMap.json`, httpClient);
            // console.log('jsonStr3Table', jsonStr3Table);
        });
        
        const expectedNSOrderArray = [
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
        ];
        
        it('json str should be set up', () => {
            expect(jsonStr3Table.str.length).not.toBe(0);
        });
        let p: GameDataService;
        beforeEach( () => {
            p = gameDataService;
            p.doDeserialize(jsonStr3Table.str);
        });
        [1, 2].forEach( (travOrder) => {
            [1,3,5,7,9,11,13,15,17,19].forEach( (bdnum) => {
                it(`should have expected NSOrder for travOrder=${travOrder}, bdnum ${bdnum}`, () => {
                    p.travOrder = travOrder;
                    component.curBoardNum = bdnum;
                    component.buildNSOrder();
                    // console.log(`in test, nsOrder for travOrder=${p.travOrder}, bdnum=${bdnum}`, component.nsOrder);
                    let expectedNSOrder;
                    if (travOrder === 2) {
                        expectedNSOrder = expectedNSOrderArray[(bdnum-1)/2];
                    } else {
                        expectedNSOrder = [...expectedNSOrderArray[(bdnum-1)/2]].sort((a, b)=>{return a - b});
                    }
                    expect(component.nsOrder).toEqual(expectedNSOrder);
                });
            });
        });
    });
});
