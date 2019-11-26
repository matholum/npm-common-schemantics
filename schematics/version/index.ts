import path from 'path';
import _ from 'underscore';

import {
    apply, applyTemplates, chain, filter, mergeWith, move, noop, Rule, SchematicContext,
    SchematicsException, template, Tree, url
} from '@angular-devkit/schematics';
import {
    addDepsToPackageJson, formatFiles, getNpmScope, getProjectConfig, names, NxJson, offsetFromRoot,
    toClassName, updateJsonInTree, updateWorkspaceInTree
} from '@nrwl/workspace';

import { Schema } from './schema';

function check(options: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const projectConfig = getProjectConfig(host, options.project);

    if (projectConfig.architect.version) {
      throw new Error(`${options.project} already has a version architect option.`);
    }

    return host;
  };
}

export function createFiles(options: Schema): Rule {
  if(!options.overrideRoot) {
    return noop();
  }

  return (host, context) => {
    const projectConfig = getProjectConfig(host, options.project);

    return mergeWith(
      apply(url('./files'), [
        applyTemplates({
          ...options,
          projectRoot: projectConfig.root,
          offsetFromRoot: offsetFromRoot(projectConfig.root)
        }),
        move(projectConfig.root)
      ])
    )(host, context);
  };
}

export function updateWorkspaceJson(options: Schema): Rule {
  return updateWorkspaceInTree((json: any) => {
    const projectConfig = json.projects[options.project];

    const projectPath = projectConfig.root;
    const outputPath = options.outputPath || path.join('dist', projectPath);

    const runner = process.argv.length > 2 && process.argv[1].endsWith(`${path.sep}nx`) ? { runner: 'nx' } : {};

    if(projectConfig.architect.build !== undefined) {
      if(projectConfig.architect.build.builder === 'common-schematics:multi-builder') {
        projectConfig.architect.build.options.targets.unshift('version');
      } else {
        projectConfig.architect.buildSrc = projectConfig.architect.build;

        projectConfig.architect.build = {
          builder: 'common-schematics:multi-builder',
          options: {
            ...runner,
            targets: [ 'version', 'buildSrc']
          },
          configurations: {
            dev: {},
            prod: {}
          }
        };
      }
    }

    projectConfig.architect.version = {
      builder: 'common-schematics:set-build-version',
      options: {
        projectPath,
        outputPath
      },
      configurations: {
        dev: {},
        prod: {}
      }
    };

    return json;
  });
}

export default function dotnetApi(schema: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    return chain([
      check(schema),
      createFiles(schema),
      updateWorkspaceJson(schema)
    ])(host, context);
  };
}
