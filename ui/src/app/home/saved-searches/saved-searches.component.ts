import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { PaginationService } from '../../services/pagination.service';
import { DomSanitizer } from '@angular/platform-browser';
import { PictureObjectPassingService } from '../../services/picture-object-passing.service';
import { FetchSavedSearchesService } from '../../services/fetch-saved-searches.service';

@Component({
  selector: 'app-saved-searches',
  templateUrl: './saved-searches.component.html',
  providers: [FetchSavedSearchesService],
  encapsulation: ViewEncapsulation.None
})

export class SavedSearchesComponent implements OnInit {
  pager: any;
  private savedSearches: any = [];
  pagedSavedOffers = [];
  private pictureObj: any;
  src = '';
  tags = '';
  id = '';
  domSanitizer;
  private url = '';

  constructor(
    private router: Router,
    private paginationService: PaginationService,
    private pictureObjectPassingService: PictureObjectPassingService,
    private fetchSavedSearchesService: FetchSavedSearchesService,
    private _domSanitizer: DomSanitizer) {
    this.domSanitizer = _domSanitizer;
    this.pictureObj = pictureObjectPassingService.getPictureObject();
    if (this.pictureObj && this.pictureObj.id && this.pictureObj.src && this.pictureObj.tags) {

      this.id = this.pictureObj.id;
      this.src = this.pictureObj.src;
      this.tags = this.pictureObj.tags;
      if (!this.savedSearches) {
        fetchSavedSearchesService.fetchSavedSearches(this.url, this.id).subscribe(
          data => {
            this.savedSearches = data;
          },
          error => {
            console.log(error)
            router.navigateByUrl('/home/gallery')
          })
      }


    } else {
      router.navigateByUrl('/home/gallery')
    }
  }

  ngOnInit() {

  }

  setPage(page: number) {
    if (page < 1 || page > this.pager.totalPages) {
      return;
    }

    // get pager object from service
    this.pager = this.paginationService.getPager(this.savedSearches.length, page);

    // get current page of items
    this.pagedSavedOffers = this.savedSearches.slice(this.pager.startIndex, this.pager.endIndex + 1);
  }

}
