import * as fs from 'fs-extra';
import * as globby from 'globby';
import { spawn$ } from 'observable-spawn';
import { Observable, of } from 'rxjs';
import { concatAll, concatMap } from 'rxjs/operators';
import _ from 'underscore';

import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

interface MultiBuilderOptions extends JsonObject {
    paths: Array<string>;
    additionalPaths: Array<string>;
  }

export default createBuilder<MultiBuilderOptions>(
    async (options: MultiBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
        if(context.target === undefined) {
            throw new Error('No target found!');
        }

        if (!options.paths) {
            throw new Error('You must specify paths or globs to clean.');
        }

        const projectName = context.target.project;

        console.log(`Cleaning project '${projectName}'...`);

        if(options.additionalPaths !== undefined) {
            options.paths = options.paths.concat(options.additionalPaths);
        }

        const files = globby.sync(options.paths);

        const filePromises = _.map(files, (file: string): Promise<void> => {
            console.log(`  ↳ Cleaning '${file}'...`);

            return fs.remove(file);
        });

        console.log('');

        try {
            await Promise.all(filePromises);
            return {success: true };
        }
        catch (err) {
            throw err;
        }
    }
);
