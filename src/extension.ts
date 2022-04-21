import * as vscode from "vscode";
import command from "./command";

export function activate(context: vscode.ExtensionContext) {
  console.log(`🚀 => vscode`, vscode);
  command.initSetting(context);
  context.subscriptions.push(command.translate);
}

export function deactivate() {}
