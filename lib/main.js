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
const fs = __importStar(require("fs"));
/// Run a command inside the virtual env
function venvExec(venv_dir, executable, args, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const actual_executable = path.join(venv_dir, "bin", executable);
        return yield exec.exec(actual_executable, args, options);
    });
}
/// Create the virtualenv
function createVenv(venv_dir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec.exec("pip", ["install", "virtualenv"]);
        yield exec.exec("python", ["-m", "virtualenv", venv_dir]);
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
function initialize() {
    return __awaiter(this, void 0, void 0, function* () {
        // The path to the virtualenv
        const venv_dir = buildVenvDir();
        // Create the virtualenv
        yield createVenv(venv_dir);
        // Install twine
        yield venvExec(venv_dir, "pip", ["install", "twine"]);
        return venv_dir;
    });
}
function findWheels(regex) {
    var wheels = [];
    const dir = fs.readdirSync("dist");
    for (const filename of dir) {
        if (regex.exec(filename)) {
            wheels.push(`dist/${filename}`);
        }
    }
    return wheels;
}
function uploadWheels(venv_dir, wheels, hostname, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const args = ["upload"].concat(wheels);
        return yield venvExec(venv_dir, "twine", args, {
            env: {
                TWINE_REPOSITORY_URL: `https://${hostname}/simple/`,
                TWINE_USERNAME: username,
                TWINE_PASSWORD: password
            }
        });
    });
}
function isPrivatePackageIndex(hostname) {
    return (hostname != "pypi.org");
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connection parameters
            const pypi_hostname = core.getInput("pypi_hostname");
            const pypi_username = core.getInput("pypi_username");
            const pypi_password = core.getInput("pypi_password");
            if (!isPrivatePackageIndex(pypi_hostname)) {
                throw new Error("Uploads are only allowed to private package indexes");
            }
            const wheels = findWheels(/\.whl$/);
            if (wheels.length == 0) {
                throw new Error("Found no matching wheels");
            }
            core.info(`Found wheels: ${wheels}`);
            const venv_dir = yield initialize();
            yield uploadWheels(venv_dir, wheels, pypi_hostname, pypi_username, pypi_password);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
