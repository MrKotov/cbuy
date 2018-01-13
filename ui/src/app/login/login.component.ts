import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ["../shared/shared.component.css"]
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;

    ngOnInit(): void {
        this.loginForm = new FormGroup({
            'username': new FormControl(null, [Validators.required, Validators.email]),
            'password': new FormControl(null, Validators.required)
        })
    }

    onSubmit(): void {
        console.log('submitted')
    }




}