import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export async function readAssetText(path: string, httpClient: HttpClient): Promise<string> {
    return await lastValueFrom(httpClient.get(path, { responseType: 'text' }));
}

export function ignoreWhiteSpace(str: string): string {
    return str.replace(/\s/g, '');
}

