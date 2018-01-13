import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";

@Injectable()
export class FetchOlxOffersService {

    private olxData: any [];
    private timeout = 10*1000;
    constructor(private httpClient: HttpClient) {

    }

    fetchOlxData(url, tags, page): Observable<any>  {
        let params = new HttpParams().
        set('tags', tags)
        .set('page', page);
        return this.httpClient
        .get(url, { params: params })
    //     .map((res: Response) => {
    //         console.log(res.json())
    //         res.json()
    //     })
    //     .catch((err: HttpErrorResponse) => {
    //         console.log(err)
    //         throw Observable.throw(err)
    //         });
    }
}
