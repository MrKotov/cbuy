import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { PictureObjectPassingService } from '../../services/picture-object-passing.service';
import { FetchOlxOffersService } from '../../services/fetch-olx-offers.service';
import { Location } from '@angular/common';
import { PaginationService } from '../../services/pagination.service';
import { FetchSavedSearchesService } from '../../services/fetch-saved-searches.service';

@Component({
    selector: 'app-home-new-search',
    templateUrl: './new-search.component.html',
    styleUrls: ['new-search.component.css']
})

export class NewSearchComponent {


    private pictureObj: any;
    src = '';
    tags = '';
    id = '';

    private fetchOffersUrl = '/olx/bg'
    private fetchSavedSearchesUrl = '/savedsearches'

    private savedSearches = [];

    private fetchedOlxOffers = [];

    private allOffers = [];
    private nextPageOffers = 1;
    private lastPageOffers = 1;

    pager: any = {};
    pagedOffers: any = [];

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private pictureObjectPassingService: PictureObjectPassingService,
        private fetchSavedSearchesService: FetchSavedSearchesService,
        private fetchOlxOffersService: FetchOlxOffersService,
        private paginationService: PaginationService,
        private location: Location) {
        this.pictureObj = pictureObjectPassingService.getPictureObject();

        if (this.pictureObj && this.pictureObj.id && this.pictureObj.src && this.pictureObj.tags) {
            this.id = this.pictureObj.id;
            this.src = this.pictureObj.src;
            this.tags = this.pictureObj.tags;
            if (this.fetchedOlxOffers.length === 0) {
                this.fetchSavedSearchesService.fetchSavedSearches(this.fetchSavedSearchesUrl, this.id).subscribe(
                    (savedSearches) => {
                        this.savedSearches = savedSearches;
                        this.fetchOlxOffersService.fetchOlxData(this.fetchOffersUrl, this.tags, '1').subscribe(
                            (data) => {
                                this.fetchedOlxOffers = data.offersArray;
                                if(this.nextPageOffers === this.lastPageOffers) {
                                    this.nextPageOffers = data.offerNextPage;
                                    this.lastPageOffers = parseInt(data.offersLastPage) * data.offersArray.length;
                                } else {
                                    this.nextPageOffers = data.offerNextPage;
                                    this.lastPageOffers = parseInt(data.offersLastPage) * 45;    
                                }
                               
                                for (let i = 0; i < data.offersLastPage; ++i) {
                                    this.allOffers.push([]);
                                }

                                for (let offer of this.fetchedOlxOffers) {
                                    for (let item of savedSearches) {
                                        if (item.olxsrc === offer.offerUrl) {
                                            offer.isSaved = true;
                                        }
                                    }
                                }

                                this.allOffers[0] = this.fetchedOlxOffers;
                                this.setPage(1);
                            },

                            (error) => {
                                console.log('Failed to fetch olx offers!\nError: ' + JSON.stringify(error))
                            }
                        )
                    },
                    (error) => {
                        console.log('Failed to fetch saved searches!');
                        this.fetchOlxOffersService.fetchOlxData(this.fetchOffersUrl, this.tags, '1').subscribe(
                            (data) => {
                                console.log(data)
                                this.fetchedOlxOffers = data.offersArray;
                                this.fetchedOlxOffers = data.offersArray;
                                if(this.nextPageOffers === this.lastPageOffers) {
                                    this.nextPageOffers = data.offerNextPage;
                                    this.lastPageOffers = parseInt(data.offersLastPage) * data.offersArray.length;
                                } else {
                                    this.nextPageOffers = data.offerNextPage;
                                    this.lastPageOffers = parseInt(data.offersLastPage) * 45;    
                                }

                                for (let i = 0; i < data.offersLastPage; ++i) {
                                    this.allOffers.push([]);
                                }
                                this.allOffers[0] = this.fetchedOlxOffers;
                                this.setPage(1);
                            },
                            (error) => {
                                console.log('Failed to fetch olx offers!\nError: ' + JSON.stringify(error));
                            }
                        )
                    })
            }
        } else {
            router.navigateByUrl('/home/gallery')
        }
    }

    saveSearch() {

    }


    setPage(page: number) {
        let startIndex;
        let startIndexNormalizedValue;

        if (page < 1 || page > this.pager.totalPages) {
            return;
        }

        // get current page of items
        try {
            this.pager = this.paginationService.getPager(this.lastPageOffers, page);
            let offerInfo = this.privateGetCurrentOffersByPage(page);
            let currentOfferSubarray = offerInfo.offerArray;
            let index = offerInfo.olxPage;
            let mpage = index + 1;
            if (currentOfferSubarray.length === 0) {
                this.fetchOlxOffersService.fetchOlxData(this.fetchOffersUrl, this.tags, mpage.toString()).subscribe(
                    (data) => {
                        this.fetchedOlxOffers = data.offersArray;
                        this.nextPageOffers = data.offerNextPage;
                        this.allOffers[index] = this.fetchedOlxOffers;
                        
                        if(this.savedSearches) {
                            for (let offer of this.fetchedOlxOffers) {
                                for (let item of this.savedSearches) {
                                    if (item.olxsrc === offer.offerUrl) {
                                        offer.isSaved = true;
                                    }
                                }
                            }
                        }
                        startIndex = this.pager.startIndex === 45 ? 0 : this.pager.startIndex;
                        startIndexNormalizedValue = this.normalizePageInterval(startIndex);
                        startIndexNormalizedValue = startIndexNormalizedValue === 45 ? 0 : startIndexNormalizedValue;
                        this.pagedOffers = this.allOffers[index]
                            .slice(
                            this.normalizePageInterval(startIndexNormalizedValue),
                            this.normalizePageInterval(this.pager.endIndex + 1));
                    },
                    (error) => {
                        console.log('Failed to fetch olx offers!\nError: ' + JSON.stringify(error));
                    }
                )
            } else {
                startIndex = this.pager.startIndex === 45 ? 0 : this.pager.startIndex;
                startIndexNormalizedValue = this.normalizePageInterval(startIndex);
                startIndexNormalizedValue = startIndexNormalizedValue === 45 ? 0 : startIndexNormalizedValue;
                this.pagedOffers = currentOfferSubarray.
                    slice(
                    this.normalizePageInterval(startIndexNormalizedValue),
                    this.normalizePageInterval(this.pager.endIndex + 1));
            }

        } catch (e) {
            console.log('Exception: ' + e)
        }



    }

    private privateGetCurrentOffersByPage(page: number) {
        let currentPage = page;
        let index;
        if (currentPage % 9 === 0) {
            index = currentPage / 9 - 1;
        } else {
            index = Math.trunc(currentPage / 9);
        }
        return { olxPage: index, offerArray: this.allOffers[index] };
    }

    goBack() {
        this.location.back();
    }

    private normalizePageInterval(index) {
        // the range is from 0 to 45
        if (index >= 0 && index <= 45) {
            return index;
        }
        for (let i = 0; i <= index; ++i) {
            if (index - 45 > 0) {
                index -= 45;
            } else {
                break;
            }
        }
        return index;
    }
}
