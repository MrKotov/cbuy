import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './services/auth.service';
import { RegisterComponent } from './register/register.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { LoginRegisterComponent } from './shared/login-register/login-register.component';
import { HomeModule } from './home/home.module';
import { HomeComponent } from './home/home.component';
import { PictureObjectPassingService } from './services/picture-object-passing.service';
import { FetchSavedSearchesService } from './services/fetch-saved-searches.service';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    NotFoundComponent,
    LoginRegisterComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HomeModule,
    AppRoutingModule,
  ],
  providers: [AuthGuard, AuthService, PictureObjectPassingService, FetchSavedSearchesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
