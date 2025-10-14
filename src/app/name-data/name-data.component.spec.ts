import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';

import { NameDataComponent } from './name-data.component';

describe('NameDataComponent', () => {
  let component: NameDataComponent;
  let fixture: ComponentFixture<NameDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
        declarations: [
            NameDataComponent,
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

    fixture = TestBed.createComponent(NameDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
