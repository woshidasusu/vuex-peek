"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const util = {
    /**
     * 获取当前所在工程根目录，有3种使用方法：<br>
     * getProjectPath(uri) uri 表示工程内某个文件的路径<br>
     * getProjectPath(document) document 表示当前被打开的文件document对象<br>
     * getProjectPath() 会自动从 activeTextEditor 拿document对象，如果没有拿到则报错
     */
    getProjectPath(document) {
        var _a;
        if (!document) {
            document = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.document
                : null;
        }
        if (!document) {
            this.showError("当前激活的编辑器不是文件或者没有文件被打开！");
            return "";
        }
        const currentFile = (document.uri ? document.uri : document).fsPath;
        let projectPath = null;
        let workspaceFolders = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a.map((item) => item.uri.path);
        // 由于存在Multi-root工作区，暂时没有特别好的判断方法，先这样粗暴判断
        // 如果发现只有一个根文件夹，读取其子文件夹作为 workspaceFolders
        if ((workspaceFolders === null || workspaceFolders === void 0 ? void 0 : workspaceFolders.length) === 1 &&
            workspaceFolders[0] === vscode.workspace.rootPath) {
            const rootPath = workspaceFolders[0];
            var files = fs.readdirSync(rootPath);
            workspaceFolders = files
                .filter((name) => !/^\./g.test(name))
                .map((name) => path.resolve(rootPath, name));
            // vscode.workspace.rootPath会不准确，且已过时
            // return vscode.workspace.rootPath + '/' + this._getProjectName(vscode, document);
        }
        workspaceFolders === null || workspaceFolders === void 0 ? void 0 : workspaceFolders.forEach((folder) => {
            if (currentFile.indexOf(folder) === 0) {
                projectPath = folder;
            }
        });
        if (!projectPath) {
            this.showError("获取工程根路径异常！");
            return "";
        }
        return projectPath;
    },
    /**
     * 获取当前工程名
     */
    getProjectName: function (projectPath) {
        return path.basename(projectPath);
    },
    /**
     * 将一个单词首字母大写并返回
     * @param {*} word 某个字符串
     */
    upperFirstLetter: function (word) {
        return (word || "").replace(/^\w/, (m) => m.toUpperCase());
    },
    /**
     * 将一个单词首字母转小写并返回
     * @param {*} word 某个字符串
     */
    lowerFirstLeter: function (word) {
        return (word || "").replace(/^\w/, (m) => m.toLowerCase());
    },
    /**
     * 弹出错误信息
     */
    showError: function (info) {
        vscode.window.showErrorMessage(info);
    },
    /**
     * 弹出提示信息
     */
    showInfo: function (info) {
        vscode.window.showInformationMessage(info);
    },
    /**
     * 从某个文件里面查找某个字符串，返回第一个匹配处的行与列，未找到返回第一行第一列
     * @param filePath 要查找的文件
     * @param reg 正则对象，最好不要带g，也可以是字符串
     */
    findStrInFile: function (filePath, reg) {
        const content = fs.readFileSync(filePath, "utf-8");
        reg = typeof reg === "string" ? new RegExp(reg, "m") : reg;
        // 没找到直接返回
        if (content.search(reg) < 0) {
            return { row: 0, col: 0 };
        }
        const rows = content.split(os.EOL);
        // 分行查找只为了拿到行
        for (let i = 0; i < rows.length; i++) {
            let col = rows[i].search(reg);
            if (col >= 0) {
                return { row: i, col };
            }
        }
        return { row: 0, col: 0 };
    },
    /**
     * 获取某个字符串在文件里第一次出现位置的范围，
     */
    getStrRangeInFile: function (filePath, str) {
        var pos = this.findStrInFile(filePath, str);
        return new vscode.Range(new vscode.Position(pos.row, pos.col), new vscode.Position(pos.row, pos.col + str.length));
    },
    /**
     * 在vscode中打开某个文件
     * @param {*} path 文件绝对路径
     * @param {*} text 可选，如果不为空，则选中第一处匹配的对应文字
     */
    openFileInVscode: function (path, text) {
        let options = undefined;
        if (text) {
            const selection = this.getStrRangeInFile(path, text);
            options = { selection };
        }
        vscode.window.showTextDocument(vscode.Uri.file(path), options);
    },
    /**
     * 读取properties文件
     * @param {*} filePath
     */
    readProperties(filePath) {
        const content = fs.readFileSync(filePath, "utf-8");
        let rows = content.split(os.EOL);
        rows = rows.filter((row) => row && row.trim() && !/^#/.test(row));
        const result = {};
        rows.forEach((row) => {
            let temp = row.split("=");
            result[temp[0].trim()] = temp[1].trim();
        });
        return result;
    },
};
exports.default = util;
//# sourceMappingURL=index.js.map