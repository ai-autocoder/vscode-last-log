<div style="max-width: 1280px">

# Last Log

<p align="center">
  <img src="https://github.com/ai-autocoder/vscode-last-log/blob/main/resources/logo.png?raw=true" width="128" alt="Logo">
</p>

## Features

Last Log offers a convenient way to view the most recent file inside a folder of your choice.
It is possible to use the extension in 3 ways: from the button on the left side of the status bar, from the command line with the command "Open last log", or by creating a custom key binding.


![command](resources/command-line.png)


![status bar](resources/status-bar.png)


## Settings

This extension contributes the following settings:

| Variable                             | Default       | Description                                                                                                                                                                                                                 |
| ------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lastLog.folderPath`                 | `logs`        | The path containing the log files relative to the workspace folder. To navigate back outside the workspace add ..\\ for each folder.                                                                                        |
| `lastLog.includeSubfolders`          | `true`        | Specifies if the logs located in subfolders are to be considered (any depth level).                                                                                                                                         |
| `lastLog.fileExtension`              | `log`         | The file extension of the log files. If unset or set to '|' it will work on any file type. Default is 'log'.                                                                                                                |
| `lastLog.excludeFolders`             | `0`           | Specifies a list of folders to be ignored (it only has effect if includeSubfolders is set to true).                                                                                                                       |
| `lastLog.logRetentionTime`           | `0`           | Sets the maximum age (in minutes) of log files in the workspace. Files older than this limit will be deleted. If unset or set to 0 this functionality will be disabled, and no log files will be deleted from the folder.   |
| `lastLog.deleteExcludedFolders`      | `false`       | If set to true, the files located inside excluded folders will be deleted according to the logRetentionTime setting. If unset or set to false, the excluded folders will be ignored and not deleted.                        |
| `lastLog.deleteEmptyFolders`         | `false`       | If set to true, any empty subfolder will be removed. If unset or set to false, empty folders will be ignored and not deleted.                                                                                               |
* Deletion actions will be triggered when opening a log file.


### Example configuration:

```js
{
	"lastLog.folderPath": "myLogsFolder",
	"lastLog.includeSubfolders": true,
	"lastLog.fileExtension": "txt",
	"lastLog.excludeFolders": [
		"nameFolder1", "nameFolder2"
	],
	"lastLog.logRetentionTime": 60,
	"lastLog.deleteExcludedFolders": true,
	"lastLog.deleteEmptyFolders": true
}
```

### Credits

Main icon by @OllyLove

**Enjoy!**

</div>