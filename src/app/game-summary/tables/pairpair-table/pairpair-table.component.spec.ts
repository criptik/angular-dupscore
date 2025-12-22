import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PairpairTableComponent } from './pairpair-table.component';

describe('PairpairTableComponent', () => {
  let component: PairpairTableComponent;
  let fixture: ComponentFixture<PairpairTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PairpairTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PairpairTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
