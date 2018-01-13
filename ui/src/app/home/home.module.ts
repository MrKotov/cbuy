import { NgModule } from "@angular/core";
import { GalleryComponent } from "./gallery/gallery.component";
import { UserComponent } from "./user/user.component";
import { CommonModule } from "@angular/common";
import { TopNavbarComponent } from "./top-navbar/top-navbar.component";
import { HomeRoutingModule } from "./home-routing.module";
import { HomeComponent } from "./home.component";
import { HttpClientModule } from "@angular/common/http";
import { ReactiveFormsModule } from "@angular/forms";
import { NewSearchComponent } from "./new-search/new-search.component";
import { OffersTableComponent } from "./new-search/offers-table/offers-table.component";
import { PictureObjectPassingService } from "../services/picture-object-passing.service";
import { FetchOlxOffersService } from "../services/fetch-olx-offers.service";
import { PaginationService } from "../services/pagination.service";
import { SavedSearchesComponent } from "./saved-searches/saved-searches.component";



@NgModule({
    declarations: [
        TopNavbarComponent,
        GalleryComponent,
        UserComponent,
        NewSearchComponent,
        OffersTableComponent,
        SavedSearchesComponent,     
        HomeComponent,
        
    ],
    imports: [
        ReactiveFormsModule,
        CommonModule,
        HomeRoutingModule,
        HttpClientModule
    ],
    providers: [PictureObjectPassingService, FetchOlxOffersService, PaginationService]
})

export class HomeModule {}