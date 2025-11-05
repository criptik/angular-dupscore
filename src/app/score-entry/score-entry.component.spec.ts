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
        let jsonStr3Table: string;
        beforeEach(  async () =>  {
            jsonStr3Table = await readAssetText('testAssets/3table/sampleNoMpMap.json', httpClient);
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
            expect(jsonStr3Table.length).not.toBe(0);
        });
        beforeEach( () => {
            gameDataService.doDeserialize(jsonStr3Table);
        });
        [1, 2].forEach( function (travOrder) {
            [1,3,5,7,9,11,13,15,17,19].forEach( function (bdnum) {
                it(`should have expected NSOrder for travOrder=${travOrder}, bdnum ${bdnum}`, () => {
                    gameDataService.travOrder = travOrder;
                    component.curBoardNum = bdnum;
                    component.buildNSOrder();
                    // console.log(`in test, nsOrder for travOrder=${travOrder}, bdnum=${bdnum}`, component.nsOrder);
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
