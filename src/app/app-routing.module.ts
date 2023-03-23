import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScoreEntryComponent } from './score-entry/score-entry.component';
import { GameDataComponent } from './game-data/game-data.component';

const routes: Routes = [
    { path: 'status',        component: GameDataComponent },
    { path: 'score',        component: ScoreEntryComponent },
    { path: '',   redirectTo: '/status', pathMatch: 'full' },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
