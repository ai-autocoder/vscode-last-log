import * as vscode from "vscode";
import { getConfig, initStatubar, checkFileAge } from "./util";
import path = require("node:path");
import fsPromises = require("fs/promises");

/**
 * @param {vscode.ExtensionContext} context
 */

const logChannel = vscode.window.createOutputChannel("Last Log", { log: true });
const userConfig = getConfig();

export function activate(context: vscode.ExtensionContext) {
	const myStatusBarItem = initStatubar();
	const myCommand = vscode.commands.registerCommand(
		"vscode-last-log.openLastLog",
		async function () {
			// Get root folder of the workspace
			const workspaceFolder =
				vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
			if (workspaceFolder === undefined) {
				vscode.window.showErrorMessage(
					"Last Log: Workspace folder not found, open a folder and try again."
				);
				return;
			}
			const ROOT_PATH = path.join(workspaceFolder, userConfig.LOG_FOLDER);
			const lastLog = await getLastLog(ROOT_PATH);

			if (lastLog?.latestFilePath === "") {
				vscode.window.showWarningMessage("Last Log: No logs found");
			} else {
				vscode.window.showInformationMessage(
					`~ ${checkFileAge(lastLog.latestFileAge)} @ ${lastLog.latestFile}`
				);
				// Open the file
				vscode.commands.executeCommand(
					"vscode.open",
					vscode.Uri.file(lastLog.latestFilePath)
				);
			}
			// Delete expired logs and empty folders
			await cleanup(ROOT_PATH);
		}
	);

	context.subscriptions.push(myStatusBarItem, myCommand);

	logChannel.appendLine("Last Log extension activated");
	logChannel.appendLine("userConfig: " + JSON.stringify(userConfig));
}

// This method is called when your extension is deactivated
export function deactivate() {}

async function getLastLog(
	currentPath: string,
	latestFile = "",
	latestFileAge = 0,
	latestFilePath = ""
) {
	// Find the most recent file including subfolders
	try {
		const folderContent = await fsPromises.readdir(currentPath);

		for (const item of folderContent) {
			const itemPath = path.join(currentPath, item);
			const itemStats = await fsPromises.stat(itemPath);

			// If item is a file
			if (itemStats.isFile()) {
				if (!checkFileExtension(item, userConfig.FILE_EXTENSION)) {
					continue;
				}
				if (
					userConfig.LOG_RETENTION_TIME &&
					isLogExpired(userConfig.LOG_RETENTION_TIME, itemStats.mtimeMs)
				) {
					continue;
				}
				if (itemStats.mtimeMs > latestFileAge) {
					latestFile = item;
					latestFileAge = itemStats.mtimeMs;
					latestFilePath = itemPath;
					continue;
				}
			}

			// If item is a folder
			if (itemStats.isDirectory() && userConfig.INCLUDE_SUBFOLDERS) {
				// If the folder is in the excluded folders list
				if (
					userConfig.EXCLUDE_FOLDERS.length &&
					userConfig.EXCLUDE_FOLDERS.includes(item)
				) {
					continue;
				}

				({ latestFile, latestFileAge, latestFilePath } = await getLastLog(
					itemPath,
					latestFile,
					latestFileAge,
					latestFilePath
				));
			}
		}
	} catch (err) {
		logError(err);
	}
	return { latestFile, latestFileAge, latestFilePath };
}

async function cleanup(ROOT_PATH: string) {
	if (userConfig.LOG_RETENTION_TIME) {
		await deleteExpiredLogs(ROOT_PATH);
	}
	if (userConfig.DELETE_EMPTY_FOLDERS) {
		await deleteEmptyFolders(ROOT_PATH, ROOT_PATH);
	}
}

async function deleteExpiredLogs(currentPath: string) {
	try {
		const folderContent = await fsPromises.readdir(currentPath);
		for (const item of folderContent) {
			const itemPath = path.join(currentPath, item);
			const itemStats = await fsPromises.stat(itemPath);

			// If item is a file
			if (itemStats.isFile()) {
				if (!checkFileExtension(item, userConfig.FILE_EXTENSION)) {
					continue;
				}
				if (isLogExpired(userConfig.LOG_RETENTION_TIME, itemStats.mtimeMs)) {
					await fsPromises.unlink(itemPath);
					logChannel.appendLine(`Deleted expired log: ${itemPath}`);
				}
				continue;
			}

			// If item is not a folder and INCLUDE_SUBFOLDERS is false, return
			if (!itemStats.isDirectory() || !userConfig.INCLUDE_SUBFOLDERS) {
				continue;
			}

			// If folder in EXCLUDE_FOLDERS and DELETE_EXCLUDED_FOLDERS is false, skip it
			if (
				userConfig.EXCLUDE_FOLDERS.length &&
				userConfig.EXCLUDE_FOLDERS.includes(item) &&
				!userConfig.DELETE_EXCLUDED_FOLDERS
			) {
				continue;
			}
			await deleteExpiredLogs(itemPath);
		}
	} catch (err) {
		logError(err);
	}
}

async function deleteEmptyFolders(currentPath: string, ROOT_PATH: string) {
	try {
		let folderContent = await fsPromises.readdir(currentPath);
		// If folder is empty and DELETE_EMPTY_FOLDERS is true, delete it
		if (folderContent.length === 0 && currentPath !== ROOT_PATH) {
			await fsPromises.rm(currentPath, { maxRetries: 5, recursive: true });
			logChannel.appendLine(`Deleted empty folder: ${currentPath.toString()}`);
			return;
		}
		if (!userConfig.INCLUDE_SUBFOLDERS) return;

		for (const item of folderContent) {
			const itemPath = path.join(currentPath, item);
			const itemStats = await fsPromises.stat(itemPath);

			if (!itemStats.isDirectory()) continue;

			// If folder in EXCLUDE_FOLDERS and DELETE_EXCLUDED_FOLDERS is false, skip it
			if (
				userConfig.EXCLUDE_FOLDERS.length &&
				userConfig.EXCLUDE_FOLDERS.includes(item) &&
				!userConfig.DELETE_EXCLUDED_FOLDERS
			) {
				continue;
			}

			await deleteEmptyFolders(itemPath, ROOT_PATH);
		}
		// Recheck if folder is empty after processing child folders
		folderContent = await fsPromises.readdir(currentPath);
		if (folderContent.length === 0 && currentPath !== ROOT_PATH) {
			await fsPromises.rm(currentPath, { maxRetries: 5, recursive: true });
			logChannel.appendLine(`Deleted empty folder: ${currentPath.toString()}`);
		}
	} catch (err) {
		logError(err);
	}
}

function isLogExpired(LOG_RETENTION_TIME: number, logCreationTimeMs: number) {
	let fileAge = new Date().getTime() - logCreationTimeMs;
	// Convert to minutes
	fileAge = fileAge / 1000 / 60;

	return fileAge > LOG_RETENTION_TIME;
}

function checkFileExtension(file: string, fileExtension = "") {
	return fileExtension === "" || fileExtension === "*"
		? true
		: path.extname(file) === "." + fileExtension;
}

function logError(err: unknown) {
	const errorMessage = err instanceof Error ? err.message : String(err);
	console.error(errorMessage);
	logChannel.appendLine(errorMessage);
}
