import {Component, Input, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {MainService} from "../main.service";
import {environment} from "../../environments/environment";
import {Subscription} from "rxjs";

declare var window : any;

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy
{
	@Output() onNewConnector = new EventEmitter();
	@Output() openConnectorEdit = new EventEmitter();
	@Output() openConnectorTest = new EventEmitter();

	subscription : Subscription;

	constructor (public service : MainService, private cdr : ChangeDetectorRef)
	{
	}

	ngOnInit () : void
	{
		this.subscription = this.service.settingsUpdated$.subscribe(newSettings =>
		{
			setTimeout(() => this.cdr.markForCheck(), 1000);
		});
	}

	testConnector (connectorForEdit)
	{
		this.openConnectorTest.emit(connectorForEdit);
	}

	editConnector (connectorForEdit)
	{
		this.openConnectorEdit.emit(connectorForEdit);
	}

	deleteConnector (connectorForDelete)
	{
		if (!confirm("Вы действительно хотите удалить преобразователь?"))
		{
			return;
		}

		let connectors = this.service.settings.connectors.filter(connector => connector.id !== connectorForDelete.id);
		this.service.settings = {...this.service.settings, connectors};
		this.service.saveSettings();
	}

	toggleConnector (connectorForEdit, flag)
	{
		let connectors = this.service.settings.connectors;

		connectors = connectors.map(connector =>
		{
			if (connector.id === connectorForEdit.id)
			{
				return {
					...connector,
					enabled : flag
				}
			}

			return connector;
		});

		this.service.settings = {...this.service.settings, connectors};
		this.service.saveSettings();
	}

	ngOnDestroy(): void
	{
		this.subscription && this.subscription.unsubscribe();
	}

	getItemShortcut (connector)
	{
		return `${connector.shift ? 'Shift+' : ''}${connector.ctrl ? 'Ctrl+' : ''}${connector.alt ? 'Alt+' : ''}${connector.key}`;
	}
}

