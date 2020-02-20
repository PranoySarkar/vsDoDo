"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
let storagePath = null;
function activate(context) {
    storagePath = context.storagePath;
    if (storagePath === undefined || storagePath === null) {
        //vscode.window.showErrorMessage("Open a folder use TODO manager");
    }
    else {
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath);
        }
        storagePath = path.join(storagePath, 'data.json');
        context.subscriptions.push(vscode.commands.registerCommand('vsdodo.start', () => {
            showPanel(context);
        }));
        if (fs.existsSync(storagePath)) {
            try {
                let data = fs.readFileSync(storagePath).toString();
                data = JSON.parse(data);
                if (data.startUp === undefined || data.startUp === true) {
                    showPanel(context);
                }
            }
            catch (_a) {
                showPanel(context);
            }
        }
        else {
            showPanel(context);
        }
    }
}
exports.activate = activate;
function showPanel(context) {
    const panel = vscode.window.createWebviewPanel('vsDoDo', 'vsDoDo', vscode.ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'app'))],
    });
    const scriptPathOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'app', 'index.js'));
    const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);
    panel.webview.onDidReceiveMessage((message) => {
        switch (message.command) {
            case 'export-data':
                fs.writeFileSync(storagePath, message.data);
                break;
            case 'sync-data':
                let data = JSON.stringify({
                    list: [],
                    startUp: true,
                    progressPie: true
                });
                try {
                    if (fs.existsSync(storagePath)) {
                        let temp = fs.readFileSync(storagePath).toString();
                        if (temp && temp.trim().length !== 0) {
                            data = temp;
                        }
                    }
                }
                catch (e) { }
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
function getWebviewContent(context, scriptURI, styleURI) {
    let html = fs.readFileSync(path.join(context.extensionPath, 'app', 'index.html')).toString();
    html = html.replace(/%%SCRIPT_URI%%/ig, scriptURI);
    html = html.replace(/%%STYLE_URI%%/ig, styleURI);
    return html;
}
//# sourceMappingURL=extension.js.map