import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PairnameButtonComponent } from './pairname-button.component';

describe('PairnameButtonComponent', () => {
  let component: PairnameButtonComponent;
  let fixture: ComponentFixture<PairnameButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PairnameButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PairnameButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
