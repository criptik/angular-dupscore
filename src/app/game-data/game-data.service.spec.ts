import { TestBed } from '@angular/core/testing';
import { Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { GameDataService } from './game-data.service';

describe('GameDataService', () => {
  let service: GameDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
