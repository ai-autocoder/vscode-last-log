const vscode = require('vscode');
const fsPromises = require('fs/promises');
const path = require('node:path');

/**
 * @param {vscode.ExtensionContext} context
 */

let logChannel;
let userConfig = {}

function activate(context) {

	logChannel = vscode.window.createOutputChannel('Last Log', { log: true });

	// Create status bar item
	const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 11000);
	myStatusBarItem.command = "vscode-last-log.openLastLog";
	myStatusBarItem.text = 'Open Log';
	myStatusBarItem.name = 'Last Log';
	myStatusBarItem.tooltip = 'Click to open log file';
	myStatusBarItem.show();

	const myCommand = vscode.commands.registerCommand('vscode-last-log.openLastLog', async function () {

		// Update user config
		userConfig = getConfig();

		// Get root folder of the workspace
		const workspaceFolder = getWorkspacePath();
		if( workspaceFolder == undefined ){
			vscode.window.showErrorMessage("Last Log: Workspace folder not found, open a folder an try again.");
			return;
		}
		userConfig.ROOT_PATH = path.join(workspaceFolder, userConfig.LOG_FOLDER)
		logChannel.appendLine('userConfig: ' + JSON.stringify(userConfig));

		const lastLog = await getLastLog(userConfig.ROOT_PATH);

		if (lastLog?.latestFilePath == "") {
			vscode.window.showWarningMessage('Last Log: No logs found');
		} else {
			vscode.window.showInformationMessage(`~ ${checkFileAge(lastLog.latestFileAge)} @ ${lastLog.latestFile}`);
			// Open the file
			vscode.commands.executeCommand('vscode.open', vscode.Uri.file(lastLog.latestFilePath));
		}
		// Delete expired logs and empty folders
		await cleanup();
	});

	context.subscriptions.push(myStatusBarItem, myCommand);

	logChannel.appendLine('Last Log extension activated');
}

function getConfig() {
	return ({
		INCLUDE_SUBFOLDERS      : vscode.workspace.getConfiguration('lastLog').get('includeSubfolders'),
		EXCLUDE_FOLDERS         : vscode.workspace.getConfiguration('lastLog').get('excludeFolders'),
		LOG_RETENTION_TIME      : vscode.workspace.getConfiguration('lastLog').get('logRetentionTime'),
		DELETE_EXCLUDED_FOLDERS : vscode.workspace.getConfiguration('lastLog').get('deleteExcludedFolders'),
		DELETE_EMPTY_FOLDERS    : vscode.workspace.getConfiguration('lastLog').get('deleteEmptyFolders'),
		LOG_FOLDER              : vscode.workspace.getConfiguration('lastLog').get('folderPath'),
		ROOT_PATH					: undefined
		});
}

async function getLastLog(currentPath, latestFile = "", latestFileAge = 0, latestFilePath = "", excludedFolder = false) {
	// Find the most recent file including subfolders
	try {
		const folderContent = await fsPromises.readdir(currentPath);
	
		for (const item of folderContent) {
			const itemPath = path.join(currentPath, item);
			const itemStats = await fsPromises.stat(itemPath);

			// If item is a file
			if (itemStats.isFile()) {
				if (!checkFileExtension(item)) continue;
				if (userConfig.LOG_RETENTION_TIME && isLogExpired(userConfig.LOG_RETENTION_TIME, itemStats.mtimeMs)) continue;
				if (!excludedFolder && itemStats.mtimeMs > latestFileAge) {
					latestFile = item;
					latestFileAge = itemStats.mtimeMs;
					latestFilePath = itemPath;
					continue;
				}
			}

			// If item is a folder
			if (itemStats.isDirectory() && userConfig.INCLUDE_SUBFOLDERS) {
				// If the folder is in the excluded folders list
				if (userConfig.EXCLUDE_FOLDERS.length && userConfig.EXCLUDE_FOLDERS.includes(item)) {
					// If DELETE_EXCLUDED_FOLDERS is true, set excludedFolder to true so the files inside the folder are ignored
					if (userConfig.DELETE_EXCLUDED_FOLDERS){
						({ latestFile, latestFileAge, latestFilePath } = await getLastLog(itemPath, latestFile, latestFileAge, latestFilePath, true));
						continue;
					}
					else continue;
				}

				({ latestFile, latestFileAge, latestFilePath } = await getLastLog(itemPath, latestFile, latestFileAge, latestFilePath, excludedFolder));
			}
		}
	} catch (err) {
		console.error(err);
		logChannel.appendLine(err);
	}
	return ({ latestFile, latestFileAge, latestFilePath });
}

async function cleanup() {
	if (userConfig.LOG_RETENTION_TIME) await deleteExpiredLogs(userConfig.ROOT_PATH);
	if (userConfig.DELETE_EMPTY_FOLDERS) await deleteEmptyFolders(userConfig.ROOT_PATH);
}

async function deleteExpiredLogs(currentPath) {
	try {
		const folderContent = await fsPromises.readdir(currentPath);
		for (const item of folderContent) {
			const itemPath = path.join(currentPath, item);
			const itemStats = await fsPromises.stat(itemPath);

			// If item is a file
			if (itemStats.isFile()) {
				if (!checkFileExtension(item)) continue;
				if (isLogExpired(userConfig.LOG_RETENTION_TIME, itemStats.mtimeMs)) {
					await fsPromises.unlink(itemPath);
				}
				continue;
			}

			// If item is not a folder and INCLUDE_SUBFOLDERS is false, return
			if (!itemStats.isDirectory() || !userConfig.INCLUDE_SUBFOLDERS) continue;
		
			// If folder in EXCLUDE_FOLDERS and DELETE_EXCLUDED_FOLDERS is false, skip it
			if (userConfig.EXCLUDE_FOLDERS.length && userConfig.EXCLUDE_FOLDERS.includes(item) && !userConfig.DELETE_EXCLUDED_FOLDERS)	continue;
			await deleteExpiredLogs(itemPath);
		}
	} catch (err) {
		console.error(err);
		logChannel.appendLine(err);
	}
}

async function deleteEmptyFolders(currentPath) {
	try {
		let folderContent = await fsPromises.readdir(currentPath);
		// If folder is empty and DELETE_EMPTY_FOLDERS is true, delete it
		if (folderContent.length == 0 && currentPath != userConfig.ROOT_PATH) {
			await fsPromises.rm(currentPath, {maxRetries: 5, recursive: true});
			logChannel.appendLine(`Deleted empty folder: ${currentPath.toString()}`);
			return;
		}
		if(!userConfig.INCLUDE_SUBFOLDERS) return;

		for (const item of folderContent) {
			const itemPath = path.join(currentPath, item);
			const itemStats = await fsPromises.stat(itemPath);

			if (!itemStats.isDirectory()) continue;

			// If folder in EXCLUDE_FOLDERS and DELETE_EXCLUDED_FOLDERS is false, skip it
			if (userConfig.EXCLUDE_FOLDERS.length && userConfig.EXCLUDE_FOLDERS.includes(item) && !userConfig.DELETE_EXCLUDED_FOLDERS)	continue;

			await deleteEmptyFolders(itemPath);
		}
		// Recheck if folder is empty after processing child folders
		folderContent = await fsPromises.readdir(currentPath);
		if (folderContent.length == 0 && currentPath != userConfig.ROOT_PATH) {
			await fsPromises.rm(currentPath, {maxRetries: 5, recursive: true});
			logChannel.appendLine(`Deleted empty folder: ${currentPath.toString()}`);
		}
	} catch (err) {
		console.error(err);
		logChannel.appendLine(err);
	}
}

function isLogExpired(LOG_RETENTION_TIME, logCreationTimeMs) {
	let fileAge = new Date() - logCreationTimeMs;
	// Convert to minutes
	fileAge = fileAge / 1000 / 60;

	return fileAge > LOG_RETENTION_TIME;
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
	let timeString = "";
	switch(true){
		case years   > 0: timeString = years + " yr";    break;
		case months  > 0: timeString = months + " mth";  break;
		case days    > 0: timeString = days + " d";      break;
		case hours   > 0: timeString = hours + " hr";    break;
		case minutes > 0: timeString = minutes + " min"; break;
		default: timeString = seconds + " s";
	}
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
