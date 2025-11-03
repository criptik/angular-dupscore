import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export class AssetFileReader {
    path: string;
    str: string = '';
    constructor(path: string) {
        this.path = path;
    }
    
    async get(httpClient: HttpClient) {
        if (this.str.length === 0) {
            this.str = await lastValueFrom(httpClient.get(this.path, { responseType: 'text' }));
        }
    }
}
