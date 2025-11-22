import { Component, Input, OnInit, OnChanges } from '@angular/core';

@Component({
  selector: 'app-suit-colorizer',
  templateUrl: './suit-colorizer.component.html',
  styleUrls: ['./suit-colorizer.component.css']
})

export class SuitColorizerComponent implements OnInit, OnChanges {
    @Input() inputStr:string = '';
    @Input() colorizeBlack:boolean = false;
    @Input() useBreak:boolean = false;

    firstPart: string = '';
    secondPart: string = '';
    redPart: string = '';
    blackPart: string = '';
    
    ngOnInit() {
    }
    
    ngOnChanges() {
        // parse out the suit characters, if any
        // hearts and diamonds
        const redSuitChars:string = '\u2665|\u2666';  
        // clubs and spades conditionally included
        const blackSuitChars:string = '|\u2660|\u2663';
        const regexStr:string = `(?<firstPart>.*)(?<suitChar>${redSuitChars}${blackSuitChars}+)(?<secondPart>.*)`;
        const regex:RegExp = new RegExp(regexStr);
        const matchOutput:RegExpMatchArray|null = regex.exec(this.inputStr);
        // console.log(`matchOutput=`, matchOutput, regexStr);
        if (matchOutput && matchOutput.groups) {
            this.firstPart = matchOutput!.groups!['firstPart'];
            this.secondPart = matchOutput!.groups!['secondPart'];
            const suitChar: string = matchOutput!.groups!['suitChar'];
            if (redSuitChars.includes(suitChar)) {
                this.redPart = `${suitChar}`
                this.blackPart = '';
            }
            else if (blackSuitChars.includes(suitChar)) {
                this.blackPart = `${suitChar}`
                this.redPart = '';
            }
        }
        else {
            // did not match suit pattern
            this.firstPart = this.inputStr;
            this.secondPart = '';
            this.redPart = '';
            this.blackPart = '';
        }
        // console.log(`parts: ${this.firstPart}, ${this.redPart}, ${this.blackPart}, ${this.secondPart}`);
    }
        
}
