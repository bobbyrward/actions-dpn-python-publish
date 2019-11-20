import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as path from 'path';
// import * as fs from 'fs';
import * as fs from 'fs';

// const fs = require("fs/promises");


/// Run a command inside the virtual env
async function venvExec(venv_dir, executable, args, options?) {
  const actual_executable = path.join(venv_dir, "bin", executable);
  return await exec.exec(actual_executable, args, options);
}


/// Create the virtualenv
async function createVenv(venv_dir) {
  await exec.exec("python", ["-m", "venv", venv_dir])
}


/// Build the path to the virtualenv
function buildVenvDir(): string {
  // Create the venv path
  const home_dir = process.env["HOME"];
  const action_id = process.env["GITHUB_ACTION"];

  if (!home_dir) {
    throw new Error("HOME MISSING");
  }

  return path.join(home_dir, `venv-${action_id}`);
}


/// Get the action input as JSON
function getInputJSON(name: string) {
  return JSON.parse(core.getInput(name));
}


/// Set everything up
async function initialize() {
  // The path to the virtualenv
  const venv_dir = buildVenvDir();

  // Create the virtualenv
  await createVenv(venv_dir)

  // Install flake8 & black
  await venvExec(venv_dir, "pip", ["install", "twine"]);

  return venv_dir;
}


function checkForWheels(regex: RegExp): boolean {
    var found: boolean = false;

    const dir = fs.readdirSync("dist");

    for (const filename of dir) {
      if (regex.exec(filename)) {
        found = true;
        break;
      }
    }

    return found;
}

async function uploadWheels(venv_dir: string, hostname: string, username: string, password: string): Promise<number> {
  return await venvExec( venv_dir, "twine", ["upload"], {
      env: {
        TWINE_REPOSITORY_URL: `https://${hostname}/simple/`,
        TWINE_USERNAME: username,
        TWINE_PASSWORD: password
      }
    });
}

function isPrivatePackageIndex(hostname: string) {
  return (hostname != "pypi.org");
}


async function run() {
  try {
    // Connection parameters
    const pypi_hostname = core.getInput("pypi_hostname");
    const pypi_username = core.getInput("pypi_username");
    const pypi_password = core.getInput("pypi_password");

    if (!isPrivatePackageIndex(pypi_hostname)) {
      throw new Error("Uploads are only allowed to private package indexes");
    }

    if (!checkForWheels(/\.whl$/)) {
      throw new Error("Check for wheels");
    }

    const venv_dir: string = await initialize();

    await uploadWheels(venv_dir, pypi_hostname, pypi_username, pypi_password);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
