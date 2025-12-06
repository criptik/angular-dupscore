import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { GameDataService, Person, Pair } from '../game-data/game-data.service';
import { NameDataService } from '../name-data/name-data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { DeleterDialogComponent } from '../deleter-dialog/deleter-dialog.component';

@Component({
    selector: 'app-name-data',
    templateUrl: './name-data.component.html',
    styleUrls: ['./name-data.component.css'],
    standalone: false
})
export class NameDataComponent implements AfterViewInit {
    allNamesList: Person[] = [];
    action: string = '';
    @ViewChild('deleterDialogComponent') deleterDialogComponent!: DeleterDialogComponent;
    
    constructor (
        public nameDataPtr: NameDataService,
        private _router: Router,
        private _route: ActivatedRoute,) {
        this._router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
        };
        this._route.params.subscribe( params => {
            this.action = params['action'] ?? '';
        });
        // console.log('action:', this.action);
    }

    ngAfterViewInit() {
        if (this.action === 'import') {
           alert("Not Implemented Yet");
        } else if (this.action === 'delete') {
            setTimeout(() => {
                this.deleteNamesSetup();
            }, 0);
        }
    }

    deleteNamesSetup() {
        this.allNamesList = this.nameDataPtr.getAllNamesList();
        const allNamesStrings: string[] = this.allNamesList.map( (person) => person.toStringLastFirst()).sort();
        // console.log('before startDialog', allNamesStrings);
        this.deleterDialogComponent.startDialog(allNamesStrings, 'Name');
        // console.log('after startDialog');
    }

    onDeleteGameFormCompleted(deletedList: string[]) {
        // console.log('in onDeleteGameFormCompleted', deletedList);
        deletedList.forEach( key=> {
            // convert string to Person
            const parts: string[] = key.split(', ');
            const removablePerson = new Person(parts[1], parts[0]);
            this.allNamesList = this.allNamesList.filter( (person) => !person.matches(removablePerson));
            this.nameDataPtr.setAllNamesList(this.allNamesList);
            // console.log(key);
        });
        
        setTimeout(() => {
            this._router.navigate(["/namedata"]);
        });
    }    
    
    
}
