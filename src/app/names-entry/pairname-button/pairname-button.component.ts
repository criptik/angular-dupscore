import { Component, Host, Input } from '@angular/core';
import { NamesEntryComponent } from '../names-entry.component';

@Component({
    selector: 'app-pairname-button',
    templateUrl: './pairname-button.component.html',
    styleUrls: ['./pairname-button.component.css']
})

export class PairnameButtonComponent {
    @Input() pairnum: number = 0;
    @Input() nameStr: string = '';
    
    constructor(@Host() public parent: NamesEntryComponent) {
        // console.log('PairnameButton constructor', parent, 'swapPairFirst=', parent.swapPairFirst);
    }

    ngOnInit() {
    }

    absPairnum(pairnum: number) {
        return Math.abs(pairnum);
    }
    
}
