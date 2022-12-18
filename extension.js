const vscode = require('vscode');
const fs = require('fs');
const fsP = require('fs/promises');
const path = require('node:path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// create a new status bar item
	const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 11000);
	myStatusBarItem.command = "vscode-last-log.openLastLog";
	myStatusBarItem.text = 'Open Log';
	myStatusBarItem.name = 'Last Log';
	myStatusBarItem.tooltip = 'Click to open';
	myStatusBarItem.show();

	const myCommand = vscode.commands.registerCommand('vscode-last-log.openLastLog', async function () {
		const lastLog = await getLastLog();
		if (lastLog.pathLastFile == "") {
			vscode.window.showWarningMessage('No logs found');
		} else {
			vscode.window.showInformationMessage(lastLog.maxFile);
			// Open the file
			vscode.commands.executeCommand('vscode.open', vscode.Uri.file(lastLog.pathLastFile));
		}
	});

	context.subscriptions.push(myStatusBarItem, myCommand);

}

async function getLastLog() {
	
	// Get root folder of the workspace
	const workSpaceFolder = getWorkspacePath();
	
	if( workSpaceFolder == undefined ) return;
	
	// Get log folder path from user configuration
	const logFolder = path.join(workSpaceFolder, vscode.workspace.getConfiguration('lastLog').get('folderPath'));
	const lastFile = await getLastFile(logFolder);

	return lastFile;
}

async function getLastFile(logFolder, max = 0, maxFile = "", pathLastFile = "") {

	const ext = "txt";
	//find the most recent file including subfolders
	try {
		const files = await fsP.readdir(logFolder);
		for (const file of files){
			const filePath = path.join(logFolder, file);
			const stat = fs.statSync(filePath);
			if (stat.isFile() && path.extname(file) === '.' + ext) {
				if (stat.mtime > max) {
					max = stat.mtime;
					maxFile = file;
					pathLastFile = filePath;
				}
			} else if (stat.isDirectory()) {
				({ max, maxFile, pathLastFile } = await getLastFile(filePath, max, maxFile, pathLastFile));
			}
		}
	} catch (err) {
		console.error(err);
	}
	return ({ max, maxFile, pathLastFile });
}

function getWorkspacePath(){
	if(vscode.workspace.workspaceFolders !== undefined) {
		// let wf = vscode.workspace.workspaceFolders[0].uri.path ;
		let f = vscode.workspace.workspaceFolders[0].uri.fsPath ; 
		return f;
	}
	else {
		vscode.window.showErrorMessage("YOUR-EXTENSION: Working folder not found, open a folder an try again");
		return undefined;
	}
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
