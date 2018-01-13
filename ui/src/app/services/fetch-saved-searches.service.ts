import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class FetchSavedSearchesService {

    private savedSearchesData: any[];
    private timeout  = 5*1000;
    constructor(private httpClient: HttpClient) {

    }

    fetchSavedSearches(url, pictureId): Observable<any> {
        let params = new HttpParams().set('id', pictureId);
        return this.httpClient
        .get(url, { params: params, headers: new HttpHeaders({ timeout: `${this.timeout}` })})
        .map((res: Response) => {
            res.json()
        })
        .catch((err: HttpErrorResponse) => {
            throw Observable.throw(err)
            });
    }
}