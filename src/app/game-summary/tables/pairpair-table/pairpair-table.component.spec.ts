import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { GameDataService } from '../../../game-data/game-data.service';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { PairpairTableComponent } from './pairpair-table.component';

describe('PairpairTableComponent', () => {
    let component: PairpairTableComponent;
    let fixture: ComponentFixture<PairpairTableComponent>;
    let gameDataService: GameDataService;
    let httpClient: HttpClient;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PairpairTableComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(),
            ],
        }).compileComponents();
        
        fixture = TestBed.createComponent(PairpairTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
