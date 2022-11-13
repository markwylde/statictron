import { promises as fs } from 'fs';
import path from 'path';
import objectPath from 'object-path';
import micromatch from 'micromatch';

import ejsLoader from './loaders/ejs.js';
import cssLoader from './loaders/css.js';

const loopRegex = /\[.* of .*\]/;
const variableRegex = /\[(.*?)\]/g;

const formatPath = (source, file) => path.relative(source, file);

async function executeLoaders (sourceFile, targetFile, options, skip = []) {
  const rechecks = [];

  let hadResult = false;
  for (const loader of options.loaders || []) {
    if (skip.includes(loader)) {
      continue;
    }

    const result = await loader(sourceFile, targetFile, options);

    if (result) {
      (Array.isArray(result) ? result : [result]).forEach(result => {
        rechecks.push([loader, result]);
      });
    }

    if (result || result === null) {
      hadResult = true;
      break;
    }
  }

  for (const recheck of rechecks) {
    await executeLoaders(recheck[1], recheck[1], options, skip = [recheck[0]]);
  }

  return hadResult;
}

async function render (source, destination, options) {
  options?.logger?.('exploring', `"${formatPath(options.source, source)}" => "${formatPath(options.source, destination)}"`);

  const files = await fs.readdir(source);

  return new Promise(async resolve => {
    for (const file of files) {
      const sourceFile = path.resolve(source, file);
      const relativeFile = path.relative(options.source, sourceFile);
      const stats = await fs.stat(sourceFile);
      const isDirectory = stats.isDirectory();
      const isLoop = !!file.match(loopRegex);
      const isVariable = !!file.match(variableRegex);
      const shouldIgnore = micromatch.isMatch(relativeFile, options.ignore || [], {
        cwd: path.resolve(options.source),
        basename: true
      });

      if (shouldIgnore) {
        continue;
      }

      if (isLoop) {
        const [left, right] = file.slice(1, -1).split(' of ');
        const itemFromScope = objectPath.get(options.scope, right);
        if (!itemFromScope) {
          continue;
        }
        for (const item of itemFromScope) {
          await render(sourceFile, destination, {
            ...options,
            scope: {
              ...options.scope,
              [left]: item
            }
          });
        }
        continue;
      }

      const parsedFile = isVariable
        ? file.replace(variableRegex, (_, b) => objectPath.get(options.scope, b))
        : file;

      const targetFile = path.resolve(destination, parsedFile);

      if (isDirectory) {
        await render(sourceFile, targetFile, options);
        continue;
      }

      const hadResult = await executeLoaders(sourceFile, targetFile, options);

      if (hadResult) {
        continue;
      }

      const exists = await fs.access(targetFile).then(() => true).catch(() => false);
      if (!exists) {
        await fs.cp(sourceFile, targetFile, { recursive: true, force: true });
      }
    }
    resolve();
  });
}

async function statictron (options) {
  options = {
    clean: true,
    ...options
  };

  const { source, output } = options;

  if (options.clean) {
    await fs.rm(output, { force: true, recursive: true });
  }

  await render(source, output, options);
}

statictron.loaders = {
  css: cssLoader,
  ejs: ejsLoader
};

export default statictron;
