import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {MainService} from "../main.service";

@Component({
	selector: 'app-auth',
	templateUrl: './auth.component.html',
	styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit
{

	constructor (private service : MainService)
	{
	}

	@Output() onAuth = new EventEmitter<any>();

	email = '';
	password = '';

	ngOnInit () : void
	{
	}

	login ()
	{
		this.service.login(this.email, this.password).subscribe(response => {
			if (!response.access_token)
			{
				throw new Error("Не удалось войти");
			}

			this.onAuth.emit({
				accessToken: response.access_token,
				email: this.email
			});

		}, err => alert("Произошла ошибка. " + err));
	}
}
