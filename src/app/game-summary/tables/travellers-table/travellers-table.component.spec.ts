import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravellersTableComponent } from './travellers-table.component';

describe('TravellersTableComponent', () => {
  let component: TravellersTableComponent;
  let fixture: ComponentFixture<TravellersTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravellersTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravellersTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
