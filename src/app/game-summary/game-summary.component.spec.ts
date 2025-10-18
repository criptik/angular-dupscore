import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';
import { GameDataService } from '../game-data/game-data.service';

import { GameSummaryComponent } from './game-summary.component';

describe('GameSummaryComponent', () => {
    let component: GameSummaryComponent;
    let fixture: ComponentFixture<GameSummaryComponent>;
    let gameDataService: GameDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
        declarations: [
            GameSummaryComponent,
            DeleterDialogComponent,
        ],
        providers: [
            provideRouter([]),
            provideHttpClient(),
        ],
        imports: [
            RouterTestingModule,
            ReactiveFormsModule,
        ],
    })
    .compileComponents();
      gameDataService = TestBed.inject(GameDataService);

    fixture = TestBed.createComponent(GameSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


    it('should produce a correct short report', () => {
        const p: GameDataService = gameDataService;
        p.doDeserialize(jsonStr());
        // const mp620 = p.boardObjs.get(20)!.pairToMpMap.get(6);
        // console.log('mp pair 6, board 20', mp620);
        component.size = 'short';
        component.ngOnInit();
        expect(component.summaryText).toBe(expectedSummary());
    });


    it('should produce a correct short report after computeMP', () => {
        const p: GameDataService = gameDataService;
        p.doDeserialize(jsonStr());
        // now go thru and recompute the MPs (this should not change anything)
        Array.from(p.boardObjs.values()).forEach( (board) => {
            const boardTop = 2;  // 3 pairs per board for this file
            board.computeMP(boardTop);
        });
        component.size = 'short';
        component.ngOnInit();
        expect(component.summaryText).toBe(expectedSummary());
    });


    function expectedSummary(): string {
        return `20 Boards have been fully scored...

Second Friday Pairs for 2025-10-10
Summary for All Pairs
  Place    Pct    Score   Pair
     1    63.75%  25.50     5 Royal-Royal
     2    62.50%  25.00     3 Dent-Dent
     3    60.00%  24.00     6 Hays-Hays
     4    40.28%  16.11     1 Jones-Jones
     5    37.50%  15.00     4 Boyer-Boyer
     6    33.33%  13.33     2 Worth-Worth
 `
    }
    
    function jsonStr(): string {
    return `
        {
  "gameFileName": "251010A",
  "movFileName": "HCOLONEL.MOV",
  "gameDate": "2025-10-10",
  "groupName": "Second Friday Pairs",
  "boardsPerRound": 2,
  "numPairs": 6,
  "numNSPairs": 6,
  "numTables": 3,
  "numRounds": 10,
  "numBoards": 20,
  "boardTop": 2,
  "boardObjs": {
    "__type": "Map",
    "__entries": [
      [
        1,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 1,
                  "round": 1,
                  "nsScore": 170,
                  "__type": "BoardPlay"
                }
              ],
              [
                5,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 5,
                  "ewPair": 4,
                  "round": 3,
                  "nsScore": 50,
                  "__type": "BoardPlay"
                }
              ],
              [
                3,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 3,
                  "ewPair": 2,
                  "round": 9,
                  "nsScore": -100,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                2
              ],
              [
                1,
                0
              ],
              [
                5,
                1
              ],
              [
                4,
                1
              ],
              [
                3,
                0
              ],
              [
                2,
                2
              ]
            ]
          },
          "bdnum": 1,
          "vulNS": false,
          "vulEW": false,
          "dealer": "E",
          "__type": "BoardObj"
        }
      ],
      [
        2,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 1,
                  "round": 1,
                  "nsScore": -450,
                  "__type": "BoardPlay"
                }
              ],
              [
                5,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 5,
                  "ewPair": 4,
                  "round": 3,
                  "nsScore": 50,
                  "__type": "BoardPlay"
                }
              ],
              [
                3,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 3,
                  "ewPair": 2,
                  "round": 9,
                  "nsScore": 50,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                0
              ],
              [
                1,
                2
              ],
              [
                5,
                1.5
              ],
              [
                4,
                0.5
              ],
              [
                3,
                1.5
              ],
              [
                2,
                0.5
              ]
            ]
          },
          "bdnum": 2,
          "vulNS": true,
          "vulEW": false,
          "dealer": "S",
          "__type": "BoardObj"
        }
      ],
      [
        3,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 1,
                  "round": 2,
                  "nsScore": 430,
                  "__type": "BoardPlay"
                }
              ],
              [
                4,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 4,
                  "ewPair": 2,
                  "round": 5,
                  "nsScore": 450,
                  "__type": "BoardPlay"
                }
              ],
              [
                5,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 5,
                  "ewPair": 3,
                  "round": 7,
                  "nsScore": 420,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                1
              ],
              [
                1,
                1
              ],
              [
                4,
                2
              ],
              [
                2,
                0
              ],
              [
                5,
                0
              ],
              [
                3,
                2
              ]
            ]
          },
          "bdnum": 3,
          "vulNS": false,
          "vulEW": true,
          "dealer": "W",
          "__type": "BoardObj"
        }
      ],
      [
        4,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 1,
                  "round": 2,
                  "nsScore": -140,
                  "__type": "BoardPlay"
                }
              ],
              [
                4,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 4,
                  "ewPair": 2,
                  "round": 5,
                  "nsScore": -650,
                  "__type": "BoardPlay"
                }
              ],
              [
                5,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 5,
                  "ewPair": 3,
                  "round": 7,
                  "nsScore": -680,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                2
              ],
              [
                1,
                0
              ],
              [
                4,
                1
              ],
              [
                2,
                1
              ],
              [
                5,
                0
              ],
              [
                3,
                2
              ]
            ]
          },
          "bdnum": 4,
          "vulNS": true,
          "vulEW": true,
          "dealer": "N",
          "__type": "BoardObj"
        }
      ],
      [
        5,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 2,
                  "round": 3,
                  "nsScore": -100,
                  "__type": "BoardPlay"
                }
              ],
              [
                4,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 4,
                  "ewPair": 3,
                  "round": 1,
                  "nsScore": -100,
                  "__type": "BoardPlay"
                }
              ],
              [
                1,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 1,
                  "ewPair": 5,
                  "round": 5,
                  "nsScore": -100,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                1
              ],
              [
                2,
                1
              ],
              [
                4,
                1
              ],
              [
                3,
                1
              ],
              [
                1,
                1
              ],
              [
                5,
                1
              ]
            ]
          },
          "bdnum": 5,
          "vulNS": true,
          "vulEW": false,
          "dealer": "E",
          "__type": "BoardObj"
        }
      ],
      [
        6,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 2,
                  "round": 3,
                  "nsScore": 200,
                  "__type": "BoardPlay"
                }
              ],
              [
                4,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 4,
                  "ewPair": 3,
                  "round": 1,
                  "nsScore": -110,
                  "__type": "BoardPlay"
                }
              ],
              [
                1,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 1,
                  "ewPair": 5,
                  "round": 5,
                  "nsScore": -150,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                2
              ],
              [
                2,
                0
              ],
              [
                4,
                1
              ],
              [
                3,
                1
              ],
              [
                1,
                0
              ],
              [
                5,
                2
              ]
            ]
          },
          "bdnum": 6,
          "vulNS": false,
          "vulEW": true,
          "dealer": "S",
          "__type": "BoardObj"
        }
      ],
      [
        7,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 2,
                  "round": 4,
                  "nsScore": 600,
                  "__type": "BoardPlay"
                }
              ],
              [
                5,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 5,
                  "ewPair": 3,
                  "round": 8,
                  "nsScore": 120,
                  "__type": "BoardPlay"
                }
              ],
              [
                1,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 1,
                  "ewPair": 4,
                  "round": 9,
                  "nsScore": 140,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                2
              ],
              [
                2,
                0
              ],
              [
                5,
                0
              ],
              [
                3,
                2
              ],
              [
                1,
                1
              ],
              [
                4,
                1
              ]
            ]
          },
          "bdnum": 7,
          "vulNS": true,
          "vulEW": true,
          "dealer": "W",
          "__type": "BoardObj"
        }
      ],
      [
        8,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 2,
                  "round": 4,
                  "nsScore": 100,
                  "__type": "BoardPlay"
                }
              ],
              [
                5,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 5,
                  "ewPair": 3,
                  "round": 8,
                  "nsScore": 120,
                  "__type": "BoardPlay"
                }
              ],
              [
                1,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 1,
                  "ewPair": 4,
                  "round": 9,
                  "nsScore": 200,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                0
              ],
              [
                2,
                2
              ],
              [
                5,
                1
              ],
              [
                3,
                1
              ],
              [
                1,
                2
              ],
              [
                4,
                0
              ]
            ]
          },
          "bdnum": 8,
          "vulNS": false,
          "vulEW": false,
          "dealer": "N",
          "__type": "BoardObj"
        }
      ],
      [
        9,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 3,
                  "round": 5,
                  "nsScore": -1430,
                  "__type": "BoardPlay"
                }
              ],
              [
                5,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 5,
                  "ewPair": 4,
                  "round": 4,
                  "nsScore": -200,
                  "__type": "BoardPlay"
                }
              ],
              [
                2,
                {
                  "kindNS": "LATE",
                  "kindEW": "LATE",
                  "nsPair": 2,
                  "ewPair": 1,
                  "round": 7,
                  "nsScore": -1,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                0.25
              ],
              [
                3,
                1.75
              ],
              [
                5,
                1.75
              ],
              [
                4,
                0.25
              ]
            ]
          },
          "bdnum": 9,
          "vulNS": false,
          "vulEW": true,
          "dealer": "E",
          "__type": "BoardObj"
        }
      ],
      [
        10,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 3,
                  "round": 5,
                  "nsScore": -200,
                  "__type": "BoardPlay"
                }
              ],
              [
                5,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 5,
                  "ewPair": 4,
                  "round": 4,
                  "nsScore": -100,
                  "__type": "BoardPlay"
                }
              ],
              [
                2,
                {
                  "kindNS": "NP ",
                  "kindEW": "NP ",
                  "nsPair": 2,
                  "ewPair": 1,
                  "round": 7,
                  "nsScore": -1,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                0.25
              ],
              [
                3,
                1.75
              ],
              [
                5,
                1.75
              ],
              [
                4,
                0.25
              ]
            ]
          },
          "bdnum": 10,
          "vulNS": true,
          "vulEW": true,
          "dealer": "S",
          "__type": "BoardObj"
        }
      ],
      [
        11,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 3,
                  "round": 6,
                  "nsScore": 100,
                  "__type": "BoardPlay"
                }
              ],
              [
                2,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 2,
                  "ewPair": 5,
                  "round": 1,
                  "nsScore": -50,
                  "__type": "BoardPlay"
                }
              ],
              [
                1,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 1,
                  "ewPair": 4,
                  "round": 10,
                  "nsScore": 50,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                2
              ],
              [
                3,
                0
              ],
              [
                2,
                0
              ],
              [
                5,
                2
              ],
              [
                1,
                1
              ],
              [
                4,
                1
              ]
            ]
          },
          "bdnum": 11,
          "vulNS": false,
          "vulEW": false,
          "dealer": "W",
          "__type": "BoardObj"
        }
      ],
      [
        12,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 3,
                  "round": 6,
                  "nsScore": 140,
                  "__type": "BoardPlay"
                }
              ],
              [
                2,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 2,
                  "ewPair": 5,
                  "round": 1,
                  "nsScore": -200,
                  "__type": "BoardPlay"
                }
              ],
              [
                1,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 1,
                  "ewPair": 4,
                  "round": 10,
                  "nsScore": 50,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                2
              ],
              [
                3,
                0
              ],
              [
                2,
                0
              ],
              [
                5,
                2
              ],
              [
                1,
                1
              ],
              [
                4,
                1
              ]
            ]
          },
          "bdnum": 12,
          "vulNS": true,
          "vulEW": false,
          "dealer": "N",
          "__type": "BoardObj"
        }
      ],
      [
        13,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 4,
                  "round": 7,
                  "nsScore": -100,
                  "__type": "BoardPlay"
                }
              ],
              [
                1,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 1,
                  "ewPair": 5,
                  "round": 6,
                  "nsScore": -680,
                  "__type": "BoardPlay"
                }
              ],
              [
                3,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 3,
                  "ewPair": 2,
                  "round": 10,
                  "nsScore": 100,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                1
              ],
              [
                4,
                1
              ],
              [
                1,
                0
              ],
              [
                5,
                2
              ],
              [
                3,
                2
              ],
              [
                2,
                0
              ]
            ]
          },
          "bdnum": 13,
          "vulNS": true,
          "vulEW": true,
          "dealer": "E",
          "__type": "BoardObj"
        }
      ],
      [
        14,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 4,
                  "round": 7,
                  "nsScore": 50,
                  "__type": "BoardPlay"
                }
              ],
              [
                1,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 1,
                  "ewPair": 5,
                  "round": 6,
                  "nsScore": -140,
                  "__type": "BoardPlay"
                }
              ],
              [
                3,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 3,
                  "ewPair": 2,
                  "round": 10,
                  "nsScore": 100,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                1
              ],
              [
                4,
                1
              ],
              [
                1,
                0
              ],
              [
                5,
                2
              ],
              [
                3,
                2
              ],
              [
                2,
                0
              ]
            ]
          },
          "bdnum": 14,
          "vulNS": false,
          "vulEW": false,
          "dealer": "S",
          "__type": "BoardObj"
        }
      ],
      [
        15,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 4,
                  "round": 8,
                  "nsScore": 50,
                  "__type": "BoardPlay"
                }
              ],
              [
                2,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 2,
                  "ewPair": 5,
                  "round": 2,
                  "nsScore": -460,
                  "__type": "BoardPlay"
                }
              ],
              [
                3,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 3,
                  "ewPair": 1,
                  "round": 3,
                  "nsScore": -200,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                2
              ],
              [
                4,
                0
              ],
              [
                2,
                0
              ],
              [
                5,
                2
              ],
              [
                3,
                1
              ],
              [
                1,
                1
              ]
            ]
          },
          "bdnum": 15,
          "vulNS": true,
          "vulEW": false,
          "dealer": "W",
          "__type": "BoardObj"
        }
      ],
      [
        16,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 4,
                  "round": 8,
                  "nsScore": 100,
                  "__type": "BoardPlay"
                }
              ],
              [
                2,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 2,
                  "ewPair": 5,
                  "round": 2,
                  "nsScore": -620,
                  "__type": "BoardPlay"
                }
              ],
              [
                3,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 3,
                  "ewPair": 1,
                  "round": 3,
                  "nsScore": -650,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                2
              ],
              [
                4,
                0
              ],
              [
                2,
                1
              ],
              [
                5,
                1
              ],
              [
                3,
                0
              ],
              [
                1,
                2
              ]
            ]
          },
          "bdnum": 16,
          "vulNS": false,
          "vulEW": true,
          "dealer": "N",
          "__type": "BoardObj"
        }
      ],
      [
        17,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 5,
                  "round": 9,
                  "nsScore": 150,
                  "__type": "BoardPlay"
                }
              ],
              [
                4,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 4,
                  "ewPair": 3,
                  "round": 2,
                  "nsScore": 120,
                  "__type": "BoardPlay"
                }
              ],
              [
                2,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 2,
                  "ewPair": 1,
                  "round": 8,
                  "nsScore": 0,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                2
              ],
              [
                5,
                0
              ],
              [
                4,
                1
              ],
              [
                3,
                1
              ],
              [
                2,
                0
              ],
              [
                1,
                2
              ]
            ]
          },
          "bdnum": 17,
          "vulNS": false,
          "vulEW": false,
          "dealer": "E",
          "__type": "BoardObj"
        }
      ],
      [
        18,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 5,
                  "round": 9,
                  "nsScore": -420,
                  "__type": "BoardPlay"
                }
              ],
              [
                4,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 4,
                  "ewPair": 3,
                  "round": 2,
                  "nsScore": -420,
                  "__type": "BoardPlay"
                }
              ],
              [
                2,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 2,
                  "ewPair": 1,
                  "round": 8,
                  "nsScore": 500,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                0.5
              ],
              [
                5,
                1.5
              ],
              [
                4,
                0.5
              ],
              [
                3,
                1.5
              ],
              [
                2,
                2
              ],
              [
                1,
                0
              ]
            ]
          },
          "bdnum": 18,
          "vulNS": true,
          "vulEW": false,
          "dealer": "S",
          "__type": "BoardObj"
        }
      ],
      [
        19,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 5,
                  "round": 10,
                  "nsScore": -630,
                  "__type": "BoardPlay"
                }
              ],
              [
                3,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 3,
                  "ewPair": 1,
                  "round": 4,
                  "nsScore": -170,
                  "__type": "BoardPlay"
                }
              ],
              [
                4,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 4,
                  "ewPair": 2,
                  "round": 6,
                  "nsScore": -690,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                1
              ],
              [
                5,
                1
              ],
              [
                3,
                2
              ],
              [
                1,
                0
              ],
              [
                4,
                0
              ],
              [
                2,
                2
              ]
            ]
          },
          "bdnum": 19,
          "vulNS": false,
          "vulEW": true,
          "dealer": "W",
          "__type": "BoardObj"
        }
      ],
      [
        20,
        {
          "boardPlays": {
            "__type": "Map",
            "__entries": [
              [
                6,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 6,
                  "ewPair": 5,
                  "round": 10,
                  "nsScore": -110,
                  "__type": "BoardPlay"
                }
              ],
              [
                3,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 3,
                  "ewPair": 1,
                  "round": 4,
                  "nsScore": -100,
                  "__type": "BoardPlay"
                }
              ],
              [
                4,
                {
                  "kindNS": "",
                  "kindEW": "",
                  "nsPair": 4,
                  "ewPair": 2,
                  "round": 6,
                  "nsScore": -100,
                  "__type": "BoardPlay"
                }
              ]
            ]
          },
          "allPlaysEntered": true,
          "pairToMpMap": {
            "__type": "Map",
            "__entries": [
              [
                6,
                0
              ],
              [
                5,
                2
              ],
              [
                3,
                1.5
              ],
              [
                1,
                0.5
              ],
              [
                4,
                1.5
              ],
              [
                2,
                0.5
              ]
            ]
          },
          "bdnum": 20,
          "vulNS": true,
          "vulEW": true,
          "dealer": "N",
          "__type": "BoardObj"
        }
      ]
    ]
  },
  "pairIdsNS": [
    1,
    2,
    3,
    4,
    5,
    6
  ],
  "pairIdsEW": [],
  "pairIds": [
    1,
    2,
    3,
    4,
    5,
    6
  ],
  "gameDataSetup": true,
  "earlyGameDataSetup": true,
  "pairNameMap": {
    "__type": "Map",
    "__entries": [
      [
        1,
        {
          "A": {
            "first": "Sam",
            "last": "Jones",
            "__type": "Person"
          },
          "B": {
            "first": "Lara",
            "last": "Jones",
            "__type": "Person"
          },
          "__type": "Pair"
        }
      ],
      [
        2,
        {
          "A": {
            "first": "Mary",
            "last": "Worth",
            "__type": "Person"
          },
          "B": {
            "first": "Peter",
            "last": "Worth",
            "__type": "Person"
          },
          "__type": "Pair"
        }
      ],
      [
        3,
        {
          "A": {
            "first": "Lisa",
            "last": "Dent",
            "__type": "Person"
          },
          "B": {
            "first": "Larry",
            "last": "Dent",
            "__type": "Person"
          },
          "__type": "Pair"
        }
      ],
      [
        4,
        {
          "A": {
            "first": "Carol",
            "last": "Boyer",
            "__type": "Person"
          },
          "B": {
            "first": "Roger",
            "last": "Boyer",
            "__type": "Person"
          },
          "__type": "Pair"
        }
      ],
      [
        5,
        {
          "A": {
            "first": "Dana",
            "last": "Royal",
            "__type": "Person"
          },
          "B": {
            "first": "Flora",
            "last": "Royal",
            "__type": "Person"
          },
          "__type": "Pair"
        }
      ],
      [
        6,
        {
          "A": {
            "first": "Sherry",
            "last": "Hays",
            "__type": "Person"
          },
          "B": {
            "first": "Ron",
            "last": "Hays",
            "__type": "Person"
          },
          "__type": "Pair"
        }
      ]
    ]
  },
  "isHowell": true,
  "phantomPair": 0,
  "__type": "GameDataService"
}
`;

    }
    

});
