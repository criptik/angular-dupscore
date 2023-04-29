import { TestBed } from '@angular/core/testing';

import { MovinfoService } from './movinfo.service';

describe('MovinfoService', () => {
  let service: MovinfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovinfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
