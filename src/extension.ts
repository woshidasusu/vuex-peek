import * as vscode from "vscode";
import {
  TextDocument,
  Position,
  CancellationToken,
  TextEditor,
  TextEditorEdit,
} from "vscode";
import * as path from "path";
import * as fs from "fs";
import util from "./util";
import * as readline from "readline";
import * as os from "os";

// FIXME 暂时写死
const STORE_PATH = "/src/store/dynamic/";

// 缓存已解析过的文件
const CACHE_PARSED_FILE: { [key: string]: { row: any; col: any } } = {};
// 缓存已解析过的变量
const CACHE_PARSED_WORD: {
  [key: string]: { path: any; row: any; stateCodes: any };
} = {};
// 缓存 store 文件地址
const STORE_PATH_MAP: {
  [key: string]: { path: any; stateCode: any; states: any };
} = {} as any;
function fileDisplay(filePath: string) {
  //根据文件路径读取文件，返回文件列表
  fs.readdir(filePath, function (err, files) {
    if (err) {
      console.warn(err);
    } else {
      //遍历读取到的文件列表
      files.forEach(function (filename) {
        //获取当前文件的绝对路径
        var filedir = path.join(filePath, filename);
        //根据文件路径获取文件信息，返回一个fs.Stats对象
        fs.stat(filedir, function (eror, stats) {
          if (eror) {
            console.warn("获取文件stats失败");
          } else {
            var isFile = stats.isFile(); //是文件
            var isDir = stats.isDirectory(); //是文件夹
            if (isFile) {
              const rl = readline.createInterface({
                input: fs.createReadStream(filedir),
                crlfDelay: Infinity,
              });
              let states: any = {};
              let stateCodes: any = [];
              let expectEndState = 0;
              let row = 0;
              rl.on("line", (line) => {
                if (line.match(/const state = \(\) => {/)) {
                  stateCodes.push(line);
                  expectEndState = 1;
                } else if (expectEndState > 0) {
                  stateCodes.push(line);
                  if (line.match("{")) {
                    expectEndState++;
                  }
                  if (line.match("}")) {
                    expectEndState--;
                  }
                  let _key = line.match(/(\S*):/);
                  if (
                    _key &&
                    (line.indexOf("//") === -1 ||
                      line.indexOf("//") > line.indexOf(":"))
                  ) {
                    states[_key[1]] = row;
                  }
                }
                row++;
              });
              rl.once("close", function () {
                STORE_PATH_MAP[filename.substring(0, filename.indexOf("."))] = {
                  path: filedir,
                  states: states,
                  stateCode: stateCodes.join(os.EOL),
                };
              });
            }
            if (isDir) {
              fileDisplay(filedir); //递归，如果是文件夹，就继续遍历该文件夹下面的文件
            }
          }
        });
      });
    }
  });
}

let isInitStoreInfo = false;
function updateStoreInfos(refresh = false) {
  let document = vscode.window.activeTextEditor?.document;
  if ((!isInitStoreInfo || refresh) && document) {
    isInitStoreInfo = true;
    let projectPath = "";

    if (vscode.workspace.workspaceFolders) {
      let workspaceFold = vscode.workspace.workspaceFolders.find((x) =>
        document?.uri.path.startsWith(x.uri.path)
      );
      projectPath = workspaceFold?.uri.path || "";
    }
    if (projectPath.startsWith('/')) {
      projectPath = projectPath.substr(1);
    }
    console.log(projectPath);
    vscode.window.showInformationMessage('正在解析 store 目录下的代码：' + projectPath + STORE_PATH);
    fileDisplay(projectPath + STORE_PATH);
  }
}

// 插件被激活时调用
export function activate(context: vscode.ExtensionContext) {
  console.log("plugin init: vuex-peek");
  updateStoreInfos();

  // 命令
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "vuex.goto-store",
      onVuexStoreCommandExec
    )
  );

  // 命令
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("vuex.update-store", function () {
      vscode.window.showInformationMessage(JSON.stringify(STORE_PATH_MAP, null, 2));
      updateStoreInfos(true);
    })
  );

  // 文件跳转
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(["vue", "javascript"], {
      provideDefinition,
    })
  );

  // 悬停提示
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(["vue", "javascript"], {
      provideHover,
    })
  );
}

/**
 * 当 Go to vuex store 命令执行时
 */
function onVuexStoreCommandExec(
  textEditor: TextEditor,
  edit: TextEditorEdit,
  ...args: any[]
) {
  console.log("command exec: Go to vuex store");
  let word = textEditor.document.getText(
    textEditor.document.getWordRangeAtPosition(textEditor.selection.active)
  );
  console.log("word: " + word); // 当前光标所在单词
  let find = CACHE_PARSED_WORD[textEditor.document.fileName + word];
  console.log("find:", find);
  if (find) {
    vscode.window.showTextDocument(vscode.Uri.file(find.path));
  } else {
    vscode.window.showInformationMessage(
      "请先执行 update vuex store 解析 store 代码"
    );
  }
}

/**
 * 当 ctrl + 鼠标左键点击跳转时
 */
function provideDefinition(
  document: TextDocument,
  position: Position,
  token: CancellationToken
) {
  console.log("============ctrl + mouse click: Go to definition=============");
  const fileName = document.fileName;
  const workDir = path.dirname(fileName);
  const word = document.getText(document.getWordRangeAtPosition(position));
  const line = document.lineAt(position);

  console.log("store", STORE_PATH_MAP, CACHE_PARSED_WORD);
  console.log("fileName: " + fileName); // 当前文件完整路径
  console.log("workDir: " + workDir); // 当前文件所在目录
  console.log("word: " + word); // 当前光标所在单词
  console.log(
    "line: " + line.lineNumber,
    line.firstNonWhitespaceCharacterIndex
  ); // 当前光标所在行
  console.log("document: " + document.languageId); // 当前文件类型
  let hasUsedStoreFlag = "";
  if (document.languageId === "vue") {
    // vue 里面通过是否有 statesToComputed() 来决定变量名是否是 store 里声明的，再提供跳转
    hasUsedStoreFlag = ".statesToComputed";
  } else if (document.languageId === "javascript") {
    // js 文件里通过  state(). 访问的变量才提供跳转
    if (line.text.indexOf(".state().") !== -1) {
      hasUsedStoreFlag = ".state().";
    }
  }
  if (hasUsedStoreFlag) {
    if (CACHE_PARSED_WORD[fileName + word]) {
      return new vscode.Location(
        vscode.Uri.file(CACHE_PARSED_WORD[fileName + word].path),
        new vscode.Position(CACHE_PARSED_WORD[fileName + word].row, 0)
      );
    }

    let {row, col } = util.findStrInFile(fileName, hasUsedStoreFlag);
    if (row > 0 && col > 0) {
      let line = document.lineAt(row);
      let _text = line.text.substring(0, col);
      let module = _text.substring(_text.lastIndexOf(".") + 1);
      console.log("module", module);
      let findModule = Object.keys(STORE_PATH_MAP).find(
        (v) => module.toLocaleLowerCase().indexOf(v.toLocaleLowerCase()) !== -1
      );
      if (findModule) {
        console.log("---find---", findModule, STORE_PATH_MAP[findModule].path);
        let findState = STORE_PATH_MAP[findModule].states[word];
        if (findState) {
          CACHE_PARSED_WORD[fileName + word] = {
            path: STORE_PATH_MAP[findModule].path,
            row: findState,
            stateCodes: STORE_PATH_MAP[findModule].stateCode,
          };
          return new vscode.Location(
            vscode.Uri.file(STORE_PATH_MAP[findModule].path),
            new vscode.Position(findState, 0)
          );
        }
      }
    }
  }
  return null;
}

function provideHover(
  document: TextDocument,
  position: Position,
  token: CancellationToken
) {
  console.log("ctrl + mouse hover: show tip");
  const fileName = document.fileName;
  const word = document.getText(document.getWordRangeAtPosition(position));

  if (document.languageId === "vue" || document.languageId === "javascript") {
    if (CACHE_PARSED_WORD[fileName + word]) {
      let tooltip = {
        language: "html",
        value: CACHE_PARSED_WORD[fileName + word].stateCodes,
      };
      return new vscode.Hover(tooltip);
    }
  }
  return null;
}

// 插件被销毁时调用
export function deactivate() {}
