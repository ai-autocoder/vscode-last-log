<div style="max-width: 1280px">

<h1 align="center">
 <br>
 <img src="https://github.com/ai-autocoder/vscode-last-log/blob/main/resources/logo.png?raw=true" width="200" alt="Logo">
 <br>
 Last Log
 <br>
 <br>
</h1>

<h4 align="center">Effortlessly view and manage your log files. Fully configurable.</h4>

<p align="center">
 <a href="https://marketplace.visualstudio.com/items?itemName=FrancescoAnzalone.vscode-last-log">
 <img src="https://vsmarketplacebadges.dev/version/FrancescoAnzalone.vscode-last-log.png?label=Last%20Log" alt="Marketplace bagde"></a>
</p>

## Features

Last Log offers a convenient way to view the most recent file inside a folder of your choice.
It is possible to use the extension in 3 ways: from the button on the left side of the status bar, from the command line with the command "Open last log", or by creating a custom key binding.

![command](resources/command-line.png)

![status bar](resources/status-bar.png)

## Settings

This extension contributes the following settings:

| Variable                        | Default | Description                                                                                                                                                                            |
| ------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lastLog.folderPath`            | `logs`  | The path to the log files relative to the workspace folder. To go up to the parent folder, add '..\\' at the start of the path for each level you want to go up.                       |
| `lastLog.includeSubfolders`     | `true`  | Specifies if logs in subfolders are to be included, with no limit on subfolder depth.                                                                                                  |
| `lastLog.fileExtension`         | `log`   | The file extension of the log files. Use '*' to match any file type.                                                                                                                   |
| `lastLog.excludeFolders`        | `[]`    | An array of folder names to exclude when __includeSubfolders__ is true.                                                                                                                |
| `lastLog.logRetentionTime`      | `0`     | Sets the maximum age in minutes for log files in the workspace. Files older than this limit will be deleted. Set to 0 to disable this functionality and prevent deletion of log files. |
| `lastLog.deleteExcludedFolders` | `false` | When true, log files inside excluded folders will be deleted based on the __logRetentionTime__ setting. When false, excluded folders will be ignored and not deleted.                  |
| `lastLog.deleteEmptyFolders`    | `false` | When true, empty subfolders will be deleted. When false, empty subfolders will be ignored and not deleted.                                                                             |

* Deletion actions will be triggered when opening a log file.

### Example configuration

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
