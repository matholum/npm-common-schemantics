import * as commander from 'commander';
import { removeSync } from 'fs-extra';
import * as globby from 'globby';
import * as path from 'path';
import _ from 'underscore';

export function removeMinifiedVendorFiles(dir: string) {
    console.log(`Removing minified vendor files: ${dir}/node_modules`)

    const files = globby.sync([
        `${dir}/node_modules/**/*.min.js`,
        `!${dir}/node_modules/**/web-animations.min.js`
    ]);

    _.each(files, (file: string): void => {
        console.log(`\t-${file}`);
        removeSync(file);
    });
}

export default function registerCommand(program: commander.CommanderStatic): void {
    program
        .command('rm-minified')
        .description('Remove minified third party code.')
        .action((command) => {
            const dir = process.cwd();

            removeMinifiedVendorFiles(dir);

            process.exit();
        });
}
