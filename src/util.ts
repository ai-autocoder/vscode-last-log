import * as vscode from "vscode";

export function initStatubar() {
	const myStatusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Left,
		11000
	);
	myStatusBarItem.command = "vscode-last-log.openLastLog";
	myStatusBarItem.text = "Open Log";
	myStatusBarItem.name = "Last Log";
	myStatusBarItem.tooltip = "Click to open log file";
	myStatusBarItem.show();
	return myStatusBarItem;
}

export function checkFileAge(fileDate: number): string {
	const ageDate = new Date(new Date().getTime() - fileDate);
	ageDate.setMinutes(ageDate.getMinutes() + ageDate.getTimezoneOffset());
	let seconds = ageDate.getSeconds();
	let minutes = ageDate.getMinutes();
	let hours = ageDate.getHours();
	let days = ageDate.getDate() - 1;
	let months = ageDate.getMonth();
	let years = ageDate.getFullYear() - 1970;
	let timeString = "";
	if (years > 0) {
		timeString = years + " yr";
	} else if (months > 0) {
		timeString = months + " mth";
	} else if (days > 0) {
		timeString = days + " d";
	} else if (hours > 0) {
		timeString = hours + " hr";
	} else if (minutes > 0) {
		timeString = minutes + " min";
	} else {
		timeString = seconds + " s";
	}
	return timeString;
}

export type Config = {
	INCLUDE_SUBFOLDERS: boolean;
	EXCLUDE_FOLDERS: string[];
	LOG_RETENTION_TIME: number;
	DELETE_EXCLUDED_FOLDERS: boolean;
	DELETE_EMPTY_FOLDERS: boolean;
	LOG_FOLDER: string;
	FILE_EXTENSION: string;
};

export function getConfig(): Config {
	const config = vscode.workspace.getConfiguration("lastLog");
	return {
		INCLUDE_SUBFOLDERS: config.get("includeSubfolders") as boolean,
		EXCLUDE_FOLDERS: config.get("excludeFolders") as string[],
		LOG_RETENTION_TIME: config.get("logRetentionTime") as number,
		DELETE_EXCLUDED_FOLDERS: config.get("deleteExcludedFolders") as boolean,
		DELETE_EMPTY_FOLDERS: config.get("deleteEmptyFolders") as boolean,
		LOG_FOLDER: config.get("folderPath") as string,
		FILE_EXTENSION: config.get("fileExtension") as string,
	};
}
