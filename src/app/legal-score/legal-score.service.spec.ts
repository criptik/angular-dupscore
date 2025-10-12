import { TestBed } from '@angular/core/testing';

import { LegalScore } from './legal-score.service';

describe('LegalScore', () => {
  let service: LegalScore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LegalScore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
