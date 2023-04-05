import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamesEntryComponent } from './names-entry.component';

describe('NamesEntryComponent', () => {
  let component: NamesEntryComponent;
  let fixture: ComponentFixture<NamesEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamesEntryComponent ]
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
