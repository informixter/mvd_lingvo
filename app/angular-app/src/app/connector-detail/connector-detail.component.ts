import {Component, Input, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {MainService} from "../main.service";
import {Subscription} from "rxjs";

declare var window : any;

@Component({
	selector: 'app-connector-detail',
	templateUrl: './connector-detail.component.html',
	styleUrls: ['./connector-detail.component.scss']
})
export class ConnectorDetailComponent implements OnInit, OnDestroy
{

	@Input() connectorForEdit : any;
	@Output() onBack = new EventEmitter();

	type = '';

	shift = false;
	ctrl = true;
	alt = false;
	key = "";

	recordShortcut = false;
	remote = window.require('electron').remote;

	subscription : Subscription;
	alpha = [];

	constructor (private service : MainService, private cdr : ChangeDetectorRef)
	{
		this.subscription = this.service.settingsUpdated$.subscribe(newSettings =>
		{
			setTimeout(() => this.cdr.markForCheck(), 1000);
		});

		function genCharArray(charA, charZ) {
			var a = [], i = charA.charCodeAt(0), j = charZ.charCodeAt(0);
			for (; i <= j; ++i) {
				a.push(String.fromCharCode(i));
			}
			return a;
		}

		this.alpha = [...genCharArray('A', 'Z'), ...genCharArray('0', '9')];
	}

	ngOnInit () : void
	{
		if (!this.connectorForEdit)
		{
			return;
		}

		this.type = this.connectorForEdit.type;
		this.shift = this.connectorForEdit.shift;
		this.alt = this.connectorForEdit.alt;
		this.ctrl = this.connectorForEdit.ctrl;
		this.key = this.connectorForEdit.key;
	}

	toggleShortcutRecord ()
	{
		this.recordShortcut = !this.recordShortcut;

		/*this.remote.getCurrentWindow().webContents.on("before-input-event", (_, event) =>
		{
			if (!this.recordShortcut)
			{
				return;
			}

			let shift = event.shift,
				control = event.control || event.meta,
				alt = event.alt,
				key = event.key.toUpperCase();

			if (!key.match(/^[A-z0-9]$/))
			{
				return
			}

			this.shortcut = `${shift ? 'Shift+' : ''}${control ? 'Ctrl+' : ''}${alt ? 'Alt+' : ''}${key}`;
			this.recordShortcut = false;
			this.service.settingsUpdatedSource.next(this.service.settings);

		});*/

	}

	submit ()
	{
		let result = false;
		if (this.connectorForEdit)
		{
			result = this.edit();
		}
		else
		{
			result = this.add();
		}

		if (!result)
		{
			return;
		}

		this.service.saveSettings();
		this.onBack.emit();
	}

	edit ()
	{
		let connectors = this.service.settings.connectors;

		connectors = connectors.map(connector =>
		{
			if (connector.id === this.connectorForEdit.id)
			{
				return {
					...connector,
					type : this.type.trim(),
					shift : this.shift,
					alt : this.alt,
					ctrl : this.ctrl,
					key : this.key.trim(),
				}
			}

			return connector;
		});

		this.service.settings = {...this.service.settings, connectors};
		return true;
	}

	add ()
	{
		let connector = {
			id : Math.random() * 1000000,
			enabled : true,
			type : this.type.trim(),
			shift : this.shift,
			alt : this.alt,
			ctrl : this.ctrl,
			key : this.key.trim(),
		};

		if (connector.type === '' || connector.key === '')
		{
			return;
		}

		this.service.settings = {...this.service.settings, connectors : [...this.service.settings.connectors, connector]};
		return true;
	}

	test ()
	{

	}

	ngOnDestroy(): void
	{
		this.recordShortcut = false;
		this.subscription && this.subscription.unsubscribe();
	}
}
