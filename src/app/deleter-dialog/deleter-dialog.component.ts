import { Component, Output, Input, EventEmitter, AfterViewChecked } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ElementRef, ViewChild, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-deleter-dialog',
    templateUrl: './deleter-dialog.component.html',
    styleUrls: ['./deleter-dialog.component.css']
})
export class DeleterDialogComponent implements AfterViewChecked {
    @Input() nameList: string[] = [];
    @Input() nameKind: string = '';
    @Output() formCompleteEvent = new EventEmitter<string[]>();
    deletedList: string[] = [];
    deleteButtonMsg: string = 'Back';
    @ViewChild('deleteDialog') deleteDialog!: ElementRef<HTMLDialogElement>;
    
    
    deleteForm = new FormGroup({
    });

    constructor() {
        // console.log('in constructor');
        // this.fillDeleteForm();
    }

    ngOnChanges(changes: SimpleChanges) {
        // console.log('OnChanges', changes);
    }
    
    ngOnInit() {
        // console.log('DeleterDialog ngOnInit', this.deleteForm);
    }

    ngAfterViewInit() {
        // console.log('DeleterDialog ngAfterViewInit');
        this.fillDeleteForm();
        // this.changeDetectorRef.detectChanges();
    }

    ngAfterViewChecked() {
        // console.log('DeleterDialog ngAfterViewChecked');
        // this.changeDetectorRef.detectChanges();
    }

    startDialog(nameList: string[], nameKind: string) {
    // startDialog() {
        this.nameList = [...nameList];
        this.nameKind = nameKind;
        // console.log('entering startDialog', this.nameList);
        this.deletedList = [];
        this.fillDeleteForm();
        // console.log('before showModal', this.nameList, this.deleteForm);
        this.deleteDialog.nativeElement.showModal();
        this.deleteDialog.nativeElement.oncancel = () => {
            // console.log('DeleterDialog oncancel');
            this.formCompleteEvent.emit([]);
        };
    }
    

    fillDeleteForm() {
        this.deleteForm = new FormGroup({});
        this.nameList.forEach( name => {
            this.deleteForm.addControl(name, new FormControl(false));
        });
        this.deleteButtonMsg = 'Back';
    }

    onDeleteFormSubmit() {
        const formVal = this.deleteForm.value as {[key: string]: boolean};
        const keys: string[]  = Array.from(Object.keys(formVal));
        // console.log('onDeleteFormSubmit', keys);
        this.deletedList = [];
        keys.forEach( (key) => {
            if (formVal[key]) {
                this.deletedList.push(key);
            }
        });
        this.deleteDialog.nativeElement.close();
        this.formCompleteEvent.emit(this.deletedList);
    }
    
    onCheckChanged(e: any) {
        // console.log('onCheckChanged');
        const formVal = this.deleteForm.value as {[key: string]: boolean};
        const keys: string[]  = Array.from(Object.keys(formVal));
        let numChecked = 0;
        keys.forEach( (key) => {
            if (formVal[key]) {
                numChecked++;
            }
        });
        this.deleteButtonMsg = (numChecked === 0 ? 'Back' : `Delete Checked ${this.nameKind}s`);
    }

}
