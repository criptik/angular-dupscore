import { TestBed } from '@angular/core/testing';

import { LegalScoreService } from './legal-score.service';

describe('LegalScoreService', () => {
  let service: LegalScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LegalScoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
