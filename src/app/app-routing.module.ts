import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NamesEntryComponent } from './names-entry/names-entry.component';
import { ScoreEntryComponent, ScoreReviewComponent } from './score-entry/score-entry.component';
import { GameDataComponent } from './game-data/game-data.component';
import { GameSummaryComponent } from './game-summary/game-summary.component';
import { GameSetupComponent } from './game-setup/game-setup.component';
import { NameDataComponent } from './name-data/name-data.component';

const routes: Routes = [
    { path: 'setup',               component: GameSetupComponent },
    { path: 'setup/:action',       component: GameSetupComponent },
    { path: 'status',       component: GameDataComponent },
    { path: 'names',        component: NamesEntryComponent },
    { path: 'score',        component: ScoreEntryComponent },
    { path: 'score-review', component: ScoreReviewComponent },
    { path: 'report',      component: GameSummaryComponent },
    { path: 'report/:size',      component: GameSummaryComponent },
    { path: 'namedata',               component: NameDataComponent },
    { path: 'namedata/:action',       component: NameDataComponent },
    { path: '',   redirectTo: '/status', pathMatch: 'full' },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
