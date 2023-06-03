import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { Ng2CompleterModule } from 'ng2-completer';
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

@NgModule({
    declarations: [
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
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        Ng2CompleterModule,
        FormsModule,
        ReactiveFormsModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
