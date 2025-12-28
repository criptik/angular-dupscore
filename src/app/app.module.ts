import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
// import { Ng2CompleterModule } from 'ng2-completer';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ScoreEntryComponent, ScoreReviewComponent, AutofocusDirective } from './score-entry/score-entry.component';
import { GameDataComponent } from './game-data/game-data.component';
import { GameDataService } from './game-data/game-data.service';
import { GameSummaryComponent } from './game-summary/game-summary.component';
import { GameSetupComponent } from './game-setup/game-setup.component';
import { NamesEntryComponent, NativeElementInjectorDirective } from './names-entry/names-entry.component';
import { DeleterDialogComponent } from './deleter-dialog/deleter-dialog.component';
import { NameDataComponent } from './name-data/name-data.component';
import { SuitColorizerComponent } from './suit-colorizer/suit-colorizer.component';
import { PairpairTableComponent } from './game-summary/tables/pairpair-table/pairpair-table.component';
import { TravellersTableComponent } from './game-summary/tables/travellers-table/travellers-table.component';

@NgModule({ declarations: [
    AppComponent,
    ScoreEntryComponent,
    ScoreReviewComponent,
    GameDataComponent,
    AutofocusDirective,
    GameSummaryComponent,
    GameSetupComponent,
    NamesEntryComponent,
    NativeElementInjectorDirective,
    DeleterDialogComponent,
    NameDataComponent,
    SuitColorizerComponent,
    PairpairTableComponent,
    TravellersTableComponent,
],
            bootstrap: [AppComponent], imports: [BrowserModule,
                                                 AppRoutingModule,
                                                 //        Ng2CompleterModule,
                                                 FormsModule,
                                                 ReactiveFormsModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
