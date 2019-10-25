import { spawn$ } from 'observable-spawn';
import { Observable, of } from 'rxjs';
import { concatAll, concatMap } from 'rxjs/operators';
import _ from 'underscore';

import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

interface MultiBuilderOptions extends JsonObject {
    targets: Array<string>;
    additionalTargets: Array<string>;
    runner: string;
  }

export default createBuilder<MultiBuilderOptions>(
    (options: MultiBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
        if(context.target === undefined) {
            throw new Error('No target found!');
        }

        if (!options.targets) {
            throw new Error('You must specify other builders to call.');
        }

        if (options.runner !== undefined && options.runner.toLowerCase() !== 'nx' && options.runner.toLowerCase() !== 'nx') {
            throw new Error(`Invalid runner specified! You may only specify 'ng' or 'nx'.`);
        }

        const runner = options.runner.toLowerCase() || 'ng';
        const projectName = context.target.project;
        const config = `:${context.target.configuration}` || '';

        if(context.target.configuration !== undefined && options.additionalTargets !== undefined) {
            options.targets = options.targets.concat(options.additionalTargets);
        }

        _.each(options.targets, (target: string) => {
            console.log(`  ↳ ${runner} run ${projectName}:${target}${config}`);
        });

        console.log('');

        return new Observable<BuilderOutput>(obs => {
            of(options.targets)
                .pipe(
                    concatAll(),
                    concatMap(target => spawn$(`${runner} run ${projectName}:${target}${config}`))
                ).subscribe(
                    undefined,
                    (err: any) => {
                        obs.error(err);
                        obs.complete();
                    },
                    () => {
                        obs.next({ success: true });
                        obs.complete();
                    }
                );
        }).toPromise();
    }
);
