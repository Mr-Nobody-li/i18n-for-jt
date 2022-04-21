import * as vscode from "vscode";
import command from "./command";

export function activate(context: vscode.ExtensionContext) {
  command.initSetting(context);
  context.subscriptions.push(command.translate);
}

export function deactivate() {}
