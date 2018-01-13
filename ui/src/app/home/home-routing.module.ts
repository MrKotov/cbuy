import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./home.component";
import { GalleryComponent } from "./gallery/gallery.component";
import { SavedSearchesComponent } from "./saved-searches/saved-searches.component";
import { UserComponent } from "./user/user.component";
import { AuthGuard } from "../guards/auth.guard";
import { NewSearchComponent } from "./new-search/new-search.component";

const homeRoutes: Routes = [
    {
        path: 'home', canActivate: [AuthGuard], component: HomeComponent,
        children: [
            { path: 'gallery', component: GalleryComponent },
            { path: 'savedsearches', component: SavedSearchesComponent },
            { path: 'newsearch', component: NewSearchComponent },
            { path: 'user', component: UserComponent },
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(homeRoutes)
    ],
    exports: [RouterModule]
})
export class HomeRoutingModule {

}