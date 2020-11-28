import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {APP_BASE_HREF} from "@angular/common";
import {AuthComponent} from './auth/auth.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {HeaderComponent} from './header/header.component';
import {FooterComponent} from './footer/footer.component';
import {LoaderComponent} from './loader/loader.component';
import {ErrorComponent} from './error/error.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {MainService} from "./main.service";
import {FormsModule} from "@angular/forms";
import {ErrorInterceptor} from "../error.interceptor";
import { ConnectorDetailComponent } from './connector-detail/connector-detail.component';
import {ConnectorTestComponent} from "./connector-test/connector-test.component";

@NgModule({
	declarations: [AppComponent, AuthComponent, DashboardComponent, HeaderComponent,
		FooterComponent, LoaderComponent, ErrorComponent, ConnectorDetailComponent, ConnectorTestComponent],
	imports: [BrowserModule, HttpClientModule, FormsModule],
	providers: [MainService, {
		provide: APP_BASE_HREF,
		useValue: '.'
	}, {
		provide: HTTP_INTERCEPTORS,
		useClass: ErrorInterceptor,
		multi: true
	}],
	bootstrap: [AppComponent]
})
export class AppModule
{
}
