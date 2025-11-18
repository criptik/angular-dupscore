import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuitColorizerComponent } from './suit-colorizer.component';

describe('SuitColorizerComponent', () => {
  let component: SuitColorizerComponent;
  let fixture: ComponentFixture<SuitColorizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuitColorizerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuitColorizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
