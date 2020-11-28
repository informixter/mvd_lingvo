const {app, BrowserWindow, Menu, Tray, shell, globalShortcut} = require('electron');
const path = require('path');

let win = null;
let tray = null;
const isWin = process.platform === "win32";
const serve = process.env.ENV === 'dev';

app.allowRendererProcessReuse = false;

function createWindow()
{
	win = new BrowserWindow({
		width: serve ? 800 : 600,
		height: serve ? 800 : 800,
		show: true,
		fullscreenable: false,
		minWidth : 800,
		minHeight : 800,
		resizable: true,
		backgroundColor : "transparent",
		webPreferences: {
			nodeIntegration: true,
			allowRunningInsecureContent: serve,
			backgroundThrottling: false,
			enableRemoteModule : true,
		}
	});

	if (serve)
	{
		win.webContents.openDevTools();
	}

	win.webContents.on('new-window', function(event, url){
		event.preventDefault();
		shell.openExternal(url);
	});

	win.removeMenu();

	if (serve)
	{
		win.loadURL('http://localhost:4200');
	}
	else
	{
		win.loadFile(path.join(__dirname, 'build', 'index.html'));
		/*win.loadURL(url.format({
			pathname: path.join(__dirname, 'build', 'index.html'),
			protocol: 'file:',
			slashes: true
		}));*/
	}

	// Emitted when the window is closed.
	win.on('closed', () =>
	{
		// Dereference the window object, usually you would store window
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null;
	});

	//toggleWindow();
}

function createTray()
{
	tray = new Tray(path.join(__dirname, 'build', 'assets', 'favicon.png'));
	tray.setToolTip('MVD Lingvoprocessor');
	tray.setIgnoreDoubleClickEvents(true);

	const items = [
		{ label: 'Закрыть', type: 'normal', role : 'quit' },
	];

	if (serve)
	{
		items.unshift({ type : 'separator' });
		//items.unshift({ label: 'Открыть панель разработки', type: 'normal', role : 'toggleDevTools' });
	}

	if (!isWin)
	{
		items.unshift({ label: 'Панель управления', type: 'normal', click : showWindow });
	}

	const contextMenu = Menu.buildFromTemplate(items);
	tray.setContextMenu(contextMenu);

	if (isWin)
	{
		tray.on('click', showWindow);
	}
}

function showWindow()
{
	if (win)
	{
		win.show();
		win.focus();
	}
	else
	{
		createWindow();
	}
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock)
{
	app.quit()
}
else
{
	app.on('second-instance', (event, commandLine, workingDirectory) =>
	{
		if (win)
		{
			if (win.isMinimized())
			{
				win.restore();
			}

			win.focus()
		}
	});
}

try
{
	// if (!isWin)
	// {
	// 	app.dock.hide();
	// }

	// This method will be called when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	// Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
	app.on('ready', () =>
	{
		setTimeout(() =>
		{
			createTray();
			createWindow();
		}, 400);
	});

	// Quit when all windows are closed.
	app.on('window-all-closed', () =>
	{
		// On OS X it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
		if (process.platform !== 'darwin')
		{
			//app.quit();
		}
	});

	app.on('activate', () =>
	{
		// On OS X it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0)
		{
			createWindow();
		}
	});

	app.on('will-quit', () =>
	{
		globalShortcut.unregisterAll()
	});

}
catch (e)
{
	throw e;
}

/*
function configureShortcuts ()
{

}*/
