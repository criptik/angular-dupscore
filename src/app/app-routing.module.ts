import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScoreEntryComponent } from './score-entry/score-entry.component';
import { GameDataComponent } from './game-data/game-data.component';
import { GameSummaryComponent } from './game-summary/game-summary.component';

const routes: Routes = [
    { path: 'status',        component: GameDataComponent },
    { path: 'score',        component: ScoreEntryComponent },
    { path: 'summary',      component: GameSummaryComponent },
    { path: '',   redirectTo: '/status', pathMatch: 'full' },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
