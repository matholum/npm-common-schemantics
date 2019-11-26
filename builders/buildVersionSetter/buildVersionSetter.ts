import * as fs from 'fs-extra';
import * as path from 'path';
import _ from 'underscore';

import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { getSystemPath, JsonObject, normalize, resolve } from '@angular-devkit/core';

interface MultiBuilderOptions extends JsonObject {
    projectPath: string;
    outputPath: string;
  }

export default createBuilder<MultiBuilderOptions>(
    (options: MultiBuilderOptions, context: BuilderContext): BuilderOutput => {
        if(context.target === undefined) {
            throw new Error('No target found!');
        }

        if (options.outputPath === undefined || options.outputPath === '') {
            throw new Error('You must specify an output path.');
        }

        const root = context.workspaceRoot;
        const projectName = context.target.project;

        const outputPath: string = getSystemPath(resolve(normalize(root), normalize(options.outputPath)));
        const outputFile: string = path.join(outputPath, 'VERSION');

        console.log(`Creating build version for project '${projectName}'...`);

        let version: string | undefined = getRootVersion(root);

        if(options.projectPath !== undefined && options.projectPath !== '') {
            const projectVersion = getProjectVersion(options.projectPath);

            version = projectVersion || version;
        }

        version = appendBuildVersion(version || '');

        console.log(`Build version detected to be '${version}'.`);
        console.log(`Saving VERSION file for build at ${outputPath}...`);

        try {
            fs.mkdirpSync(outputPath);
            fs.writeFileSync(outputFile, version);
            return {success: true };
        }
        catch (err) {
            throw err;
        }
    }
);

function getRootVersion(rootDir: string = '.'): string | undefined {
    const pkgPath: string = getSystemPath(resolve(normalize(rootDir), normalize('package.json')));

    if(!fs.existsSync(pkgPath)) {
        return undefined;
    }

    const pkg = fs.readJsonSync(pkgPath);
    const version = pkg.version;

    console.log(`Root version found: '${version}'`);

    return version;
}

function getProjectVersion(projectDir: string): string | undefined {
    const versionPath: string = getSystemPath(resolve(normalize(projectDir), normalize('VERSION')));

    if(!fs.existsSync(versionPath)) {
        return undefined;
    }

    const versionBuffer = fs.readFileSync(versionPath);
    const version = versionBuffer.toString();

    console.log(`Project version found: '${version}'`);

    return version;
}

function appendBuildVersion(version: string) {
    console.log(`Creating a new build segment for base version ${version}...`);

    const today  = new Date();
    const versionSegments = version.split('.').length;

    let versionSuffix: string = '';

    if(versionSegments < 4) {
        const iso = today.toISOString();

        versionSuffix = iso.substring(0, iso.indexOf('T'));
        versionSuffix = versionSuffix.split('-').join('');
        versionSuffix = `.${versionSuffix}`;
    }

    if(versionSegments < 3) {
        versionSuffix += '.';
        versionSuffix += today.getHours() * 60 + today.getMinutes();
    }

    return `${version}${versionSuffix}`;
}
