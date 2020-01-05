import { spawn$ } from 'observable-spawn';
import { Observable, of } from 'rxjs';
import { concatAll, concatMap } from 'rxjs/operators';
import _ from 'underscore';

import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { JsonObject, normalize, virtualFs } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { HostTree } from '@angular-devkit/schematics';
import { getProjectConfig } from '@nrwl/workspace';

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
        const config = context.target.configuration;

        if(context.target.configuration !== undefined && options.additionalTargets !== undefined) {
            options.targets = options.targets.concat(options.additionalTargets);
        }

        const host: virtualFs.Host = new virtualFs.ScopedHost(new NodeJsSyncHost(), normalize(context.workspaceRoot));
        const tree = new HostTree(host);

        const projectConfig = getProjectConfig(tree, context.target.project);

        const targetsWithConfigs = _.map(options.targets, (target: string): string => {
            if(config === undefined) {
                return target;
            }

            const targetObj = projectConfig.architect[target];

            if(targetObj === undefined) {
                throw new Error(`The project '${projectName}' does not contain a target named '${target}'!`);
            }

            const configs = targetObj.configurations;

            return (configs !== undefined && configs[config] !== undefined)
                ? `${target}:${config}`
                : target;
        });

        _.each(targetsWithConfigs, (target: string) => {
            console.log(`  ↳ ${runner} run ${projectName}:${target}`);
        });

        console.log('');

        return new Observable<BuilderOutput>(obs => {
            of(options.targets)
                .pipe(
                    concatAll(),
                    concatMap(target => spawn$(`${runner} run ${projectName}:${target}`))
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
