import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['../shared/shared.component.css']
})
export class RegisterComponent implements OnInit{

    registerForm: FormGroup;
    constructor() {

    }

    ngOnInit(): void {
        this.registerForm = new FormGroup({
            'username': new FormControl(null, [Validators.required, Validators.email]),
            'password': new FormControl(null, Validators.required)
        })
    }

    onSubmit() {
        console.log('submitted.')
    }

}