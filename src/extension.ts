
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


let storagePath: any = null;


export function activate(context: vscode.ExtensionContext) {

	storagePath = context.storagePath;
	if (storagePath === undefined || storagePath === null) {
		//vscode.window.showErrorMessage("Open a folder use TODO manager");
	}
	else {
		if (!fs.existsSync(storagePath)) {
			fs.mkdirSync(storagePath);
		}
		storagePath = path.join(storagePath, 'data.json');
		context.subscriptions.push(
			vscode.commands.registerCommand('vsdodo.start', () => {
				showPanel(context);
			})
		);
		if (fs.existsSync(storagePath)) {
			try{
				
				let data: any = fs.readFileSync(storagePath).toString();
				data = JSON.parse(data);
			
				if (data.startUp === undefined || data.startUp === true) {
					showPanel(context);
				}
			}
			catch{
				showPanel(context);
			}
		} else {
			showPanel(context);
		}

	}

}

function showPanel(context: any) {

	const panel = vscode.window.createWebviewPanel(
		'vsDoDo',
		'vsDoDo',
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'app'))],
		}
	);

	const scriptPathOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'app', 'index.js'));
	const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);

	panel.webview.onDidReceiveMessage((message: any) => {
		switch (message.command) {
			case 'export-data':
				fs.writeFileSync(storagePath, message.data);
				console.log(storagePath);
				break;
			case 'sync-data':
				let data:any =  {
					list: [],
					startUp:true,
					progressPie:true
				};
				if(fs.existsSync(storagePath)){
					data = fs.readFileSync(storagePath).toString();
				}
				
				panel.webview.postMessage({
					command: 'restore',
					data
				});
				break;
			case 'show-error':
				vscode.window.showErrorMessage(message.error);
				break;	
		}
	});

	const stylePathOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'app', 'style.css'));
	const styleURI = panel.webview.asWebviewUri(stylePathOnDisk);
	panel.webview.html = getWebviewContent(context, scriptUri, styleURI);


	/* 	setTimeout(_ => {
			panel.webview.postMessage({ command: 'restoreData' });
		}, 5000); */
}






function getWebviewContent(context: any, scriptURI: any, styleURI: any) {

	let html = fs.readFileSync(path.join(context.extensionPath, 'app', 'index.html')).toString();
	html = html.replace(/%%SCRIPT_URI%%/ig, scriptURI);
	html = html.replace(/%%STYLE_URI%%/ig, styleURI);
	return html;

}

