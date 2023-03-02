import { Component } from '@angular/core';

const undefScore: number = 9999;


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {
    myTitle:string = 'my-app';
    myPhrase:string = 'this is funny';
    blanks: string = '  ';
    myArray: ScoreLine[] = [
        new ScoreLine(3,4,100),
        new ScoreLine(5,2),
        new ScoreLine(6,1,-200),
       ];

    nsString(nsScore:number): string {
        return (nsScore >=0 && nsScore !== undefScore? this.stringFor(nsScore) : this.blanks);
    }
    ewString(nsScore:number): string {
        return (nsScore <0 && nsScore !== undefScore ? this.stringFor(-1*nsScore) : this.blanks);
    }
    stringFor(score:number): string {
        return (score.toString()); 
    }
    
}

interface ScoreLine {
    constructor : Function,
    nsPair : number,
    ewPair : number,
    score  : number,
}

class ScoreLine {
    constructor(nsPair : number,
                ewPair : number,
                score : number = undefScore) {
        this.nsPair = nsPair;
        this.ewPair = ewPair;
        this.score = score;
    }
}



