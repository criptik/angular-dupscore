
# Overview

Angular-Dupscore is a web app that facilitates scoring of home
duplicate bridge games.  It handles a very small but still useful
subset of the functionality of the American Contract Bridge League's
Acblscore program. It's advantage is that it will run on any web
browser and does not depend on the operating system or the processor
architecture, whereas acblscore is a Windows program tied to the x64
processor architecture.

## Functions
Here is a list of what you can do with Angular-dupscore.

* Setup a game, choosing a movement, a number of boards and whether or not there is a phantom pair.  You can also return to a game that had already been played, or delete a game record.

* Enter player names for each pair.  You can also swap pairs.

* Enter the results from the traveller for each board.  When entering
  numeric scores directly, the way the results are entered and the
  keystrokes used matches the way it is done in acblscore.  For
  example, just like in Acblscore, you enter a score without the last
  zero.  And just like in acblscore, hitting return duplicates the previously entered score.  There is, however, support for an alternate method of result
  entry where you enter the contract and result instead of just the
  score.  The following formats are supported for the Contract+Result entry.  It
  must have the following parts: "level suit  dblstate><decl><result>"
  * level=1-7
  * suit is SHDC or N or NT (both are accepted)
  * dblstate is either empty or '*' (doubled) or '**' (redoubled)
  * decl is NSEW
  * result part supports
     * = for a contract made exactly
     * +num for that number of overtricks
     * -num for that number down
     * a number without a plus or minus indicates how many tricks were made (after the first 6).  Examples:
        * 2SW=    2 spades by west made exactly
        * 2S*W-1  2 spades doubled by west, down 1
        * 2SE+1   2 spades by East, made 3
        * 2SE3    another way of entering 2 spades by east making 3

* Note: When a contract/result is used to enter the score (instead of just the numeric score entry), the contract/result is shown in the score-entry and score-review pages, as well as on the full report page.

* Review the scores that have been entered, similar to the F10 option in acblscore.

* Show who is leading (possible even when all the board results have not been entered yet).

* Get a board by board report at the end of the game, showing the final standings and the results and matchpoints for each pair on each board.

Things to note:
* only a few movements (for from 2-5 tables) are currently incorporated into the app, but more could be added if requested.

* When entering player names, pairs can be swapped using right-click (acblscore uses the F3 key for swapping pairs).

* No support for stratuses.

* No support for sending results to the ACBL.


# Development Notes

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.1.5.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

