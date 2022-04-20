import * as vscode from "vscode";
const axios = require("axios");
const md5 = require("md5");
const fs = require("fs");
const http = require("http");

interface configInterface {
  zhCNPath: string;
  enUSPath: string;
  replaceContent: string;
}

let ctx: vscode.ExtensionContext;
let config: configInterface;

const generate = (path: string, key: string, value: string) => {
  fs.readFile(path, "utf-8", (err: Error, json: string) => {
    err && vscode.window.showInformationMessage(`读取${path}失败`);
    const newJson = { ...JSON.parse(json), ...{ [key]: value } };
    fs.writeFile(path, JSON.stringify(newJson, null, "\t"), (err: Error) => {
      err && vscode.window.showInformationMessage(`写入${path}失败`);
    });
  });
};

const doTranslate = async (query: string) => {
  const appid = "20220411001168024";
  const key = "vwwfS_ohpZ0n2JQs3Koz";
  const salt = new Date().getTime();
  const str1 = appid + query + salt + key;
  const sign = md5(str1);
  const response = await axios.get(
    `http://api.fanyi.baidu.com/api/trans/vip/translate?q=${encodeURIComponent(
      query
    )}&from=zh&to=en&appid=${appid}&salt=${salt}&sign=${sign}`
  );
  return response.data.trans_result[0].dst;
};

const initSetting = (context: vscode.ExtensionContext) => {
  ctx = context;
  config = vscode.workspace.getConfiguration().get("i18nForJT.config") || {
    zhCNPath: "\\src\\locales\\zh_CN.json",
    enUSPath: "\\src\\locales\\en_US.json",
    replaceContent: "{intl.get('$1').d('$2')}",
  };
};

const translate = vscode.commands.registerCommand(
  "i18n-for-jt.translate",
  async () => {
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
      if (/^[' | "].*?[' | "]$/.test(text)) {
        text = text.slice(1, text.length - 2);
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
        const res = await doTranslate(text);
        generate(rootPath + config.zhCNPath, intlName, text);
        generate(rootPath + config.enUSPath, intlName, res);
      } catch (error) {
        vscode.window.showInformationMessage("error");
      }
    }
  }
);

export default {
  initSetting,
  translate,
};
