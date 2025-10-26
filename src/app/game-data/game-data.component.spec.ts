import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';
import { AppComponent } from '../app.component';

import { GameDataComponent } from './game-data.component';

describe('GameDataComponent', () => {
  let component: GameDataComponent;
  let fixture: ComponentFixture<GameDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
        declarations: [
            GameDataComponent,
            DeleterDialogComponent,
        ],
        providers: [
            provideRouter([]),
            provideHttpClient(),
            { provide: AppComponent, useValue: {} }
        ],
        imports: [
            RouterTestingModule,
            ReactiveFormsModule,
        ],
    })
    await TestBed.configureTestingModule({
      declarations: [ GameDataComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
