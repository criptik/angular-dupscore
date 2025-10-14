import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { DeleterDialogComponent } from './deleter-dialog.component';

describe('DeleterDialogComponent', () => {
  let component: DeleterDialogComponent;
  let fixture: ComponentFixture<DeleterDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
        declarations: [
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
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
