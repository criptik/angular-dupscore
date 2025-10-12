import { TestBed } from '@angular/core/testing';

import { MovInfoService } from './movinfo.service';

describe('MovinfoService', () => {
  let service: MovInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
