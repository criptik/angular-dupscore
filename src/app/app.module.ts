import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { Ng2CompleterModule } from 'ng2-completer';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ScoreEntryComponent, AutofocusDirective } from './score-entry/score-entry.component';
import { GameDataComponent } from './game-data/game-data.component';
import { GameDataService } from './game-data/game-data.service';
import { GameSummaryComponent } from './game-summary/game-summary.component';
import { NamesEntryComponent } from './names-entry/names-entry.component';

@NgModule({
    declarations: [
        AppComponent,
        ScoreEntryComponent,
        GameDataComponent,
        AutofocusDirective,
        GameSummaryComponent,
        NamesEntryComponent,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        Ng2CompleterModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
