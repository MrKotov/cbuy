import { Component } from "@angular/core";
import { Router } from "@angular/router";

@Component({
    selector: 'top-navbar',
    templateUrl: 'top-navbar.component.html',
    styleUrls:[ '../home.component.css']
})
export class TopNavbarComponent {
    constructor(private router: Router) {
        
    }
}