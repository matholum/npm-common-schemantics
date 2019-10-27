#!/usr/bin/env node

import commander from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';

const pkg = require('../package.json');

let loadPath = path.dirname(__filename);
loadPath = loadPath.substring(0, loadPath.lastIndexOf('/'));
loadPath += '/scripts';

const commands: any = {};

fs.readdirSync(loadPath)
  .filter((filename) => filename.endsWith('.js'))
  .forEach((filename) => {
    const name = filename.substring(0, filename.lastIndexOf('.'));
    const command = require(path.join(loadPath, filename)).default;

    commands[name] = command(commander);
  });

commander
  .version(pkg.version)
  .usage('<command> [options]')
  .parse(process.argv);
