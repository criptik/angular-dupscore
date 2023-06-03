import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleterDialogComponent } from './deleter-dialog.component';

describe('DeleterDialogComponent', () => {
  let component: DeleterDialogComponent;
  let fixture: ComponentFixture<DeleterDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleterDialogComponent ]
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
