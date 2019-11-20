"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const path = __importStar(require("path"));
// import * as fs from 'fs';
const fs_1 = require("fs");
// const fs = require("fs/promises");
/// Run a command inside the virtual env
function venvExec(venv_dir, executable, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const actual_executable = path.join(venv_dir, "bin", executable);
        return yield exec.exec(actual_executable, args);
    });
}
/// Create the virtualenv
function createVenv(venv_dir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec.exec("python", ["-m", "venv", venv_dir]);
    });
}
/// Build the path to the virtualenv
function buildVenvDir() {
    // Create the venv path
    const home_dir = process.env["HOME"];
    const action_id = process.env["GITHUB_ACTION"];
    if (!home_dir) {
        throw new Error("HOME MISSING");
    }
    return path.join(home_dir, `venv-${action_id}`);
}
/// Get the action input as JSON
function getInputJSON(name) {
    return JSON.parse(core.getInput(name));
}
/// Set everything up
function initialize(run_black, run_flake8) {
    return __awaiter(this, void 0, void 0, function* () {
        // The path to the virtualenv
        const venv_dir = buildVenvDir();
        // Create the virtualenv
        yield createVenv(venv_dir);
        // Install flake8 & black
        yield venvExec(venv_dir, "pip", ["install", "twine"]);
        return venv_dir;
    });
}
function checkForWheels(regex) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        var found = false;
        // const dir = await fs.opendir("dist");
        const dir = yield fs_1.promises.opendir("src");
        try {
            for (var dir_1 = __asyncValues(dir), dir_1_1; dir_1_1 = yield dir_1.next(), !dir_1_1.done;) {
                const dirent = dir_1_1.value;
                if (regex.exec(dirent.name)) {
                    found = true;
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (dir_1_1 && !dir_1_1.done && (_a = dir_1.return)) yield _a.call(dir_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        /*
        if (!found) {
          throw new Error("js file not found");
        }
        */
        return found;
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connection parameters
            // const pypi_hostname = core.getInput("pypi_hostname");
            // const pypi_username = core.getInput("pypi_username");
            // const pypi_password = core.getInput("pypi_password");
            if (!(yield checkForWheels(/\.js/))) {
                throw new Error("Check for wheels");
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
