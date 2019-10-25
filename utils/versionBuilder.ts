import * as fs from 'fs-extra';
import _ from 'underscore';

import { getSystemPath, normalize, resolve } from '@angular-devkit/core';

export function getRootVersion(rootDir: string = '.'): string | undefined {
    const pkgPath: string = getSystemPath(resolve(normalize(rootDir), normalize('package.json')));

    //console.log(`Attempting to get the version from '${pkgPath}'`);

    if(!fs.existsSync(pkgPath)) {
        return undefined;
    }

    const pkg = fs.readJsonSync(pkgPath);
    const version = pkg.version;

    //console.log(`Version Found: '${version}'`);

    return version;
}

export function getProjectVersion(projectDir: string): string | undefined {
    const versionPath: string = getSystemPath(resolve(normalize(projectDir), normalize('VERSION')));

    //console.log(`Attempting to get the version from '${versionPath}'`);

    if(!fs.existsSync(versionPath)) {
        return undefined;
    }

    const versionBuffer = fs.readFileSync(versionPath);
    const version = versionBuffer.toString();

    //console.log(`Version Found: '${version}'`);

    return version;
}

export function appendBuildVersion(version: string) {
    //console.log(`Creating a new build segment for base version ${version}...`);

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

export function getVersion(rootDir: string, projectDir: string): string {
    let version = getProjectVersion(projectDir);
    version = version || getRootVersion(rootDir);
    version = appendBuildVersion(version || '');

    //console.log(`New build version '${version}' created.`);

    return version;
}
