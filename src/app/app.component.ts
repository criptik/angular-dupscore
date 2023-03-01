import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    myTitle:string = 'my-app';
    myPhrase:string = 'this is funny';
    undefScore: number = 9999;
    blanks: string = '  ';
    myArray:(number)[] = [100,-200,50, this.undefScore, -420];

    nsString(nsScore:number): string {
        return (nsScore >=0 && nsScore !== this.undefScore? this.stringFor(nsScore) : this.blanks);
    }
    ewString(nsScore:number): string {
        return (nsScore <0 && nsScore !== this.undefScore ? this.stringFor(-1*nsScore) : this.blanks);
    }
    stringFor(score:number): string {
        return (score.toString()); 
    }
    
}

