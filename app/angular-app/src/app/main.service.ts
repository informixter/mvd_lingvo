import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../environments/environment";
import {Subject} from "rxjs";
import {map} from "rxjs/operators";

declare var process : any;
declare var window : any;
const serve = process.env.ENV === 'dev';

const defaultSettings = {
	connectors: [
		{
			id : Math.random() * 1000000,
			enabled : true,
			type : 'FIRST_TO_THIRD',
			shift : false,
			alt : false,
			ctrl : true,
			key : "M",
		},
		{
			id : Math.random() * 1000000,
			enabled : true,
			type : 'GRAMMA',
			shift : false,
			alt : false,
			ctrl : true,
			key : "G",
		}
	],
	accessToken: null,
	email: null
};

@Injectable({
	providedIn: 'root'
})
export class MainService
{

	currentTokenSource = new Subject<any>();
	currentTokenUpdated$ = this.currentTokenSource.asObservable();

	settingsUpdatedSource = new Subject<any>();
	settingsUpdated$ = this.settingsUpdatedSource.asObservable();

	storage = window.require('electron-json-storage');
	token = null;

	connectorsIntervals = {};
	fs = window.require('fs');
	getSelectedText : Function = window.require('electron-selected-text').getSelectedText;
	globalShortcut = window.require('electron').globalShortcut;
	clipboard = window.require('electron').clipboard;
	remote = window.require('electron').remote;
	robotjs = window.require('robotjs');

	settings : any = defaultSettings;
	mystem = window.require('mystem3');

	constructor (private httpClient : HttpClient)
	{
	}

	getSettings ()
	{
		return new Promise<any>((resolve, reject) => {
			this.storage.get('connector-settings', (error, data) => {
				if (error)
				{
					reject(error);
				}

				resolve(data);
			});
		});
	}

	saveSettings (refreshTimers = true)
	{
		this.settingsUpdatedSource.next(this.settings);

		return new Promise<any>((resolve, reject) => {
			this.storage.set('connector-settings', this.settings, (error, data) => {
				if (error)
				{
					reject(error);
				}

				resolve(data);
				if (refreshTimers)
				{
					this.refreshConnectorsShortcuts();
				}
			});
		});

	}

	login (email, password)
	{
		return this.httpClient.post<any>(`${environment.apiEndpoint}/login`, JSON.stringify({
			email,
			password
		}), {headers: this.getHeaders()});
	}

	private getHeaders ()
	{
		if (this.token === null)
		{
			return new HttpHeaders({'Content-Type': 'application/json'});
		}
		else
		{
			return new HttpHeaders({
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + this.token
			})
		}
	}

	cancelConnectorsShortcuts ()
	{
		this.settings.connectors.forEach(connector =>
		{
			try
			{
				let shortcut = this.getConnectorShortcut(connector);
				this.remote.globalShortcut.unregister(shortcut);
			}
			catch (e)
			{

			}
		});
	}

	refreshConnectorsShortcuts ()
	{
		this.cancelConnectorsShortcuts();

		this.settings.connectors.filter(connector => connector.enabled).forEach(connector =>
		{
			let shortcut = this.getConnectorShortcut(connector);

			this.remote.globalShortcut.unregister(shortcut);

			let ret = this.remote.globalShortcut.register(shortcut, async () => {

				this.robotjs.keyTap('c', process.platform === 'darwin' ? 'command' : 'control');

				let text = this.clipboard.readText(),
					lines = text.split("\n"),
					i = 0;

				//console.log('text', text);

				for (const line of lines)
				{
					lines[i] = await (connector.type !== 'GRAMMA' ? this.convert1stTo3rd(line) : this.gramma(line));
					//console.log(lines[i]);
					i++;
				}

				let formattedText = lines.join("\n") + "\r";
				this.clipboard.writeText(formattedText);

				//console.log(formattedText);

				this.robotjs.keyTap('v', process.platform === 'darwin' ? 'command' : 'control');

			});

			if (!ret)
			{
				console.log('ошибка регистрации ' + shortcut)
			}
			else if (this.remote.globalShortcut.isRegistered(shortcut))
			{
				//console.log('зарегано ' + shortcut);
			}
		});
	}

	async gramma (text)
	{
		let words = text.split(' '),
			chunks = [],
			i = 0;

		while (i < words.length)
		{
			chunks.push(words.slice(i, i + 100));
			i+= 100;
		}

		for (const chunk of chunks)
		{
			let fixes : any = await this.httpClient.get(`https://speller.yandex.net/services/spellservice.json/checkText?text=${chunk.join(' ')}`).toPromise();

			fixes.filter(fix => fix.s !== undefined && fix.s.length > 0 && fix.word).forEach(fix =>
			{
				let originalWord = fix.word,
					newWord = fix.s[0];

				text = text.replace(new RegExp(originalWord), newWord);
			});
		}

		return text;
	}

	async convert1stTo3rd (text)
	{
		console.log(text);
		const myStem = new this.mystem();
		myStem.start();

		let words = text.split(' '),
			wordsInfo = [],
			sex = "MALE",
			lockSex = false,
			dialogWordsMode = false,
			sexChanged = false;

		for (let i = 0, max = words.length; i < max; i++)
		{
			let clearedWord = words[i].replace(/[,\."\']/, '').toLowerCase(),
				grammems = [],
				type = "LOWER";

			try
			{
				let parsedGrammems = await myStem.extractAllGrammemes(clearedWord);
				if (Array.isArray(parsedGrammems))
				{
					grammems = parsedGrammems;
				}
			}
			catch (e)
			{
				console.log('Err with ' + clearedWord + ': ' + e.toString());
				continue;
			}

			if (words[i].slice(0, 1) === words[i].slice(0, 1).toUpperCase())
			{
				type = "CAPITALIZE";

				if (clearedWord.length > 1 && words[i].slice(1, 2) === words[i].slice(1, 2).toUpperCase())
				{
					type = "UPPER";
				}
			}

			if ((words[i].match(/[\"\'\«\“\‘]/) || words[i].match(/[\:\-\—]$/)) && !dialogWordsMode && !words[i].match(/[\"\'\»\“\‘]?$/))
			{
				dialogWordsMode = true;
			}
			else if (words[i].match(/[\"\'\»\“\‘]/) || words[i].match(/\.|\n/m))
			{
				dialogWordsMode = false;
			}

			wordsInfo[i] = {
				original : words[i],
				cleared : clearedWord,
				grammems,
				type,
				linkedVerbsIndexes : [],
				inDialog : dialogWordsMode
			};
		}

		myStem.stop();

		let lastPrivatePronounIndex = 0;

		for (let i = 0, max = wordsInfo.length; i < max; i++)
		{
			const grammems = wordsInfo[i].grammems;
			//console.log(grammems);

			// если местоимение 1 лица или притяжательное местоимение
			if (grammems.indexOf('SPRO') !== -1 && grammems.find(item => item.match(/1p=/)) !== undefined
				|| ['моему', 'мой', 'моё', 'наш', 'наши'].indexOf(wordsInfo[i].cleared) !== -1 || ['моему', 'мой', 'моё', 'наш', 'наши'].indexOf(grammems[0]) !== -1)
			{
				if (wordsInfo[i].inDialog)
				{
					continue;
				}

				// отмечаем личное местоимение
				wordsInfo[i].isPrivatePronoun = true;
				lastPrivatePronounIndex = i;

				if (['мой', 'наш'].indexOf(grammems[0]) !== -1)
				{
					wordsInfo[i].isPossessive = true;
				}

				if (i - 1 < 0)
				{
					continue;
				}

				if (wordsInfo[i - 1].original.match(/(надо|передо|со|ко|об)$/))
				{
					wordsInfo[i - 1].original = wordsInfo[i - 1].original.replace(/о$/, '');
					wordsInfo[i].withPredlog = true;
				}

				if (wordsInfo[i - 1].grammems.find(item => item.match(/^PR/)) !== undefined)
				{
					wordsInfo[i].withPredlog = true;
				}

			}
			else if (grammems.indexOf('V') !== -1)
			{
				if (i - lastPrivatePronounIndex < 2)
				{
					// не учитвая описаные глагола (со мной что-то сделали, у меня что-то было)
					if (i - 1 >= 0 && wordsInfo[i - 1].original.slice(0, 1) === 'м')
					{
						continue;
					}

					// исключаем из анализа пола глаголы в формате под личное местоимения
					if (!lockSex && !wordsInfo[i].cleared.match(/юсь$/))
					{
						sex = grammems.indexOf("f") !== -1 ? "FEMALE" : "MALE";
						sexChanged = true;
						//console.log(grammems, sex);
					}

					// если найдена связка я <глагол>, то фиксируем пол, потому что это самый точный вариант
					if (sexChanged && wordsInfo[lastPrivatePronounIndex].cleared === 'я')
					{
						lockSex = true;
					}

					wordsInfo[lastPrivatePronounIndex].linkedVerbsIndexes.push(i);
				}
			}
			else if (grammems.find(item => item.match(/A=/)) !== undefined)
			{
				// исключаем из анализа пола глаголы в формате под личное местоимения
				if (!lockSex)
				{
					sex = grammems.indexOf("f") !== -1 ? "FEMALE" : "MALE";
					sexChanged = true;
				}
			}
		}

		const substitutes = {
			'мною' : sex === "MALE" ? 'им' : 'ею',
			'мной' : sex === "MALE" ? 'им' : 'ею',
			'мнои' : sex === "MALE" ? 'им' : 'ею',
			'моей' : sex === "MALE" ? 'его' : 'её',
			'моего' : sex === "MALE" ? 'его' : 'её',
			'моему' : sex === "MALE" ? 'его' : 'её',
			'меня' : sex === "MALE" ? 'его' : 'её',
			'моё' : sex === "MALE" ? 'его' : 'её',
			'мое' : sex === "MALE" ? 'его' : 'её',
			'мне' : sex === "MALE" ? 'ему' : 'ей',
			'мой' : sex === "MALE" ? 'его' : 'её',
			'мои' : sex === "MALE" ? 'его' : 'её',
			'мою' : sex === "MALE" ? 'его' : 'её',
			'я' : sex === "MALE" ? 'он' : 'она',
			'мы' : 'они',
			'наши' : 'их',
			'нас' : 'их',
			'нам' : 'им',
			'нами' : 'ими'
		};

		let formatWord = (type, word) =>
		{
			switch (type)
			{
				case "UPPER" :
					return word.toUpperCase();
				case "CAPITALIZE" :
					return word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase();
				default:
					return word.toLowerCase();
			}
		};

		for (let i = 0, max = wordsInfo.length; i < max; i++)
		{
			if (wordsInfo[i].inDialog)
			{
				continue;
			}

			if (wordsInfo[i].grammems.indexOf('V') !== -1)
			{
				/*wordsInfo[i].original = wordsInfo[i].original.replace(/(а|я)ю/, sex === 'MALE' ? 'ил' : 'ила').replace('гил', 'жил');
				wordsInfo[i].original = wordsInfo[i].original.replace(/могу/, 'может');
				wordsInfo[i].original = wordsInfo[i].original.replace(/люсь/, 'ится');
				*/

				// проверяем связку глагол - глагол-инфинитив
				if (wordsInfo[i - 2] && wordsInfo[i - 2].cleared !== 'я' && wordsInfo[i].original.match(/у[.,"'«»]?$/) && wordsInfo[i + 1] && wordsInfo[i + 1].original.match(/ть[.,"'«»]?$/) && wordsInfo[i + 1].grammems.indexOf('V') !== -1)
				{
					wordsInfo[i].original = sex === "MALE" ? 'он' : 'она';
					wordsInfo[i + 1].original = wordsInfo[i + 1].original.replace(/ть([.,"'«»])?$/, sex === "MALE" ? 'л$1' : 'ла$1');
				}
				else
				{
					// глаголы первой формы в прошедшее время
					wordsInfo[i].original = wordsInfo[i].original.replace(/юсь([.,"'«»])?$/, sex === 'MALE' ? 'лся$1' : 'лась$1');
					wordsInfo[i].original = wordsInfo[i].original.replace(/жусь([.,"'«»])?$/, sex === 'MALE' ? 'дился$1' : 'дилась$1');
					wordsInfo[i].original = wordsInfo[i].original.replace(/гу([.,"'«»])?$/, sex === 'MALE' ? 'г$1' : 'гла$1');
					wordsInfo[i].original = wordsInfo[i].original.replace(/аю([.,"'«»])?$/, sex === 'MALE' ? 'ал$1' : 'ала$1');
					wordsInfo[i].original = wordsInfo[i].original.replace(/яю([.,"'«»])?$/, sex === 'MALE' ? 'ял$1' : 'яла$1');
					wordsInfo[i].original = wordsInfo[i].original.replace(/ею([.,"'«»])?$/, sex === 'MALE' ? 'ел$1' : 'ела$1');
					wordsInfo[i].original = wordsInfo[i].original.replace(/ем([.,"'«»])?$/, 'ли');
					wordsInfo[i].original = wordsInfo[i].original.replace(/усь([.,"'«»])?$/, 'ится');
				}
			}

			if (!wordsInfo[i].isPrivatePronoun)
			{
				continue;
			}

			for (let oldWord in substitutes)
			{
				let formattedOldWord = formatWord(wordsInfo[i].type, oldWord),
					originalWord = wordsInfo[i].original,
					substitute = substitutes[oldWord];

				if (!originalWord.match(new RegExp(formattedOldWord)))
				{
					continue;
				}

				substitute = (wordsInfo[i].withPredlog && !wordsInfo[i].isPossessive ? 'н' : '') + substitute;
				let formattedSubstitute = formatWord(wordsInfo[i].type, substitute);

				// исключение для притяжательного местоимения мр
				if (wordsInfo[i].withPredlog && substitute === 'нему' && (!wordsInfo[i - 1] || ['ко'].indexOf(wordsInfo[i - 1].cleared) === -1))
				{
					formattedSubstitute = formatWord(wordsInfo[i].type, 'нем');
				}

				// учитываем множественное число описания (я с кем-то...)
				if ((substitute === 'он' || substitute === 'она') && wordsInfo[i + 1] && (wordsInfo[i + 1].cleared === 'с'))
				{
					//console.log('===========================', wordsInfo[i + 1]);
					formattedSubstitute = formatWord(wordsInfo[i].type, 'они');
				}

				wordsInfo[i].original = wordsInfo[i].original.replace(formattedOldWord, formattedSubstitute);
			}
		}

		let formattedText = wordsInfo.map(item => item.original).join(' ');

		formattedText = formattedText.replace(/настоящее время/i, "то время");

		return formattedText;
	}

	private getConnectorShortcut (connector)
	{
		return `${connector.shift ? 'Shift+' : ''}${connector.ctrl ? 'CommandOrControl+' : ''}${connector.alt ? 'Alt+' : ''}${connector.key}`;
	}

}
