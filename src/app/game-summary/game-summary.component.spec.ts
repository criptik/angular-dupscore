import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';
import { GameDataService, BoardObj } from '../game-data/game-data.service';
import { readAssetText, ignoreWhiteSpace } from '../testutils/testutils';
import * as _ from 'lodash';

import { GameSummaryComponent } from './game-summary.component';
import { TravellersTableComponent, BoardInfo, BPInfo } from './tables/travellers-table/travellers-table.component';
import { ShortsummTableComponent } from './tables/shortsumm-table/shortsumm-table.component';

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
    
});
