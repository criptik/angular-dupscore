import { Component, Input, OnInit, OnChanges } from '@angular/core';

@Component({
  selector: 'app-suit-colorizer',
  templateUrl: './suit-colorizer.component.html',
  styleUrls: ['./suit-colorizer.component.css']
})

export class SuitColorizerComponent implements OnInit, OnChanges {
    @Input() inputStr:string = '';

    firstPart: string = '';
    secondPart: string = '';
    redPart: string = '';
    
    ngOnInit() {
    }
    
    ngOnChanges() {
        // parse out the diamond suit character, if any, into red part 
        const regex:RegExp = /(?<firstPart>.*)(?<redPart>\u2665|\u2666+)(?<secondPart>.*)/;
        const matchOutput:RegExpMatchArray|null = regex.exec(this.inputStr);
        // console.log('matchOutput', matchOutput);
        if (matchOutput && matchOutput.groups) {
            this.firstPart = matchOutput!.groups!['firstPart'];
            this.secondPart = matchOutput!.groups!['secondPart'];
            this.redPart = matchOutput!.groups!['redPart'];
        }
        else {
            this.firstPart = this.inputStr;
            this.secondPart = '';
            this.redPart = '';
        }
        // console.log(`parts: ${this.firstPart}, ${this.redPart}, ${this.secondPart}`);
    }
        
}
