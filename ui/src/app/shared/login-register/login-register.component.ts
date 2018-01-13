import { Component } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";

@Component({
    selector: 'app-login-register',
    templateUrl: './login-register.component.html',
    styleUrls: ['../shared.component.css']
})
export class LoginRegisterComponent {
    constructor(private router: Router, private activatedRoute: ActivatedRoute){}
}