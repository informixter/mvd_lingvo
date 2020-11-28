import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {MainService} from "../main.service";

declare var window : any;

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: [`./header.component.scss`]
})
export class HeaderComponent implements OnInit
{

	@Input() hideLogo = false;
	@Input() showBack = false;
	@Output() onLogout = new EventEmitter();
	@Output() toAuth = new EventEmitter();
	@Output() onBack = new EventEmitter();

	constructor (public service : MainService)
	{
	}

	ngOnInit () : void
	{
	}

	logout ()
	{
		this.onLogout.emit();
	}
}
