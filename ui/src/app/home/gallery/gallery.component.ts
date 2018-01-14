import { Component, ViewChild, ElementRef, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { FormGroup, Validators, FormControl } from "@angular/forms";
import { PictureObjectPassingService } from "../../services/picture-object-passing.service";


@Component({
    selector: 'app-home-gallery',
    templateUrl: 'gallery.component.html',
    styleUrls: ['gallery.component.css']
})
export class GalleryComponent implements OnInit {

    private imagesUrl = '/gallery/images'
    uploadForm: FormGroup;
    userPicturesArray: any = [];
    pictureObject;

    @ViewChild('fileInput') fileInput: ElementRef;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private httpClient: HttpClient,
        private PictureObjectPassingService: PictureObjectPassingService,
    ) { }

    ngOnInit(): void {
        this.uploadForm = new FormGroup({
            'name': new FormControl(null),
            'fileInput': new FormControl(null)
        })
        this.loadFromServer()
    }
    ngOnDestroy(): void {
    }

    onFileChange(event) {
        if (event.target.files.length > 0) {
            let file = event.target.files[0];
            this.uploadForm.get('fileInput').setValue(file);
            this.onSubmit()
        }
    }

    private prepareSave(): any {
        let input = new FormData();
        input.append('name', this.uploadForm.get('fileInput').value.name);
        input.append('fileInput', this.uploadForm.get('fileInput').value);
        input.append('useruuid', 'someuseruuid');
        return input;
    }

    onSubmit() {
        const formModel = this.prepareSave();
        this.httpClient.post('/gallery/fileupload', formModel, {
        }).subscribe(
            (data: any) => {
                this.loadFromServer();
                this.clearFile();
            },
            (error) => {
                this.clearFile();
            })
    }

    clearFile() {
        this.uploadForm.get('fileInput').setValue(null);
        this.fileInput.nativeElement.value = '';
    }

    loadFromServer() {
        if (this.userPicturesArray.length === 0) {
            let params = { useruuid: '0d6ceea0-f39c-11e7-b16f-6d2c86545d91' }
            this.httpClient.get(this.imagesUrl, {
                params: params
            }).subscribe(
                (data: any) => {
                    if (data.error) {
                    } else {
                        this.userPicturesArray = data.imagesArray;
                    }
                },
                (error) => {
                    console.log('get error: ' + error)
                })
        }
    }

    deletePicture(pictureObject) {
        let params = {
            uuid: pictureObject.id,
            useruuid: 'someid',
            imageName: pictureObject.name
        }
        this.httpClient.post(this.imagesUrl, {
            params: params
        }).subscribe(
            (data) => {
                this.userPicturesArray = this.userPicturesArray.filter((image) => {
                    return image !== pictureObject;
                })
            },
            (error) => {
                console.log(error)
            })
    }


    goToNewSearch(pictureObject) {
        this.PictureObjectPassingService.setPictureObject(pictureObject);
    }

    goToSavedSearches(pictureObject) {
        this.PictureObjectPassingService.setPictureObject(pictureObject);
    }
}

