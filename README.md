# Last Log

<p align="center">
  <img src="https://github.com/ai-autocoder/vscode-last-log/blob/main/resources/logo128x128.png?raw=true" width="128" alt="Logo">
</p>

## Features

Last Log offers a convenient way to open the most recent file inside a folder of your choice. 
It is possible to use the extension in 3 ways: from the button at the left side of the status bar, from the command line with the command "Open last log", or by creating a custom key binding.

<div align="center">

![After](resources/command-line.png)

</div>
<div align="center">

![After](resources/status-bar.png)

</div>

## Settings

This extension contributes the following settings:

* `lastLog.folderPath`: "Specifies the folder path containing the log files. Default value is **'xml'** which represents: **\\workspace-folder\\xml**. To navigate back outside the workspace add ..\\ for each folder.".
* `lastLog.includeSubfolders`: Default true.
* `lastLog.fileExtension`: The extension of the log files. If not specified or value is '*' it will open any file type.
* `lastLog.excludeFolders`: The name of the folders to exclude. Any file inside those folder will be ignored.

### Example configuration:

```js
{
	"lastLog.folderPath": "logs",
	"lastLog.includeSubfolders": false,
	"lastLog.fileExtension": "log",
	"lastLog.excludeFolders": [
		"nameFolder1", "nameFolder2"
	]
}
```





**Enjoy!**
