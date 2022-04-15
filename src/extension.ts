// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as child_process from 'child_process';
import * as fs from "fs";

fs.readFile('d:\\xiangmu\\datahub-frontend\\test.js', "utf-8", (err, data) => {
  console.log(`🚀 => fs.readFile => data`, err);
});

export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  console.log('Congratulations, your extension "i18n-for-jt" is now active!');

  const config = {
    generateScriptPath:"/script/generate.js",
    translateScriptPath:"/script/translate.js",
    replaceContent: "{intl.get('$1').d('$2')}",
  };

  let disposable = vscode.commands.registerCommand(
    "i18n-for-jt.helloWorld",
    () => {
      // No open text editor or rootPath
      const editor = vscode.window.activeTextEditor;
      const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.path;
      if (!editor || !rootPath) {
        return;
      }

      // 不知道这个length什么时候不是1
      const length: number = editor.selections.length;
      let text: string = "";

      for (let i = 0; i < length; i++) {
        // 获取选中的内容
        const selection = editor.selections[i];
        text = editor.document.getText(selection);

        // 生成国际化的key
        const path = editor.document.uri.path;
        const intlName =
          path.match(/(?<=\/)[\w]+(?=\.)/) + JSON.stringify(Date.now());

        try {
          // 替换选中的内容
          const replaceContent = config.replaceContent
            .replace("$1", intlName)
            .replace("$2", text.trim());
          editor.edit((editBuilder) => {
            editBuilder.replace(selection, replaceContent);
          });

          // 调用generate脚本
          // const generateCmd = 'node ';
          // child_process.exec(generateCmd, (err : Error | null) => {
          //   err && vscode.window.showInformationMessage("调用generate脚本失败");
          // });


        } catch (error) {
          vscode.window.showInformationMessage("error");
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
