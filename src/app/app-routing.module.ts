import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NamesEntryComponent } from './names-entry/names-entry.component';
import { ScoreEntryComponent } from './score-entry/score-entry.component';
import { GameDataComponent } from './game-data/game-data.component';
import { GameSummaryComponent } from './game-summary/game-summary.component';
import { GameSetupComponent } from './game-setup/game-setup.component';

const routes: Routes = [
    { path: 'setup',        component: GameSetupComponent },
    { path: 'status',       component: GameDataComponent },
    { path: 'names',        component: NamesEntryComponent },
    { path: 'score',        component: ScoreEntryComponent },
    { path: 'summary',      component: GameSummaryComponent },
    { path: '',   redirectTo: '/status', pathMatch: 'full' },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
