import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { ScoreEntryComponent } from './score-entry.component';

describe('ScoreEntryComponent', () => {
  let component: ScoreEntryComponent;
  let fixture: ComponentFixture<ScoreEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
        declarations: [ ScoreEntryComponent ],
        providers: [
          provideRouter([]),
          provideHttpClient(),
      ],
      imports: [
          RouterTestingModule,
          ReactiveFormsModule,
      ],
        
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoreEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
