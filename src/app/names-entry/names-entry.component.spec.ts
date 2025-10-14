import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { NamesEntryComponent } from './names-entry.component';

describe('NamesEntryComponent', () => {
  let component: NamesEntryComponent;
  let fixture: ComponentFixture<NamesEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
        declarations: [
            NamesEntryComponent
        ],
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

    fixture = TestBed.createComponent(NamesEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
