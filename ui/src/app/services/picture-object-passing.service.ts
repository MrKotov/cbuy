import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";

@Injectable()
export class PictureObjectPassingService {
    
    private pictureObject: any;

    setPictureObject(pictureObj) {
        this.pictureObject = pictureObj;
    }
    getPictureObject() {
        return this.pictureObject;
    }
}