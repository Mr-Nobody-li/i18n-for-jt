// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as child_process from "child_process";
import * as fs from "fs";
import * as http from "http";
const md5 = require("md5");

const generate = (path: string, key: string, value: string) => {
  fs.readFile(path, "utf-8", (err, json) => {
    err && vscode.window.showInformationMessage(`读取${path}失败`);
    const newJson = { ...JSON.parse(json), ...{ [key]: value } };
    fs.writeFile(path, JSON.stringify(newJson, null, "\t"), (err) => {
      err && vscode.window.showInformationMessage(`写入${path}失败`);
    });
  });
};

const translate = (query: string) => {
  // const query = '测试/你好/我好';
  const appid = "20220411001168024";
  const key = "vwwfS_ohpZ0n2JQs3Koz";
  const salt = new Date().getTime();
  const str1 = appid + query + salt + key;
  const sign = md5(str1);
  return new Promise<string>((resolve, reject) => {
    http.get(
      `http://api.fanyi.baidu.com/api/trans/vip/translate?q=${encodeURIComponent(
        query
      )}&from=zh&to=en&appid=${appid}&salt=${salt}&sign=${sign}`,
      (resp) => {
        let data = "";
        resp.on("data", (res) => {
          data += res;
        });
        resp.on("end", () => {
          console.log(JSON.parse(data));
          const res = JSON.parse(data).trans_result;
          res ? resolve(res[0].dst) : resolve(query);
        });
      }
    );
  });
};

const replace = () => {

};

export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  console.log('Congratulations, your extension "i18n-for-jt" is now active!');

  const config = {
    zhCNPath: "\\src\\locales\\zh_CN.json",
    enUSPath: "\\src\\locales\\en_US.json",
    replaceContent: "{intl.get('$1').d('$2')}",
  };

  let disposable = vscode.commands.registerCommand(
    "i18n-for-jt.helloWorld",
    () => {
      // No open text editor or rootPath
      const editor = vscode.window.activeTextEditor;
      const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!editor || !rootPath) {
        vscode.window.showInformationMessage("找不到editor或者rootpath");
        return;
      }

      // 不知道这个length什么时候不是1
      const length: number = editor.selections.length;
      let text: string = "";

      for (let i = 0; i < length; i++) {
        // 获取选中的内容
        const selection = editor.selections[i];
        text = editor.document.getText(selection);
        if(/^[' | "].*?[' | "]$/.test(text)){
          text = text.slice(1,text.length-2);
        }

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
          translate(text).then((res) => {
            generate(rootPath + config.zhCNPath, intlName, text);
            generate(rootPath + config.enUSPath, intlName, res);
          });
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
