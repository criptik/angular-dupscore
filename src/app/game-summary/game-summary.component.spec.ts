import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';
import { GameDataService } from '../game-data/game-data.service';
import { lastValueFrom } from 'rxjs';

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

    describe('GameSummaryComponent Reports', () => {
        let json251010AStr: string = '';
        let expectedShortReport: string = '';
        
        beforeEach( (done) => {
            httpClient.get('testAssets/251010A.json', { responseType: 'text' })!
                      .subscribe(data1 => {
                          // console.log('data1', data1); // 'data' contains the content of your-file.txt
                          // Process the text data here
                          json251010AStr = data1;
                          // console.log('jsonStr complete');
                          httpClient.get('testAssets/expectedShortSummary.txt', { responseType: 'text' })!
                                    .subscribe(data2 => {
                                        // console.log('data2', data2);
                                        expectedShortReport = data2;
                                        done();
                                    });
                      });
        });
    
        it('should have read in files', () => {
            console.log('jsonLength', json251010AStr.length);
            expect(json251010AStr.length).not.toBe(0);
            expect(expectedShortReport.length).not.toBe(0);
        });

        function jsonToShortReport(jsonStr: string, shouldComputeMP: boolean) {
            const p: GameDataService = gameDataService;
            p.doDeserialize(jsonStr);
            if (shouldComputeMP) {
                // go thru and recompute the MPs (this should not change anything)
                Array.from(p.boardObjs.values()).forEach( (board) => {
                    const boardTop = 2;  // 3 pairs per board for this file
                    board.computeMP(boardTop);
                });
            }
            component.size = 'short';
            component.ngOnInit();
        }
    
        it('should produce a correct short report', () => {
            jsonToShortReport(json251010AStr, false);
            expect(component.summaryText.trim()).toBe(expectedShortReport.trim());
        });


        it('should produce a correct short report after computeMP', () => {
            jsonToShortReport(json251010AStr,true);
            expect(component.summaryText.trim()).toBe(expectedShortReport.trim());
        });
    });
});
