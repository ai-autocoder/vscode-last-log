const vscode = require('vscode');
const fs = require('fs');
const fsP = require('fs/promises');
const path = require('node:path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Create status bar item
	const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 11000);
	myStatusBarItem.command = "vscode-last-log.openLastLog";
	myStatusBarItem.text = 'Open Log';
	myStatusBarItem.name = 'Last Log';
	myStatusBarItem.tooltip = 'Click to open log file';
	myStatusBarItem.show();

	const myCommand = vscode.commands.registerCommand('vscode-last-log.openLastLog', async function () {
		const lastLog = await getLastLog();
		if (lastLog?.pathLastFile == "") {
			vscode.window.showWarningMessage('Last Log: No logs found');
		} else {
			vscode.window.showInformationMessage(`~${ checkFileAge(lastLog.max)} @ ${lastLog.maxFile}`);
			// Open the file
			vscode.commands.executeCommand('vscode.open', vscode.Uri.file(lastLog.pathLastFile));
		}
	});

	context.subscriptions.push(myStatusBarItem, myCommand);

}

async function getLastLog() {
	
	// Get root folder of the workspace
	const workSpaceFolder = getWorkspacePath();
	
	if( workSpaceFolder == undefined ){
		vscode.window.showErrorMessage("Last Log: Workspace folder not found, open a folder an try again.");
		return;
	}
	
	// Get log folder path from user configuration
	const logFolder = path.join(workSpaceFolder, vscode.workspace.getConfiguration('lastLog').get('folderPath'));
	// Get 'include subfolder' from user configuration
	const incSubFolders = vscode.workspace.getConfiguration('lastLog').get('includeSubfolders');
	const excludedFolders = vscode.workspace.getConfiguration('lastLog').get('excludeFolders');
	const logRetentionTime = vscode.workspace.getConfiguration('lastLog').get('logRetentionTime');
	const lastFile = await getLastFile({incSubFolders, excludedFolders, logRetentionTime}, logFolder);

	return lastFile;
}

async function getLastFile(userConfig, logFolder, max = 0, maxFile = "", pathLastFile = "") {
	// Find the most recent file including subfolders
	try {
		const files = await fsP.readdir(logFolder);
		for (const file of files){
			const filePath = path.join(logFolder, file);
			const stat = fs.statSync(filePath);
			if (stat.isFile() && checkFileExtension(file)) {
				if(userConfig.logRetentionTime && isLogExpired(userConfig.logRetentionTime, stat.birthtimeMs)){
					deleteLog(filePath);
				} else if (stat.mtime > max) {
					max = stat.mtime;
					maxFile = file;
					pathLastFile = filePath;
				}
			} else if (stat.isDirectory() && userConfig.incSubFolders) {
				if (userConfig.excludedFolders.length && userConfig.excludedFolders.includes(file)) continue;
				({ max, maxFile, pathLastFile } = await getLastFile(userConfig, filePath, max, maxFile, pathLastFile));
			}
		}
	} catch (err) {
		console.error(err);
	}
	return ({ max, maxFile, pathLastFile });
}

function isLogExpired(logRetentionTime, logCreationTimeMs){
	let fileAge = new Date() - logCreationTimeMs;
	// Convert to minutes
	fileAge = fileAge / 1000 / 60;

	return fileAge > logRetentionTime;
}

function deleteLog(filePath){
	// delete the file at path 'filePath'
	fs.unlink(filePath, (err) => {
		if (err) {
		console.error(err);
		vscode.window.showErrorMessage(`Failed to delete file at ${filePath}`);
		return;
		}
	});
}

function checkFileExtension(file){
	const extension = vscode.workspace.getConfiguration('lastLog').get('fileExtension');
	return (extension == "" || extension === "*" ) ? true : (path.extname(file) === '.' + extension);
}

function checkFileAge(sfileDate){
	const ageDate = new Date(new Date() - new Date(sfileDate));
	ageDate.setMinutes(ageDate.getMinutes() + ageDate.getTimezoneOffset());
	let seconds = ageDate.getSeconds();
	let minutes = ageDate.getMinutes();
	let hours = ageDate.getHours();
	let days = ageDate.getDate() - 1;
	let months = ageDate.getMonth();
	let years = ageDate.getFullYear() - 1970;
	let timeString = years ? years + " yr" :
						months ? months + " mth" :
						days ? days + " d" :
						hours ? hours + " hr" :
						minutes ? minutes + " min" :
						seconds + " s";
	return timeString;
}

function getWorkspacePath(){
	return vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
